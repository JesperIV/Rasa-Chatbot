from pydantic import BaseModel
from typing import List

class ResponseCreate(BaseModel):
    message_id: str
    bot_output: List[str]
