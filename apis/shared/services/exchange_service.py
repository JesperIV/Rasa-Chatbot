from sqlalchemy.orm import Session
from shared.models.message import Message
from shared.models.response import Response
from shared.models.intent import Intent
from shared.models.feedback import Feedback
from shared.schemas.message import MessageCreate
from shared.schemas.response import ResponseCreate
from shared.schemas.intent import IntentCreate
from shared.schemas.feedback import FeedbackCreate
from typing import List, Optional

class ExchangeService:
    def __init__(self, db: Session):
        self.db = db

    def create_exchange(self, message_data, response_data, intent_data, feedback_data=None):
        message = Message(**message_data.dict())
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)

        response = Response(**response_data.dict())
        self.db.add(response)

        intent = Intent(**intent_data.dict())
        self.db.add(intent)

        if feedback_data is not None:
            feedback = Feedback(**feedback_data.dict())
            self.db.add(feedback)

        self.db.commit()

        return {"message": "Exchange successfully stored."}
    
    def get_all_exchanges(self):
        messages = self.db.query(Message).all()
        exchanges = []

        for msg in messages:
            response = self.db.query(Response).filter_by(message_id=msg.message_id).first()
            intent = self.db.query(Intent).filter_by(message_id=msg.message_id).first()
            feedback = self.db.query(Feedback).filter_by(message_id=msg.message_id).first()

            exchange = {
                "sender_id": msg.sender_id,
                "message_id": msg.message_id,
                "user_input": msg.user_input,
                "timestamp": msg.timestamp,
                "bot_output": response.bot_output if response else None,
                "intent": intent.intent if intent else None,
                "confidence": intent.confidence if intent else None,
                "feedback": feedback.feedback if feedback else None
            }
            exchanges.append(exchange)

        return exchanges

    def update_feedback(self, message_id: str, feedback_value: bool):
        feedback = self.db.query(Feedback).filter_by(message_id=message_id).first()

        if feedback:
            feedback.feedback = feedback_value
        else:
            new_feedback = Feedback(message_id=message_id, feedback=feedback_value)
            self.db.add(new_feedback)

        self.db.commit()
        return True

    def update_exchange(
        self,
        message_id: str,
        message_data: Optional[MessageCreate] = None,
        response_data: Optional[ResponseCreate] = None,
        intent_data: Optional[IntentCreate] = None,
        feedback_data: Optional[FeedbackCreate] = None
    ):
        message = self.db.query(Message).filter_by(message_id=message_id).first()
        if message and message_data:
            for key, value in message_data.dict(exclude_unset=True).items():
                setattr(message, key, value)

        response = self.db.query(Response).filter_by(message_id=message_id).first()
        if response and response_data:
            for key, value in response_data.dict(exclude_unset=True).items():
                setattr(response, key, value)
        elif response_data:
            new_response = Response(**response_data.dict())
            self.db.add(new_response)

        intent = self.db.query(Intent).filter_by(message_id=message_id).first()
        if intent and intent_data:
            for key, value in intent_data.dict(exclude_unset=True).items():
                setattr(intent, key, value)
        elif intent_data:
            new_intent = Intent(**intent_data.dict())
            self.db.add(new_intent)

        feedback = self.db.query(Feedback).filter_by(message_id=message_id).first()
        if feedback and feedback_data:
            for key, value in feedback_data.dict(exclude_unset=True).items():
                setattr(feedback, key, value)
        elif feedback_data:
            new_feedback = Feedback(**feedback_data.dict())
            self.db.add(new_feedback)

        self.db.commit()

        return True
    
    def delete_exchange(self, message_id: str):
        self.db.query(Feedback).filter(Feedback.message_id == message_id).delete()
        self.db.query(Intent).filter(Intent.message_id == message_id).delete()
        self.db.query(Response).filter(Response.message_id == message_id).delete()

        deleted = self.db.query(Message).filter(Message.message_id == message_id).delete()

        self.db.commit()

        return deleted > 0  #   return true if something was deleted
    
    def get_filtered_exchanges(
        self,
        intent: Optional[str] = None,
        confidence_flag: Optional[str] = None,
        feedback: Optional[str] = None,
        sender_id: Optional[str] = None,
        sort_by: str = "timestamp",
        sort_order: str = "desc"
    ):
        query = self.db.query(Message)

        if sender_id:
            query = query.filter(Message.sender_id == sender_id)

        #   sorting
        sort_column = getattr(Message, sort_by, None)
        if sort_column is None:
            sort_column = Message.timestamp  # fallback
        if sort_order.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        messages = query.all()
        exchanges = []

        for msg in messages:
            response = self.db.query(Response).filter_by(message_id=msg.message_id).first()
            intent_obj = self.db.query(Intent).filter_by(message_id=msg.message_id).first()
            feedback_obj = self.db.query(Feedback).filter_by(message_id=msg.message_id).first()

            #   apply intent filter
            if intent and (not intent_obj or intent_obj.intent != intent):
                continue

            #   apply confidence flag filter
            if confidence_flag and intent_obj:
                conf = intent_obj.confidence
                if confidence_flag == "low" and conf >= 0.5:
                    continue
                elif confidence_flag == "medium" and (conf < 0.5 or conf >= 0.8):
                    continue
                elif confidence_flag == "high" and conf < 0.8:
                    continue

            #   apply feedback filter
            if feedback:
                if feedback == "Positive" and (not feedback_obj or feedback_obj.feedback is not True):
                    continue
                if feedback == "Negative" and (not feedback_obj or feedback_obj.feedback is not False):
                    continue

            exchange = {
                "sender_id": msg.sender_id,
                "message_id": msg.message_id,
                "user_input": msg.user_input,
                "timestamp": msg.timestamp,
                "bot_output": response.bot_output if response else None,
                "intent": intent_obj.intent if intent_obj else None,
                "confidence": intent_obj.confidence if intent_obj else None,
                "feedback": feedback_obj.feedback if feedback_obj else None
            }
            exchanges.append(exchange)

        return exchanges
