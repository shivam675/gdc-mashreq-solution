"""
Database Seed Script - Generate Realistic Banking Data
Generates 1000 transactions and 300 customer reviews
"""

import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import Transaction, CustomerReview, TransactionStatus
from app.config import config

# Configuration
NUM_TRANSACTIONS = 1000
NUM_REVIEWS = 300

# Customer names pool
FIRST_NAMES = [
    "Ahmed", "Fatima", "Mohammed", "Aisha", "Omar", "Layla", "Ali", "Zainab",
    "Hassan", "Mariam", "Khalid", "Noor", "Abdullah", "Sara", "Youssef", "Hana",
    "Ibrahim", "Amira", "Rashid", "Salma", "Tariq", "Dina", "Karim", "Yasmin",
    "Majid", "Rania", "Saeed", "Leila", "Hamza", "Nadine", "Faisal", "Maya"
]

LAST_NAMES = [
    "Al-Mansouri", "Al-Hashimi", "Al-Farsi", "Al-Balushi", "Al-Jabri", "Al-Rawahi",
    "Al-Shukaili", "Al-Shihi", "Al-Hinai", "Al-Busaidi", "Al-Azri", "Al-Qasimi",
    "Khan", "Patel", "Sharma", "Kumar", "Singh", "Ali", "Rahman", "Ahmed"
]

# Transaction types and descriptions - ONLY TRANSFERS
TRANSACTION_TYPES = {
    "transfer": [
        "International wire transfer",
        "Domestic fund transfer",
        "Bill payment transfer",
        "Salary transfer",
        "Business payment transfer",
        "Utility payment transfer",
        "Rent payment transfer",
        "Vendor payment transfer",
        "Employee salary disbursement",
        "Insurance premium transfer",
        "School fee transfer",
        "Investment transfer",
        "Family remittance transfer",
        "Loan repayment transfer",
        "Tax payment transfer"
    ]
}

# No fraud scenarios - all transactions are legitimate

# Review categories and templates
REVIEW_CATEGORIES = {
    "mobile_app": {
        "positive": [
            "The new mobile app is fantastic! Easy to use and very fast.",
            "Love the mobile banking app. Loan approval was so quick!",
            "Best banking app I've used. Face ID login is seamless.",
            "Mobile app updates have really improved the experience.",
            "Quick transfers and bill payments through the app. Excellent!"
        ],
        "neutral": [
            "Mobile app works fine, nothing special.",
            "The app is okay, could use more features.",
            "Mobile banking is functional but UI could be better."
        ],
        "negative": [
            "Mobile app keeps crashing during transfers.",
            "Very disappointed with the app's performance.",
            "App is slow and confusing to navigate."
        ]
    },
    "loan_service": {
        "positive": [
            "Got my home loan approved in just 2 days! Amazing service.",
            "Personal loan process was smooth and fast.",
            "Car loan rates are very competitive. Great experience!",
            "Loan officer was helpful and professional.",
            "Quick approval for business loan. Highly recommend!"
        ],
        "neutral": [
            "Loan process was standard, took expected time.",
            "Average loan service, nothing extraordinary."
        ],
        "negative": [
            "Loan approval took too long, poor communication.",
            "Hidden fees in the loan agreement. Not transparent.",
            "Rejected my loan without clear explanation."
        ]
    },
    "customer_support": {
        "positive": [
            "Customer service representative was very helpful!",
            "24/7 support is great. Got my issue resolved quickly.",
            "Phone banking support is excellent and professional.",
            "Live chat support resolved my query in minutes."
        ],
        "neutral": [
            "Support was okay, took some time but resolved.",
            "Average customer service experience."
        ],
        "negative": [
            "Terrible customer service. Had to wait 45 minutes.",
            "Support team was rude and unhelpful.",
            "Multiple calls to resolve simple issue. Very frustrating."
        ]
    },
    "fraud_concern": {
        "negative": [
            "Unauthorized transaction on my account! Need help urgently.",
            "Suspicious activity detected. Bank should improve security.",
            "Someone hacked my account. Security is terrible!",
            "Received fraud alert but customer service was slow to respond.",
            "Card was cloned. Very concerned about security measures."
        ]
    },
    "account_management": {
        "positive": [
            "Opening a new account was quick and easy.",
            "Account features are comprehensive. Very satisfied.",
            "Online account management is excellent.",
            "Easy to track all transactions and statements."
        ],
        "neutral": [
            "Account management is fine, meets basic needs.",
            "Standard banking services, nothing special."
        ],
        "negative": [
            "Too many hidden charges on my account.",
            "Account statements are confusing.",
            "Difficult to close my account. Poor process."
        ]
    },
    "branch_service": {
        "positive": [
            "Branch staff are always courteous and helpful.",
            "Very professional service at the branch.",
            "Clean and well-organized branch. Great experience."
        ],
        "neutral": [
            "Branch service is acceptable.",
            "Standard branch banking experience."
        ],
        "negative": [
            "Long waiting times at the branch. Poor management.",
            "Branch staff were not knowledgeable.",
            "Rude behavior from branch manager."
        ]
    }
}

