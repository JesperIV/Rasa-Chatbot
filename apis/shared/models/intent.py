from sqlalchemy import Column, String, Float, ForeignKey
from shared.database import Base

class Intent(Base):
    __tablename__ = 'intent'

    message_id = Column(String, ForeignKey('message.message_id'), primary_key=True, index=True)
    intent = Column(String)
    confidence = Column(Float)
