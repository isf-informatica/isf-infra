from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Command(Base):
    __tablename__ = "commands_queue"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    command_type = Column(String(50), nullable=False)
    payload_json = Column(JSON, nullable=True)
    status = Column(String(20), default="pending")
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    executed_at = Column(DateTime, nullable=True)
    result_json = Column(JSON, nullable=True)

    school = relationship("School", back_populates="commands")