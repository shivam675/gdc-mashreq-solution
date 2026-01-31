import asyncio
import json
from typing import List, Dict, Any, AsyncGenerator
from datetime import datetime
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from app.models import Transaction, CustomerReview, Sentiment, AgentWorkflow, AgentWorkflowStatus
from app.config import config
import logging

logger = logging.getLogger(__name__)

class InternalAnalysisAgent:
    """IAA Agent - Searches for matching transactions/reviews and provides analysis"""
    
    def __init__(self):
        self.ollama_url = config.ollama_base_url
        self.model = config.ollama_model
        self.max_retries = config.get('agents.iaa.max_retries', 3)
        self.retry_delay = config.get('agents.iaa.retry_delay', 2)
        self.search_threshold = config.get('agents.iaa.search_threshold', 0.6)
    
    async def _analyze_drivers(self, sentiment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze FDA drivers using LLM to extract search keywords and intent"""
        signal_type = sentiment_data.get('signal_type', '')
        drivers = sentiment_data.get('drivers', [])
        confidence = sentiment_data.get('confidence', 0)
        
        prompt = f"""You are analyzing social media sentiment drivers to determine how to search internal bank data.

SENTIMENT SIGNAL:
- Type: {signal_type}
- Confidence: {confidence * 100:.1f}%
- Drivers: {', '.join(drivers)}

TASK: Extract search intent and keywords.

1. Determine if this is about:
   - fraud/security (search flagged transactions)
   - delays/pending (search pending/failed transactions)
   - service complaints (search reviews with negative sentiment + keywords)
   - positive feedback (search reviews with positive sentiment + keywords)

2. Extract keywords to search in:
   - Transaction descriptions
   - Customer review text
   - Review categories

3. Determine sentiment to match in reviews (positive/negative/neutral/any)

RETURN ONLY JSON (no explanation):
{{
    "search_intent": "fraud" | "delay" | "service_complaint" | "positive_feedback" | "general",
    "transaction_status_filter": ["flagged", "pending", "failed", "inprocess", "completed"],
    "review_sentiment_filter": "positive" | "negative" | "neutral" | "any",
    "keywords": ["keyword1", "keyword2", ...],
    "explanation": "brief explanation of search strategy"
}}
"""
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                response.raise_for_status()
                result = response.json()
                analysis = json.loads(result['response'])
                logger.info(f"Driver analysis: {analysis}")
                return analysis
        except Exception as e:
            logger.error(f"Error analyzing drivers: {e}")
            # Fallback to basic keyword extraction
            return {
                "search_intent": "general",
                "transaction_status_filter": ["flagged", "pending", "failed", "inprocess"],
                "review_sentiment_filter": "negative",
                "keywords": [d.replace('_', ' ') for d in drivers],
                "explanation": "Fallback: using driver terms as keywords"
            }
    
    async def _search_transactions(
        self,
        db: AsyncSession,
        driver_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Search for relevant transactions based on analyzed driver intent"""
        status_filter = driver_analysis.get('transaction_status_filter', [])
        keywords = driver_analysis.get('keywords', [])
        
        # Build query conditions
        conditions = []
        
        # Add status filter
        if status_filter:
            conditions.append(Transaction.status.in_(status_filter))
        
        # Add keyword search in description
        keyword_conditions = []
        for keyword in keywords:
            if keyword:
                keyword_conditions.append(Transaction.description.ilike(f'%{keyword}%'))
        
        if keyword_conditions:
            conditions.append(or_(*keyword_conditions))
        
        # Build final query
        if conditions:
            query = select(Transaction).where(or_(*conditions)).limit(20)
        else:
            # Fallback: just get recent transactions with problem status
            query = select(Transaction).where(
                Transaction.status.in_(['flagged', 'pending', 'failed', 'inprocess'])
            ).limit(20)
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        # Convert to dict
        return [
            {
                "transaction_id": t.transaction_id,
                "customer_name": t.customer_name,
                "amount": t.amount,
                "currency": t.currency,
                "transaction_type": t.transaction_type,
                "status": t.status.value,
                "description": t.description,
                "flagged_reason": t.flagged_reason,
                "timestamp": t.timestamp.isoformat()
            }
            for t in transactions
        ]
    
    async def _search_reviews(
        self,
        db: AsyncSession,
        driver_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Search for reviews matching the analyzed driver intent"""
        sentiment_filter = driver_analysis.get('review_sentiment_filter', 'any')
        keywords = driver_analysis.get('keywords', [])
        
        # Build query based on sentiment and keywords
        conditions = []
        
        # Add sentiment filter (unless 'any')
        if sentiment_filter and sentiment_filter != 'any':
            conditions.append(CustomerReview.sentiment == sentiment_filter)
        
        # Add keyword search in review text and category
        keyword_conditions = []
        for keyword in keywords:
            if keyword:
                keyword_conditions.append(
                    or_(
                        CustomerReview.review_text.ilike(f'%{keyword}%'),
                        CustomerReview.category.ilike(f'%{keyword}%')
                    )
                )
        
        if keyword_conditions:
            conditions.append(or_(*keyword_conditions))
        
        if conditions:
            query = select(CustomerReview).where(or_(*conditions)).limit(20)
        else:
            query = select(CustomerReview).limit(20)
        
        result = await db.execute(query)
        reviews = result.scalars().all()
        
        # Convert to dict
        return [
            {
                "review_id": r.review_id,
                "customer_name": r.customer_name,  # For operator only
                "rating": r.rating,
                "sentiment": r.sentiment,
                "category": r.category,
                "review_text": r.review_text,
                "source": r.source,
                "timestamp": r.timestamp.isoformat()
            }
            for r in reviews
        ]
    
    async def _calculate_confidence(
        self,
        db: AsyncSession,
        matched_reviews: List[Dict[str, Any]],
        driver_analysis: Dict[str, Any]
    ) -> float:
        """Calculate confidence score: (matching_reviews / total_reviews) × 100"""
        # Get total reviews count
        result = await db.execute(select(func.count()).select_from(CustomerReview))
        total_reviews = result.scalar() or 1  # Avoid division by zero
        
        # Calculate confidence
        matching_count = len(matched_reviews)
        confidence = (matching_count / total_reviews) * 100
        
        return round(confidence, 2)
    
    def _create_sanitized_summary(
        self,
        matched_transactions: List[Dict[str, Any]],
        matched_reviews: List[Dict[str, Any]],
        confidence: float,
        driver_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create sanitized summary for EBA (NO sensitive data)"""
        # Count sentiment match based on analyzed sentiment filter
        expected_sentiment = driver_analysis.get('review_sentiment_filter', 'any')
        if expected_sentiment and expected_sentiment != 'any':
            sentiment_match_count = sum(
                1 for r in matched_reviews 
                if r.get('sentiment', '').lower() == expected_sentiment.lower()
            )
        else:
            sentiment_match_count = len(matched_reviews)
        
        verification_status = "CONFIRMED" if confidence >= 5.0 else "NOT CONFIRMED"
        
        return {
            "transactions_found": len(matched_transactions),
            "reviews_found": len(matched_reviews),
            "sentiment_match_count": sentiment_match_count,
            "confidence_score": confidence,
            "verification": verification_status,
            "sentiment": expected_sentiment,
            "search_intent": driver_analysis.get('search_intent', 'general'),
            "keywords_used": driver_analysis.get('keywords', [])
        }
    
    async def _generate_analysis_stream(
        self,
        sentiment_data: Dict[str, Any],
        sanitized_summary: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Generate analysis paragraph using Ollama with streaming (uses ONLY sanitized data)"""
        
        # Prepare prompt for Ollama - NO SENSITIVE DATA
        prompt = f"""You are an Internal Analysis Agent for a bank. You've received a sentiment signal from social media monitoring.

**Sentiment Signal:**
- Type: {sentiment_data.get('signal_type')}
- Confidence: {sentiment_data.get('confidence')}
- Drivers: {', '.join(sentiment_data.get('drivers', []))}

**Database Search Results (Sanitized):**
- Transactions found: {sanitized_summary['transactions_found']}
- Customer reviews found: {sanitized_summary['reviews_found']}
- Reviews matching sentiment: {sanitized_summary['sentiment_match_count']}
- Confidence score: {sanitized_summary['confidence_score']}%
- Verification: {sanitized_summary['verification']}

Provide a brief analysis (2-3 paragraphs) of:
1. Whether this sentiment is confirmed by our internal data
2. The confidence level and what it means
3. Your recommendation for the PR team

Be professional and factual. Do NOT mention specific customer data as you don't have access to it."""

        # Stream from Ollama
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                async with client.stream(
                    'POST',
                    f'{self.ollama_url}/api/generate',
                    json={
                        'model': self.model,
                        'prompt': prompt,
                        'stream': True,
                        'options': {
                            'temperature': 0.7,
                            'num_predict': 400
                        }
                    }
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk = json.loads(line)
                                if 'response' in chunk:
                                    yield chunk['response']
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                logger.error(f"Ollama streaming error: {e}")
                yield f"[Error generating analysis: {str(e)}]"
    
    async def analyze(
        self,
        db: AsyncSession,
        sentiment_id: int,
        sentiment_data: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Main analysis method - DYNAMICALLY analyzes FDA drivers, searches DBs, generates analysis
        Yields progress updates via generator with TWO outputs:
        1. Detailed data for operator dashboard (transactions, reviews with full details)
        2. Sanitized summary for EBA agent (counts, confidence, verification only)
        """
        try:
            signal_type = sentiment_data.get('signal_type', 'neutral')
            
            # Step 1: Analyze FDA drivers to extract search intent and keywords
            yield {
                "type": "progress",
                "stage": "analyzing_drivers",
                "message": "Analyzing FDA drivers to determine search strategy..."
            }
            
            driver_analysis = await self._analyze_drivers(sentiment_data)
            
            yield {
                "type": "progress",
                "stage": "search_strategy",
                "message": driver_analysis.get('explanation', 'Search strategy determined'),
                "data": {
                    "intent": driver_analysis.get('search_intent'),
                    "keywords": driver_analysis.get('keywords', []),
                    "transaction_filter": driver_analysis.get('transaction_status_filter', []),
                    "review_filter": driver_analysis.get('review_sentiment_filter')
                }
            }
            
            # Step 2: Search transactions using analyzed strategy
            yield {
                "type": "progress",
                "stage": "searching_transactions",
                "message": "Searching transaction database..."
            }
            
            matched_transactions = await self._search_transactions(db, driver_analysis)
            
            yield {
                "type": "progress",
                "stage": "transactions_found",
                "message": f"Found {len(matched_transactions)} matching transactions",
                "data": {"count": len(matched_transactions)}
            }
            
            # Step 3: Search reviews using analyzed strategy
            yield {
                "type": "progress",
                "stage": "searching_reviews",
                "message": "Searching customer reviews..."
            }
            
            matched_reviews = await self._search_reviews(db, driver_analysis)
            
            yield {
                "type": "progress",
                "stage": "reviews_found",
                "message": f"Found {len(matched_reviews)} matching reviews",
                "data": {"count": len(matched_reviews)}
            }
            
            # Step 4: Calculate confidence
            confidence = await self._calculate_confidence(db, matched_reviews, driver_analysis)
            
            yield {
                "type": "progress",
                "stage": "confidence_calculated",
                "message": f"Confidence score: {confidence}%",
                "data": {"confidence": confidence}
            }
            
            # Step 5: Create sanitized summary for EBA (NO SENSITIVE DATA)
            sanitized_summary = self._create_sanitized_summary(
                matched_transactions,
                matched_reviews,
                confidence,
                driver_analysis
            )
            
            # Step 5: Generate analysis (streaming) using ONLY sanitized data
            yield {
                "type": "progress",
                "stage": "generating_analysis",
                "message": "Generating analysis..."
            }
            
            full_analysis = ""
            async for chunk in self._generate_analysis_stream(
                sentiment_data,
                sanitized_summary
            ):
                full_analysis += chunk
                yield {
                    "type": "stream",
                    "stage": "analysis_chunk",
                    "data": {"chunk": chunk}
                }
            
            # Step 6: Complete - return BOTH detailed and sanitized data
            yield {
                "type": "completed",
                "stage": "analysis_completed",
                "message": "Analysis completed",
                "data": {
                    # Detailed data for OPERATOR DASHBOARD
                    "matched_transactions": matched_transactions,
                    "matched_reviews": matched_reviews,
                    "confidence_score": confidence,
                    "analysis": full_analysis,
                    # Sanitized data for EBA AGENT (no sensitive info)
                    "sanitized_summary": sanitized_summary
                }
            }
            
        except Exception as e:
            logger.error(f"IAA analysis error: {e}")
            yield {
                "type": "error",
                "stage": "analysis_failed",
                "message": str(e)
            }

# Global instance
iaa_agent = InternalAnalysisAgent()
