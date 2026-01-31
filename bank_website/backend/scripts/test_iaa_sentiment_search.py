"""
Test IAA Sentiment-Based Search and Confidence Calculation
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "app"
sys.path.insert(0, str(backend_path))

from app.database import get_db, init_db
from app.models import Sentiment, Transaction, CustomerReview
from sqlalchemy import select, func

async def test_iaa_search_logic():
    """Test the sentiment-based search logic"""
    await init_db()
    
    async for db in get_db():
        print("\n" + "="*80)
        print("IAA SENTIMENT-BASED SEARCH TEST")
        print("="*80)
        
        # Count total reviews
        total_reviews_result = await db.execute(select(func.count(CustomerReview.id)))
        total_reviews = total_reviews_result.scalar() or 0
        print(f"\n📊 Total Reviews in Database: {total_reviews}")
        
        # Test 1: Positive Signal Search
        print("\n" + "-"*80)
        print("TEST 1: POSITIVE SIGNAL")
        print("-"*80)
        
        # Positive reviews
        positive_reviews_result = await db.execute(
            select(func.count(CustomerReview.id)).where(
                CustomerReview.sentiment == 'positive'
            )
        )
        positive_count = positive_reviews_result.scalar() or 0
        
        # Completed transactions
        completed_txn_result = await db.execute(
            select(func.count(Transaction.id)).where(
                Transaction.status == 'completed'
            )
        )
        completed_count = completed_txn_result.scalar() or 0
        
        confidence_positive = (positive_count / total_reviews * 100) if total_reviews > 0 else 0
        verification_positive = "CONFIRMED" if confidence_positive >= 5.0 else "NOT CONFIRMED"
        
        print(f"✅ Positive Reviews Found: {positive_count}")
        print(f"✅ Completed Transactions: {completed_count}")
        print(f"📈 Confidence Score: {confidence_positive:.1f}%")
        print(f"✅ Verification Status: {verification_positive}")
        
        # Test 2: Negative Signal Search
        print("\n" + "-"*80)
        print("TEST 2: NEGATIVE SIGNAL")
        print("-"*80)
        
        # Negative reviews
        negative_reviews_result = await db.execute(
            select(func.count(CustomerReview.id)).where(
                CustomerReview.sentiment == 'negative'
            )
        )
        negative_count = negative_reviews_result.scalar() or 0
        
        # Failed/flagged/pending/inprocess transactions
        problem_txn_result = await db.execute(
            select(func.count(Transaction.id)).where(
                Transaction.status.in_(['flagged', 'pending', 'failed', 'inprocess'])
            )
        )
        problem_count = problem_txn_result.scalar() or 0
        
        confidence_negative = (negative_count / total_reviews * 100) if total_reviews > 0 else 0
        verification_negative = "CONFIRMED" if confidence_negative >= 5.0 else "NOT CONFIRMED"
        
        print(f"❌ Negative Reviews Found: {negative_count}")
        print(f"⚠️  Problem Transactions: {problem_count}")
        print(f"📈 Confidence Score: {confidence_negative:.1f}%")
        print(f"✅ Verification Status: {verification_negative}")
        
        # Test 3: Neutral Signal Search
        print("\n" + "-"*80)
        print("TEST 3: NEUTRAL SIGNAL")
        print("-"*80)
        
        # Neutral reviews
        neutral_reviews_result = await db.execute(
            select(func.count(CustomerReview.id)).where(
                CustomerReview.sentiment == 'neutral'
            )
        )
        neutral_count = neutral_reviews_result.scalar() or 0
        
        confidence_neutral = (neutral_count / total_reviews * 100) if total_reviews > 0 else 0
        verification_neutral = "CONFIRMED" if confidence_neutral >= 5.0 else "NOT CONFIRMED"
        
        print(f"⚪ Neutral Reviews Found: {neutral_count}")
        print(f"📈 Confidence Score: {confidence_neutral:.1f}%")
        print(f"✅ Verification Status: {verification_neutral}")
        
        # Summary Table
        print("\n" + "="*80)
        print("VERIFICATION SUMMARY")
        print("="*80)
        print(f"\n{'Signal Type':<15} {'Reviews':<10} {'Txns':<10} {'Confidence':<15} {'Verification':<15}")
        print("-"*80)
        print(f"{'Positive':<15} {positive_count:<10} {completed_count:<10} {confidence_positive:>6.1f}% {'':<7} {verification_positive:<15}")
        print(f"{'Negative':<15} {negative_count:<10} {problem_count:<10} {confidence_negative:>6.1f}% {'':<7} {verification_negative:<15}")
        print(f"{'Neutral':<15} {neutral_count:<10} {'-':<10} {confidence_neutral:>6.1f}% {'':<7} {verification_neutral:<15}")
        print("-"*80)
        print(f"{'TOTAL':<15} {total_reviews:<10} {'-':<10} {'100.0%':<15} {'':<15}")
        
        # Sample Review Distribution
        print("\n" + "="*80)
        print("REVIEW SENTIMENT DISTRIBUTION")
        print("="*80)
        print(f"✅ Positive: {positive_count:>3} ({(positive_count/total_reviews*100):>5.1f}%)")
        print(f"⚪ Neutral:  {neutral_count:>3} ({(neutral_count/total_reviews*100):>5.1f}%)")
        print(f"❌ Negative: {negative_count:>3} ({(negative_count/total_reviews*100):>5.1f}%)")
        print("-"*80)
        print(f"📊 Total:    {total_reviews:>3} (100.0%)")
        
        # Sample Transactions by Status
        print("\n" + "="*80)
        print("TRANSACTION STATUS DISTRIBUTION")
        print("="*80)
        
        for status in ['completed', 'pending', 'flagged', 'inprocess', 'failed']:
            status_result = await db.execute(
                select(func.count(Transaction.id)).where(Transaction.status == status)
            )
            count = status_result.scalar() or 0
            
            total_txns_result = await db.execute(select(func.count(Transaction.id)))
            total_txns = total_txns_result.scalar() or 0
            
            percentage = (count / total_txns * 100) if total_txns > 0 else 0
            
            emoji = {
                'completed': '✅',
                'pending': '⏳',
                'flagged': '🚩',
                'inprocess': '🔄',
                'failed': '❌'
            }.get(status, '⚪')
            
            print(f"{emoji} {status.capitalize():<12}: {count:>4} ({percentage:>5.1f}%)")
        
        print("-"*80)
        total_txns_result = await db.execute(select(func.count(Transaction.id)))
        total_txns = total_txns_result.scalar() or 0
        print(f"📊 Total Transactions: {total_txns:>4} (100.0%)")
        
        print("\n" + "="*80)
        print("✅ TEST COMPLETED SUCCESSFULLY")
        print("="*80 + "\n")

if __name__ == "__main__":
    asyncio.run(test_iaa_search_logic())
