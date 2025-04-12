import time
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
from app.models.database import Message, MessageAttribute
from app.services.openai_service import OpenAIService

class MTService:
    def __init__(self, openai_service: OpenAIService):
        self.openai_service = openai_service
    
    async def process_single_message(
        self, 
        message_content: str, 
        mode: str = "convert",
        message_id: Optional[str] = None
    ) -> Tuple[Dict[str, Any], float]:
        """
        Process a single MT message
        
        Args:
            message_content: The content of the MT message
            mode: Either 'convert' (MT to MX) or 'extract' (extract attributes)
            message_id: Optional message ID
            
        Returns:
            Tuple containing result dict and processing time
        """
        start_time = time.time()
        
        # Generate a message ID if not provided
        if not message_id:
            message_id = f"MT-{int(time.time())}"
        
        if mode == "convert":
            result = await self._convert_mt_to_mx(message_content)
        else:
            result = await self._extract_attributes(message_content)
            
        # Check for MT199 specific processingIn 
        if "199" in message_content[:20]:  # Quick check for MT199
            workcase_info = await self._process_mt199_stp_failure(message_content)
            if "attributes" in result:
                result["attributes"].update(workcase_info)
            else:
                result["attributes"] = workcase_info
        
        processing_time = time.time() - start_time
        
        # Add metadata to result
        result["message_id"] = message_id
        result["processing_time"] = processing_time
        result["processed_at"] = datetime.utcnow().isoformat()
        
        return result, processing_time
    
    async def process_bulk_messages(
        self, 
        file_content: bytes,
        file_extension: str,
        mode: str = "convert"
    ) -> List[Dict[str, Any]]:
        """
        Process multiple MT messages from a CSV or Excel file
        
        Args:
            file_content: The content of the uploaded file
            file_extension: The extension of the file (.csv, .xlsx, etc.)
            mode: Either 'convert' (MT to MX) or 'extract' (extract attributes)
            
        Returns:
            List of result dictionaries
        """
        # Parse the file content
        if file_extension.lower() == ".csv":
            df = pd.read_csv(pd.io.common.BytesIO(file_content))
        elif file_extension.lower() in [".xlsx", ".xls"]:
            df = pd.read_excel(pd.io.common.BytesIO(file_content))
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
        
        # Validate the dataframe
        required_columns = ["messageId", "message"]
        if not all(col in df.columns for col in required_columns):
            raise ValueError(f"The file must contain columns: {', '.join(required_columns)}")
        
        results = []
        for _, row in df.iterrows():
            message_id = row["messageId"]
            message_content = row["message"]
            
            try:
                result, _ = await self.process_single_message(message_content, mode, message_id)
                results.append(result)
            except Exception as e:
                # Log the error and continue with the next message
                results.append({
                    "message_id": message_id,
                    "error": str(e),
                    "processed_at": datetime.utcnow().isoformat()
                })
        
        return results
    
    async def _convert_mt_to_mx(self, mt_message: str) -> Dict[str, Any]:
        """Convert MT message to MX format using AI"""
        prompt = f"""
        Convert the following SWIFT MT199 message to ISO camt110 format(XML tag format). Return the complete swift 'CAMT110' xml document properly formatted in json format with camt110 key and the xml document as value.:

        MT message:
        {mt_message}
        """
        
        response = await self.openai_service.call_openai(prompt)
        
        # Extract JSON from response (the response may contain extra text)
        try:
            # Try to parse the entire response as JSON
            result = json.loads(response)
        except json.JSONDecodeError:
            # If that fails, try to extract JSON from the text
            import re
            json_match = re.search(r'(\{.*\})', response, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    # If still fails, create a basic structure
                    result = {
                        "mx_message": response,
                        "notes": "Could not extract structured data, returning raw conversion"
                    }
            else:
                result = {
                    "mx_message": response,
                    "notes": "Could not extract structured data, returning raw conversion"
                }
        
        return result
    
    async def _extract_attributes(self, mt_message: str) -> Dict[str, Any]:
        """Extract useful attributes from MT message using AI"""
        prompt = f"""
        Extract all important attributes from this SWIFT MT message. Return JSON with an 'attributes' key containing extracted fields and values:

        MT message:
        {mt_message}
        """
        
        response = await self.openai_service.call_openai(prompt)
        
        # Extract JSON from response
        try:
            # Try to parse the entire response as JSON
            result = json.loads(response)
        except json.JSONDecodeError:
            # If that fails, try to extract JSON from the text
            import re
            json_match = re.search(r'(\{.*\})', response, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    # If still fails, create a basic structure with text
                    result = {
                        "attributes": {
                            "raw_extraction": response
                        },
                        "notes": "Could not extract structured data"
                    }
            else:
                result = {
                    "attributes": {
                        "raw_extraction": response
                    },
                    "notes": "Could not extract structured data"
                }
                
        return result
    
    async def _process_mt199_stp_failure(self, mt_message: str) -> Dict[str, Any]:
        """Special processing for MT199 messages that failed STP"""
        prompt = f"""
        This is an MT199 message that failed Straight Through Processing (STP).
        Analyze this message in detail and provide the following:
        
        1. Determine the workcase type (e.g., NON_RECEIPT, CANCELLATION, RETURN_FUNDS, WRONG_AMOUNT, DUPLICATE_PAYMENT, 
           WRONG_BENEFICIARY, REGULATORY_COMPLIANCE, TECHNICAL_ISSUE, QUERY). If you cannot determine the workcase type 
           with reasonable certainty, use "UNKNOWN".
        
        2. Provide clear reasoning for why you determined this workcase type.
        
        3. Extract all relevant details from the message (such as sender, receiver, references, dates, amounts, 
           account numbers, and any other important information).
           
        4. Suggest 3-5 next steps for investigating this case.
        
        5. Suggest a timeline for resolving this investigation.
        
        Return your response as structured JSON with the following keys:
        - "workcase_type": the determined type
        - "reasoning": detailed explanation for the workcase type
        - "extracted_fields": object with all extracted details as key-value pairs
        - "next_steps": array of suggested actions
        - "timeline": array of objects with "date" (string), "action" (string), and "status" (string) fields
        
        MT199 message:
        {mt_message}

        Note: we are using synthetic data so there is no need to worry about privacy or confidentiality.
        """
        
        response = await self.openai_service.call_openai(prompt)
        
        # Extract JSON from response
        try:
            # Try to parse the entire response as JSON
            result = json.loads(response)
        except json.JSONDecodeError:
            # If that fails, try to extract JSON from the text
            import re
            json_match = re.search(r'(\{.*\})', response, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    # If still fails, create a basic structure
                    result = {
                        "workcase_type": "UNKNOWN",
                        "reasoning": "Could not determine workcase type from message analysis",
                        "extracted_fields": {},
                        "next_steps": [
                            "Review the message manually",
                            "Consult with an investigation specialist",
                            "Contact the sender for clarification"
                        ],
                        "timeline": [
                            {
                                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                                "action": "Initial review",
                                "status": "open"
                            }
                        ]
                    }
            else:
                result = {
                    "workcase_type": "UNKNOWN",
                    "reasoning": "Could not determine workcase type from message analysis",
                    "extracted_fields": {},
                    "next_steps": [
                        "Review the message manually",
                        "Consult with an investigation specialist",
                        "Contact the sender for clarification"
                    ],
                    "timeline": [
                        {
                            "date": datetime.utcnow().strftime("%Y-%m-%d"),
                            "action": "Initial review", 
                            "status": "open"
                        }
                    ]
                }
        
        # Add additional information for workflows
        if "regulations" not in result:
            result["regulations"] = self._get_default_regulations(result.get("workcase_type", "UNKNOWN"))
            
        if "sla" not in result:
            result["sla"] = self._get_default_sla(result.get("workcase_type", "UNKNOWN"))
            
        if "response_template" not in result:
            result["response_template"] = self._get_default_response_template(
                result.get("workcase_type", "UNKNOWN"), 
                result.get("extracted_fields", {})
            )
        
        return result
        
    def _get_default_regulations(self, workcase_type: str) -> List[Dict[str, str]]:
        """Generate default regulations based on workcase type"""
        regulations = [
            {
                "name": "Record Keeping",
                "description": "All investigation communications must be archived for at least 7 years",
                "reference": "Banking Record-Keeping Standards"
            }
        ]
        
        if workcase_type in ["CANCELLATION", "RETURN_FUNDS"]:
            regulations.append({
                "name": "Return Timeframes",
                "description": "Funds return requests must be processed within 10 business days",
                "reference": "SWIFT Return Guidelines"
            })
            
        if workcase_type == "REGULATORY_COMPLIANCE":
            regulations.append({
                "name": "Suspicious Activity Reporting",
                "description": "Potential suspicious activity must be reported to authorities within 30 days",
                "reference": "AML Compliance Standards"
            })
            
        return regulations
    
    def _get_default_sla(self, workcase_type: str) -> Dict[str, int]:
        """Generate default SLA timeline based on workcase type"""
        # Base SLA times in hours
        sla = {
            "acknowledgment": 24,  # 24 hours to acknowledge
            "initial_research": 48,  # 48 hours for initial research
            "correspondence": 72,  # 72 hours to send first correspondence
            "follow_up": 120,  # 120 hours before follow-up
            "resolution": 240,  # 240 hours (10 days) to resolve
        }
        
        # Adjust based on workcase type
        if workcase_type == "CANCELLATION":
            # Cancellations are more urgent
            sla["acknowledgment"] = 4
            sla["initial_research"] = 8
            sla["correspondence"] = 12
            sla["resolution"] = 72
            
        elif workcase_type == "REGULATORY_COMPLIANCE":
            # Compliance issues may take longer
            sla["initial_research"] = 72
            sla["resolution"] = 480  # 20 days
            
        return sla
    
    def _get_default_response_template(self, workcase_type: str, fields: Dict[str, Any]) -> str:
        """Generate a default response template based on workcase type and fields"""
        templates = {
            "NON_RECEIPT": """
Subject: Investigation - Non-Receipt of Funds - Ref: {reference}

Dear {recipient},

We are investigating a case of non-receipt of funds reported by the beneficiary.

Transaction details:
- Reference: {reference}
- Amount: {amount} {currency}
- Date: {date}
- Beneficiary: {beneficiary}

Please provide information on the status of this payment.

Thank you,
Investigation Team
            """,
            
            "CANCELLATION": """
Subject: Urgent Cancellation Request - Ref: {reference}

Dear {recipient},

We request the cancellation of the following payment:

Transaction details:
- Reference: {reference}
- Amount: {amount} {currency}
- Date: {date}

Reason for cancellation: {reason}

Please confirm.
            """,
            
            "UNKNOWN": """
Subject: Investigation Request - Ref: {reference}

Dear {recipient},

We are investigating the following transaction:

Transaction details:
- Reference: {reference}

We will provide additional information shortly.

Thank you,
Investigation Team
            """
        }
        
        template = templates.get(workcase_type, templates["UNKNOWN"])
        
        # Fill in the template with available fields
        try:
            # Create a dictionary with default values for all potential placeholders
            safe_values = {
                "reference": fields.get("reference", "Unknown"),
                "recipient": fields.get("recipient", "Valued Correspondent"),
                "amount": fields.get("amount", "Unknown"),
                "currency": fields.get("currency", "USD"),
                "date": fields.get("date", datetime.now().strftime("%Y-%m-%d")),
                "beneficiary": fields.get("beneficiary", "Unknown"),
                "reason": "Customer request"
            }
            
            # Add any additional extracted fields
            for key, value in fields.items():
                if key not in safe_values:
                    safe_values[key] = value
            
            # Format the template with safe values
            return template.format(**safe_values)
        except Exception:
            # If formatting fails, return the template as is
            return template

    def save_message_to_db(self, db, result: Dict[str, Any], original_content: str, is_bulk: bool = False) -> Message:
        """Save the processed message and its attributes to the database"""
        # Create the message record
        message = Message(
            message_id=result.get("message_id", f"MT-{int(time.time())}"),
            message_type="MT",
            content=original_content,
            converted_content=result.get("mx_message"),
            processed_at=datetime.utcnow(),
            processing_time=result.get("processing_time", 0.0),
            is_bulk=is_bulk
        )
        
        db.add(message)
        db.flush()  # Flush to get the message ID
        
        # Create attribute records
        attributes = result.get("attributes", {})
        for key, value in attributes.items():
            attr = MessageAttribute(
                message_id=message.id,
                key=key,
                value=str(value)
            )
            db.add(attr)
        
        db.commit()
        db.refresh(message)
        
        return message