from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List

from app.models.database import get_db, Investigation, InvestigationAction
from app.services.investigation_service import InvestigationService
from app.services.openai_service import OpenAIService

# Create router
investigation_router = APIRouter(prefix="/api/investigations", tags=["Investigations"])

# Routes for investigation management
@investigation_router.post("/")
async def create_investigation(
    message_id: int = Body(..., description="Message ID"),
    priority: str = Body("medium", description="Priority (low, medium, high, critical)"),
    customer_info: Optional[Dict[str, Any]] = Body(None, description="Customer information"),
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Create investigation
        investigation = await investigation_service.create_investigation(
            db=db, 
            message_id=message_id, 
            priority=priority,
            customer_info=customer_info
        )
        
        # Get full investigation data
        result = investigation_service.get_investigation(db, investigation.id)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@investigation_router.get("/")
async def get_investigations(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    limit: int = Query(10, description="Result limit"),
    offset: int = Query(0, description="Result offset"),
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Get investigations
        result = investigation_service.get_investigations(
            db=db, 
            status=status, 
            priority=priority,
            limit=limit,
            offset=offset
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@investigation_router.get("/{investigation_id}")
async def get_investigation(
    investigation_id: int,
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Get investigation
        result = investigation_service.get_investigation(db, investigation_id)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@investigation_router.get("/reference/{reference_number}")
async def get_investigation_by_reference(
    reference_number: str,
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Get investigation
        result = investigation_service.get_investigation_by_reference(db, reference_number)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@investigation_router.post("/{investigation_id}/actions")
async def add_investigation_action(
    investigation_id: int,
    action_type: str = Body(..., description="Action type"),
    description: str = Body(..., description="Action description"),
    suggested_response: Optional[str] = Body(None, description="Suggested response"),
    priority: str = Body("medium", description="Priority"),
    deadline_days: int = Body(3, description="Days to deadline"),
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Add action
        action = await investigation_service.add_investigation_action(
            db=db,
            investigation_id=investigation_id,
            action_type=action_type,
            description=description,
            suggested_response=suggested_response,
            priority=priority,
            deadline_days=deadline_days
        )
        
        return {
            "id": action.id,
            "investigation_id": action.investigation_id,
            "action_type": action.action_type,
            "description": action.description,
            "suggested_response": action.suggested_response,
            "status": action.status,
            "priority": action.priority,
            "deadline": action.deadline.isoformat() if action.deadline else None,
            "created_at": action.created_at.isoformat(),
            "updated_at": action.updated_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@investigation_router.put("/actions/{action_id}")
async def update_action_status(
    action_id: int,
    status: str = Body(..., description="New status"),
    notes: Optional[str] = Body(None, description="Action notes"),
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Update action
        action = investigation_service.update_action_status(
            db=db,
            action_id=action_id,
            status=status,
            notes=notes
        )
        
        return {
            "id": action.id,
            "investigation_id": action.investigation_id,
            "status": action.status,
            "notes": action.notes,
            "completed_at": action.completed_at.isoformat() if action.completed_at else None,
            "updated_at": action.updated_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@investigation_router.put("/{investigation_id}/resolve")
async def resolve_investigation(
    investigation_id: int,
    resolution_notes: str = Body(..., description="Resolution notes"),
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Resolve investigation
        investigation = investigation_service.resolve_investigation(
            db=db,
            investigation_id=investigation_id,
            resolution_notes=resolution_notes
        )
        
        return {
            "id": investigation.id,
            "reference_number": investigation.reference_number,
            "status": investigation.status,
            "resolution_notes": investigation.resolution_notes,
            "resolved_at": investigation.resolved_at.isoformat() if investigation.resolved_at else None,
            "updated_at": investigation.updated_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@investigation_router.put("/{investigation_id}/close")
async def close_investigation(
    investigation_id: int,
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Close investigation
        investigation = investigation_service.close_investigation(
            db=db,
            investigation_id=investigation_id
        )
        
        return {
            "id": investigation.id,
            "reference_number": investigation.reference_number,
            "status": investigation.status,
            "updated_at": investigation.updated_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@investigation_router.get("/analytics/summary")
async def get_investigation_analytics(
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Get analytics
        result = await investigation_service.get_investigation_analytics(db)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@investigation_router.post("/{investigation_id}/notifications")
async def generate_customer_notification(
    investigation_id: int,
    notification_type: str = Body("status_update", description="Notification type"),
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        investigation_service = InvestigationService(openai_service)
        
        # Generate notification
        result = await investigation_service.generate_customer_notification(
            db=db,
            investigation_id=investigation_id,
            notification_type=notification_type
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))