def generate_customer_name():
    """Generate a random customer name"""
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def generate_account_number():
    """Generate a random account number"""
    return f"ACC{random.randint(1000000000, 9999999999)}"

def generate_transaction_id():
    """Generate a unique transaction ID"""
    return f"TXN{random.randint(100000000, 999999999)}"

def generate_review_id():
    """Generate a unique review ID"""
    return f"REV{random.randint(100000, 999999)}"

def generate_transaction():
    """Generate a realistic bank transfer transaction"""
    # Only transfer type
    tx_type = "transfer"
    description = random.choice(TRANSACTION_TYPES[tx_type])
    
    # Determine status (95% completed, 5% pending) - NO FRAUD
    status_roll = random.random()
    if status_roll < 0.95:
        status = TransactionStatus.COMPLETED
    else:
        status = TransactionStatus.PENDING
    
    flagged_reason = None  # No fraud scenarios
    
    # Generate transfer amounts (realistic range for bank transfers)
    amount = round(random.uniform(50, 25000), 2)
    
    # Random timestamp within last 90 days
    days_ago = random.randint(0, 90)
    hours_ago = random.randint(0, 23)
    timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
    
    return Transaction(
        transaction_id=generate_transaction_id(),
        customer_id=f"CUST{random.randint(1000, 9999)}",
        customer_name=generate_customer_name(),
        amount=amount,
        currency="AED",  # UAE Dirham
        transaction_type=tx_type,
        status=status,
        description=description,
        source_account=generate_account_number(),
        destination_account=generate_account_number() if tx_type in ["transfer", "loan_payment"] else None,
        flagged_reason=flagged_reason,
        timestamp=timestamp
    )

def generate_review():
    """Generate a realistic customer review"""
    # Choose category (exclude fraud_concern)
    available_categories = [c for c in REVIEW_CATEGORIES.keys() if c != "fraud_concern"]
    category = random.choice(available_categories)
    
    # Determine sentiment distribution
    # 70% positive, 20% neutral, 10% negative - NO FRAUD CONCERN
    sentiment_roll = random.random()
    if sentiment_roll < 0.70:
        sentiment = "positive"
    elif sentiment_roll < 0.90:
        sentiment = "neutral"
    else:
        sentiment = "negative"
    
    # Get review text
    if sentiment in REVIEW_CATEGORIES[category]:
        review_text = random.choice(REVIEW_CATEGORIES[category][sentiment])
    else:
        # Fallback to positive if sentiment not available for category
        review_text = random.choice(REVIEW_CATEGORIES[category]["positive"])
    
    # Rating based on sentiment
    if sentiment == "positive":
        rating = random.choice([4, 5, 5, 5])  # Weighted towards 5
    elif sentiment == "neutral":
        rating = random.choice([3, 3, 4])
    else:  # negative
        rating = random.choice([1, 1, 2, 2, 3])
    
    # Random timestamp within last 60 days
    days_ago = random.randint(0, 60)
    hours_ago = random.randint(0, 23)
    timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
    
    # Review source
    source = random.choice([
        "Google Reviews",
        "Trustpilot",
        "App Store",
        "Play Store",
        "Facebook",
        "Twitter",
        "Bank Website"
    ])
    
    return CustomerReview(
        review_id=generate_review_id(),
        customer_id=f"CUST{random.randint(1000, 9999)}",
        customer_name=generate_customer_name(),
        rating=rating,
        sentiment=sentiment,
        category=category,
        review_text=review_text,
        source=source,
        timestamp=timestamp
    )

