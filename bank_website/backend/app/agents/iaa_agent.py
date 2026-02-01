import asyncio
import json
from typing import List, Dict, Any, AsyncGenerator
from datetime import datetime, timedelta
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AgentWorkflow, AgentWorkflowStatus
from app.config import config
import logging
from collections import Counter

logger = logging.getLogger(__name__)

class InternalAnalysisAgent:
    """
    IAA Agent - Social Signal Verification & Risk Analysis
    
    Analyzes social media patterns to verify FDA signals and assess risk.
    Focuses on SOCIAL INTELLIGENCE, not internal banking operations.
    """
    
    def __init__(self):
        self.ollama_url = config.ollama_base_url
        self.model = config.ollama_model
        self.max_retries = config.get('agents.iaa.max_retries', 3)
        self.retry_delay = config.get('agents.iaa.retry_delay', 2)
        self.social_media_api = "http://localhost:8001/api"  # Social media platform
    
    async def _fetch_social_posts(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch recent posts from social media platform for pattern analysis"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Fetch posts across all channels
                response = await client.get("http://localhost:8001/posts/")
                response.raise_for_status()
                posts_data = response.json()
                
                if not isinstance(posts_data, list):
                    logger.warning(f"Unexpected posts response format: {type(posts_data)}")
                    return []
                
                # Transform to expected format (no time filtering - use all available posts for demo)
                recent_posts = []
                for post in posts_data:
                    recent_posts.append({
                        'post_id': post.get('id'),
                        'content': post.get('content', ''),
                        'channel': post.get('channel_id', 'general'),
                        'timestamp': post.get('created_at', ''),
                        'author': 'social_user'
                    })
                
                logger.info(f"Fetched {len(recent_posts)} posts for analysis")
                return recent_posts[:limit]
        except Exception as e:
            logger.error(f"Error fetching social posts: {e}")
            return []
    
    async def _analyze_social_patterns(
        self,
        posts: List[Dict[str, Any]],
        fda_signal: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze social media patterns:
        - Spread velocity (posts per hour)
        - Keyword clustering
        - Sentiment trajectory
        - Channel distribution
        """
        if not posts:
            return {
                "posts_analyzed": 0,
                "spread_velocity": "0 posts/hour",
                "top_keywords": [],
                "channels": [],
                "time_range": "No data"
            }
        
        # Extract FDA drivers for keyword matching
        fda_drivers = fda_signal.get('drivers', [])
        signal_type = fda_signal.get('signal_type', '')
        
        # Time-based analysis
        now = datetime.now()
        one_hour_ago = now - timedelta(hours=1)
        
        posts_last_hour = 0
        all_words = []
        channels = set()
        
        for post in posts:
            # Social media platform format: { post_id, channel, author, content, timestamp, comments }
            content = post.get('content', '').lower()
            timestamp_str = post.get('timestamp', '')  # Format: "31-01-2026 14:30:00"
            channel = post.get('channel', 'general')
            
            # Extract words for keyword analysis
            words = content.split()
            all_words.extend([w.strip('.,!?;:') for w in words if len(w) > 3])
            
            channels.add(channel)
            
            # Count recent posts - parse custom timestamp format
            try:
                # Parse "DD-MM-YYYY HH:MM:SS" format
                post_time = datetime.strptime(timestamp_str, "%d-%m-%Y %H:%M:%S")
                if post_time >= one_hour_ago:
                    posts_last_hour += 1
            except:
                # If timestamp parsing fails, count it as recent (conservative approach)
                posts_last_hour += 1
        
        # Keyword frequency analysis
        word_freq = Counter(all_words)
        top_keywords = [word for word, count in word_freq.most_common(10)]
        
        # Velocity calculation
        velocity = f"{posts_last_hour} posts/hour" if posts_last_hour > 0 else "< 1 post/hour"
        
        return {
            "posts_analyzed": len(posts),
            "spread_velocity": velocity,
            "posts_last_hour": posts_last_hour,
            "top_keywords": top_keywords,
            "channels": list(channels),
            "time_range": "Last 24 hours"
        }
    
    async def _assess_risk_level(
        self,
        fda_signal: Dict[str, Any],
        social_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Assess risk level based on signal type, confidence, and social patterns.
        Returns: CRITICAL / HIGH / MEDIUM / LOW
        """
        signal_type = fda_signal.get('signal_type', '')
        confidence = fda_signal.get('confidence', 0)
        drivers = fda_signal.get('drivers', [])
        posts_last_hour = social_patterns.get('posts_last_hour', 0)
        
        # Risk calculation logic
        risk_level = "LOW"
        impact_brand = "LOW"
        impact_customer = "LOW"
        impact_operational = "LOW"
        impact_financial = "LOW"
        
        # Fraud/scam signals
        if 'scam' in signal_type or 'fraud' in signal_type or 'phishing' in signal_type:
            risk_level = "CRITICAL"
            impact_brand = "HIGH"
            impact_customer = "CRITICAL"
            impact_financial = "MEDIUM"
            
            # Check for urgency indicators
            if posts_last_hour > 20:
                impact_brand = "CRITICAL"
            
        # Service/outage signals
        elif 'service' in signal_type or 'outage' in signal_type or 'incident' in signal_type:
            risk_level = "HIGH"
            impact_operational = "HIGH"
            impact_customer = "HIGH"
            impact_brand = "MEDIUM"
            
        # Sentiment shift signals
        elif 'sentiment' in signal_type or 'negative' in signal_type:
            if confidence > 0.8:
                risk_level = "HIGH"
            else:
                risk_level = "MEDIUM"
            impact_brand = "MEDIUM" if confidence > 0.7 else "LOW"
            impact_customer = "MEDIUM"
        
        # Positive signals
        elif 'positive' in signal_type:
            risk_level = "LOW"
            impact_brand = "POSITIVE"
        
        # Default for unknown types
        else:
            risk_level = "MEDIUM"
        
        return {
            "risk_level": risk_level,
            "impact_assessment": {
                "brand_trust": impact_brand,
                "customer_safety": impact_customer,
                "operational_continuity": impact_operational,
                "financial_loss_potential": impact_financial
            },
            "confidence": confidence,
            "reasoning": f"Based on signal type '{signal_type}' with {confidence*100:.0f}% confidence and {posts_last_hour} posts/hour velocity"
        }
    
    async def _generate_explainability(
        self,
        fda_signal: Dict[str, Any],
        risk_assessment: Dict[str, Any],
        social_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate 'Why This Matters' explanation using LLM
        """
        signal_type = fda_signal.get('signal_type', '')
        drivers = fda_signal.get('drivers', [])
        risk_level = risk_assessment.get('risk_level', 'MEDIUM')
        confidence = fda_signal.get('confidence', 0)
        
        prompt = f"""You are a banking risk analyst explaining a social media signal to executive leadership.

SIGNAL DETECTED:
Type: {signal_type}
Risk Level: {risk_level}
Confidence: {confidence * 100:.1f}%

DRIVERS:
{chr(10).join(f'- {d}' for d in drivers[:5])}

SOCIAL PATTERN ANALYSIS:
- Posts analyzed: {social_patterns.get('posts_analyzed', 0)}
- Spread velocity: {social_patterns.get('spread_velocity', 'unknown')}
- Channels: {', '.join(social_patterns.get('channels', [])[:3])}

TASK: Generate concise explanations for:

1. WHY THIS MATTERS (2-3 sentences) - Impact on bank and customers
2. POTENTIAL CONSEQUENCES (3 bullet points) - What could happen if not addressed
3. RECOMMENDED ACTIONS (3 specific actions) - What should be done immediately

RETURN ONLY JSON:
{{
    "why_matters": "...",
    "potential_consequences": ["...", "...", "..."],
    "recommended_actions": ["...", "...", "..."]
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
                explanation = json.loads(result['response'])
                return explanation
        except Exception as e:
            logger.error(f"Error generating explainability: {e}")
            # Fallback explanation
            return {
                "why_matters": f"This {signal_type} signal requires attention due to potential impact on brand trust and customer experience.",
                "potential_consequences": [
                    "Brand reputation damage if not addressed",
                    "Customer confusion and loss of trust",
                    "Potential regulatory or media scrutiny"
                ],
                "recommended_actions": [
                    "Verify signal with operations team",
                    "Prepare public response if needed",
                    "Monitor situation for escalation"
                ]
            }
    
    async def _determine_escalation(
        self,
        risk_assessment: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Determine escalation routing based on risk level"""
        risk_level = risk_assessment.get('risk_level', 'MEDIUM')
        
        escalation_routes = {
            "CRITICAL": {
                "escalate_to": ["Security Team", "PR Team", "Executive Leadership"],
                "urgency": "IMMEDIATE",
                "notification_channels": ["Email", "SMS", "Dashboard Alert"],
                "sla_minutes": 15
            },
            "HIGH": {
                "escalate_to": ["PR Team", "Compliance", "Operations"],
                "urgency": "HIGH",
                "notification_channels": ["Email", "Dashboard Alert"],
                "sla_minutes": 60
            },
            "MEDIUM": {
                "escalate_to": ["PR Team", "Customer Service"],
                "urgency": "STANDARD",
                "notification_channels": ["Dashboard Alert"],
                "sla_minutes": 240
            },
            "LOW": {
                "escalate_to": ["Monitoring Team"],
                "urgency": "LOW",
                "notification_channels": ["Dashboard Alert"],
                "sla_minutes": 1440
            }
        }
        
        return escalation_routes.get(risk_level, escalation_routes["MEDIUM"])
    
    async def _generate_analysis_stream(
        self,
        sentiment_data: Dict[str, Any],
        social_patterns: Dict[str, Any],
        risk_assessment: Dict[str, Any],
        explainability: Dict[str, Any],
        escalation: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Generate streaming analysis output for WebSocket"""
        
        # Yield section by section for progressive UI update
        yield "\n## 🔍 Social Signal Verification\n\n"
        yield f"**Signal Type**: {sentiment_data.get('signal_type', 'unknown')}\n"
        yield f"**FDA Confidence**: {sentiment_data.get('confidence', 0) * 100:.1f}%\n\n"
        
        yield "### 📊 Social Pattern Analysis\n\n"
        yield f"- **Posts Analyzed**: {social_patterns.get('posts_analyzed', 0)}\n"
        yield f"- **Spread Velocity**: {social_patterns.get('spread_velocity', 'unknown')}\n"
        yield f"- **Channels**: {', '.join(social_patterns.get('channels', [])[:3])}\n"
        yield f"- **Top Keywords**: {', '.join(social_patterns.get('top_keywords', [])[:5])}\n\n"
        
        yield f"### ⚠️ Risk Assessment: **{risk_assessment.get('risk_level', 'MEDIUM')}**\n\n"
        impact = risk_assessment.get('impact_assessment', {})
        yield "**Impact Analysis**:\n"
        yield f"- Brand Trust: {impact.get('brand_trust', 'UNKNOWN')}\n"
        yield f"- Customer Safety: {impact.get('customer_safety', 'UNKNOWN')}\n"
        yield f"- Operational Continuity: {impact.get('operational_continuity', 'UNKNOWN')}\n"
        yield f"- Financial Loss Potential: {impact.get('financial_loss_potential', 'UNKNOWN')}\n\n"
        
        yield "### 💡 Why This Matters\n\n"
        yield f"{explainability.get('why_matters', 'Analysis in progress...')}\n\n"
        
        yield "### 🚨 Potential Consequences\n\n"
        for consequence in explainability.get('potential_consequences', []):
            yield f"- {consequence}\n"
        yield "\n"
        
        yield "### ✅ Recommended Actions\n\n"
        for action in explainability.get('recommended_actions', []):
            yield f"- {action}\n"
        yield "\n"
        
        yield f"### 📢 Escalation Routing: **{escalation.get('urgency', 'STANDARD')}**\n\n"
        yield f"**Escalate To**: {', '.join(escalation.get('escalate_to', []))}\n"
        yield f"**SLA**: {escalation.get('sla_minutes', 60)} minutes\n"
        yield f"**Channels**: {', '.join(escalation.get('notification_channels', []))}\n\n"
        
        yield "---\n\n"
        yield f"*Analysis completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n"
    
    async def analyze_and_stream(
        self,
        sentiment_data: Dict[str, Any],
        db: AsyncSession
    ) -> AsyncGenerator[str, None]:
        """
        Main analysis method - streams results as they're generated
        
        Flow:
        1. Fetch social media posts
        2. Analyze social patterns
        3. Assess risk level
        4. Generate explainability
        5. Determine escalation
        6. Stream formatted output
        """
        try:
            logger.info(f"IAA analyzing signal: {sentiment_data.get('signal_type', 'unknown')}")
            
            # Step 1: Fetch social media posts
            posts = await self._fetch_social_posts(limit=100)
            
            # Step 2: Analyze social patterns
            social_patterns = await self._analyze_social_patterns(posts, sentiment_data)
            
            # Step 3: Assess risk level
            risk_assessment = await self._assess_risk_level(sentiment_data, social_patterns)
            
            # Step 4: Generate explainability
            explainability = await self._generate_explainability(
                sentiment_data,
                risk_assessment,
                social_patterns
            )
            
            # Step 5: Determine escalation
            escalation = await self._determine_escalation(risk_assessment)
            
            # Step 6: Stream formatted output
            async for chunk in self._generate_analysis_stream(
                sentiment_data,
                social_patterns,
                risk_assessment,
                explainability,
                escalation
            ):
                yield chunk
            
            logger.info("IAA analysis completed successfully")
            
        except Exception as e:
            logger.error(f"IAA analysis error: {e}")
            yield f"\n## ❌ Analysis Error\n\n{str(e)}\n"
    
    async def analyze(
        self,
        sentiment_data: Dict[str, Any],
        db: AsyncSession
    ) -> str:
        """
        Non-streaming version - returns complete analysis as single string
        """
        chunks = []
        async for chunk in self.analyze_and_stream(sentiment_data, db):
            chunks.append(chunk)
        return ''.join(chunks)


# Create singleton instance for import
iaa_agent = InternalAnalysisAgent()
