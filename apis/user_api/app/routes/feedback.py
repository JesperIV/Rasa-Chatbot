from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from shared.database import SessionLocal
from shared.schemas.feedback import FeedbackCreate
from shared.services.exchange_service import ExchangeService

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/api/exchanges/feedback")
def send_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    updated = ExchangeService(db).update_feedback(message_id=data.message_id, feedback_value=data.feedback)
    if not updated:
        raise HTTPException(status_code=404, detail="Feedback not updated")
    return {"status": "feedback updated"}