async def populate_database():
    """Populate database with transactions and reviews"""
    # Create engine
    engine = create_async_engine(config.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("🚀 Starting database population...")
        
        # Check existing data
        result = await session.execute(select(Transaction))
        existing_transactions = len(result.scalars().all())
        
        result = await session.execute(select(CustomerReview))
        existing_reviews = len(result.scalars().all())
        
        print(f"📊 Existing data: {existing_transactions} transactions, {existing_reviews} reviews")
        
        # Generate transactions
        print(f"\n📝 Generating {NUM_TRANSACTIONS} transactions...")
        transactions = []
        for i in range(NUM_TRANSACTIONS):
            transactions.append(generate_transaction())
            if (i + 1) % 100 == 0:
                print(f"  Generated {i + 1}/{NUM_TRANSACTIONS} transactions...")
        
        # Add transactions to database
        print(f"\n💾 Saving {NUM_TRANSACTIONS} transactions to database...")
        session.add_all(transactions)
        await session.commit()
        print(f"✅ Transactions saved!")
        
        # Generate reviews
        print(f"\n📝 Generating {NUM_REVIEWS} customer reviews...")
        reviews = []
        for i in range(NUM_REVIEWS):
            reviews.append(generate_review())
            if (i + 1) % 50 == 0:
                print(f"  Generated {i + 1}/{NUM_REVIEWS} reviews...")
        
        # Add reviews to database
        print(f"\n💾 Saving {NUM_REVIEWS} reviews to database...")
        session.add_all(reviews)
        await session.commit()
        print(f"✅ Reviews saved!")
        
        # Summary statistics
        print("\n" + "="*60)
        print("📊 DATABASE POPULATION SUMMARY")
        print("="*60)
        
        # Transaction stats
        result = await session.execute(select(Transaction))
        all_transactions = result.scalars().all()
        completed = sum(1 for t in all_transactions if t.status == TransactionStatus.COMPLETED)
        pending = sum(1 for t in all_transactions if t.status == TransactionStatus.PENDING)
        inprocess = sum(1 for t in all_transactions if t.status == TransactionStatus.INPROCESS)
        flagged = sum(1 for t in all_transactions if t.status == TransactionStatus.FLAGGED)
        
        print(f"\n📊 TRANSACTIONS (Total: {len(all_transactions)})")
        print(f"  ✅ Completed: {completed} ({completed/len(all_transactions)*100:.1f}%)")
        print(f"  ⏳ Pending: {pending} ({pending/len(all_transactions)*100:.1f}%)")
        print(f"  🔄 In Process: {inprocess} ({inprocess/len(all_transactions)*100:.1f}%)")
        print(f"  🚩 Flagged: {flagged} ({flagged/len(all_transactions)*100:.1f}%)")
        
        # Review stats
        result = await session.execute(select(CustomerReview))
        all_reviews = result.scalars().all()
        positive = sum(1 for r in all_reviews if r.sentiment == "positive")
        neutral = sum(1 for r in all_reviews if r.sentiment == "neutral")
        negative = sum(1 for r in all_reviews if r.sentiment == "negative")
        
        print(f"\n📊 CUSTOMER REVIEWS (Total: {len(all_reviews)})")
        print(f"  😊 Positive: {positive} ({positive/len(all_reviews)*100:.1f}%)")
        print(f"  😐 Neutral: {neutral} ({neutral/len(all_reviews)*100:.1f}%)")
        print(f"  😞 Negative: {negative} ({negative/len(all_reviews)*100:.1f}%)")
        
        # Category breakdown
        print(f"\n📊 REVIEW CATEGORIES")
        categories = {}
        for review in all_reviews:
            categories[review.category] = categories.get(review.category, 0) + 1
        
        for category, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {category}: {count}")
        
        print("\n" + "="*60)
        print("✅ Database population completed successfully!")
        print("="*60)
        print("\n💡 Next steps:")
        print("  1. Start the backend server")
        print("  2. Navigate to Database page in frontend")
        print("  3. Trigger FDA sentiment to test IAA agent search")
        print("\n")

if __name__ == "__main__":
    asyncio.run(populate_database())
