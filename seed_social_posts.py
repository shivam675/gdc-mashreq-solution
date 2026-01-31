"""
Seed social media platform with sample posts for testing
"""

import requests
import json
from datetime import datetime, timedelta

API_URL = "http://localhost:8001"

# Sample posts related to the fraud scenario
SAMPLE_POSTS = [
    {
        "content": "@SecurityAlert says: URGENT! Received suspicious SMS claiming Mashreq Gold Rewards expiring. DO NOT CLICK the link mashreq-rewards-portal-update.com - it's a SCAM!",
        "channel_id": "fraud-watch"
    },
    {
        "content": "@BankCustomer says: Just got a fake Mashreq text about rewards. Almost clicked it! The website looks EXACTLY like the real one. Be careful everyone! #ScamAlert",
        "channel_id": "general"
    },
    {
        "content": "@ConsumerWatch says: WARNING: Phishing campaign targeting Mashreq customers. Fake SMS asks for OTP and CVV. Multiple reports in the last 2 hours. #BankingSecurity",
        "channel_id": "fraud-watch"
    },
    {
        "content": "@FinanceGuru says: PSA - If you receive SMS about Mashreq rewards expiring, DELETE IT. The bank confirmed it's a phishing attempt. Don't enter any card details!",
        "channel_id": "general"
    },
    {
        "content": "@TechSavvy says: The mashreq-rewards-portal-update.com site has SSL certificate but it's FAKE. Uses exact Mashreq branding. This is a sophisticated phishing attack!",
        "channel_id": "fraud-watch"
    },
    {
        "content": "@CustomerCare says: Heads up - friend lost 5000 AED to fake Mashreq site today. They entered CVV thinking it was real rewards redemption. Spread the word!",
        "channel_id": "general"
    },
    {
        "content": "@InfoSec says: Analyzing the Mashreq phishing SMS. It's well-crafted with urgency tactics ('24-hour expiry'). Creating panic to override critical thinking. Classic social engineering.",
        "channel_id": "fraud-watch"
    },
    {
        "content": "@ConcernedUser says: Why hasn't Mashreq Bank issued an official statement about this phishing SMS? It's been spreading for hours. We need clarity! #CustomerSafety",
        "channel_id": "general"
    },
    {
        "content": "@MobileUser says: Got the same fake Mashreq SMS. Reported it to UAE cybercrime. Everyone should report this - the more reports, the faster the domain gets blocked.",
        "channel_id": "fraud-watch"
    },
    {
        "content": "@BankingExpert says: This Mashreq phishing campaign is particularly dangerous because: 1) Perfect branding match 2) SSL certificate 3) Urgent deadline 4) Targets loyalty program. Very professional.",
        "channel_id": "fraud-watch"
    }
]

def seed_posts():
    """Add sample posts to social media platform"""
    print("🌱 Seeding social media platform with sample posts...")
    print(f"API URL: {API_URL}\n")
    
    try:
        # Check if API is running
        response = requests.get(f"{API_URL}/api/")
        if response.status_code != 200:
            print(f"❌ Social media API not responding. Is it running on port 8001?")
            return False
        
        print("✅ Social media API is running\n")
        
        # Add sample posts
        created_count = 0
        for post in SAMPLE_POSTS:
            try:
                response = requests.post(
                    f"{API_URL}/posts/",
                    json=post,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code in [200, 201]:
                    created_count += 1
                    print(f"✅ Created: [{post['channel_id']}] {post['content'][:60]}...")
                else:
                    print(f"⚠️  Failed to create post: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error creating post: {e}")
        
        print(f"\n🎉 Successfully created {created_count}/{len(SAMPLE_POSTS)} posts!")
        print(f"\n📊 Check posts at: {API_URL}/api/sync")
        return True
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to social media API at {API_URL}")
        print("   Make sure the social media server is running:")
        print("   cd social_media/backend && python run.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "="*80)
    print("SEED SOCIAL MEDIA PLATFORM")
    print("="*80 + "\n")
    
    success = seed_posts()
    
    if success:
        print("\n✅ Seeding complete! Now you can:")
        print("   1. Run: python test_winning_solution.py")
        print("   2. Or manually trigger FDA detection")
        print("   3. Watch the dashboard for real-time updates\n")
    else:
        print("\n❌ Seeding failed. Fix the errors above and try again.\n")
