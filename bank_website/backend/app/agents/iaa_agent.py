import asyncio
import json
from typing import List, Dict, Any, AsyncGenerator
from datetime import datetime
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
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
    
    async def _search_transactions(
        self,
        db: AsyncSession,
        sentiment_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Search for relevant transactions based on sentiment"""
        signal_type = sentiment_data.get('signal_type', '')
        drivers = sentiment_data.get('drivers', [])
        
        # Build search criteria
        search_terms = [signal_type] + drivers
        
        # Fuzzy search: look for flagged transactions, pending ones, or specific keywords
        query = select(Transaction).where(
            or_(
                Transaction.status.in_(['flagged', 'inprocess', 'pending']),
                *[Transaction.description.ilike(f'%{term}%') for term in search_terms if term],
                *[Transaction.flagged_reason.ilike(f'%{term}%') for term in search_terms if term]
            )
        ).limit(10)
        
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
        sentiment_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Search for relevant customer reviews based on sentiment"""
        signal_type = sentiment_data.get('signal_type', '')
        drivers = sentiment_data.get('drivers', [])
        
        # Build search criteria
        search_terms = [signal_type] + drivers
        
        # Fuzzy search: look for negative reviews or matching keywords
        query = select(CustomerReview).where(
            or_(
                CustomerReview.sentiment.in_(['negative']),
                CustomerReview.category.in_(['fraud_concern', 'service']),
                *[CustomerReview.review_text.ilike(f'%{term}%') for term in search_terms if term]
            )
        ).limit(10)
        
        result = await db.execute(query)
        reviews = result.scalars().all()
        
        # Convert to dict (no sensitive data)
        return [
            {
                "review_id": r.review_id,
                "rating": r.rating,
                "sentiment": r.sentiment,
                "category": r.category,
                "review_text": r.review_text,
                "source": r.source,
                "timestamp": r.timestamp.isoformat()
            }
            for r in reviews
        ]
    
    async def _generate_analysis_stream(
        self,
        sentiment_data: Dict[str, Any],
        matched_transactions: List[Dict[str, Any]],
        matched_reviews: List[Dict[str, Any]]
    ) -> AsyncGenerator[str, None]:
        """Generate analysis paragraph using Ollama with streaming"""
        
        # Prepare prompt for Ollama
        prompt = f"""You are an Internal Analysis Agent for a bank. You've received a fraud/sentiment signal from social media monitoring.

**Sentiment Signal:**
- Type: {sentiment_data.get('signal_type')}
- Confidence: {sentiment_data.get('confidence')}
- Drivers: {', '.join(sentiment_data.get('drivers', []))}
- Uncertainty Notes: {sentiment_data.get('uncertainty_notes', 'None')}
- Escalation Recommended: {sentiment_data.get('recommend_escalation')}

**Matching Transactions Found:** {len(matched_transactions)}
{json.dumps(matched_transactions, indent=2) if matched_transactions else "None"}

**Matching Customer Reviews Found:** {len(matched_reviews)}
{json.dumps(matched_reviews, indent=2) if matched_reviews else "None"}

Provide a concise analysis (2-3 paragraphs) of:
1. Whether this sentiment correlates with our internal data
2. Any patterns or red flags in the matched transactions/reviews
3. Your recommendation on how to proceed

Be professional and factual. Do not include sensitive customer data."""

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
                            'num_predict': 500
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
        Main analysis method - searches DBs and generates streaming analysis
        Yields progress updates via generator
        """
        try:
            # Step 1: Search transactions
            yield {
                "type": "progress",
                "stage": "searching_transactions",
                "message": "Searching transaction database..."
            }
            
            matched_transactions = await self._search_transactions(db, sentiment_data)
            
            yield {
                "type": "progress",
                "stage": "transactions_found",
                "message": f"Found {len(matched_transactions)} matching transactions",
                "data": {"count": len(matched_transactions)}
            }
            
            # Step 2: Search reviews
            yield {
                "type": "progress",
                "stage": "searching_reviews",
                "message": "Searching customer reviews..."
            }
            
            matched_reviews = await self._search_reviews(db, sentiment_data)
            
            yield {
                "type": "progress",
                "stage": "reviews_found",
                "message": f"Found {len(matched_reviews)} matching reviews",
                "data": {"count": len(matched_reviews)}
            }
            
            # Step 3: Generate analysis (streaming)
            yield {
                "type": "progress",
                "stage": "generating_analysis",
                "message": "Generating analysis..."
            }
            
            full_analysis = ""
            async for chunk in self._generate_analysis_stream(
                sentiment_data,
                matched_transactions,
                matched_reviews
            ):
                full_analysis += chunk
                yield {
                    "type": "stream",
                    "stage": "analysis_chunk",
                    "data": {"chunk": chunk}
                }
            
            # Step 4: Complete
            yield {
                "type": "completed",
                "stage": "analysis_completed",
                "message": "Analysis completed",
                "data": {
                    "matched_transactions": matched_transactions,
                    "matched_reviews": matched_reviews,
                    "analysis": full_analysis
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
