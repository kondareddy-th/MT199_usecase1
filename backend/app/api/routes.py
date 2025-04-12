from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import logging

from app.models.database import get_db, Message, UserSetting
from app.services.mt_service import MTService
from app.services.openai_service import OpenAIService
from pydantic import BaseModel

# Create routers
mt_router = APIRouter(prefix="/api/mt", tags=["MT Messages"])
settings_router = APIRouter(prefix="/api/settings", tags=["Settings"])

# Routes for MT processing
@mt_router.post("/process")
async def process_mt_message(
    content: str = Body(..., description="MT message content"),
    mode: str = Body("convert", description="Processing mode: 'convert' or 'extract'"),
    message_id: Optional[str] = Body(None, description="Optional message ID"),
    feeling_lucky: bool = Body(False, description="Get an additional 'feeling lucky' insight"),
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        mt_service = MTService(openai_service)
        
        # Process the message
        result, _ = await mt_service.process_single_message(content, mode, message_id)
        
        # Add "feeling lucky" insight if requested
        if feeling_lucky:
            insight = await openai_service.get_feeling_lucky(content)
            result["feeling_lucky"] = insight
        
        # Save to database
        mt_service.save_message_to_db(db, result, content)
        print('result', result)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeRequest(BaseModel):
    content: str

@mt_router.post("/analyze-mt199")
async def analyze_mt199(
    request_data: AnalyzeRequest,
    db: Session = Depends(get_db)
):
    try:
        # Initialize services
        openai_service = OpenAIService(db)
        mt_service = MTService(openai_service)
        
        logging.info(f"Analyzing MT199 message starting with: {request_data.content[:50]}...") # Add info log
        # Process the MT199 message
        result = await mt_service._process_mt199_stp_failure(request_data.content)
        logging.info(f"Successfully analyzed MT199. Workcase type: {result.get('workcase_type')}") # Add success log

        
        # Add a formatted response for UI display if not already present
        if "mt199_formatted_response" not in result:
            # Default simple format
            formatted_response = f"""{{1:F01SENDERXXXXXX0000000000}}
{{2:I199RECEIVERXXXXN}}
{{4:
:20:{result.get("extracted_fields", {}).get("reference", "REF1234")}
:21:REPLY
:79:{result.get("response_template", "Investigation in progress. Will update shortly.")}
-}}"""
            result["mt199_formatted_response"] = formatted_response
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mt_router.post("/upload")
async def upload_mt_file(
    file: UploadFile = File(...),
    mode: str = Form("convert"),
    db: Session = Depends(get_db)
):
    try:
        # Check file extension
        _, file_extension = os.path.splitext(file.filename)
        
        # Read file content
        file_content = await file.read()
        
        # Process based on file extension
        if file_extension.lower() in [".csv", ".xlsx", ".xls"]:
            # Initialize services
            openai_service = OpenAIService(db)
            mt_service = MTService(openai_service)
            
            # Process bulk messages
            results = await mt_service.process_bulk_messages(file_content, file_extension, mode)
            
            # Save all messages to database
            for i, result in enumerate(results):
                if "error" not in result:
                    # Find the original message from the results
                    original_content = ""
                    if "original_message" in result:
                        original_content = result["original_message"]
                    mt_service.save_message_to_db(db, result, original_content, is_bulk=True)
            
            return {"processed": len(results), "results": results}
        
        elif file_extension.lower() in [".txt", ".swift"]:
            # Single MT message in a text file
            message_content = file_content.decode("utf-8")
            
            # Initialize services
            openai_service = OpenAIService(db)
            mt_service = MTService(openai_service)
            
            # Process the message
            result, _ = await mt_service.process_single_message(message_content, mode)
            
            # Save to database
            mt_service.save_message_to_db(db, result, message_content)
            
            return result
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {file_extension}")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mt_router.get("/history")
async def get_message_history(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    try:
        # Get messages from database with pagination
        messages = db.query(Message).order_by(Message.created_at.desc()).offset(offset).limit(limit).all()
        
        # Count total messages
        total = db.query(Message).count()
        
        # Format the response
        result = {
            "total": total,
            "offset": offset,
            "limit": limit,
            "messages": []
        }
        
        for message in messages:
            # Get attributes
            attributes = {}
            for attr in message.attributes:
                attributes[attr.key] = attr.value
            
            # Format message
            result["messages"].append({
                "id": message.id,
                "message_id": message.message_id,
                "message_type": message.message_type,
                "content": message.content,
                "converted_content": message.converted_content,
                "created_at": message.created_at.isoformat(),
                "processed_at": message.processed_at.isoformat() if message.processed_at else None,
                "processing_time": message.processing_time,
                "is_bulk": message.is_bulk,
                "attributes": attributes
            })
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@mt_router.get("/message/{message_id}")
async def get_message_by_id(
    message_id: int,
    db: Session = Depends(get_db)
):
    try:
        # Get message from database
        message = db.query(Message).filter(Message.id == message_id).first()
        
        if not message:
            raise HTTPException(status_code=404, detail=f"Message with ID {message_id} not found")
        
        # Get attributes
        attributes = {}
        for attr in message.attributes:
            attributes[attr.key] = attr.value
        
        # Format the response
        result = {
            "id": message.id,
            "message_id": message.message_id,
            "message_type": message.message_type,
            "content": message.content,
            "converted_content": message.converted_content,
            "created_at": message.created_at.isoformat(),
            "processed_at": message.processed_at.isoformat() if message.processed_at else None,
            "processing_time": message.processing_time,
            "is_bulk": message.is_bulk,
            "attributes": attributes
        }
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Routes for settings
@settings_router.get("/")
async def get_settings(db: Session = Depends(get_db)):
    try:
        # Get settings from database
        settings = db.query(UserSetting).first()
        
        if not settings:
            # Create default settings if not exists
            settings = UserSetting()
            db.add(settings)
            db.commit()
            db.refresh(settings)
        
        # Format the response (mask API key)
        api_key = settings.api_key
        masked_key = None
        if api_key:
            masked_key = api_key[:4] + "****" + api_key[-4:] if len(api_key) > 8 else "****"
        
        return {
            "id": settings.id,
            "api_key_set": bool(settings.api_key),
            "api_key_masked": masked_key,
            "model": settings.model,
            "default_mode": settings.default_mode,
            "created_at": settings.created_at.isoformat(),
            "updated_at": settings.updated_at.isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@settings_router.post("/")
async def update_settings(
    api_key: Optional[str] = Body(None),
    model: Optional[str] = Body(None),
    default_mode: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    try:
        # Get settings from database
        settings = db.query(UserSetting).first()
        
        if not settings:
            # Create default settings if not exists
            settings = UserSetting()
            db.add(settings)
        
        # Update settings
        if api_key is not None:
            settings.api_key = api_key
        if model is not None:
            settings.model = model
        if default_mode is not None:
            settings.default_mode = default_mode
        
        db.commit()
        db.refresh(settings)
        
        # Format the response (mask API key)
        api_key = settings.api_key
        masked_key = None
        if api_key:
            masked_key = api_key[:4] + "****" + api_key[-4:] if len(api_key) > 8 else "****"
        
        return {
            "id": settings.id,
            "api_key_set": bool(settings.api_key),
            "api_key_masked": masked_key,
            "model": settings.model,
            "default_mode": settings.default_mode,
            "created_at": settings.created_at.isoformat(),
            "updated_at": settings.updated_at.isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@settings_router.delete("/api-key")
async def delete_api_key(db: Session = Depends(get_db)):
    try:
        # Get settings from database
        settings = db.query(UserSetting).first()
        
        if not settings:
            raise HTTPException(status_code=404, detail="Settings not found")
        
        # Clear API key
        settings.api_key = None
        db.commit()
        
        return {"message": "API key removed successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))