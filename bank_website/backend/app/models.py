from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class TransactionStatus(str, enum.Enum):
    COMPLETED = "completed"
    INPROCESS = "inprocess"
    PENDING = "pending"
    FAILED = "failed"
    FLAGGED = "flagged"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, index=True)
    customer_id = Column(String(50), index=True)
    customer_name = Column(String(100))
    amount = Column(Float)
    currency = Column(String(10), default="USD")
    transaction_type = Column(String(50))  # deposit, withdrawal, transfer, payment
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.COMPLETED)
    description = Column(Text, nullable=True)
    source_account = Column(String(50))
    destination_account = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    flagged_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CustomerReview(Base):
    __tablename__ = "customer_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(String(50), unique=True, index=True)
    customer_id = Column(String(50), index=True)
    customer_name = Column(String(100))
    rating = Column(Integer)  # 1-5
    sentiment = Column(String(20))  # positive, negative, neutral
    category = Column(String(50))  # service, fraud_concern, app_issue, general
    review_text = Column(Text)
    source = Column(String(50))  # app, website, social_media, email
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Sentiment(Base):
    __tablename__ = "sentiments"
    
    id = Column(Integer, primary_key=True, index=True)
    signal_type = Column(String(100))
    confidence = Column(Float)
    drivers = Column(JSON)  # List of driver strings
    uncertainty_notes = Column(Text, nullable=True)
    recommend_escalation = Column(Integer)  # 0 or 1 (boolean)
    raw_data = Column(JSON)  # Store complete FDA agent response
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to workflow
    workflows = relationship("AgentWorkflow", back_populates="sentiment", cascade="all, delete-orphan")

class AgentWorkflowStatus(str, enum.Enum):
    PENDING = "pending"
    IAA_PROCESSING = "iaa_processing"
    IAA_COMPLETED = "iaa_completed"
    EBA_PROCESSING = "eba_processing"
    EBA_COMPLETED = "eba_completed"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISCARDED = "discarded"
    POSTED = "posted"
    FAILED = "failed"

class AgentWorkflow(Base):
    __tablename__ = "agent_workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(String(50), unique=True, index=True)
    sentiment_id = Column(Integer, ForeignKey("sentiments.id"), index=True)
    status = Column(SQLEnum(AgentWorkflowStatus), default=AgentWorkflowStatus.PENDING)
    
    # IAA Agent data
    iaa_matched_transactions = Column(JSON, nullable=True)  # List of transaction IDs
    iaa_matched_reviews = Column(JSON, nullable=True)  # List of review IDs
    iaa_analysis = Column(Text, nullable=True)  # IAA's analysis paragraph
    iaa_completed_at = Column(DateTime, nullable=True)
    
    # EBA Agent data
    eba_original_post = Column(Text, nullable=True)  # Original markdown post
    eba_edited_post = Column(Text, nullable=True)  # User-edited post
    eba_completed_at = Column(DateTime, nullable=True)
    
    # Approval & posting
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    posted_at = Column(DateTime, nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sentiment = relationship("Sentiment", back_populates="workflows")
