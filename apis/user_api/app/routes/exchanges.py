from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from shared.database import SessionLocal
from shared.schemas.message import MessageCreate
from shared.schemas.response import ResponseCreate
from shared.schemas.intent import IntentCreate
from shared.schemas.feedback import FeedbackCreate
from shared.services.exchange_service import ExchangeService
from shared.schemas.exchange_summary import ExchangeSummaryCreate
from typing import Optional

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/api/exchanges")
def create_exchange(
    data: ExchangeSummaryCreate,
    db: Session = Depends(get_db)
):
    return ExchangeService(db).create_exchange(
        message_data=data.message_data,
        response_data=data.response_data,
        intent_data=data.intent_data,
        feedback_data=data.feedback_data,
    )
