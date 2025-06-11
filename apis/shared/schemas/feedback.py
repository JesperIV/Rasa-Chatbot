from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    message_id: str
    feedback: Optional[bool]
