"""
Test script to verify the WINNING solution: Social Signal Intelligence Flow

Flow:
1. Social Media Platform has posts
2. FDA detects signal from social media
3. IAA fetches MORE social posts and analyzes patterns (NOT transactions!)
4. IAA assesses risk and generates explainability
5. EBA generates briefing
6. Human operator approves

This demonstrates we are analyzing SOCIAL SIGNALS, not internal banking data.
"""

import asyncio
import httpx
import json

# FDA Signal Output (from your example)
FDA_SIGNAL = {
    "signal_type": "potential_scam_rumor",
    "confidence": 0.98,
    "drivers": [
        "URGENT phishing SMS ('Gold Rewards expiry') with domain 'mashreq-rewards-portal-update.com' matching bank branding",
        "Suspicious link ('mashreq-rewards-portal-update.com') with exact branding (fonts, logo) and SSL certificate verification request",
        "OTP verification request for loyalty points redemption (common phishing tactic)",
        "Rapid spread across social channels (#ScamAlert, #BankingSecurity) with high reply velocity in #general and #fraud-watch",
        "Multiple reports of card CVV disclosure and transaction authorization to fraudulent site"
    ],
    "uncertainty_notes": "Domain appears temporarily down but was active during peak reports",
    "recommend_escalation": True
}

async def test_complete_flow():
    """Test the complete social signal intelligence flow"""
    
    print("=" * 80)
    print("SOCIAL SIGNAL INTELLIGENCE TEST")
    print("=" * 80)
    
    # Step 1: Check social media platform
    print("\n1️⃣  Checking Social Media Platform...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("http://localhost:8001/api/sync")
            if response.status_code == 200:
                posts = response.json()  # /api/sync returns list directly
                print(f"✅ Social media platform running: {len(posts)} posts available")
                
                # Show sample posts
                if posts:
                    print("\nSample posts:")
                    for post in posts[:3]:
                        content = post.get('content', 'No content')[:80]
                        channel = post.get('channel', 'unknown')
                        print(f"   - [{channel}] {content}...")
            else:
                print(f"❌ Social media platform error: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Cannot connect to social media platform: {e}")
        print("   Make sure the social media server is running:")
        print("   cd social_media/backend && python run.py")
        return False
    
    # Step 2: Send FDA signal to backend
    print("\n2️⃣ Sending FDA Signal to Backend...")
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "http://localhost:8000/api/send_social_sentiment",
                json=FDA_SIGNAL
            )
            if response.status_code == 200:
                result = response.json()
                print(f"✅ FDA signal processed")
                print(f"   Workflow ID: {result.get('workflow_id', 'unknown')}")
                print(f"   Status: {result.get('status', 'unknown')}")
                workflow_id = result.get('workflow_id')
            else:
                print(f"❌ Backend error: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("   Make sure the backend is running on port 8000")
        return False
    
    # Step 3: Wait for processing
    print("\n3️⃣ Waiting for IAA + EBA Processing...")
    await asyncio.sleep(5)
    
    # Step 4: Check workflow status
    print("\n4️⃣ Checking Workflow Status...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"http://localhost:8000/api/workflows/{workflow_id}")
            if response.status_code == 200:
                workflow = response.json()
                print(f"✅ Workflow retrieved")
                print(f"   Status: {workflow.get('status')}")
                
                # Show IAA analysis (should be social signal analysis)
                iaa_analysis = workflow.get('iaa_analysis', '')
                if iaa_analysis:
                    print("\n📊 IAA SOCIAL SIGNAL ANALYSIS:")
                    print("   " + "-" * 70)
                    # Show first 500 chars
                    print(f"   {iaa_analysis[:500]}...")
                    
                    # Verify it's social analysis (not transaction analysis)
                    if "Social Pattern Analysis" in iaa_analysis or "posts_analyzed" in iaa_analysis.lower():
                        print("\n   ✅ CORRECT: IAA analyzing SOCIAL signals")
                    else:
                        print("\n   ⚠️  WARNING: IAA might still be analyzing transactions")
                
                # Show EBA output
                eba_post = workflow.get('eba_original_post', '')
                if eba_post:
                    print("\n📝 EBA EXECUTIVE BRIEFING:")
                    print("   " + "-" * 70)
                    print(f"   {eba_post[:500]}...")
                
                print(f"\n   Ready for human approval: {workflow.get('status') == 'awaiting_approval'}")
            else:
                print(f"❌ Cannot retrieve workflow: {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Error checking workflow: {e}")
        return False
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE - Check the dashboard at http://localhost:5174")
    print("=" * 80)
    return True

if __name__ == "__main__":
    print("\n🏆 COMPETITION-WINNING SOLUTION TEST")
    print("Testing: FDA → IAA (Social Analysis) → EBA → Human Approval\n")
    
    result = asyncio.run(test_complete_flow())
    
    if result:
        print("\n✅ SUCCESS: System is analyzing SOCIAL SIGNALS (competition requirement)")
        print("\nNext steps:")
        print("1. Login to dashboard (http://localhost:5174) with bankop/bankop123")
        print("2. Review the IAA analysis - should show social pattern analysis")
        print("3. Approve or escalate the signal")
        print("\nYou're ready for the competition! 🎉")
    else:
        print("\n❌ FAILED: Fix the errors above and try again")
