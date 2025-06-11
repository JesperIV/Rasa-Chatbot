from sqlalchemy import Column, String, Boolean, ForeignKey
from shared.database import Base

class Feedback(Base):
    __tablename__ = 'feedback'

    message_id = Column(String, ForeignKey('message.message_id'), primary_key=True, index=True)
    feedback = Column(Boolean)
