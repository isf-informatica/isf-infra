from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class SchoolStatus(Base):
    __tablename__ = "school_status"

    school_id = Column(Integer, ForeignKey("schools.id"), primary_key=True)
    agent_online = Column(Integer, default=0)
    nginx_running = Column(Integer, default=0)
    last_sync_at = Column(DateTime, nullable=True)
    last_backup_at = Column(DateTime, nullable=True)
    storage_used_gb = Column(Float, default=0.0)
    file_count = Column(Integer, default=0)
    last_seen_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    school = relationship("School", back_populates="status_info")