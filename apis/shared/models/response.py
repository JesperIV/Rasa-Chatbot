from sqlalchemy import Column, String, JSON, ForeignKey
from shared.database import Base

class Response(Base):
    __tablename__ = 'response'

    message_id = Column(String, ForeignKey('message.message_id'), primary_key=True, index=True)
    bot_output = Column(JSON)
