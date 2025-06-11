from pydantic import BaseModel
from typing import Optional

class IntentCreate(BaseModel):
    message_id: str
    intent: Optional[str]
    confidence: Optional[float]
