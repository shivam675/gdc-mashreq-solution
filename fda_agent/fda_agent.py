#!/usr/bin/env python3
"""
FDA Agent - Fraud Detection & Analysis Agent
Monitors social media for potential security threats and sends signals to SLM Desk
"""

import asyncio
import httpx
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FDAAgent:
    """Fraud Detection & Analysis Agent"""
    
    def __init__(
        self,
        social_media_url: str = "http://localhost:8001",
        bank_backend_url: str = "http://localhost:8000",
        ollama_url: str = "http://localhost:11434",
        ollama_model: str = "ministral-3:3b",
        poll_interval: int = 30,
        state_file: str = "fda_state.json"
    ):
        self.social_media_url = social_media_url
        self.bank_backend_url = bank_backend_url
        self.ollama_url = ollama_url
        self.ollama_model = ollama_model
        self.poll_interval = poll_interval
        self.state_file = Path(state_file)
        
        # Load last processed timestamp
        self.last_processed_time = self._load_state()
        
        logger.info(f"FDA Agent initialized")
        logger.info(f"Monitoring: {self.social_media_url}")
        logger.info(f"Reporting to: {self.bank_backend_url}")
        logger.info(f"Using model: {self.ollama_model}")
    
    def _load_state(self) -> datetime:
        """Load the last processed timestamp from state file"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
                    timestamp_str = state.get('last_processed_time')
                    if timestamp_str:
                        return datetime.fromisoformat(timestamp_str)
            except Exception as e:
                logger.warning(f"Could not load state file: {e}")
        
        # Default to 1 hour ago
        return datetime.utcnow() - timedelta(hours=1)
    
    def _save_state(self):
        """Save the last processed timestamp to state file"""
        try:
            with open(self.state_file, 'w') as f:
                json.dump({
                    'last_processed_time': self.last_processed_time.isoformat()
                }, f)
        except Exception as e:
            logger.error(f"Could not save state file: {e}")
    
    async def fetch_social_media_posts(self) -> List[Dict[str, Any]]:
        """Fetch posts from social media simulator"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(f"{self.social_media_url}/api/sync")
                response.raise_for_status()
                data = response.json()
                
                # The sync endpoint returns posts in a specific format
                posts = data if isinstance(data, list) else []
                logger.info(f"Fetched {len(posts)} posts from social media")
                return posts
                
            except Exception as e:
                logger.error(f"Error fetching social media posts: {e}")
                return []
    
    def _parse_post_timestamp(self, timestamp_str: str) -> Optional[datetime]:
        """Parse timestamp from various formats"""
        try:
            # Try format: "31-01-2026 20:45:30"
            return datetime.strptime(timestamp_str, "%d-%m-%Y %H:%M:%S")
        except:
            try:
                # Try ISO format
                return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except:
                logger.warning(f"Could not parse timestamp: {timestamp_str}")
                return None
    
    def filter_new_posts(self, posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter posts to only include new ones since last check"""
        new_posts = []
        
        for post in posts:
            timestamp_str = post.get('timestamp')
            if not timestamp_str:
                continue
            
            post_time = self._parse_post_timestamp(timestamp_str)
            if post_time and post_time > self.last_processed_time:
                new_posts.append(post)
        
        logger.info(f"Found {len(new_posts)} new posts since {self.last_processed_time}")
        return new_posts
    
    async def analyze_post_with_llm(self, post: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Analyze a post using Ollama to detect potential threats"""
        content = post.get('content', '')
        author = post.get('author', 'Unknown')
        
        # Skip very short posts or obvious spam
        if len(content.strip()) < 10:
            return None
        
        prompt = f"""You are a fraud detection AI analyzing social media posts for a bank's security team.

Analyze this post for potential security threats:

Author: {author}
Content: {content}

Detect if this post contains:
1. Phishing attempts (fake links, credential harvesting)
2. Fraud warnings (scam reports, fake websites)
3. Brand impersonation (pretending to be the bank)
4. Social engineering (urgency tactics, CVV requests)
5. Customer complaints about security issues

Response format (JSON only):
{{
  "is_threat": true/false,
  "signal_type": "Phishing SMS Campaign" or "Fake Website" or "CVV Disclosure" or "Brand Impersonation" or "Customer Security Complaint" or "None",
  "confidence": 0-100,
  "drivers": ["specific reason 1", "specific reason 2"],
  "recommend_escalation": 0 or 1,
  "uncertainty_notes": "any concerns about classification"
}}

If not a threat, set is_threat to false and signal_type to "None".
"""
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.3,
                        "format": "json"
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                # Parse the LLM response
                llm_output = result.get('response', '{}')
                analysis = json.loads(llm_output)
                
                # Only return if it's actually a threat
                if analysis.get('is_threat', False):
                    logger.info(f"Threat detected: {analysis.get('signal_type')} (confidence: {analysis.get('confidence')}%)")
                    return analysis
                
                return None
                
            except Exception as e:
                logger.error(f"Error analyzing post with LLM: {e}")
                return None
    
    async def send_signal_to_bank(self, signal_data: Dict[str, Any], post: Dict[str, Any]):
        """Send detected signal to bank backend"""
        payload = {
            "signal_type": signal_data.get('signal_type', 'Unknown Threat'),
            "confidence": signal_data.get('confidence', 50) / 100.0,  # Convert to 0-1 range
            "drivers": signal_data.get('drivers', []),
            "uncertainty_notes": signal_data.get('uncertainty_notes', ''),
            "recommend_escalation": bool(signal_data.get('recommend_escalation', 0))  # Convert to boolean
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.bank_backend_url}/api/send_social_sentiment",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"✅ Signal sent to bank: {signal_data.get('signal_type')} - Workflow: {result.get('workflow_id')}")
                return result
                
            except Exception as e:
                logger.error(f"❌ Error sending signal to bank: {e}")
                return None
    
    async def analyze_posts_batch(self, posts: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Analyze multiple posts together to detect aggregate patterns"""
        if len(posts) < 3:
            logger.info(f"Only {len(posts)} posts - below threshold of 3 for aggregate analysis")
            return None
        
        # Combine all post contents for batch analysis
        combined_content = "\n\n---POST SEPARATOR---\n\n".join([
            f"[Post {p.get('post_id')} by {p.get('author')} on {p.get('channel')}]: {p.get('content', '')}"
            for p in posts
        ])
        
        prompt = f"""You are a fraud detection AI analyzing {len(posts)} social media posts for aggregate threat patterns.

Analyze these posts to detect PATTERNS and TRENDS, not individual incidents:

{combined_content}

Detect aggregate patterns like:
1. Multiple phishing reports (3+ posts mentioning fake SMS/links)
2. Emerging fraud trends (spike in CVV requests, fake website warnings)
3. Brand impersonation campaign (coordinated fake accounts)
4. Social engineering wave (multiple urgency/pressure tactics)
5. Customer security complaints (pattern of security issues)

Response format (JSON only):
{{
  "is_threat": true/false,
  "signal_type": "Phishing SMS Campaign" or "Fake Website Trend" or "CVV Disclosure Wave" or "Brand Impersonation Campaign" or "Security Complaints Spike" or "None",
  "confidence": 0-100,
  "drivers": ["specific pattern 1", "specific pattern 2", "X posts mentioning Y"],
  "recommend_escalation": 0 or 1,
  "uncertainty_notes": "any concerns about classification",
  "affected_posts_count": number of posts showing this pattern,
  "affected_channels": ["channel1", "channel2"]
}}

Only flag if pattern appears in 3+ posts. If not a threat pattern, set is_threat to false.
"""
        
        async with httpx.AsyncClient(timeout=90.0) as client:
            try:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.3,
                        "format": "json"
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                llm_output = result.get('response', '{}')
                analysis = json.loads(llm_output)
                
                if analysis.get('is_threat', False):
                    logger.info(f"Aggregate threat detected: {analysis.get('signal_type')} (confidence: {analysis.get('confidence')}%)")
                    logger.info(f"Pattern found in {analysis.get('affected_posts_count', len(posts))} posts")
                    return analysis
                
                return None
                
            except Exception as e:
                logger.error(f"Error analyzing post batch with LLM: {e}")
                return None
    
    async def process_posts(self):
        """Main processing loop - fetch, analyze aggregate patterns, and report"""
        logger.info("🔍 Starting post analysis cycle...")
        
        # Fetch all posts
        all_posts = await self.fetch_social_media_posts()
        
        # Filter to new posts only
        new_posts = self.filter_new_posts(all_posts)
        
        if not new_posts:
            logger.info("No new posts to analyze")
            return
        
        logger.info(f"Analyzing {len(new_posts)} new posts for aggregate patterns...")
        
        # Analyze ALL new posts together for patterns (not individually)
        analysis = await self.analyze_posts_batch(new_posts)
        
        if analysis:
            # Send ONE signal for the aggregate pattern
            await self.send_signal_to_bank(analysis, new_posts[0])  # Include first post as reference
            logger.info(f"✨ Aggregate signal sent: {analysis.get('signal_type')}")
        else:
            logger.info(f"No significant threat patterns detected in {len(new_posts)} posts")
        
        # Update last processed time
        if new_posts:
            latest_time = max(
                self._parse_post_timestamp(p.get('timestamp', ''))
                for p in new_posts
                if self._parse_post_timestamp(p.get('timestamp', ''))
            )
            if latest_time:
                self.last_processed_time = latest_time
                self._save_state()
    
    async def run(self):
        """Run the FDA agent continuously"""
        logger.info(f"🚀 FDA Agent started - polling every {self.poll_interval} seconds")
        
        while True:
            try:
                await self.process_posts()
            except Exception as e:
                logger.error(f"Error in processing cycle: {e}")
            
            # Wait before next cycle
            logger.info(f"💤 Waiting {self.poll_interval} seconds until next cycle...\n")
            await asyncio.sleep(self.poll_interval)


async def main():
    """Entry point"""
    agent = FDAAgent(
        poll_interval=30,  # Check every 30 seconds
        ollama_model="ministral-3:3b"
    )
    
    try:
        await agent.run()
    except KeyboardInterrupt:
        logger.info("FDA Agent stopped by user")


if __name__ == "__main__":
    asyncio.run(main())
