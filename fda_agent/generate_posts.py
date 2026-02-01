#!/usr/bin/env python3
"""
Social Media Post Generator
Creates posts, comments, and replies on the social media simulator for testing
"""

import asyncio
import httpx
import random
from datetime import datetime
from typing import List

# Social media server URL
SOCIAL_MEDIA_URL = "http://localhost:8001"

# Sample channels - representing different social media platforms
CHANNELS = ["chirper", "photogram", "facespace", "linkedup", "threadit"]

# Sample threat posts (for FDA to detect)
THREAT_POSTS = [
    "@PhishingScammer says: Urgent! Your GBank account has been suspended. Click here to verify: gbank-rewards-portal.com/verify. Act now!",
    "@FraudAlert says: WARNING: Fake SMS campaign asking for CVV codes claiming to be from GBank. Do NOT share your details!",
    "@ScamReporter says: I received a call from someone pretending to be GBank support asking for my card PIN. This is a scam!",
    "@SuspiciousUser says: Free iPhone 15 for first 100 GBank customers! Share your card number here: bit.ly/gbank-prize",
    "@FakeBankRep says: Dear customer, update your KYC immediately or account will be closed. Visit: gbank-kyc-update.net",
    "@ImpersonatorBot says: GBank Official: You've won $10,000! Click link to claim: gbank-lottery.com/claim",
    "@UrgentAlert says: CRITICAL: Suspicious activity on your account. Verify your CVV and PIN now: secure-gbank-verify.com",
    "@BrandHijacker says: I'm GBank manager. Send me your OTP to fix account issue immediately!",
]

# Sample legitimate posts
LEGITIMATE_POSTS = [
    "@HappyCustomer says: Great service at GBank branch today! The staff was very helpful.",
    "@SatisfiedUser says: Love the new mobile app features. Banking is so much easier now!",
    "@TechEnthusiast says: The biometric login on GBank app works perfectly. Very secure!",
    "@LoyalClient says: Been with GBank for 10 years. Best banking experience!",
    "@AppUser says: Quick question - what are the new savings account rates?",
    "@GeneralQuery says: Can someone explain the difference between current and savings accounts?",
    "@FeatureRequest says: Would be great to have dark mode in the app!",
    "@TravelBlogger says: Using GBank card abroad - no issues at all. Recommended!",
]

# Sample comments (can be added to any post)
COMMENTS = [
    "@Commenter1 says: This is concerning. Thanks for sharing!",
    "@Responder says: I experienced the same thing yesterday.",
    "@Helper says: You should report this to the official GBank fraud hotline.",
    "@Agreeing says: Yes, I've seen this scam circulating on WhatsApp too.",
    "@Thankful says: Thank you for the warning!",
    "@Curious says: How can we verify if a message is actually from GBank?",
    "@Supporter says: Always check the official website before clicking any links.",
    "@Worried says: This is getting out of hand. Banks need better security.",
]

# Sample replies to comments
REPLIES = [
    "@ReplyBot says: Good point! Always verify through official channels.",
    "@Agreement says: Exactly! Never share OTP or PIN with anyone.",
    "@InfoProvider says: GBank will never ask for CVV or PIN via SMS/call.",
    "@Advisor says: Report suspicious messages to cyber@gbank.com",
]


