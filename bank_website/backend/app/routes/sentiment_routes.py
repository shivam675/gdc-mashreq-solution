from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
import uuid
import logging

from app.database import get_db
from app.models import (
    Transaction, CustomerReview, Sentiment, AgentWorkflow,
    AgentWorkflowStatus, TransactionStatus as TransactionStatusEnum
)
from app.schemas import (
    FDASentimentInput,
    TransactionCreate, TransactionUpdate, TransactionResponse,
    CustomerReviewCreate, CustomerReviewUpdate, CustomerReviewResponse,
    SentimentResponse,
    AgentWorkflowResponse,
    WorkflowApproval
)
from app.agents import iaa_agent, eba_agent
from app.websocket import manager

logger = logging.getLogger(__name__)
router = APIRouter()

# ==================== FDA Sentiment Endpoint ====================
async def process_sentiment_workflow(
    sentiment_id: int,
    sentiment_data: dict,
    workflow_id: str,
    db: AsyncSession
):
    """Background task to process sentiment through IAA -> EBA pipeline"""
    try:
        # Create workflow record
        workflow = AgentWorkflow(
            workflow_id=workflow_id,
            sentiment_id=sentiment_id,
            status=AgentWorkflowStatus.IAA_PROCESSING
        )
        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)
        
        # Broadcast IAA started
        await manager.broadcast({
            "type": "iaa_started",
            "workflow_id": workflow_id,
            "message": "Internal Analysis Agent started",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Run IAA analysis (streaming markdown)
        iaa_analysis = ""
        
        async for chunk in iaa_agent.analyze_and_stream(sentiment_data, db):
            # Accumulate analysis text
            iaa_analysis += chunk
            
            # Broadcast progress (send chunks for progressive rendering)
            await manager.broadcast({
                "type": "iaa_progress",
                "workflow_id": workflow_id,
                "data": {"chunk": chunk},
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Update workflow with IAA results
        workflow.iaa_analysis = iaa_analysis
        workflow.iaa_completed_at = datetime.utcnow()
        workflow.status = AgentWorkflowStatus.IAA_COMPLETED
        
        # Extract confidence and risk from FDA signal
        workflow.confidence_score = sentiment_data.get("confidence", 75.0)
        
        # Determine data quality based on confidence
        if workflow.confidence_score >= 90:
            workflow.data_quality = "excellent"
        elif workflow.confidence_score >= 75:
            workflow.data_quality = "good"
        elif workflow.confidence_score >= 60:
            workflow.data_quality = "fair"
        else:
            workflow.data_quality = "poor"
        
        # Determine risk level from FDA signal type or default to MEDIUM
        signal_type = sentiment_data.get("signal_type", "").lower()
        if "phishing" in signal_type or "fraud" in signal_type or "security" in signal_type:
            workflow.risk_level = "CRITICAL"
        elif "scam" in signal_type or "warning" in signal_type:
            workflow.risk_level = "HIGH"
        elif "complaint" in signal_type or "issue" in signal_type:
            workflow.risk_level = "MEDIUM"
        else:
            workflow.risk_level = "MEDIUM"
        
        # Generate escalation recommendation based on risk and confidence
        if workflow.risk_level == "CRITICAL" or workflow.confidence_score < 60:
            workflow.escalation_recommendation = "Recommend escalation to Legal/Compliance for review"
        elif workflow.risk_level == "HIGH" and workflow.confidence_score < 75:
            workflow.escalation_recommendation = "Consider management review before posting"
        else:
            workflow.escalation_recommendation = None
        
        await db.commit()
        
        # Broadcast IAA completed
        await manager.broadcast({
            "type": "iaa_completed",
            "workflow_id": workflow_id,
            "data": {
                "analysis": iaa_analysis
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Start EBA agent
        workflow.status = AgentWorkflowStatus.EBA_PROCESSING
        await db.commit()
        
        await manager.broadcast({
            "type": "eba_started",
            "workflow_id": workflow_id,
            "message": "Executive Briefing Agent started",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Prepare summary for EBA (based on IAA analysis)
        sanitized_summary = {
            "analysis": iaa_analysis,
            "signal_type": sentiment_data.get("signal_type", "unknown"),
            "confidence": sentiment_data.get("confidence", 0)
        }
        
        # Run EBA post generation (streaming)
        eba_post = ""
        async for update in eba_agent.generate_post(
            sentiment_data,
            sanitized_summary
        ):
            # Broadcast progress
            await manager.broadcast({
                "type": "eba_progress",
                "workflow_id": workflow_id,
                "data": update,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            if update.get("type") == "completed":
                eba_post = update["data"]["original_post"]
        
        # Update workflow with EBA results
        workflow.eba_original_post = eba_post
        workflow.eba_completed_at = datetime.utcnow()
        workflow.status = AgentWorkflowStatus.AWAITING_APPROVAL
        await db.commit()
        
        # Broadcast EBA completed
        await manager.broadcast({
            "type": "eba_completed",
            "workflow_id": workflow_id,
            "data": {
                "original_post": eba_post
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Workflow processing error: {e}")
        # Update workflow status
        try:
            workflow.status = AgentWorkflowStatus.FAILED
            workflow.error_message = str(e)
            await db.commit()
        except:
            pass
        
        await manager.broadcast({
            "type": "workflow_error",
            "workflow_id": workflow_id,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })

@router.post("/send_social_sentiment")
async def receive_fda_sentiment(
    sentiment_input: FDASentimentInput,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Endpoint for FDA agent to send sentiment data"""
    try:
        # Create sentiment record
        sentiment = Sentiment(
            signal_type=sentiment_input.signal_type,
            confidence=sentiment_input.confidence,
            drivers=sentiment_input.drivers,
            uncertainty_notes=sentiment_input.uncertainty_notes,
            recommend_escalation=1 if sentiment_input.recommend_escalation else 0,
            raw_data=sentiment_input.dict()
        )
        db.add(sentiment)
        await db.commit()
        await db.refresh(sentiment)
        
        # Generate workflow ID
        workflow_id = f"WF-{uuid.uuid4().hex[:12].upper()}"
        
        # Broadcast FDA received
        await manager.broadcast({
            "type": "fda_received",
            "workflow_id": workflow_id,
            "data": sentiment_input.dict(),
            "sentiment_id": sentiment.id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Start background processing
        background_tasks.add_task(
            process_sentiment_workflow,
            sentiment.id,
            sentiment_input.dict(),
            workflow_id,
            db
        )
        
        return {
            "status": "received",
            "sentiment_id": sentiment.id,
            "workflow_id": workflow_id,
            "message": "Sentiment received and processing started"
        }
        
    except Exception as e:
        logger.error(f"Error receiving sentiment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Workflow Management ====================
@router.get("/workflows", response_model=List[AgentWorkflowResponse])
async def get_workflows(
    status: str = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get recent workflows, optionally filtered by status"""
    query = select(AgentWorkflow).options(
        selectinload(AgentWorkflow.sentiment)
    ).order_by(desc(AgentWorkflow.created_at)).limit(limit)
    
    if status:
        query = query.where(AgentWorkflow.status == status)
    
    result = await db.execute(query)
    workflows = result.scalars().all()
    
    # Add signal_type from sentiment to each workflow
    response_data = []
    for workflow in workflows:
        workflow_dict = {
            "id": workflow.id,
            "workflow_id": workflow.workflow_id,
            "sentiment_id": workflow.sentiment_id,
            "status": workflow.status,
            "signal_type": workflow.sentiment.signal_type if workflow.sentiment else None,
            "iaa_matched_transactions": workflow.iaa_matched_transactions,
            "iaa_matched_reviews": workflow.iaa_matched_reviews,
            "iaa_analysis": workflow.iaa_analysis,
            "iaa_completed_at": workflow.iaa_completed_at,
            "eba_original_post": workflow.eba_original_post,
            "eba_edited_post": workflow.eba_edited_post,
            "eba_completed_at": workflow.eba_completed_at,
            "confidence_score": workflow.confidence_score,
            "data_quality": workflow.data_quality,
            "risk_level": workflow.risk_level,
            "escalation_recommendation": workflow.escalation_recommendation,
            "approved_by": workflow.approved_by,
            "approved_at": workflow.approved_at,
            "posted_at": workflow.posted_at,
            "discarded_by": workflow.discarded_by,
            "escalated_by": workflow.escalated_by,
            "escalated_at": workflow.escalated_at,
            "escalation_type": workflow.escalation_type,
            "error_message": workflow.error_message,
            "retry_count": workflow.retry_count,
            "timestamp": workflow.timestamp,
            "created_at": workflow.created_at,
            "updated_at": workflow.updated_at,
        }
        response_data.append(workflow_dict)
    
    return response_data

@router.get("/workflows/{workflow_id}", response_model=AgentWorkflowResponse)
async def get_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get specific workflow by ID"""
    result = await db.execute(
        select(AgentWorkflow).where(AgentWorkflow.workflow_id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow

@router.post("/workflows/{workflow_id}/approve")
async def approve_post(
    workflow_id: str,
    approval: WorkflowApproval,
    db: AsyncSession = Depends(get_db)
):
    """Approve and optionally edit the PR post, then post to social media"""
    result = await db.execute(
        select(AgentWorkflow).where(AgentWorkflow.workflow_id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.status != AgentWorkflowStatus.AWAITING_APPROVAL:
        raise HTTPException(status_code=400, detail="Workflow not awaiting approval")
    
    # Update workflow
    workflow.eba_edited_post = approval.edited_post if approval.edited_post else workflow.eba_original_post
    workflow.approved_by = approval.approved_by
    workflow.approved_at = datetime.utcnow()
    workflow.status = AgentWorkflowStatus.APPROVED
    
    # Post to social media
    final_post = workflow.eba_edited_post
    post_result = await eba_agent.post_to_social_media(final_post)
    
    if post_result.get("success"):
        workflow.status = AgentWorkflowStatus.POSTED
        workflow.posted_at = datetime.utcnow()
    else:
        workflow.error_message = post_result.get("error")
    
    await db.commit()
    
    # Broadcast approval
    await manager.broadcast({
        "type": "post_approved",
        "workflow_id": workflow_id,
        "data": {
            "approved_by": approval.approved_by,
            "final_post": final_post,
            "posted": post_result.get("success")
        },
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {
        "status": "approved",
        "workflow_id": workflow_id,
        "posted": post_result.get("success"),
        "message": "Post approved and published" if post_result.get("success") else "Post approved but publishing failed"
    }

@router.post("/workflows/{workflow_id}/escalate")
async def escalate_workflow(
    workflow_id: str,
    escalate_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Escalate a workflow for management/legal/investigation review"""
    result = await db.execute(
        select(AgentWorkflow).where(AgentWorkflow.workflow_id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.status != AgentWorkflowStatus.AWAITING_APPROVAL:
        raise HTTPException(status_code=400, detail="Workflow not awaiting approval")
    
    escalation_type = escalate_data.get("escalation_type", "management")
    
    # Set escalation status based on type
    if escalation_type == "management":
        workflow.status = AgentWorkflowStatus.ESCALATED_MANAGEMENT
    elif escalation_type == "legal":
        workflow.status = AgentWorkflowStatus.ESCALATED_LEGAL
    elif escalation_type == "investigation":
        workflow.status = AgentWorkflowStatus.ESCALATED_INVESTIGATION
    
    workflow.escalated_by = escalate_data.get("escalated_by")
    workflow.escalated_at = datetime.utcnow()
    workflow.escalation_type = escalation_type
    
    await db.commit()
    
    # Broadcast escalation event
    await manager.broadcast({
        "type": "workflow_escalated",
        "workflow_id": workflow_id,
        "data": {
            "escalated_by": escalate_data.get("escalated_by"),
            "escalation_type": escalation_type
        },
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {
        "status": "success",
        "message": f"Workflow escalated to {escalation_type}"
    }

@router.post("/workflows/{workflow_id}/discard")
async def discard_post(
    workflow_id: str,
    discard_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Discard a PR post without posting to social media"""
    result = await db.execute(
        select(AgentWorkflow).where(AgentWorkflow.workflow_id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.status != AgentWorkflowStatus.AWAITING_APPROVAL:
        raise HTTPException(status_code=400, detail="Workflow not awaiting approval")
    
    # Update workflow to discarded status
    workflow.status = AgentWorkflowStatus.DISCARDED
    workflow.approved_by = discard_data.get("discarded_by")  # Track who discarded it
    workflow.approved_at = datetime.utcnow()  # Use this field to track discard time
    
    await db.commit()
    
    # Broadcast discard event
    await manager.broadcast({
        "type": "post_discarded",
        "workflow_id": workflow_id,
        "data": {
            "discarded_by": discard_data.get("discarded_by"),
            "reason": discard_data.get("reason", "Not specified")
        },
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {
        "status": "discarded",
        "workflow_id": workflow_id,
        "message": "Post has been discarded"
    }

@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a workflow by ID"""
    result = await db.execute(
        select(AgentWorkflow).where(AgentWorkflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    await db.delete(workflow)
    await db.commit()
    
    # Broadcast deletion
    await manager.broadcast({
        "type": "workflow_deleted",
        "workflow_id": workflow.workflow_id,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"status": "deleted", "workflow_id": workflow.workflow_id}

# ==================== WebSocket Endpoint ====================
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back for ping/pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
