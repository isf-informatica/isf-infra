from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import secrets
from app.core.database import get_db
from app.models.school_model import School
from app.models.status_model import SchoolStatus
from app.models.log_model import SchoolLog

router = APIRouter()

class AgentRegister(BaseModel):
    name: str
    code: str
    institution_type: Optional[str] = "school"
    public_ip: str
    lan_ip: Optional[str] = None
    storage_domain: Optional[str] = None
    storage_path: Optional[str] = "D:\\MediaStorage"
    nginx_port: Optional[int] = 9006
    https_port: Optional[int] = 9000
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    db_name: Optional[str] = None

@router.post("/register")
def agent_self_register(data: AgentRegister, db: Session = Depends(get_db)):
    existing = db.query(School).filter(School.code == data.code).first()
    if existing:
        return {
            "message": "Already registered",
            "id": existing.id,
            "token": existing.agent_token,
            "status": existing.status
        }

    agent_token = secrets.token_hex(32)
    institution = School(
        name=data.name,
        code=data.code,
        institution_type=data.institution_type,
        public_ip=data.public_ip,
        lan_ip=data.lan_ip,
        storage_domain=data.storage_domain,
        storage_path=data.storage_path,
        nginx_port=data.nginx_port,
        https_port=data.https_port,
        contact_name=data.contact_name,
        contact_email=data.contact_email,
        db_name=data.db_name,
        agent_token=agent_token,
        status="pending"
    )
    db.add(institution)
    db.commit()
    db.refresh(institution)

    status = SchoolStatus(school_id=institution.id)
    db.add(status)

    log = SchoolLog(
        school_id=institution.id,
        log_type="info",
        message=f"{data.institution_type.capitalize()} '{institution.name}' self-registered via agent"
    )
    db.add(log)
    db.commit()

    return {
        "message": "Registered — awaiting ISF approval",
        "id": institution.id,
        "token": agent_token,
        "status": "pending"
    }