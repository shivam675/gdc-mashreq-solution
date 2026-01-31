from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import Transaction, CustomerReview, Sentiment, TransactionStatus as TransactionStatusEnum
from app.schemas import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    CustomerReviewCreate, CustomerReviewUpdate, CustomerReviewResponse,
    SentimentResponse
)

router = APIRouter(prefix="/database", tags=["Database Management"])

# ==================== Transaction CRUD ====================
@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all transactions with optional filtering"""
    query = select(Transaction).order_by(desc(Transaction.timestamp))
    
    if status:
        query = query.where(Transaction.status == status)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    transactions = result.scalars().all()
    return transactions

@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get specific transaction"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction

@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new transaction"""
    db_transaction = Transaction(**transaction.dict())
    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction

@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update transaction"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update fields
    update_data = transaction_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    transaction.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(transaction)
    return transaction

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete transaction"""
    result = await db.execute(
        delete(Transaction).where(Transaction.id == transaction_id)
    )
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    await db.commit()
    return {"status": "deleted", "transaction_id": transaction_id}

# ==================== Customer Review CRUD ====================
@router.get("/reviews", response_model=List[CustomerReviewResponse])
async def get_reviews(
    skip: int = 0,
    limit: int = 100,
    sentiment: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all customer reviews with optional filtering"""
    query = select(CustomerReview).order_by(desc(CustomerReview.timestamp))
    
    if sentiment:
        query = query.where(CustomerReview.sentiment == sentiment)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    reviews = result.scalars().all()
    return reviews

@router.get("/reviews/{review_id}", response_model=CustomerReviewResponse)
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get specific review"""
    result = await db.execute(
        select(CustomerReview).where(CustomerReview.id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return review

@router.post("/reviews", response_model=CustomerReviewResponse)
async def create_review(
    review: CustomerReviewCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new customer review"""
    db_review = CustomerReview(**review.dict())
    db.add(db_review)
    await db.commit()
    await db.refresh(db_review)
    return db_review

@router.put("/reviews/{review_id}", response_model=CustomerReviewResponse)
async def update_review(
    review_id: int,
    review_update: CustomerReviewUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update customer review"""
    result = await db.execute(
        select(CustomerReview).where(CustomerReview.id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update fields
    update_data = review_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)
    
    await db.commit()
    await db.refresh(review)
    return review

@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete customer review"""
    result = await db.execute(
        delete(CustomerReview).where(CustomerReview.id == review_id)
    )
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.commit()
    return {"status": "deleted", "review_id": review_id}

# ==================== Sentiment CRUD ====================
@router.get("/sentiments", response_model=List[SentimentResponse])
async def get_sentiments(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all sentiments"""
    result = await db.execute(
        select(Sentiment)
        .order_by(desc(Sentiment.timestamp))
        .offset(skip)
        .limit(limit)
    )
    sentiments = result.scalars().all()
    return sentiments

@router.delete("/sentiments/{sentiment_id}")
async def delete_sentiment(
    sentiment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete sentiment record"""
    result = await db.execute(
        delete(Sentiment).where(Sentiment.id == sentiment_id)
    )
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Sentiment not found")
    
    await db.commit()
    return {"status": "deleted", "sentiment_id": sentiment_id}
