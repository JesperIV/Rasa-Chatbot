from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from shared.schemas.message import MessageCreate
from shared.schemas.response import ResponseCreate
from shared.schemas.intent import IntentCreate
from shared.schemas.feedback import FeedbackCreate
from shared.services.exchange_service import ExchangeService
from shared.database import SessionLocal

router = APIRouter(prefix="/admin", tags=["admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/exchanges")
def get_exchanges(          #   to get all exchanges (READ)
    intent: str = Query(None),
    confidence_flag: str = Query(None),
    feedback: str = Query(None),
    sender_id: str = Query(None),
    sort_by: str = Query("timestamp"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    return ExchangeService(db).get_filtered_exchanges(
        intent=intent,
        confidence_flag=confidence_flag,
        feedback=feedback,
        sender_id=sender_id,
        sort_by=sort_by,
        sort_order=sort_order
    )

@router.post("/exchanges")
def create_full_exchange(   #   to create a full exchange (CREATE)
    message_data: MessageCreate,
    response_data: ResponseCreate,
    intent_data: IntentCreate,
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db)
):
    return ExchangeService(db).create_exchange(
        message_data=message_data,
        response_data=response_data,
        intent_data=intent_data,
        feedback_data=feedback_data
    )

@router.post("/exchanges/{message_id}/feedback")
def update_feedback(message_id: str, feedback_data: FeedbackCreate, db: Session = Depends(get_db)):     #   to update feedback (UPDATE)
    updated = ExchangeService(db).update_feedback(message_id=message_id, feedback_value=feedback_data.feedback)
    if not updated:
        raise HTTPException(status_code=404, detail="Exchange not found")
    return {"status": "feedback updated"}

@router.put("/exchanges/{message_id}")
def update_full_exchange(   #   to update a full exchange (UPDATE)
    message_id: str,
    message_data: MessageCreate,
    response_data: ResponseCreate,
    intent_data: IntentCreate,
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db)
):
    updated = ExchangeService(db).update_exchange(
        message_id=message_id,
        message_data=message_data,
        response_data=response_data,
        intent_data=intent_data,
        feedback_data=feedback_data
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Exchange not found")
    return {"status": "exchange updated"}

@router.delete("/exchanges/{message_id}")
def delete_exchange(message_id: str, db: Session = Depends(get_db)):    #   to delete an exchange (DELETE)
    deleted = ExchangeService(db).delete_exchange(message_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Exchange not found")
    return {"status": "exchange deleted"}