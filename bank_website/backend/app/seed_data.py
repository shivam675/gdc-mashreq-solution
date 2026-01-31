import asyncio
import random
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, init_db
from app.models import Transaction, CustomerReview, TransactionStatus

fake = Faker()

async def seed_database():
    """Seed database with demo data"""
    print("Initializing database...")
    await init_db()
    
    async with AsyncSessionLocal() as db:
        print("Generating 1000 transactions...")
        
        # Generate 1000 transactions
        statuses_distribution = {
            TransactionStatus.COMPLETED: 950,
            TransactionStatus.INPROCESS: 30,
            TransactionStatus.PENDING: 15,
            TransactionStatus.FLAGGED: 3,
            TransactionStatus.FAILED: 2
        }
        
        transaction_types = ['deposit', 'withdrawal', 'transfer', 'payment', 'bill_payment']
        currencies = ['USD', 'EUR', 'GBP', 'AED']
        
        transactions = []
        for i in range(1000):
            # Determine status based on distribution
            status = random.choices(
                list(statuses_distribution.keys()),
                weights=list(statuses_distribution.values()),
                k=1
            )[0]
            
            customer_name = fake.name()
            customer_id = f"CUST{fake.unique.random_number(digits=8)}"
            
            transaction = Transaction(
                transaction_id=f"TXN{fake.unique.random_number(digits=10)}",
                customer_id=customer_id,
                customer_name=customer_name,
                amount=round(random.uniform(10, 50000), 2),
                currency=random.choice(currencies),
                transaction_type=random.choice(transaction_types),
                status=status,
                description=fake.sentence() if random.random() > 0.5 else None,
                source_account=f"ACC{fake.random_number(digits=12)}",
                destination_account=f"ACC{fake.random_number(digits=12)}" if random.random() > 0.3 else None,
                timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 90)),
                flagged_reason=fake.sentence() if status == TransactionStatus.FLAGGED else None
            )
            transactions.append(transaction)
        
        db.add_all(transactions)
        await db.commit()
        print(f"✓ Created {len(transactions)} transactions")
        
        # Generate customer reviews
        print("Generating customer reviews...")
        sentiments = ['positive', 'negative', 'neutral']
        categories = ['service', 'fraud_concern', 'app_issue', 'general', 'support']
        sources = ['app', 'website', 'social_media', 'email', 'phone']
        
        review_templates = {
            'positive': [
                "Great service! Very satisfied with the bank.",
                "The mobile app is user-friendly and efficient.",
                "Customer support was helpful and responsive.",
                "Fast and secure transactions.",
                "Excellent banking experience overall."
            ],
            'negative': [
                "Concerned about recent security issues.",
                "Transaction delays are becoming frequent.",
                "Poor customer service experience.",
                "App keeps crashing during important transactions.",
                "Suspicious activity on my account not addressed.",
                "Worried about potential fraud risks.",
                "Security measures seem inadequate.",
                "Multiple failed transactions without explanation."
            ],
            'neutral': [
                "Average service, nothing special.",
                "The app works but could be better.",
                "Standard banking experience.",
                "It's okay for basic transactions."
            ]
        }
        
        reviews = []
        for i in range(200):
            sentiment = random.choices(
                sentiments,
                weights=[70, 20, 10],  # 70% positive, 20% negative, 10% neutral
                k=1
            )[0]
            
            review = CustomerReview(
                review_id=f"REV{fake.unique.random_number(digits=8)}",
                customer_id=f"CUST{fake.random_number(digits=8)}",
                customer_name=fake.name(),
                rating=random.randint(4, 5) if sentiment == 'positive' else (
                    random.randint(1, 2) if sentiment == 'negative' else 3
                ),
                sentiment=sentiment,
                category=random.choice(categories),
                review_text=random.choice(review_templates[sentiment]),
                source=random.choice(sources),
                timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 60))
            )
            reviews.append(review)
        
        db.add_all(reviews)
        await db.commit()
        print(f"✓ Created {len(reviews)} customer reviews")
        
        print("\n" + "="*50)
        print("Database seeding completed!")
        print("="*50)
        print(f"Transactions: {len(transactions)}")
        print(f"  - Completed: {sum(1 for t in transactions if t.status == TransactionStatus.COMPLETED)}")
        print(f"  - In Process: {sum(1 for t in transactions if t.status == TransactionStatus.INPROCESS)}")
        print(f"  - Pending: {sum(1 for t in transactions if t.status == TransactionStatus.PENDING)}")
        print(f"  - Flagged: {sum(1 for t in transactions if t.status == TransactionStatus.FLAGGED)}")
        print(f"  - Failed: {sum(1 for t in transactions if t.status == TransactionStatus.FAILED)}")
        print(f"\nCustomer Reviews: {len(reviews)}")
        print(f"  - Positive: {sum(1 for r in reviews if r.sentiment == 'positive')}")
        print(f"  - Negative: {sum(1 for r in reviews if r.sentiment == 'negative')}")
        print(f"  - Neutral: {sum(1 for r in reviews if r.sentiment == 'neutral')}")

if __name__ == "__main__":
    asyncio.run(seed_database())
