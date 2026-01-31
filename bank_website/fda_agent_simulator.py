"""
FDA Agent Simulator
Sends fake sentiment data to the Bank Sentinel backend every 30 seconds
"""
import asyncio
import httpx
import random
from datetime import datetime

BACKEND_URL = "http://localhost:8000/api/send_social_sentiment"

# Sample sentiment signals
SIGNALS = [
    {
        "signal_type": "potential_scam_rumor",
        "confidence": 0.65,
        "drivers": ["social_media_chatter", "suspicious_activity", "fraud_concerns"],
        "uncertainty_notes": "Multiple unverified reports on Twitter about phishing emails",
        "recommend_escalation": True
    },
    {
        "signal_type": "customer_trust_decline",
        "confidence": 0.58,
        "drivers": ["negative_reviews", "service_complaints", "app_issues"],
        "uncertainty_notes": "Increase in 1-star app store reviews over past week",
        "recommend_escalation": False
    },
    {
        "signal_type": "security_breach_speculation",
        "confidence": 0.72,
        "drivers": ["data_breach_rumors", "security_concerns", "customer_panic"],
        "uncertainty_notes": "Reddit thread about potential data leak, no confirmation",
        "recommend_escalation": True
    },
    {
        "signal_type": "positive_sentiment_spike",
        "confidence": 0.81,
        "drivers": ["new_feature_launch", "positive_feedback", "customer_satisfaction"],
        "uncertainty_notes": "Recent mobile app update receiving positive reviews",
        "recommend_escalation": False
    },
    {
        "signal_type": "transaction_delay_complaints",
        "confidence": 0.63,
        "drivers": ["delayed_transactions", "customer_frustration", "service_issues"],
        "uncertainty_notes": "Multiple reports of slow international transfers",
        "recommend_escalation": True
    },
]

async def send_sentiment():
    """Send a random sentiment signal to the backend"""
    signal = random.choice(SIGNALS).copy()
    
    # Add some randomness to confidence
    signal["confidence"] += random.uniform(-0.05, 0.05)
    signal["confidence"] = max(0.5, min(0.9, signal["confidence"]))
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(BACKEND_URL, json=signal, timeout=10.0)
            response.raise_for_status()
            result = response.json()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sent: {signal['signal_type']}")
            print(f"  → Confidence: {signal['confidence']:.2f}")
            print(f"  → Workflow ID: {result.get('workflow_id')}")
            print()
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Error: {e}")
            print()

async def main():
    """Main loop - send sentiment every 30 seconds"""
    print("="*60)
    print("FDA Agent Simulator Started")
    print("Sending sentiment signals every 30 seconds...")
    print("Press Ctrl+C to stop")
    print("="*60)
    print()
    
    while True:
        await send_sentiment()
        await asyncio.sleep(30)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nFDA Agent Simulator stopped.")
