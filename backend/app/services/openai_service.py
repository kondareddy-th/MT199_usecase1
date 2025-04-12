import os
from typing import Dict, Any, Optional
import json
from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from app.models.database import UserSetting

class OpenAIService:
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize OpenAI client with API key from environment or database"""
        api_key = os.environ.get("OPENAI_API_KEY")
        model = "gpt-4o mini"
        
        # If db is available, try to get settings from database
        if self.db:
            settings = self.db.query(UserSetting).first()
            if settings and settings.api_key:
                api_key = settings.api_key
            if settings and settings.model:
                model = settings.model
        
        # Initialize client if API key is available
        if api_key:
            self.client = AsyncOpenAI(api_key=api_key)
            self.model = model
        else:
            self.client = None
            self.model = model
    
    async def call_openai(self, prompt: str) -> str:
        """Call OpenAI API with the given prompt"""
        # Re-initialize client if needed
        if not self.client:
            self._initialize_client()
        
        if not self.client:
            raise ValueError("OpenAI API key not set. Please configure it in settings.")
        
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a financial message parsing assistant. Your task is to accurately convert MT messages to MX(ISO 20022) format or extract useful attributes from MT messages. Always return well-structured JSON responses when requested."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.55,
                max_tokens=1500
            )
            
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Error calling OpenAI API: {str(e)}")
    
    async def get_feeling_lucky(self, mt_message: str) -> Dict[str, Any]:
        """Get a 'feeling lucky' insight about the MT message"""
        prompt = f"""
        Analyze this SWIFT MT message and provide one surprising or interesting insight that most people would miss.
        Be creative but accurate. Return JSON with 'insight', 'explanation', and 'confidence' keys.

        MT message:
        {mt_message}
        """
        
        response = await self.call_openai(prompt)
        
        # Parse response
        try:
            result = json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from text
            import re
            json_match = re.search(r'(\{.*\})', response, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    result = {
                        "insight": "Could not generate a clear insight",
                        "explanation": response
                    }
            else:
                result = {
                    "insight": "Could not generate a clear insight",
                    "explanation": response
                }
        
        return result