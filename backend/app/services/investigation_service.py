import time
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import random
import string
import pandas as pd
from sqlalchemy.orm import Session

from app.models.database import Message, MessageAttribute, Investigation, InvestigationAction
from app.services.openai_service import OpenAIService

class InvestigationService:
    def __init__(self, openai_service: OpenAIService):
        self.openai_service = openai_service
    
    async def create_investigation(
        self, 
        db: Session,
        message_id: int, 
        priority: str = "medium",
        customer_info: Optional[Dict[str, Any]] = None
    ) -> Investigation:
        """
        Create a new investigation based on an MT message
        
        Args:
            db: Database session
            message_id: ID of the message to investigate
            priority: Priority level (low, medium, high, critical)
            customer_info: Optional customer information
            
        Returns:
            The created investigation
        """
        # Get the message
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise ValueError(f"Message with ID {message_id} not found")
        
        # Generate reference number
        ref_number = self._generate_reference_number()
        
        # Create investigation
        investigation = Investigation(
            message_id=message_id,
            reference_number=ref_number,
            status="open",
            priority=priority,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            customer_info=json.dumps(customer_info) if customer_info else None
        )
        
        db.add(investigation)
        db.commit()
        db.refresh(investigation)
        
        # Analyze the message and create initial actions
        await self._analyze_and_create_actions(db, investigation.id, message)
        
        return investigation
    
    async def _analyze_and_create_actions(
        self, 
        db: Session,
        investigation_id: int, 
        message: Message
    ) -> None:
        """
        Analyze the message and create initial actions for the investigation
        
        Args:
            db: Database session
            investigation_id: ID of the investigation
            message: The message to analyze
        """
        # Get attributes for the message
        attributes = {}
        for attr in message.attributes:
            attributes[attr.key] = attr.value
        
        # Use AI to analyze and suggest actions
        actions = await self._suggest_investigation_actions(message.content, attributes)
        
        # Create action records
        for action in actions:
            investigation_action = InvestigationAction(
                investigation_id=investigation_id,
                action_type=action["type"],
                description=action["description"],
                suggested_response=action.get("suggested_response"),
                status="pending",
                priority=action.get("priority", "medium"),
                deadline=datetime.utcnow() + timedelta(days=action.get("suggested_days", 3)),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(investigation_action)
        
        db.commit()
    
    async def _suggest_investigation_actions(
        self, 
        message_content: str,
        attributes: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Use OpenAI to suggest investigation actions based on message content
        
        Args:
            message_content: The content of the MT message
            attributes: Message attributes
            
        Returns:
            List of suggested actions
        """
        prompt = f"""
        Analyze this SWIFT MT message and its extracted attributes to suggest investigation actions.
        Return a JSON array of actions with the following fields:
        - type: The type of action (information_request, amendment_request, customer_notification, cancellation, other)
        - description: A clear description of the action to take
        - suggested_response: Template text for a response (if applicable)
        - priority: Priority of the action (low, medium, high, critical)
        - suggested_days: Suggested days to complete (1-10)

        MT message:
        {message_content}
        
        Attributes:
        {json.dumps(attributes, indent=2)}
        """
        
        response = await self.openai_service.call_openai(prompt)
        
        # Parse response
        try:
            actions = json.loads(response)
            if not isinstance(actions, list):
                actions = [actions]  # Ensure it's a list
        except json.JSONDecodeError:
            # Try to extract JSON from text
            import re
            json_match = re.search(r'(\[.*\])', response, re.DOTALL)
            if json_match:
                try:
                    actions = json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    # If still fails, create a basic action
                    actions = [{
                        "type": "information_request",
                        "description": "Analyze the message and determine next steps",
                        "suggested_response": "Based on our initial analysis, we need to investigate further.",
                        "priority": "medium",
                        "suggested_days": 3
                    }]
            else:
                # Create a basic action
                actions = [{
                    "type": "information_request",
                    "description": "Analyze the message and determine next steps",
                    "suggested_response": "Based on our initial analysis, we need to investigate further.",
                    "priority": "medium",
                    "suggested_days": 3
                }]
        
        return actions
    
    def get_investigation(self, db: Session, investigation_id: int) -> Dict[str, Any]:
        """
        Get investigation with all related data
        
        Args:
            db: Database session
            investigation_id: ID of the investigation
            
        Returns:
            Investigation data with actions
        """
        investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not investigation:
            raise ValueError(f"Investigation with ID {investigation_id} not found")
        
        # Get the message
        message = db.query(Message).filter(Message.id == investigation.message_id).first()
        
        # Get attributes
        attributes = {}
        if message:
            for attr in message.attributes:
                attributes[attr.key] = attr.value
        
        # Get actions
        actions = db.query(InvestigationAction).filter(
            InvestigationAction.investigation_id == investigation_id
        ).order_by(InvestigationAction.created_at.asc()).all()
        
        # Format actions
        formatted_actions = []
        for action in actions:
            formatted_actions.append({
                "id": action.id,
                "type": action.action_type,
                "description": action.description,
                "suggested_response": action.suggested_response,
                "status": action.status,
                "priority": action.priority,
                "deadline": action.deadline.isoformat() if action.deadline else None,
                "completed_at": action.completed_at.isoformat() if action.completed_at else None,
                "created_at": action.created_at.isoformat(),
                "updated_at": action.updated_at.isoformat()
            })
        
        # Format customer info
        customer_info = json.loads(investigation.customer_info) if investigation.customer_info else {}
        
        # Format result
        result = {
            "id": investigation.id,
            "reference_number": investigation.reference_number,
            "status": investigation.status,
            "priority": investigation.priority,
            "message": {
                "id": message.id if message else None,
                "message_id": message.message_id if message else None,
                "content": message.content if message else None,
                "attributes": attributes
            },
            "customer_info": customer_info,
            "actions": formatted_actions,
            "created_at": investigation.created_at.isoformat(),
            "updated_at": investigation.updated_at.isoformat(),
            "resolution_notes": investigation.resolution_notes,
            "resolved_at": investigation.resolved_at.isoformat() if investigation.resolved_at else None
        }
        
        return result
    
    def get_investigation_by_reference(self, db: Session, reference_number: str) -> Dict[str, Any]:
        """Get investigation by reference number"""
        investigation = db.query(Investigation).filter(Investigation.reference_number == reference_number).first()
        if not investigation:
            raise ValueError(f"Investigation with reference {reference_number} not found")
        
        return self.get_investigation(db, investigation.id)
    
    def get_investigations(
        self, 
        db: Session, 
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get list of investigations with filters
        
        Args:
            db: Database session
            status: Filter by status (open, in_progress, resolved, closed)
            priority: Filter by priority (low, medium, high, critical)
            limit: Result limit
            offset: Result offset
            
        Returns:
            List of investigations
        """
        # Build query
        query = db.query(Investigation)
        
        if status:
            query = query.filter(Investigation.status == status)
        
        if priority:
            query = query.filter(Investigation.priority == priority)
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        investigations = query.order_by(Investigation.updated_at.desc()).offset(offset).limit(limit).all()
        
        # Format results
        results = []
        for inv in investigations:
            # Get the message
            message = db.query(Message).filter(Message.id == inv.message_id).first()
            
            # Get action counts
            action_counts = {
                "total": db.query(InvestigationAction).filter(
                    InvestigationAction.investigation_id == inv.id
                ).count(),
                "pending": db.query(InvestigationAction).filter(
                    InvestigationAction.investigation_id == inv.id,
                    InvestigationAction.status == "pending"
                ).count(),
                "completed": db.query(InvestigationAction).filter(
                    InvestigationAction.investigation_id == inv.id,
                    InvestigationAction.status == "completed"
                ).count()
            }
            
            # Format customer info
            customer_info = json.loads(inv.customer_info) if inv.customer_info else {}
            
            results.append({
                "id": inv.id,
                "reference_number": inv.reference_number,
                "status": inv.status,
                "priority": inv.priority,
                "message_id": message.message_id if message else None,
                "customer_name": customer_info.get("name", "N/A"),
                "action_counts": action_counts,
                "created_at": inv.created_at.isoformat(),
                "updated_at": inv.updated_at.isoformat(),
                "days_open": (datetime.utcnow() - inv.created_at).days
            })
        
        return {
            "total": total,
            "investigations": results,
            "limit": limit,
            "offset": offset
        }
    
    async def add_investigation_action(
        self, 
        db: Session,
        investigation_id: int, 
        action_type: str,
        description: str,
        suggested_response: Optional[str] = None,
        priority: str = "medium",
        deadline_days: int = 3
    ) -> InvestigationAction:
        """
        Add a new action to an investigation
        
        Args:
            db: Database session
            investigation_id: ID of the investigation
            action_type: Type of action
            description: Description of the action
            suggested_response: Template text for a response
            priority: Priority level
            deadline_days: Days to deadline
            
        Returns:
            The created action
        """
        # Check if investigation exists
        investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not investigation:
            raise ValueError(f"Investigation with ID {investigation_id} not found")
        
        # Create action
        action = InvestigationAction(
            investigation_id=investigation_id,
            action_type=action_type,
            description=description,
            suggested_response=suggested_response,
            status="pending",
            priority=priority,
            deadline=datetime.utcnow() + timedelta(days=deadline_days),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(action)
        db.commit()
        db.refresh(action)
        
        # Update investigation status if it's "open"
        if investigation.status == "open":
            investigation.status = "in_progress"
            investigation.updated_at = datetime.utcnow()
            db.commit()
        
        return action
    
    def update_action_status(
        self, 
        db: Session,
        action_id: int, 
        status: str,
        notes: Optional[str] = None
    ) -> InvestigationAction:
        """
        Update the status of an investigation action
        
        Args:
            db: Database session
            action_id: ID of the action
            status: New status (pending, in_progress, completed, cancelled)
            notes: Optional notes
            
        Returns:
            The updated action
        """
        # Get the action
        action = db.query(InvestigationAction).filter(InvestigationAction.id == action_id).first()
        if not action:
            raise ValueError(f"Action with ID {action_id} not found")
        
        # Update action
        action.status = status
        action.notes = notes
        action.updated_at = datetime.utcnow()
        
        if status == "completed":
            action.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(action)
        
        # Check if all actions are completed
        self._check_investigation_completion(db, action.investigation_id)
        
        return action
    
    def _check_investigation_completion(self, db: Session, investigation_id: int) -> None:
        """
        Check if all actions for an investigation are completed and update investigation status
        
        Args:
            db: Database session
            investigation_id: ID of the investigation
        """
        # Get investigation
        investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not investigation:
            return
        
        # Count total and completed actions
        total_actions = db.query(InvestigationAction).filter(
            InvestigationAction.investigation_id == investigation_id
        ).count()
        
        completed_actions = db.query(InvestigationAction).filter(
            InvestigationAction.investigation_id == investigation_id,
            InvestigationAction.status == "completed"
        ).count()
        
        # Update status if all actions are completed
        if total_actions > 0 and total_actions == completed_actions:
            investigation.status = "resolved"
            investigation.resolved_at = datetime.utcnow()
            investigation.updated_at = datetime.utcnow()
            db.commit()
    
    def resolve_investigation(
        self, 
        db: Session,
        investigation_id: int, 
        resolution_notes: str
    ) -> Investigation:
        """
        Resolve an investigation
        
        Args:
            db: Database session
            investigation_id: ID of the investigation
            resolution_notes: Notes about the resolution
            
        Returns:
            The updated investigation
        """
        # Get investigation
        investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not investigation:
            raise ValueError(f"Investigation with ID {investigation_id} not found")
        
        # Update investigation
        investigation.status = "resolved" if investigation.status != "closed" else "closed"
        investigation.resolution_notes = resolution_notes
        investigation.resolved_at = datetime.utcnow() if not investigation.resolved_at else investigation.resolved_at
        investigation.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(investigation)
        
        return investigation
    
    def close_investigation(self, db: Session, investigation_id: int) -> Investigation:
        """Close an investigation"""
        # Get investigation
        investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not investigation:
            raise ValueError(f"Investigation with ID {investigation_id} not found")
        
        # Update investigation
        investigation.status = "closed"
        investigation.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(investigation)
        
        return investigation
    
    async def get_investigation_analytics(self, db: Session) -> Dict[str, Any]:
        """
        Get analytics data for investigations
        
        Args:
            db: Database session
            
        Returns:
            Analytics data
        """
        # Get total counts by status
        status_counts = {
            "open": db.query(Investigation).filter(Investigation.status == "open").count(),
            "in_progress": db.query(Investigation).filter(Investigation.status == "in_progress").count(),
            "resolved": db.query(Investigation).filter(Investigation.status == "resolved").count(),
            "closed": db.query(Investigation).filter(Investigation.status == "closed").count()
        }
        
        # Get total counts by priority
        priority_counts = {
            "low": db.query(Investigation).filter(Investigation.priority == "low").count(),
            "medium": db.query(Investigation).filter(Investigation.priority == "medium").count(),
            "high": db.query(Investigation).filter(Investigation.priority == "high").count(),
            "critical": db.query(Investigation).filter(Investigation.priority == "critical").count()
        }
        
        # Calculate average resolution time (for resolved investigations)
        resolved_investigations = db.query(Investigation).filter(
            Investigation.status.in_(["resolved", "closed"]),
            Investigation.resolved_at.isnot(None)
        ).all()
        
        total_resolution_hours = 0
        for inv in resolved_investigations:
            resolution_time = inv.resolved_at - inv.created_at
            total_resolution_hours += resolution_time.total_seconds() / 3600
        
        avg_resolution_hours = total_resolution_hours / len(resolved_investigations) if resolved_investigations else 0
        
        # Get action type distribution
        action_types = db.query(
            InvestigationAction.action_type,
            db.func.count(InvestigationAction.id)
        ).group_by(InvestigationAction.action_type).all()
        
        action_type_counts = {action_type: count for action_type, count in action_types}
        
        # Return analytics data
        return {
            "status_counts": status_counts,
            "priority_counts": priority_counts,
            "avg_resolution_hours": avg_resolution_hours,
            "total_investigations": sum(status_counts.values()),
            "action_type_counts": action_type_counts,
            "updated_at": datetime.utcnow().isoformat()
        }
    
    async def generate_customer_notification(
        self, 
        db: Session,
        investigation_id: int,
        notification_type: str = "status_update"
    ) -> Dict[str, Any]:
        """
        Generate a customer notification for an investigation
        
        Args:
            db: Database session
            investigation_id: ID of the investigation
            notification_type: Type of notification (status_update, resolution, request_info)
            
        Returns:
            Generated notification content
        """
        # Get investigation
        investigation_data = self.get_investigation(db, investigation_id)
        
        # Generate notification using AI
        prompt = f"""
        Generate a customer notification email for a SWIFT MT message investigation.
        
        Investigation details:
        - Reference: {investigation_data['reference_number']}
        - Status: {investigation_data['status']}
        - Created: {investigation_data['created_at']}
        - Message Type: MT199
        
        Customer info:
        {json.dumps(investigation_data['customer_info'], indent=2)}
        
        Notification type: {notification_type}
        
        Return JSON with 'subject' and 'body' fields.
        """
        
        response = await self.openai_service.call_openai(prompt)
        
        # Parse response
        try:
            notification = json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from text
            import re
            json_match = re.search(r'(\{.*\})', response, re.DOTALL)
            if json_match:
                try:
                    notification = json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    # If still fails, create a basic notification
                    notification = {
                        "subject": f"Update on your payment investigation - Ref: {investigation_data['reference_number']}",
                        "body": f"Dear Customer,\n\nThis is an update regarding your payment investigation (Reference: {investigation_data['reference_number']}).\n\nThe current status is: {investigation_data['status']}.\n\nWe will continue to keep you informed of any developments.\n\nBest regards,\nThe Investigation Team"
                    }
            else:
                # Create a basic notification
                notification = {
                    "subject": f"Update on your payment investigation - Ref: {investigation_data['reference_number']}",
                    "body": f"Dear Customer,\n\nThis is an update regarding your payment investigation (Reference: {investigation_data['reference_number']}).\n\nThe current status is: {investigation_data['status']}.\n\nWe will continue to keep you informed of any developments.\n\nBest regards,\nThe Investigation Team"
                }
        
        # Add metadata
        notification["investigation_id"] = investigation_id
        notification["reference_number"] = investigation_data["reference_number"]
        notification["generated_at"] = datetime.utcnow().isoformat()
        notification["notification_type"] = notification_type
        
        return notification
    
    def _generate_reference_number(self) -> str:
        """Generate a unique reference number for an investigation"""
        prefix = "INV"
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"{prefix}-{timestamp}-{random_part}"