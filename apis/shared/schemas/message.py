from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageCreate(BaseModel):
    message_id: str
    sender_id: str
    user_input: Optional[str]
    timestamp: Optional[datetime]
