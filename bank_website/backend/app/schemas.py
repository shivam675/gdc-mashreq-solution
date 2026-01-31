from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from enum import Enum

# ==================== FDA Agent Schemas ====================
class FDASentimentInput(BaseModel):
    signal_type: str
    confidence: float
    drivers: List[str]
    uncertainty_notes: Optional[str] = None
    recommend_escalation: bool

# ==================== Transaction Schemas ====================
class TransactionStatus(str, Enum):
    COMPLETED = "completed"
    INPROCESS = "inprocess"
    PENDING = "pending"
    FAILED = "failed"
    FLAGGED = "flagged"

class TransactionBase(BaseModel):
    transaction_id: str
    customer_id: str
    customer_name: str
    amount: float
    currency: str = "USD"
    transaction_type: str
    status: TransactionStatus
    description: Optional[str] = None
    source_account: str
    destination_account: Optional[str] = None
    flagged_reason: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    flagged_reason: Optional[str] = None
    description: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    timestamp: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Customer Review Schemas ====================
class CustomerReviewBase(BaseModel):
    review_id: str
    customer_id: str
    customer_name: str
    rating: int = Field(ge=1, le=5)
    sentiment: str  # positive, negative, neutral
    category: str
    review_text: str
    source: str

class CustomerReviewCreate(CustomerReviewBase):
    pass

class CustomerReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    sentiment: Optional[str] = None
    category: Optional[str] = None
    review_text: Optional[str] = None

class CustomerReviewResponse(CustomerReviewBase):
    id: int
    timestamp: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Sentiment Schemas ====================
class SentimentResponse(BaseModel):
    id: int
    signal_type: str
    confidence: float
    drivers: List[str]
    uncertainty_notes: Optional[str]
    recommend_escalation: bool
    timestamp: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Agent Workflow Schemas ====================
class AgentWorkflowStatus(str, Enum):
    PENDING = "pending"
    IAA_PROCESSING = "iaa_processing"
    IAA_COMPLETED = "iaa_completed"
    EBA_PROCESSING = "eba_processing"
    EBA_COMPLETED = "eba_completed"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISCARDED = "discarded"
    ESCALATED_MANAGEMENT = "escalated_management"
    ESCALATED_LEGAL = "escalated_legal"
    ESCALATED_INVESTIGATION = "escalated_investigation"
    POSTED = "posted"
    FAILED = "failed"

class IAAAnalysisResult(BaseModel):
    matched_transactions: List[dict]
    matched_reviews: List[dict]
    analysis: str
    confidence: float

class EBAPostResult(BaseModel):
    original_post: str
    formatted_post: str

class WorkflowApproval(BaseModel):
    edited_post: Optional[str] = None
    approved_by: str

class AgentWorkflowResponse(BaseModel):
    id: int
    workflow_id: str
    sentiment_id: int
    status: AgentWorkflowStatus
    signal_type: Optional[str] = None
    iaa_matched_transactions: Optional[List[dict]]
    iaa_matched_reviews: Optional[List[dict]]
    iaa_analysis: Optional[str]
    iaa_completed_at: Optional[datetime]
    eba_original_post: Optional[str]
    eba_edited_post: Optional[str]
    eba_completed_at: Optional[datetime]
    confidence_score: Optional[float] = None
    data_quality: Optional[str] = None
    risk_level: Optional[str] = None
    escalation_recommendation: Optional[str] = None
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    posted_at: Optional[datetime]
    discarded_by: Optional[str] = None
    escalated_by: Optional[str] = None
    escalated_at: Optional[datetime] = None
    escalation_type: Optional[str] = None
    error_message: Optional[str]
    retry_count: int
    timestamp: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ==================== WebSocket Message Schemas ====================
class WSMessageType(str, Enum):
    FDA_RECEIVED = "fda_received"
    IAA_STARTED = "iaa_started"
    IAA_PROGRESS = "iaa_progress"
    IAA_COMPLETED = "iaa_completed"
    EBA_STARTED = "eba_started"
    EBA_PROGRESS = "eba_progress"
    EBA_COMPLETED = "eba_completed"
    WORKFLOW_ERROR = "workflow_error"
    POST_APPROVED = "post_approved"
    POST_POSTED = "post_posted"

class WSMessage(BaseModel):
    type: WSMessageType
    workflow_id: str
    data: Any
    timestamp: datetime = Field(default_factory=datetime.utcnow)
