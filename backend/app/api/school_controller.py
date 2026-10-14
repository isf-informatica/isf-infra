from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import date
import secrets
from app.core.database import get_db
from app.models.school_model import School
from app.models.status_model import SchoolStatus as SchoolStatusModel
from app.models.log_model import SchoolLog
from app.api.auth_controller import get_current_user
from app.models.user_model import User

router = APIRouter()

class SchoolCreate(BaseModel):
    name: str
    code: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    erp_domain: Optional[str] = None
    storage_domain: Optional[str] = None
    public_ip: Optional[str] = None
    lan_ip: Optional[str] = None
    storage_path: Optional[str] = "D:\\MediaStorage"
    nginx_port: Optional[int] = 9006
    https_port: Optional[int] = 9000
    ssl_thumbprint: Optional[str] = None
    sync_interval_min: Optional[int] = 15
    db_name: Optional[str] = None
    contract_end_date: Optional[date] = None

class SchoolUpdate(SchoolCreate):
    pass

@router.get("/")
def get_all_schools(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    schools = db.query(School).all()
    result = []
    for school in schools:
        status = db.query(SchoolStatusModel).filter(SchoolStatusModel.school_id == school.id).first()
        result.append({
            "id": school.id,
            "name": school.name,
            "code": school.code,
            "public_ip": school.public_ip,
            "storage_domain": school.storage_domain,
            "status": school.status,
            "kill_level": school.kill_level,
            "agent_online": status.agent_online if status else 0,
            "nginx_running": status.nginx_running if status else 0,
            "storage_used_gb": status.storage_used_gb if status else 0,
            "file_count": status.file_count if status else 0,
            "last_sync_at": status.last_sync_at if status else None,
            "last_seen_at": status.last_seen_at if status else None,
        })
    return result

@router.post("/")
def create_school(school_data: SchoolCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(School).filter(School.code == school_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="School code already exists")
    
    agent_token = secrets.token_hex(32)
    school = School(**school_data.dict(), agent_token=agent_token)
    db.add(school)
    db.commit()
    db.refresh(school)

    status = SchoolStatusModel(school_id=school.id)
    db.add(status)

    log = SchoolLog(school_id=school.id, log_type="info", message=f"School {school.name} created")
    db.add(log)
    db.commit()

    return {"message": "School created", "id": school.id, "agent_token": agent_token}

@router.get("/{school_id}")
def get_school(school_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school

@router.put("/{school_id}")
def update_school(school_id: int, school_data: SchoolUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    for key, value in school_data.dict(exclude_unset=True).items():
        setattr(school, key, value)
    db.commit()
    db.refresh(school)
    return {"message": "School updated", "id": school.id}

@router.delete("/{school_id}")
def delete_school(school_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    db.delete(school)
    db.commit()
    return {"message": "School deleted"}

@router.get("/{school_id}/logs")
def get_school_logs(school_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(SchoolLog).filter(SchoolLog.school_id == school_id).order_by(SchoolLog.created_at.desc()).limit(50).all()
    return logs