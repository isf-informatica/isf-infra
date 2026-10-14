from sqlalchemy import Column, Integer, String, DateTime, SmallInteger, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    institution_type = Column(String(20), default="school")  # school / college / institute
    contact_name = Column(String(100))
    contact_email = Column(String(100))
    erp_domain = Column(String(100))
    storage_domain = Column(String(100))
    public_ip = Column(String(20))
    lan_ip = Column(String(20))
    storage_path = Column(String(200))
    nginx_port = Column(Integer, default=9006)
    https_port = Column(Integer, default=9000)
    ssl_thumbprint = Column(String(100))
    sync_interval_min = Column(Integer, default=15)
    agent_token = Column(String(64), unique=True)
    status = Column(String(20), default="pending")
    kill_level = Column(Integer, default=0)
    contract_end_date = Column(Date, nullable=True)
    db_name = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    commands = relationship("Command", back_populates="school")
    status_info = relationship("SchoolStatus", back_populates="school", uselist=False)
    logs = relationship("SchoolLog", back_populates="school")
    devices = relationship("Device", back_populates="school")