class SocialMediaGenerator:
    """Generate posts, comments, and replies on social media"""
    
    def __init__(self, base_url: str = SOCIAL_MEDIA_URL):
        self.base_url = base_url
    
    async def create_post(self, content: str, channel: str = "general") -> dict:
        """Create a post on social media"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/posts/",
                    json={
                        "content": content,
                        "channel_id": channel,
                        "image_url": None,
                        "scheduled_at": None
                    }
                )
                response.raise_for_status()
                post_data = response.json()
                print(f"✅ Posted to #{channel}: {post_data.get('id')} - {content[:60]}...")
                return post_data
            except Exception as e:
                print(f"❌ Error creating post: {e}")
                return {}
    
    async def add_comment(self, post_id: int, text: str, parent_id: int = None) -> dict:
        """Add a comment or reply to a post"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/comments/{post_id}",
                    json={
                        "text": text,
                        "parent_id": parent_id
                    }
                )
                response.raise_for_status()
                comment_data = response.json()
                comment_type = "Reply" if parent_id else "Comment"
                print(f"  💬 {comment_type} added to post {post_id}: {text[:60]}...")
                return comment_data
            except Exception as e:
                print(f"❌ Error adding comment: {e}")
                return {}
    
    async def get_posts(self, channel: str = None) -> List[dict]:
        """Get posts from social media"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                url = f"{self.base_url}/posts/"
                if channel:
                    url += f"?channel_id={channel}"
                
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"❌ Error fetching posts: {e}")
                return []
    
    async def generate_threat_scenario(self, num_posts: int = 5):
        """Generate a scenario with threat posts, comments, and replies"""
        print(f"\n🚨 Generating {num_posts} THREAT posts for FDA detection...\n")
        
        created_posts = []
        
        for i in range(num_posts):
            # Pick random threat post and channel
            content = random.choice(THREAT_POSTS)
            channel = random.choice(CHANNELS)
            
            # Create post
            post = await self.create_post(content, channel)
            if not post:
                continue
            
            created_posts.append(post)
            post_id = post.get('id')
            
            # Add 1-3 comments
            num_comments = random.randint(1, 3)
            comment_ids = []
            
            for _ in range(num_comments):
                comment_text = random.choice(COMMENTS)
                comment = await self.add_comment(post_id, comment_text)
                if comment and comment.get('id'):
                    comment_ids.append(comment.get('id'))
            
            # Add 0-2 replies to random comments
            if comment_ids:
                num_replies = random.randint(0, min(2, len(comment_ids)))
                for _ in range(num_replies):
                    parent_comment_id = random.choice(comment_ids)
                    reply_text = random.choice(REPLIES)
                    await self.add_comment(post_id, reply_text, parent_id=parent_comment_id)
            
            # Small delay between posts
            await asyncio.sleep(1)
        
        print(f"\n✨ Generated {len(created_posts)} threat posts with comments and replies!")
        return created_posts
    
    async def generate_legitimate_scenario(self, num_posts: int = 10):
        """Generate legitimate posts for normal activity"""
        print(f"\n📝 Generating {num_posts} LEGITIMATE posts...\n")
        
        created_posts = []
        
        for i in range(num_posts):
            # Pick random legitimate post and channel
            content = random.choice(LEGITIMATE_POSTS)
            channel = random.choice(CHANNELS)  # Uses all 5 channels
            
            # Create post
            post = await self.create_post(content, channel)
            if not post:
                continue
            
            created_posts.append(post)
            post_id = post.get('id')
            
            # Occasionally add comments (50% chance)
            if random.random() > 0.5:
                num_comments = random.randint(1, 2)
                for _ in range(num_comments):
                    comment_text = random.choice([
                        "@Responder says: Great to hear!",
                        "@Helper says: You're welcome!",
                        "@Supporter says: Glad you're satisfied!",
                        "@InfoProvider says: Check the website for more details.",
                    ])
                    await self.add_comment(post_id, comment_text)
            
            # Small delay
            await asyncio.sleep(0.5)
        
        print(f"\n✨ Generated {len(created_posts)} legitimate posts!")
        return created_posts
    
    async def generate_mixed_scenario(self, threat_count: int = 5, legit_count: int = 10):
        """Generate a mixed scenario of threats and legitimate posts"""
        print(f"\n🎭 Generating MIXED scenario: {threat_count} threats + {legit_count} legitimate posts\n")
        
        # Interleave threat and legitimate posts
        all_tasks = []
        
        # Spread out posts randomly
        all_posts = (
            [(content, random.choice(CHANNELS), True) 
             for content in random.sample(THREAT_POSTS, min(threat_count, len(THREAT_POSTS)))] +
            [(content, random.choice(CHANNELS), False) 
             for content in random.sample(LEGITIMATE_POSTS, min(legit_count, len(LEGITIMATE_POSTS)))]
        )
        
        random.shuffle(all_posts)
        
        for content, channel, is_threat in all_posts:
            post = await self.create_post(content, channel)
            
            if post and post.get('id'):
                # Add comments more frequently to threat posts
                if is_threat:
                    num_comments = random.randint(2, 4)
                else:
                    num_comments = random.randint(0, 2)
                
                for _ in range(num_comments):
                    comment_text = random.choice(COMMENTS)
                    await self.add_comment(post.get('id'), comment_text)
            
            await asyncio.sleep(1)
        
        print(f"\n✨ Mixed scenario complete!")


async def main():
    """Main entry point"""
    generator = SocialMediaGenerator()
    
    print("=" * 80)
    print("Social Media Post Generator for FDA Testing")
    print("=" * 80)
    
    # Menu
    print("\nWhat would you like to generate?")
    print("1. Threat posts only (for FDA detection)")
    print("2. Legitimate posts only")
    print("3. Mixed scenario (threats + legitimate)")
    print("4. Custom amounts")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        num = int(input("How many threat posts? (default 5): ") or "5")
        await generator.generate_threat_scenario(num)
    elif choice == "2":
        num = int(input("How many legitimate posts? (default 10): ") or "10")
        await generator.generate_legitimate_scenario(num)
    elif choice == "3":
        threats = int(input("How many threat posts? (default 5): ") or "5")
        legit = int(input("How many legitimate posts? (default 10): ") or "10")
        await generator.generate_mixed_scenario(threats, legit)
    elif choice == "4":
        threats = int(input("How many threat posts? ") or "0")
        legit = int(input("How many legitimate posts? ") or "0")
        if threats > 0:
            await generator.generate_threat_scenario(threats)
        if legit > 0:
            await generator.generate_legitimate_scenario(legit)
    else:
        print("Invalid choice. Exiting.")
    
    print("\n✅ Done! FDA agent should detect the threats in the next cycle.")


if __name__ == "__main__":
    asyncio.run(main())
