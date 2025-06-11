from sqlalchemy import Column, String, Text, TIMESTAMP
from shared.database import Base

class Message(Base):
    __tablename__ = 'message'

    message_id = Column(String, primary_key=True, index=True)
    sender_id = Column(String, nullable=False)
    user_input = Column(Text)
    timestamp = Column(TIMESTAMP)
