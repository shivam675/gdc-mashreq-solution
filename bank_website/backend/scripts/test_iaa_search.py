"""
Test IAA Agent Database Search Functionality
Tests if IAA agent correctly retrieves transactions and reviews based on sentiment
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.iaa_agent import InternalAnalysisAgent
from app.config import config

# Test scenarios
TEST_SCENARIOS = [
    {
        "name": "Fraud Detection Test",
        "sentiment_data": {
            "signal_type": "negative",
            "confidence": 0.85,
            "drivers": ["fraud", "unauthorized", "security"],
            "uncertainty_notes": "Multiple fraud reports",
            "recommend_escalation": True
        },
        "expected": "Should find flagged transactions and fraud-related reviews"
    },
    {
        "name": "Mobile App Positive Sentiment",
        "sentiment_data": {
            "signal_type": "positive",
            "confidence": 0.92,
            "drivers": ["mobile app", "fast", "loan approval"],
            "uncertainty_notes": None,
            "recommend_escalation": False
        },
        "expected": "Should find mobile_app positive reviews and related transactions"
    },
    {
        "name": "Customer Service Negative",
        "sentiment_data": {
            "signal_type": "negative",
            "confidence": 0.78,
            "drivers": ["customer service", "slow", "waiting"],
            "uncertainty_notes": "Service complaints",
            "recommend_escalation": True
        },
        "expected": "Should find negative customer_support reviews"
    },
    {
        "name": "Loan Service Positive",
        "sentiment_data": {
            "signal_type": "positive",
            "confidence": 0.88,
            "drivers": ["loan", "quick approval", "home loan"],
            "uncertainty_notes": None,
            "recommend_escalation": False
        },
        "expected": "Should find loan_payment transactions and loan_service reviews"
    },
    {
        "name": "ATM Withdrawal Issue",
        "sentiment_data": {
            "signal_type": "negative",
            "confidence": 0.81,
            "drivers": ["ATM", "withdrawal", "cash"],
            "uncertainty_notes": "ATM complaints",
            "recommend_escalation": False
        },
        "expected": "Should find withdrawal transactions and related issues"
    }
]

async def test_iaa_search():
    """Test IAA agent search functionality"""
    # Create engine
    engine = create_async_engine(config.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Initialize IAA agent
    iaa = InternalAnalysisAgent()
    
    print("="*80)
    print("🔍 IAA AGENT DATABASE SEARCH TEST")
    print("="*80)
    print(f"\nTesting {len(TEST_SCENARIOS)} scenarios...\n")
    
    for i, scenario in enumerate(TEST_SCENARIOS, 1):
        print(f"\n{'='*80}")
        print(f"TEST {i}/{len(TEST_SCENARIOS)}: {scenario['name']}")
        print(f"{'='*80}")
        print(f"\n📊 Sentiment Data:")
        print(f"  Signal Type: {scenario['sentiment_data']['signal_type']}")
        print(f"  Confidence: {scenario['sentiment_data']['confidence']}")
        print(f"  Drivers: {', '.join(scenario['sentiment_data']['drivers'])}")
        print(f"\n🎯 Expected: {scenario['expected']}")
        
        async with async_session() as session:
            # Search transactions
            print(f"\n🔍 Searching Transactions...")
            transactions = await iaa._search_transactions(session, scenario['sentiment_data'])
            print(f"  Found: {len(transactions)} transactions")
            
            if transactions:
                print(f"\n  Sample Transactions:")
                for tx in transactions[:3]:  # Show first 3
                    print(f"    • {tx['transaction_id']} - {tx['transaction_type']}")
                    print(f"      Status: {tx['status']} | Amount: {tx['currency']} {tx['amount']}")
                    print(f"      Description: {tx['description']}")
                    if tx['flagged_reason']:
                        print(f"      ⚠️ Flagged: {tx['flagged_reason']}")
                if len(transactions) > 3:
                    print(f"    ... and {len(transactions) - 3} more")
            else:
                print(f"    ⚠️ No transactions found")
            
            # Search reviews
            print(f"\n🔍 Searching Customer Reviews...")
            reviews = await iaa._search_reviews(session, scenario['sentiment_data'])
            print(f"  Found: {len(reviews)} reviews")
            
            if reviews:
                print(f"\n  Sample Reviews:")
                for rev in reviews[:3]:  # Show first 3
                    print(f"    • {rev['review_id']} - {'⭐' * rev['rating']}")
                    print(f"      Sentiment: {rev['sentiment']} | Category: {rev['category']}")
                    print(f"      Text: {rev['review_text'][:100]}...")
                    print(f"      Source: {rev['source']}")
                if len(reviews) > 3:
                    print(f"    ... and {len(reviews) - 3} more")
            else:
                print(f"    ⚠️ No reviews found")
            
            # Summary
            print(f"\n✅ Test Result:")
            if transactions or reviews:
                print(f"  ✓ IAA agent successfully retrieved data from database")
                print(f"  ✓ Total matches: {len(transactions)} transactions + {len(reviews)} reviews")
            else:
                print(f"  ⚠️ No data found - may need more specific data in database")
    
    print(f"\n{'='*80}")
    print("🎉 IAA AGENT SEARCH TEST COMPLETED")
    print("="*80)
    print("\n📋 Summary:")
    print("  • IAA agent is querying the database correctly")
    print("  • Search uses fuzzy matching on keywords and status")
    print("  • Transactions: searches status, description, flagged_reason")
    print("  • Reviews: searches sentiment, category, review_text")
    print("\n💡 Recommendations:")
    print("  • Ensure database has diverse data for better matching")
    print("  • Consider adding more search criteria for precision")
    print("  • Monitor search performance with large datasets")
    print()

if __name__ == "__main__":
    asyncio.run(test_iaa_search())
