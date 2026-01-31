import asyncio
import json
from typing import Dict, Any, AsyncGenerator
from datetime import datetime
import httpx
from app.config import config
import logging

logger = logging.getLogger(__name__)

def clean_post_content(content: str) -> str:
    """Remove meta-commentary and notes from LLM output"""
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Stop at horizontal rules followed by notes
        if line.strip().startswith('---'):
            # Check if next content is meta-commentary
            remaining = '\n'.join(lines[lines.index(line):])
            if any(keyword in remaining.lower() for keyword in [
                'key tone', 'structure notes', '**note:', 'meta-commentary',
                'acknowledges concerns', 'reinforces trust', 'encourages proactive'
            ]):
                break
        
        # Skip lines that are clearly meta-commentary
        lower_line = line.lower().strip()
        if any(lower_line.startswith(prefix) for prefix in [
            '**note:', '**key tone', '**structure notes',
            '*note:', 'note:', '- **acknowledges', '- **reinforces', '- **encourages'
        ]):
            continue
            
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()

class ExecutiveBriefingAgent:
    """EBA Agent - Generates PR posts for social media"""
    
    def __init__(self):
        self.ollama_url = config.ollama_base_url
        self.model = config.ollama_model
        self.max_retries = config.get('agents.eba.max_retries', 3)
        self.retry_delay = config.get('agents.eba.retry_delay', 2)
        self.social_media_url = config.social_media_url
    
    async def _generate_pr_post_stream(
        self,
        sentiment_data: Dict[str, Any],
        sanitized_summary: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Generate PR post using Ollama with streaming - uses ONLY sanitized data"""
        
        # Extract sanitized verification data (NO sensitive info)
        transactions_found = sanitized_summary.get('transactions_found', 0)
        reviews_found = sanitized_summary.get('reviews_found', 0)
        sentiment_match_count = sanitized_summary.get('sentiment_match_count', 0)
        confidence_score = sanitized_summary.get('confidence_score', 0.0)
        verification = sanitized_summary.get('verification', 'NOT CONFIRMED')
        internal_sentiment = sanitized_summary.get('sentiment', 'unknown')
        
        # Prepare prompt with ONLY sanitized data
        prompt = f"""You are an Executive Briefing Agent for a bank's PR team. You need to create a professional social media post to address public concerns.

**Social Media Sentiment Detected:**
- Signal Type: {sentiment_data.get('signal_type')}
- Confidence: {sentiment_data.get('confidence')}
- Key Concerns: {', '.join(sentiment_data.get('drivers', []))}

**Internal Verification Results (Sanitized):**
- Transactions Found: {transactions_found}
- Customer Reviews Found: {reviews_found}
- Matching Sentiment Reviews: {sentiment_match_count}
- Confidence Score: {confidence_score:.1f}%
- Verification Status: {verification}
- Internal Sentiment: {internal_sentiment}

Create a professional, reassuring social media post (in **markdown format**) that:
1. Acknowledges the public concern without confirming or denying specifics
2. Highlights the bank's commitment to security and customer trust
3. Provides reassurance about internal monitoring and safeguards
4. Invites customers to reach out for concerns
5. Keeps a professional, calm, and confident tone
6. Uses the verification confidence to gauge response strength (higher confidence = more acknowledgment, lower confidence = more reassurance)

Target audience: General public
Length: 150-250 words
Format: Professional markdown with proper headings and structure

IMPORTANT RULES:
- Output ONLY the final post content
- Do NOT add explanations, notes, or commentary after the post
- Do NOT include lines starting with "---" or "**Note:**" or "**Key" 
- Do NOT include meta-commentary about tone, structure, or strategy
- Do NOT mention specific customer names, transaction amounts, or review details
- The post should be ready to publish as-is

Do NOT include:
- Specific customer data
- Transaction amounts
- Customer names
- Review text content
- Admission of fault
- Technical jargon
- Links or references
- Any explanatory notes about the post"""

        # Stream from Ollama
        async with httpx.AsyncClient(timeout=90.0) as client:
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
                            'num_predict': 800
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
                yield f"[Error generating post: {str(e)}]"
    
    async def generate_post(
        self,
        sentiment_data: Dict[str, Any],
        sanitized_summary: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Generate PR post with streaming - receives ONLY sanitized data (no sensitive info)
        Yields progress updates via generator
        """
        try:
            # Step 1: Start generation
            yield {
                "type": "progress",
                "stage": "generating_post",
                "message": "Generating PR post using sanitized internal data..."
            }
            
            # Step 2: Stream the post (ONLY using sanitized summary)
            full_post = ""
            async for chunk in self._generate_pr_post_stream(
                sentiment_data,
                sanitized_summary
            ):
                full_post += chunk
                yield {
                    "type": "stream",
                    "stage": "post_chunk",
                    "data": {"chunk": chunk}
                }
            
            # Clean the post to remove any meta-commentary
            cleaned_post = clean_post_content(full_post)
            
            # Step 3: Complete
            yield {
                "type": "completed",
                "stage": "post_completed",
                "message": "PR post generated successfully",
                "data": {
                    "original_post": cleaned_post
                }
            }
            
        except Exception as e:
            logger.error(f"EBA post generation error: {e}")
            yield {
                "type": "error",
                "stage": "generation_failed",
                "message": str(e)
            }
    
    async def post_to_social_media(self, post_content: str) -> Dict[str, Any]:
        """Post the approved content to social media simulator"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self.social_media_url,
                    json={
                        "content": post_content,
                        "channel_id": "bank-official",
                        "image_url": None,
                        "scheduled_at": None
                    }
                )
                response.raise_for_status()
                return {
                    "success": True,
                    "response": response.json()
                }
            except Exception as e:
                logger.error(f"Social media posting error: {e}")
                return {
                    "success": False,
                    "error": str(e)
                }

# Global instance
eba_agent = ExecutiveBriefingAgent()
