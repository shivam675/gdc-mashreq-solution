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
        iaa_analysis: str,
        matched_data: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Generate PR post using Ollama with streaming"""
        
        # Prepare prompt
        prompt = f"""You are an Executive Briefing Agent for a bank's PR team. You need to create a professional social media post to address public concerns.

**Social Media Sentiment Detected:**
- Signal Type: {sentiment_data.get('signal_type')}
- Confidence: {sentiment_data.get('confidence')}
- Key Concerns: {', '.join(sentiment_data.get('drivers', []))}

**Internal Analysis Report:**
{iaa_analysis}

**Matched Internal Data:**
- Transactions flagged: {len(matched_data.get('matched_transactions', []))}
- Customer reviews found: {len(matched_data.get('matched_reviews', []))}

Create a professional, reassuring social media post (in **markdown format**) that:
1. Acknowledges the public concern without confirming or denying specifics
2. Highlights the bank's commitment to security and customer trust
3. Provides reassurance about internal monitoring and safeguards
4. Invites customers to reach out for concerns
5. Keeps a professional, calm, and confident tone

Target audience: General public
Length: 150-250 words
Format: Professional markdown with proper headings and structure

IMPORTANT RULES:
- Output ONLY the final post content
- Do NOT add explanations, notes, or commentary after the post
- Do NOT include lines starting with "---" or "**Note:**" or "**Key" 
- Do NOT include meta-commentary about tone, structure, or strategy
- The post should be ready to publish as-is

Do NOT include:
- Specific customer data
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
        iaa_analysis: str,
        matched_data: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Generate PR post with streaming
        Yields progress updates via generator
        """
        try:
            # Step 1: Start generation
            yield {
                "type": "progress",
                "stage": "generating_post",
                "message": "Generating PR post..."
            }
            
            # Step 2: Stream the post
            full_post = ""
            async for chunk in self._generate_pr_post_stream(
                sentiment_data,
                iaa_analysis,
                matched_data
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
                        "timestamp": datetime.utcnow().isoformat(),
                        "platform": "social_media_simulator"
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
