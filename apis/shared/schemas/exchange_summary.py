from pydantic import BaseModel
from typing import Optional
from shared.schemas.message import MessageCreate
from shared.schemas.response import ResponseCreate
from shared.schemas.intent import IntentCreate
from shared.schemas.feedback import FeedbackCreate

#   a group of the models so all data can be sent in one request
class ExchangeSummaryCreate(BaseModel):
    message_data: MessageCreate
    response_data: ResponseCreate
    intent_data: IntentCreate
    feedback_data: Optional[FeedbackCreate] = None
