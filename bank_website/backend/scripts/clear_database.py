"""
Clear and Regenerate Database with Clean Data
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import Transaction, CustomerReview, Sentiment, AgentWorkflow
from app.config import config

async def clear_database():
    """Clear transactions and reviews from database (preserves sentiments and workflows)"""
    engine = create_async_engine(config.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("🗑️  Clearing transactions and reviews...")
        print("   (Preserving sentiments and workflows)")
        
        # Only delete transactions and reviews, keep sentiments and workflows
        await session.execute(delete(Transaction))
        await session.execute(delete(CustomerReview))
        
        await session.commit()
        print("✅ Database cleared successfully!")
        print("   Sentiments and workflows preserved.")

if __name__ == "__main__":
    asyncio.run(clear_database())
