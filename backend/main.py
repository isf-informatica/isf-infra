"""
easyreach/main.py
-----------------
EasyReach — On-Premise Media Server Management
ISF Analytica & Informatica Pvt. Ltd.
"""

import os
import io
import re
import json
import secrets
import zipfile
import urllib.request
import bcrypt
from datetime import datetime, timedelta, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Date, Text, ForeignKey, or_
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship, aliased
from sqlalchemy.sql import func
from jose import JWTError, jwt
from pydantic import BaseModel

router = APIRouter(redirect_slashes=False)

# ═══════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════
DATABASE_URL = os.environ.get(
    "EASYREACH_DATABASE_URL",
    "mysql+pymysql://root:@localhost/isf_easyreach"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    pool_size=5,
    max_overflow=2,
    connect_args={"connect_timeout": 10}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ═══════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════
class School(Base):
    __tablename__ = "schools"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    institution_type = Column(String(20), default="school")
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
    status_info = relationship("SchoolStatus", back_populates="school", uselist=False)
    logs = relationship("SchoolLog", back_populates="school")
    commands = relationship("Command", back_populates="school")
    devices = relationship("Device", back_populates="school")

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

class SchoolLog(Base):
    __tablename__ = "school_logs"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    log_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    school = relationship("School", back_populates="logs")

class Command(Base):
    __tablename__ = "commands_queue"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    device_id = Column(Integer, nullable=True)
    command_type = Column(String(50), nullable=False)
    payload_json = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    executed_at = Column(DateTime, nullable=True)
    result_json = Column(Text, nullable=True)
    school = relationship("School", back_populates="commands")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="school_admin")
    school_id = Column(Integer, nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    name = Column(String(100), nullable=False)
    device_type = Column(String(20), default="system")
    ip_address = Column(String(20))
    mac_address = Column(String(20))
    os = Column(String(100))
    status = Column(String(20), default="offline")
    last_seen = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    agent_token = Column(String(64), nullable=True)
    agent_online = Column(Integer, default=0)
    last_seen_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    school = relationship("School", back_populates="devices")

class SdDepartment(Base):
    __tablename__ = "sd_departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    is_active = Column(Integer, default=1)

class SdTicket(Base):
    __tablename__ = "sd_tickets"
    id = Column(Integer, primary_key=True, index=True)
    token_no = Column(String(30), unique=True, nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(10), default="Medium")
    status = Column(String(20), default="open")
    target_department_id = Column(Integer, ForeignKey("sd_departments.id"), nullable=False)
    raised_by = Column(Integer, nullable=False, index=True)
    raised_by_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    assigned_to = Column(Integer, nullable=True, index=True)
    assigned_by = Column(Integer, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completion_remarks = Column(Text, nullable=True)
    verified_by = Column(Integer, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verification_remarks = Column(Text, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class SdAttachment(Base):
    __tablename__ = "sd_attachments"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("sd_tickets.id"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_stage = Column(String(20), default="raised")
    created_at = Column(DateTime, server_default=func.now())

class SdDepartmentMember(Base):
    """Staff (role=service_desk) who belong to a department and receive assigned tokens."""
    __tablename__ = "sd_department_members"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("sd_departments.id"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, unique=True)
    created_at = Column(DateTime, server_default=func.now())

class SdTicketLog(Base):
    __tablename__ = "sd_ticket_logs"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("sd_tickets.id"), nullable=False, index=True)
    action = Column(String(20), nullable=False)
    action_by = Column(Integer, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class License(Base):
    __tablename__ = "licenses"
    id = Column(Integer, primary_key=True, index=True)
    license_key = Column(String(64), unique=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    organization_type = Column(String(30), nullable=False, default="School")
    max_students = Column(Integer, default=1000)
    max_mentors = Column(Integer, default=100)
    max_classrooms = Column(Integer, default=50)
    subscription_type = Column(String(20), default="yearly")  # monthly/quarterly/yearly/lifetime
    subscription_start_date = Column(Date, nullable=False)
    subscription_end_date = Column(Date, nullable=False)
    expires_at = Column(DateTime, nullable=True)       # exact expiry (demo license ke liye)
    activated_at = Column(DateTime, nullable=True)     # product se pehla verify/login
    product_url = Column(String(255), nullable=True)   # e.g. http://localhost/easylearnv3.org.in
    grace_period_days = Column(Integer, default=7)
    status = Column(String(20), default="active")  # active/expired/suspended/revoked
    notes = Column(Text, nullable=True)
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    school = relationship("School")


class LicenseUsageLog(Base):
    __tablename__ = "license_usage_logs"
    id = Column(Integer, primary_key=True, index=True)
    license_id = Column(Integer, ForeignKey("licenses.id"), nullable=False)
    action_type = Column(String(30), nullable=False)  # activation/renewal/suspension/assignment/violation
    description = Column(Text, nullable=True)
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())


class LicenseViolation(Base):
    __tablename__ = "license_violations"
    id = Column(Integer, primary_key=True, index=True)
    license_id = Column(Integer, ForeignKey("licenses.id"), nullable=False)
    violation_type = Column(String(30), nullable=False)  # multiple_device/account_sharing/expired_license/exceeded_limit/tampering
    severity = Column(String(10), default="medium")  # low/medium/high/critical
    description = Column(Text, nullable=True)
    is_resolved = Column(Integer, default=0)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class LicenseCheckpoint(Base):
    __tablename__ = "license_checkpoints"
    id = Column(Integer, primary_key=True, index=True)
    license_id = Column(Integer, ForeignKey("licenses.id"), nullable=False, index=True)
    students = Column(Integer, default=0)
    teachers = Column(Integer, default=0)
    error = Column(Text, nullable=True)
    checked_at = Column(DateTime, server_default=func.now())

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    import logging
    logging.getLogger(__name__).error(f"EasyReach DB init failed: {e}")

SD_DEFAULT_DEPARTMENTS = ["Technical Support", "Server & Infrastructure", "Accounts / Finance", "Admin", "HR"]

def _sd_seed_departments():
    db = SessionLocal()
    try:
        if db.query(SdDepartment).count() == 0:
            for n in SD_DEFAULT_DEPARTMENTS:
                db.add(SdDepartment(name=n))
            db.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Service desk seed failed: {e}")
    finally:
        db.close()

_sd_seed_departments()

# ═══════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════
SECRET_KEY = os.environ.get("EASYREACH_SECRET_KEY", "easyreach-secret-key-2026-isf")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/easyreach/auth/login")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

# ═══════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "school_admin"
    school_id: Optional[int] = None

class SchoolCreate(BaseModel):
    name: str
    code: str
    institution_type: Optional[str] = "school"
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

class AgentPing(BaseModel):
    school_id: int
    token: str
    nginx_running: int = 0
    storage_used_gb: float = 0.0
    file_count: int = 0
    last_sync_at: Optional[datetime] = None

class DeviceAgentPing(BaseModel):
    device_id: int
    token: str

class KillRequest(BaseModel):
    reason: Optional[str] = None
    confirmation_code: Optional[str] = None

class SetupForm(BaseModel):
    name: str
    code: str
    institution_type: str = "school"
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    erp_domain: Optional[str] = None
    db_name: Optional[str] = None
    public_ip: str
    lan_ip: str
    storage_domain: str
    storage_path: str = "D:\\MediaStorage"
    nginx_port: int = 9006
    https_port: int = 9000
    ssl_thumbprint: str
    sync_interval_min: int = 15
    aws_folders: List[str] = ["easylearn-ncert", "NCERT Course video", "SAAR"]
    aws_access_key: str
    aws_secret_key: str
    aws_bucket: str = "easylearn1"
    aws_region: str = "eu-north-1"
    ftp_host: str = "184.168.118.87"
    ftp_user: Optional[str] = None
    ftp_pass: Optional[str] = None
    easyreach_api: str = "https://easyreach.easylearn.org.in/easyreach"

class DeviceCreate(BaseModel):
    name: str
    device_type: str = "system"
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    os: Optional[str] = None
    notes: Optional[str] = None

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

class CommandCreate(BaseModel):
    command_type: str
    payload: Optional[dict] = None
    device_id: Optional[int] = None

class LicenseCreate(BaseModel):
    organization_type: str = "School"
    organization_id: Optional[int] = None
    max_students: int = 1000
    max_mentors: Optional[int] = 100
    max_classrooms: Optional[int] = 50
    subscription_type: str = "yearly"
    subscription_months: int = 12
    start_date: date
    grace_period_days: Optional[int] = 7
    notes: Optional[str] = None
    demo_minutes: Optional[int] = None      # e.g. 10 => license 10 minute baad expire
    product_url: Optional[str] = None


class LicenseUpdate(BaseModel):
    status: Optional[str] = None
    max_students: Optional[int] = None
    max_mentors: Optional[int] = None
    max_classrooms: Optional[int] = None
    subscription_end_date: Optional[date] = None
    notes: Optional[str] = None


class LicenseAssignBody(BaseModel):
    school_id: int


class ViolationResolveBody(BaseModel):
    remarks: Optional[str] = None

# ═══════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════
@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == form_data.username).first()
        if not user or not verify_password(form_data.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Invalid email or password")
        token = create_token({"sub": user.email, "role": user.role})
        return {"access_token": token, "token_type": "bearer", "role": user.role, "name": user.name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@router.post("/auth/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        school_id=user_data.school_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "id": user.id}

@router.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email, "role": current_user.role}

# ═══════════════════════════════════════════════
# SCHOOLS
# ═══════════════════════════════════════════════
@router.get("/schools/")
def get_schools(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    schools = db.query(School).all()
    result = []
    for s in schools:
        st = db.query(SchoolStatus).filter(SchoolStatus.school_id == s.id).first()
        result.append({
            "id": s.id, "name": s.name, "code": s.code,
            "institution_type": s.institution_type,
            "public_ip": s.public_ip, "storage_domain": s.storage_domain,
            "https_port": s.https_port,
            "status": s.status, "kill_level": s.kill_level,
            "agent_online": st.agent_online if st else 0,
            "storage_used_gb": st.storage_used_gb if st else 0,
            "file_count": st.file_count if st else 0,
            "last_seen_at": st.last_seen_at if st else None,
        })
    return result

@router.post("/schools/")
def create_school(data: SchoolCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(School).filter(School.code == data.code).first():
        raise HTTPException(status_code=400, detail="School code already exists")
    agent_token = secrets.token_hex(32)
    school = School(**data.dict(), agent_token=agent_token)
    db.add(school)
    db.commit()
    db.refresh(school)
    db.add(SchoolStatus(school_id=school.id))
    db.add(SchoolLog(school_id=school.id, log_type="info", message=f"{school.name} created"))
    db.commit()
    return {"message": "School created", "id": school.id, "agent_token": agent_token}

@router.get("/schools/{school_id}")
def get_school(school_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="Not found")
    return school

@router.get("/schools/{school_id}/logs")
def get_logs(school_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SchoolLog).filter(SchoolLog.school_id == school_id).order_by(SchoolLog.created_at.desc()).limit(50).all()

# ═══════════════════════════════════════════════
# STATUS / PING
# ═══════════════════════════════════════════════
@router.post("/status/ping")
def agent_ping(ping: AgentPing, db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == ping.school_id).first()
    if not school or school.agent_token != ping.token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    st = db.query(SchoolStatus).filter(SchoolStatus.school_id == ping.school_id).first()
    if not st:
        st = SchoolStatus(school_id=ping.school_id)
        db.add(st)
    st.agent_online = 1
    st.nginx_running = ping.nginx_running
    st.storage_used_gb = ping.storage_used_gb
    st.file_count = ping.file_count
    st.last_sync_at = ping.last_sync_at
    st.last_seen_at = datetime.utcnow()
    if school.status == "pending":
        school.status = "active"
    db.commit()
    return {"message": "Ping received"}

@router.get("/status/dashboard")
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    schools = db.query(School).all()
    statuses = db.query(SchoolStatus).all()
    return {
        "total": len(schools),
        "active": sum(1 for s in schools if s.status == "active"),
        "pending": sum(1 for s in schools if s.status == "pending"),
        "killed": sum(1 for s in schools if s.status == "killed"),
        "total_storage_gb": round(sum(s.storage_used_gb for s in statuses), 2),
        "online_agents": sum(1 for s in statuses if s.agent_online == 1),
    }

# ═══════════════════════════════════════════════
# KILL SWITCH
# ═══════════════════════════════════════════════
@router.post("/kill/{school_id}/level/{level}")
def kill_school(school_id: int, level: int, data: KillRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "developer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if level not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Invalid level")
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="Not found")
    if level == 3 and data.confirmation_code != f"CONFIRM WIPE {school.code.upper()}":
        raise HTTPException(status_code=400, detail=f"Type: CONFIRM WIPE {school.code.upper()}")
    cmd = Command(school_id=school_id, command_type=f"KILL_{level}", payload_json=json.dumps({"reason": data.reason}), status="pending", created_by=current_user.email)
    db.add(cmd)
    school.kill_level = level
    school.status = "killed"
    db.add(SchoolLog(school_id=school_id, log_type="kill", message=f"Level {level} kill by {current_user.email}"))
    db.commit()
    return {"message": f"Level {level} kill activated"}

@router.post("/kill/{school_id}/restore/{level}")
def restore_school(school_id: int, level: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="Not found")
    cmd = Command(school_id=school_id, command_type=f"RESTORE_{level}", payload_json="{}", status="pending", created_by=current_user.email)
    db.add(cmd)
    school.kill_level = 0
    school.status = "active"
    db.add(SchoolLog(school_id=school_id, log_type="restore", message=f"Level {level} restore by {current_user.email}"))
    db.commit()
    return {"message": f"Level {level} restore initiated"}

# ═══════════════════════════════════════════════
# CONFIG GENERATOR
# ═══════════════════════════════════════════════
@router.get("/config/generate/{school_id}")
def generate_config(school_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="Not found")
    sp = school.storage_path or "D:\\MediaStorage"
    root = sp.replace("\\", "/")
    nginx_conf = f"""worker_processes 1;
events {{ worker_connections 1024; }}
http {{
    include mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;
    server {{
        listen {school.nginx_port};
        root {root};
        autoindex off;
        location / {{
            limit_except GET HEAD OPTIONS {{ deny all; }}
            add_header Accept-Ranges bytes;
            add_header Cache-Control "public, max-age=3600";
            add_header Access-Control-Allow-Origin "*";
            try_files $uri $uri/ =404;
        }}
    }}
}}"""
    folders = ["easylearn-ncert", "NCERT Course video", "SAAR"]
    sync_lines = ["@echo off", f"echo Sync Started: %date% %time% >> {sp}\\sync_log.txt"]
    for f in folders:
        sync_lines.append(f'D:\\EasyReach\\rclone.exe --config "D:\\EasyReach\\rclone.conf" sync "aws-s3:easylearn1/{f}" "{sp}\\{f}" --log-level INFO --retries 3')
    sync_lines.append(f"echo Sync Complete: %date% %time% >> {sp}\\sync_log.txt")
    readme = f"""EasyReach Setup — {school.name} ({school.code})
Storage: {sp}
Domain: {school.storage_domain}:{school.https_port}
Run: PowerShell -ExecutionPolicy Bypass -File install.ps1
Support: support@easylearn.org.in"""
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("nginx.conf", nginx_conf)
        zf.writestr("sync_aws.bat", "\n".join(sync_lines))
        zf.writestr("README.txt", readme)
    zip_buf.seek(0)
    return StreamingResponse(zip_buf, media_type="application/zip", headers={"Content-Disposition": f"attachment; filename=easyreach_{school.code}_setup.zip"})

# ═══════════════════════════════════════════════
# SETUP — ONE CLICK ZIP
# ═══════════════════════════════════════════════
@router.post("/setup/generate-setup")
def generate_setup(form: SetupForm, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(School).filter(School.code == form.code).first()
    if existing:
        school = existing
        agent_token = school.agent_token
    else:
        agent_token = secrets.token_hex(32)
        school = School(name=form.name, code=form.code, institution_type=form.institution_type, contact_name=form.contact_name, contact_email=form.contact_email, erp_domain=form.erp_domain, storage_domain=form.storage_domain, public_ip=form.public_ip, lan_ip=form.lan_ip, storage_path=form.storage_path, nginx_port=form.nginx_port, https_port=form.https_port, ssl_thumbprint=form.ssl_thumbprint, sync_interval_min=form.sync_interval_min, agent_token=agent_token, db_name=form.db_name, status="pending")
        db.add(school)
        db.commit()
        db.refresh(school)
        db.add(SchoolStatus(school_id=school.id))
        db.add(SchoolLog(school_id=school.id, log_type="info", message=f"Setup ZIP generated for {school.name}"))
        db.commit()

    sp = form.storage_path
    root = sp.replace("\\", "/")
    folders_ps = "\n".join([f'    New-Item -ItemType Directory -Force -Path "{sp}\\{f}"' for f in form.aws_folders])

    install_ps1 = f"""# EasyReach Master Installer — {form.name}
$InstallPath = "D:\\EasyReach"
$StoragePath = "{sp}"
$AgentToken = "{agent_token}"
$SchoolId = {school.id}
$EasyReachAPI = "{form.easyreach_api}"

function Write-Step {{ param($msg) Write-Host "`n[$([DateTime]::Now.ToString('HH:mm:ss'))] $msg" -ForegroundColor Cyan }}
function Write-OK   {{ param($msg) Write-Host "  OK: $msg" -ForegroundColor Green }}

Write-Host "======================================================" -ForegroundColor Blue
Write-Host "  EasyReach Setup — {form.name}" -ForegroundColor White
Write-Host "======================================================" -ForegroundColor Blue

Write-Step "Step 1: Creating folders..."
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
New-Item -ItemType Directory -Force -Path $StoragePath | Out-Null
{folders_ps}
New-Item -ItemType Directory -Force -Path "D:\\nginx\\conf" | Out-Null
New-Item -ItemType Directory -Force -Path "D:\\nginx\\logs" | Out-Null
Write-OK "Folders created"

Write-Step "Step 2: Downloading Nginx..."
if (-not (Test-Path "D:\\nginx\\nginx.exe")) {{
    Invoke-WebRequest -Uri "https://nginx.org/download/nginx-1.26.2.zip" -OutFile "$InstallPath\\nginx.zip"
    Expand-Archive -Path "$InstallPath\\nginx.zip" -DestinationPath "$InstallPath\\nginx_temp" -Force
    Copy-Item "$InstallPath\\nginx_temp\\nginx-1.26.2\\*" "D:\\nginx\\" -Recurse -Force
    Remove-Item "$InstallPath\\nginx.zip","$InstallPath\\nginx_temp" -Recurse -Force
    Write-OK "Nginx downloaded"
}} else {{ Write-OK "Nginx already exists" }}

Write-Step "Step 3: Downloading rclone..."
if (-not (Test-Path "$InstallPath\\rclone.exe")) {{
    Invoke-WebRequest -Uri "https://downloads.rclone.org/rclone-current-windows-amd64.zip" -OutFile "$InstallPath\\rclone.zip"
    Expand-Archive -Path "$InstallPath\\rclone.zip" -DestinationPath "$InstallPath\\rclone_temp" -Force
    $r = Get-ChildItem "$InstallPath\\rclone_temp" -Recurse -Filter "rclone.exe" | Select-Object -First 1
    Copy-Item $r.FullName "$InstallPath\\rclone.exe" -Force
    Remove-Item "$InstallPath\\rclone.zip","$InstallPath\\rclone_temp" -Recurse -Force
    Write-OK "rclone downloaded"
}} else {{ Write-OK "rclone already exists" }}

Write-Step "Step 4: Copying config files..."
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$scriptDir\\nginx.conf" "D:\\nginx\\conf\\nginx.conf" -Force
Copy-Item "$scriptDir\\rclone.conf" "$InstallPath\\rclone.conf" -Force
Copy-Item "$scriptDir\\sync_aws.bat" "$StoragePath\\sync_aws.bat" -Force
Copy-Item "$scriptDir\\backup.bat" "$InstallPath\\backup.bat" -Force
Copy-Item "$scriptDir\\web.config" "C:\\inetpub\\nginx-proxy\\web.config" -Force -ErrorAction SilentlyContinue
Write-OK "Config files copied"

Write-Step "Step 5: Starting Nginx..."
& "D:\\nginx\\nginx.exe" -p "D:\\nginx" -t
& "D:\\nginx\\nginx.exe" -p "D:\\nginx"
Start-Sleep 2
Write-OK "Nginx started"

Write-Step "Step 6: Setting up scheduled tasks..."
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
$a1 = New-ScheduledTaskAction -Execute "D:\\nginx\\nginx.exe" -Argument "-p D:\\nginx"
$t1 = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "EasyReach-Nginx" -Action $a1 -Trigger $t1 -Principal $principal -Force | Out-Null
$a2 = New-ScheduledTaskAction -Execute "$StoragePath\\sync_aws.bat"
$t2 = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes {form.sync_interval_min}) -Once -At (Get-Date)
Register-ScheduledTask -TaskName "EasyReach-Sync" -Action $a2 -Trigger $t2 -Principal $principal -Force | Out-Null
$a3 = New-ScheduledTaskAction -Execute "$InstallPath\\backup.bat"
Register-ScheduledTask -TaskName "EasyReach-Backup-AM" -Action $a3 -Trigger (New-ScheduledTaskTrigger -Daily -At "2:00AM") -Principal $principal -Force | Out-Null
Register-ScheduledTask -TaskName "EasyReach-Backup-PM" -Action $a3 -Trigger (New-ScheduledTaskTrigger -Daily -At "2:00PM") -Principal $principal -Force | Out-Null
Write-OK "Scheduled tasks created"

Write-Step "Step 7: First AWS sync..."
& "$StoragePath\\sync_aws.bat"
Write-OK "First sync complete"

Write-Step "Step 8: Registering with EasyReach..."
$body = @{{ school_id=$SchoolId; token=$AgentToken; nginx_running=1; storage_used_gb=0; file_count=0 }} | ConvertTo-Json
Invoke-RestMethod -Uri "$EasyReachAPI/status/ping" -Method POST -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue
Write-OK "Registered with dashboard"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE! — {form.name}" -ForegroundColor Green
Write-Host "  Test: https://{form.storage_domain}:{form.https_port}/" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Green
Read-Host "Press Enter to exit"
"""

    rclone_conf = f"""[aws-s3]
type = s3
provider = AWS
access_key_id = {form.aws_access_key}
secret_access_key = {form.aws_secret_key}
region = {form.aws_region}

[godaddy-backup]
type = ftp
host = {form.ftp_host}
user = {form.ftp_user or ''}
pass = {form.ftp_pass or ''}"""

    nginx_conf = f"""worker_processes 1;
events {{ worker_connections 1024; }}
http {{
    include mime.types;
    default_type application/octet-stream;
    sendfile on;
    server {{
        listen {form.nginx_port};
        root {root};
        location / {{
            limit_except GET HEAD OPTIONS {{ deny all; }}
            add_header Accept-Ranges bytes;
            add_header Access-Control-Allow-Origin "*";
            try_files $uri $uri/ =404;
        }}
    }}
}}"""

    sync_bat = "@echo off\n" + "\n".join([
        f'D:\\EasyReach\\rclone.exe --config "D:\\EasyReach\\rclone.conf" sync "aws-s3:{form.aws_bucket}/{f}" "{sp}\\{f}" --log-level INFO --retries 3'
        for f in form.aws_folders
    ]) + f"\necho Sync Complete: %date% %time% >> {sp}\\sync_log.txt"

    backup_bat = f"""@echo off
D:\\EasyReach\\rclone.exe --config "D:\\EasyReach\\rclone.conf" copy "{sp}" "godaddy-backup:/" --transfers 3 --retries 10
echo Backup Complete: %date% %time% >> {sp}\\backup_log.txt"""

    web_config = f"""<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <proxy enabled="true" />
    <rewrite>
      <rules>
        <rule name="Nginx" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:{form.nginx_port}/{{R:1}}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>"""

    config_json = json.dumps({"school_id": school.id, "name": form.name, "code": form.code, "agent_token": agent_token, "easyreach_api": form.easyreach_api}, indent=2)

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("install.ps1", install_ps1)
        zf.writestr("nginx.conf", nginx_conf)
        zf.writestr("rclone.conf", rclone_conf)
        zf.writestr("sync_aws.bat", sync_bat)
        zf.writestr("backup.bat", backup_bat)
        zf.writestr("web.config", web_config)
        zf.writestr("config.json", config_json)
    zip_buf.seek(0)
    return StreamingResponse(zip_buf, media_type="application/zip", headers={"Content-Disposition": f"attachment; filename=easyreach_{form.code}_setup.zip", "X-School-Id": str(school.id)})

# ═══════════════════════════════════════════════
# AGENT SELF-REGISTER
# ═══════════════════════════════════════════════
@router.post("/agent/register")
def agent_register(data: AgentRegister, db: Session = Depends(get_db)):
    existing = db.query(School).filter(School.code == data.code).first()
    if existing:
        return {"message": "Already registered", "id": existing.id, "token": existing.agent_token, "status": existing.status}
    agent_token = secrets.token_hex(32)
    school = School(name=data.name, code=data.code, institution_type=data.institution_type, public_ip=data.public_ip, lan_ip=data.lan_ip, storage_domain=data.storage_domain, storage_path=data.storage_path, nginx_port=data.nginx_port, https_port=data.https_port, contact_name=data.contact_name, contact_email=data.contact_email, db_name=data.db_name, agent_token=agent_token, status="pending")
    db.add(school)
    db.commit()
    db.refresh(school)
    db.add(SchoolStatus(school_id=school.id))
    db.add(SchoolLog(school_id=school.id, log_type="info", message=f"{school.name} self-registered via agent"))
    db.commit()
    return {"message": "Registered — awaiting approval", "id": school.id, "token": agent_token}

# ═══════════════════════════════════════════════
# DEVICES
# ═══════════════════════════════════════════════
@router.get("/schools/{school_id}/devices")
def get_devices(school_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    devices = db.query(Device).filter(Device.school_id == school_id).all()
    return {
        "server": [d for d in devices if d.device_type == "server"],
        "systems": [d for d in devices if d.device_type == "system"]
    }

@router.post("/schools/{school_id}/devices")
def add_device(school_id: int, data: DeviceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent_token = secrets.token_hex(32)
    device = Device(school_id=school_id, agent_token=agent_token, **data.dict(), status="offline")
    db.add(device)
    db.commit()
    db.refresh(device)
    return {"message": "Device added", "id": device.id, "agent_token": agent_token}

@router.delete("/schools/{school_id}/devices/{device_id}")
def delete_device(school_id: int, device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(Device).filter(Device.id == device_id, Device.school_id == school_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(device)
    db.commit()
    return {"message": "Device deleted"}

# ═══════════════════════════════════════════════
# DEVICE AGENT — Per-PC agent endpoints
# ═══════════════════════════════════════════════
@router.post("/device-agent/ping")
def device_agent_ping(ping: DeviceAgentPing, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == ping.device_id).first()
    if not device or device.agent_token != ping.token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    device.agent_online = 1
    device.last_seen_at = datetime.utcnow()
    device.status = "online"
    db.commit()
    return {"message": "Ping received"}

@router.get("/device-agent/commands/{device_id}")
def get_device_commands(device_id: int, request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("X-Agent-Token")
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device or device.agent_token != token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    commands = db.query(Command).filter(
        Command.device_id == device_id,
        Command.status == "pending"
    ).all()
    return {"commands": [{"id": c.id, "command_type": c.command_type, "payload_json": c.payload_json} for c in commands]}

@router.post("/device-agent/command-result/{command_id}")
def device_command_result(command_id: int, data: dict, db: Session = Depends(get_db)):
    cmd = db.query(Command).filter(Command.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Not found")
    device = db.query(Device).filter(Device.id == cmd.device_id).first()
    if not device or device.agent_token != data.get("token"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    cmd.status = data.get("status", "done")
    cmd.result_json = json.dumps({"result": data.get("result", "")})
    cmd.executed_at = datetime.utcnow()
    db.commit()
    return {"message": "Result saved"}

@router.get("/schools/{school_id}/devices/{device_id}/generate-agent")
def generate_device_agent(school_id: int, device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(Device).filter(Device.id == device_id, Device.school_id == school_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Not found")

    config_json = json.dumps({
        "device_id": device.id,
        "device_name": device.name,
        "school_id": school_id,
        "agent_token": device.agent_token,
        "easyreach_api": "https://dolphin-app-33jp4.ondigitalocean.app/easyreach"
    }, indent=2)

    agent_py = '''"""
EasyReach PC Agent
Runs on individual PC — pings dashboard + executes remote commands
"""
import os, time, json, subprocess, requests, ctypes
from datetime import datetime, timezone
from pathlib import Path

CONFIG_FILE = Path(__file__).parent / "config.json"

def load_config():
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {}

config = load_config()
DEVICE_ID = config.get("device_id")
AGENT_TOKEN = config.get("agent_token", "")
API_URL = config.get("easyreach_api", "")

def execute_command(cmd_type, payload=None):
    try:
        if cmd_type == "RESTART":
            subprocess.run(["shutdown", "/r", "/t", "5"], check=True)
            return "Restarting in 5 seconds..."
        elif cmd_type == "SHUTDOWN":
            subprocess.run(["shutdown", "/s", "/t", "5"], check=True)
            return "Shutting down in 5 seconds..."
        elif cmd_type == "LOCK":
            ctypes.windll.user32.LockWorkStation()
            return "Workstation locked"
        elif cmd_type == "NETWORK_INFO":
            result = subprocess.run(["ipconfig", "/all"], capture_output=True, text=True, timeout=10)
            return result.stdout[:2000]
        elif cmd_type == "DISK_INFO":
            output = ""
            for drive in ["C:", "D:", "E:"]:
                try:
                    result = subprocess.run(["fsutil", "volume", "diskfree", drive], capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        output += f"\\n{drive}\\n{result.stdout}"
                except: pass
            return output or "No disk info"
        elif cmd_type == "PROCESS_LIST":
            result = subprocess.run(["tasklist"], capture_output=True, text=True, timeout=10)
            return result.stdout[:2000]
        elif cmd_type == "SYSTEM_INFO":
            result = subprocess.run(["systeminfo"], capture_output=True, text=True, timeout=30)
            return result.stdout[:2000]
        elif cmd_type == "RUN_SCRIPT":
            script = payload.get("script", "") if payload else ""
            if script:
                result = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-Command", script], capture_output=True, text=True, timeout=30)
                return result.stdout + result.stderr
            return "No script provided"
        else:
            return f"Unknown command: {cmd_type}"
    except Exception as e:
        return f"Error: {str(e)}"

def check_commands():
    try:
        res = requests.get(f"{API_URL}/device-agent/commands/{DEVICE_ID}",
                          headers={"X-Agent-Token": AGENT_TOKEN}, timeout=10)
        if res.status_code == 200:
            for cmd in res.json().get("commands", []):
                cmd_id = cmd.get("id")
                cmd_type = cmd.get("command_type")
                payload = json.loads(cmd.get("payload_json") or "{}")
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Executing: {cmd_type}")
                result = execute_command(cmd_type, payload)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Done: {result[:80]}")
                requests.post(f"{API_URL}/device-agent/command-result/{cmd_id}",
                            json={"token": AGENT_TOKEN, "result": result, "status": "done"}, timeout=10)
    except: pass

def ping():
    try:
        res = requests.post(f"{API_URL}/device-agent/ping",
                           json={"device_id": DEVICE_ID, "token": AGENT_TOKEN}, timeout=10)
        if res.status_code == 200:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Ping OK")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Error: {e}")

if __name__ == "__main__":
    print("=" * 40)
    print(f"  EasyReach PC Agent")
    print(f"  Device ID: {DEVICE_ID}")
    print(f"  API: {API_URL}")
    print("=" * 40)
    while True:
        ping()
        check_commands()
        time.sleep(30)
'''

    install_bat = f"""@echo off
echo Installing EasyReach PC Agent...
mkdir C:\\EasyReachAgent 2>nul
copy agent.py C:\\EasyReachAgent\\agent.py
copy config.json C:\\EasyReachAgent\\config.json
pip install requests
schtasks /create /tn "EasyReachPCAgent" /tr "python C:\\EasyReachAgent\\agent.py" /sc onstart /ru SYSTEM /rl HIGHEST /f
schtasks /run /tn "EasyReachPCAgent"
echo.
echo Agent installed and started!
echo Device: {device.name} (ID: {device.id})
pause
"""

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("agent.py", agent_py)
        zf.writestr("config.json", config_json)
        zf.writestr("install.bat", install_bat)
        zf.writestr("README.txt", f"EasyReach PC Agent — {device.name}\n1. Extract this ZIP\n2. Run install.bat as Administrator\n3. Agent will start automatically!")
    zip_buf.seek(0)
    return StreamingResponse(zip_buf, media_type="application/zip",
                           headers={"Content-Disposition": f"attachment; filename=easyreach_agent_{device.name}.zip"})

# ═══════════════════════════════════════════════
# SERVER AGENT ZIP GENERATOR
# ═══════════════════════════════════════════════
@router.get("/schools/{school_id}/generate-server-agent")
def generate_server_agent(school_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="Not found")

    config_json = json.dumps({
        "school_id": school.id,
        "agent_token": school.agent_token,
        "easyreach_api": "https://dolphin-app-33jp4.ondigitalocean.app/easyreach",
        "storage_path": school.storage_path or "D:\\MediaStorage"
    }, indent=2)

    agent_py = '''"""
EasyReach Server Agent
Pings dashboard + executes remote commands
"""
import os, time, json, subprocess, requests, ctypes
from datetime import datetime, timezone
from pathlib import Path

CONFIG_FILE = Path(__file__).parent / "config.json"

def load_config():
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {}

config = load_config()
SCHOOL_ID = config.get("school_id")
AGENT_TOKEN = config.get("agent_token", "")
API_URL = config.get("easyreach_api", "")
STORAGE_PATH = config.get("storage_path", "D:\\\\MediaStorage")

def get_storage_gb():
    try:
        path = Path(STORAGE_PATH)
        if not path.exists():
            return 0.0
        total = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
        return round(total / (1024 ** 3), 2)
    except:
        return 0.0

def get_file_count():
    try:
        path = Path(STORAGE_PATH)
        if not path.exists():
            return 0
        return sum(1 for f in path.rglob("*") if f.is_file())
    except:
        return 0

def is_nginx_running():
    try:
        result = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, timeout=5)
        return ":9006" in result.stdout or ":9000" in result.stdout
    except:
        return False

def execute_command(cmd_type, payload=None):
    try:
        if cmd_type == "RESTART":
            subprocess.run(["shutdown", "/r", "/t", "5"], check=True)
            return "Restarting in 5 seconds..."
        elif cmd_type == "SHUTDOWN":
            subprocess.run(["shutdown", "/s", "/t", "5"], check=True)
            return "Shutting down in 5 seconds..."
        elif cmd_type == "LOCK":
            ctypes.windll.user32.LockWorkStation()
            return "Workstation locked"
        elif cmd_type == "NETWORK_INFO":
            result = subprocess.run(["ipconfig", "/all"], capture_output=True, text=True, timeout=10)
            return result.stdout[:2000]
        elif cmd_type == "DISK_INFO":
            output = ""
            for drive in ["C:", "D:", "E:"]:
                try:
                    result = subprocess.run(["fsutil", "volume", "diskfree", drive], capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        output += f"\\n{drive}\\n{result.stdout}"
                except: pass
            return output or "No disk info"
        elif cmd_type == "PROCESS_LIST":
            result = subprocess.run(["tasklist"], capture_output=True, text=True, timeout=10)
            return result.stdout[:2000]
        elif cmd_type == "SYSTEM_INFO":
            result = subprocess.run(["systeminfo"], capture_output=True, text=True, timeout=30)
            return result.stdout[:2000]
        elif cmd_type == "RUN_SCRIPT":
            script = payload.get("script", "") if payload else ""
            if script:
                result = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-Command", script], capture_output=True, text=True, timeout=30)
                return result.stdout + result.stderr
            return "No script provided"
        elif cmd_type == "NGINX_START":
            subprocess.Popen(["D:\\\\nginx\\\\nginx.exe", "-p", "D:\\\\nginx"])
            return "Nginx start command sent"
        elif cmd_type == "NGINX_STOP":
            result = subprocess.run(["taskkill", "/F", "/IM", "nginx.exe"], capture_output=True, text=True)
            return "Nginx stopped: " + result.stdout
        elif cmd_type == "NGINX_RESTART":
            subprocess.run(["taskkill", "/F", "/IM", "nginx.exe"], capture_output=True)
            time.sleep(2)
            subprocess.Popen(["D:\\\\nginx\\\\nginx.exe", "-p", "D:\\\\nginx"])
            return "Nginx restarted"
        elif cmd_type == "SYNC_NOW":
            result = subprocess.run([f"{STORAGE_PATH}\\\\sync_aws.bat"], capture_output=True, text=True, timeout=300, shell=True)
            return "Sync triggered: " + result.stdout[-500:]
        elif cmd_type.startswith("KILL_") or cmd_type.startswith("RESTORE_"):
            return f"Command {cmd_type} acknowledged"
        else:
            return f"Unknown command: {cmd_type}"
    except Exception as e:
        return f"Error: {str(e)}"

def check_commands():
    try:
        res = requests.get(f"{API_URL}/agent/commands/{SCHOOL_ID}",
                          headers={"X-Agent-Token": AGENT_TOKEN}, timeout=10)
        if res.status_code == 200:
            for cmd in res.json().get("commands", []):
                cmd_id = cmd.get("id")
                cmd_type = cmd.get("command_type")
                payload = json.loads(cmd.get("payload_json") or "{}")
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Executing: {cmd_type}")
                result = execute_command(cmd_type, payload)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Done: {result[:80]}")
                requests.post(f"{API_URL}/agent/command-result/{cmd_id}",
                            json={"token": AGENT_TOKEN, "result": result, "status": "done"}, timeout=10)
    except: pass

def ping():
    try:
        payload = {
            "school_id": SCHOOL_ID,
            "token": AGENT_TOKEN,
            "nginx_running": 1 if is_nginx_running() else 0,
            "storage_used_gb": get_storage_gb(),
            "file_count": get_file_count(),
            "last_sync_at": datetime.now(timezone.utc).isoformat()
        }
        res = requests.post(f"{API_URL}/status/ping", json=payload, timeout=10)
        if res.status_code == 200:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Ping OK | Storage: {payload['storage_used_gb']} GB | Files: {payload['file_count']} | Nginx: {'ON' if payload['nginx_running'] else 'OFF'}")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Error: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print(f"  EasyReach Server Agent")
    print(f"  School ID: {SCHOOL_ID}")
    print(f"  API: {API_URL}")
    print(f"  Storage: {STORAGE_PATH}")
    print("=" * 50)
    while True:
        ping()
        check_commands()
        time.sleep(30)
'''

    install_bat = f"""@echo off
echo Installing EasyReach Server Agent...
mkdir D:\\EasyReach 2>nul
copy agent.py D:\\EasyReach\\agent.py
copy config.json D:\\EasyReach\\config.json
pip install requests
schtasks /create /tn "EasyReachAgent" /tr "python D:\\EasyReach\\agent.py" /sc onstart /ru SYSTEM /rl HIGHEST /f
schtasks /run /tn "EasyReachAgent"
echo.
echo Server Agent installed and started!
echo School: {school.name} (ID: {school.id})
pause
"""

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("agent.py", agent_py)
        zf.writestr("config.json", config_json)
        zf.writestr("install.bat", install_bat)
        zf.writestr("README.txt", f"EasyReach Server Agent — {school.name}\n1. Extract this ZIP\n2. Run install.bat as Administrator\n3. Agent will start automatically!")
    zip_buf.seek(0)
    return StreamingResponse(zip_buf, media_type="application/zip",
                           headers={"Content-Disposition": f"attachment; filename=easyreach_server_agent_{school.code}.zip"})

# ═══════════════════════════════════════════════
# AGENT COMMAND ENDPOINTS (School-level)
# ═══════════════════════════════════════════════
@router.get("/agent/commands/{school_id}")
def get_pending_commands(school_id: int, request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("X-Agent-Token")
    school = db.query(School).filter(School.id == school_id).first()
    if not school or school.agent_token != token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    commands = db.query(Command).filter(
        Command.school_id == school_id,
        Command.device_id == None,
        Command.status == "pending"
    ).all()
    return {"commands": [{"id": c.id, "command_type": c.command_type, "payload_json": c.payload_json} for c in commands]}

@router.post("/agent/command-result/{command_id}")
def update_command_result(command_id: int, data: dict, db: Session = Depends(get_db)):
    cmd = db.query(Command).filter(Command.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Not found")
    school = db.query(School).filter(School.id == cmd.school_id).first()
    if not school or school.agent_token != data.get("token"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    cmd.status = data.get("status", "done")
    cmd.result_json = json.dumps({"result": data.get("result", "")})
    cmd.executed_at = datetime.utcnow()
    db.commit()
    return {"message": "Result saved"}

@router.get("/agent/command-result/{command_id}")
def get_command_result_frontend(command_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cmd = db.query(Command).filter(Command.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": cmd.id,
        "status": cmd.status,
        "result": json.loads(cmd.result_json).get("result", "") if cmd.result_json else None,
        "executed_at": cmd.executed_at
    }

@router.post("/schools/{school_id}/command")
def send_command(school_id: int, data: CommandCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="Not found")
    cmd = Command(
        school_id=school_id,
        device_id=data.device_id,
        command_type=data.command_type,
        payload_json=json.dumps(data.payload or {}),
        status="pending",
        created_by=current_user.email
    )
    db.add(cmd)
    db.add(SchoolLog(school_id=school_id, log_type="command", message=f"Command sent: {data.command_type} by {current_user.email}"))
    db.commit()
    db.refresh(cmd)
    return {"message": "Command queued", "id": cmd.id}

# ═══════════════════════════════════════════════
# SERVICE DESK (requester)
# ═══════════════════════════════════════════════
SD_UPLOAD_DIR = os.environ.get(
    "EASYREACH_UPLOAD_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "service_desk")
)
SD_ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".txt", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".zip"}
SD_MAX_FILE_BYTES = 10 * 1024 * 1024
SD_MAX_FILES = 5
SD_PRIORITIES = ["Low", "Medium", "High", "Urgent"]
SD_RAISE_ROLES = ["requester"]
SD_HEAD_ROLES = ["admin", "master"]        # assign / verify / manage staff (all departments)
SD_VIEW_ALL_ROLES = ["admin", "master"]
SD_STAFF_ROLE = "service_desk"             # works on assigned tokens

def _sd_log(db: Session, ticket_id: int, action: str, user_id: Optional[int], remarks: str = ""):
    db.add(SdTicketLog(ticket_id=ticket_id, action=action, action_by=user_id, remarks=(remarks or "").strip()))

@router.get("/service-desk/departments")
def sd_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(SdDepartment).filter(SdDepartment.is_active == 1).order_by(SdDepartment.id).all()
    return [{"id": r.id, "name": r.name} for r in rows]

@router.post("/service-desk/tickets")
def sd_raise_ticket(
    target_department_id: int = Form(...),
    subject: str = Form(...),
    description: str = Form(""),
    priority: str = Form("Medium"),
    attachments: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in SD_RAISE_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized to raise requests")

    subject = subject.strip()
    if not subject or len(subject) > 200:
        raise HTTPException(status_code=400, detail="Subject is required (max 200 characters)")
    if priority not in SD_PRIORITIES:
        raise HTTPException(status_code=400, detail="Invalid priority")
    dept = db.query(SdDepartment).filter(SdDepartment.id == target_department_id, SdDepartment.is_active == 1).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Invalid department")

    files = [f for f in (attachments or []) if f and f.filename]
    if len(files) > SD_MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Maximum {SD_MAX_FILES} files allowed")

    # validate + read every file before touching the DB / disk
    prepared = []
    for f in files:
        original = os.path.basename(f.filename)
        ext = os.path.splitext(original)[1].lower()
        if ext not in SD_ALLOWED_EXT:
            raise HTTPException(status_code=400, detail=f"File type not allowed: {original}")
        content = f.file.read(SD_MAX_FILE_BYTES + 1)
        if len(content) > SD_MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail=f"{original} is larger than 10 MB")
        prepared.append((original, ext, content))

    ticket = SdTicket(
        token_no="TMP-" + secrets.token_hex(8),
        subject=subject,
        description=description.strip(),
        priority=priority,
        status="open",
        target_department_id=dept.id,
        raised_by=current_user.id,
        raised_by_name=current_user.name,
    )
    written = []
    try:
        db.add(ticket)
        db.flush()
        ticket.token_no = f"SD-{datetime.utcnow():%Y%m%d}-{ticket.id:04d}"
        _sd_log(db, ticket.id, "raised", current_user.id, f"Ticket raised: {subject}")

        if prepared:
            ticket_dir = os.path.join(SD_UPLOAD_DIR, str(ticket.id))
            os.makedirs(ticket_dir, exist_ok=True)
            for original, ext, content in prepared:
                stored = secrets.token_hex(8) + ext
                path = os.path.join(ticket_dir, stored)
                with open(path, "wb") as out:
                    out.write(content)
                written.append(path)
                db.add(SdAttachment(ticket_id=ticket.id, file_name=original, file_path=path, uploaded_stage="raised"))
        db.commit()
    except Exception as e:
        db.rollback()
        for p in written:
            try:
                os.remove(p)
            except OSError:
                pass
        raise HTTPException(status_code=500, detail=f"Could not raise request: {str(e)}")

    return {"message": "Token raised", "id": ticket.id, "token_no": ticket.token_no}

@router.get("/service-desk/my-tickets")
def sd_my_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(SdTicket, SdDepartment.name)
        .outerjoin(SdDepartment, SdDepartment.id == SdTicket.target_department_id)
        .filter(SdTicket.raised_by == current_user.id)
        .order_by(SdTicket.id.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "token_no": t.token_no,
            "subject": t.subject,
            "description": t.description,
            "priority": t.priority,
            "status": t.status,
            "department_name": dept_name,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t, dept_name in rows
    ]

def _sd_get_ticket_for_user(db: Session, ticket_id: int, user: User) -> SdTicket:
    ticket = db.query(SdTicket).filter(SdTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.raised_by != user.id and ticket.assigned_to != user.id and user.role not in SD_VIEW_ALL_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized")
    return ticket

@router.get("/service-desk/tickets/{ticket_id}/attachments")
def sd_ticket_attachments(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _sd_get_ticket_for_user(db, ticket_id, current_user)
    rows = db.query(SdAttachment).filter(SdAttachment.ticket_id == ticket_id).order_by(SdAttachment.id).all()
    return [{"id": a.id, "file_name": a.file_name, "uploaded_stage": a.uploaded_stage} for a in rows]

@router.get("/service-desk/attachments/{attachment_id}/download")
def sd_download_attachment(attachment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    att = db.query(SdAttachment).filter(SdAttachment.id == attachment_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="File not found")
    _sd_get_ticket_for_user(db, att.ticket_id, current_user)
    real = os.path.realpath(att.file_path)
    if not real.startswith(os.path.realpath(SD_UPLOAD_DIR) + os.sep) or not os.path.isfile(real):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(real, filename=att.file_name)

# ═══════════════════════════════════════════════
# SERVICE DESK (head / master / staff)
# ═══════════════════════════════════════════════
class SdAssign(BaseModel):
    staff_id: int
    remarks: Optional[str] = ""

class SdComplete(BaseModel):
    remarks: Optional[str] = ""

class SdVerify(BaseModel):
    approve: bool
    remarks: Optional[str] = ""

class SdStaffCreate(BaseModel):
    departmentId: int
    name: str
    email: str
    password: str

def _sd_iso(d):
    return d.isoformat() if d else None

def _sd_require_head(user: User):
    if user.role not in SD_HEAD_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized")

def _sd_parse_date(s: Optional[str]):
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date (use YYYY-MM-DD)")

def _sd_ticket_query(db: Session):
    assignee = aliased(User)
    return (
        db.query(SdTicket, SdDepartment.name, assignee.name)
        .outerjoin(SdDepartment, SdDepartment.id == SdTicket.target_department_id)
        .outerjoin(assignee, assignee.id == SdTicket.assigned_to)
    )

def _sd_ticket_out(t: SdTicket, dept_name, assignee_name):
    return {
        "id": t.id,
        "token_no": t.token_no,
        "subject": t.subject,
        "description": t.description,
        "priority": t.priority,
        "status": t.status,
        "target_department_id": t.target_department_id,
        "department_name": dept_name,
        "raised_by": t.raised_by,
        "raised_by_name": t.raised_by_name,
        "assigned_to": t.assigned_to,
        "assigned_to_name": assignee_name,
        "assigned_at": _sd_iso(t.assigned_at),
        "completed_at": _sd_iso(t.completed_at),
        "completion_remarks": t.completion_remarks,
        "verified_at": _sd_iso(t.verified_at),
        "verification_remarks": t.verification_remarks,
        "created_at": _sd_iso(t.created_at),
    }

def _sd_ticket_or_404(db: Session, ticket_id: int) -> SdTicket:
    ticket = db.query(SdTicket).filter(SdTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.get("/service-desk/tickets")
def sd_all_tickets(
    q: Optional[str] = None,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _sd_require_head(current_user)
    query = _sd_ticket_query(db)
    if department_id and department_id.isdigit():
        query = query.filter(SdTicket.target_department_id == int(department_id))
    if status:
        query = query.filter(SdTicket.status == status)
    start = _sd_parse_date(from_date)
    end = _sd_parse_date(to_date)
    if start:
        query = query.filter(SdTicket.created_at >= start)
    if end:
        query = query.filter(SdTicket.created_at < end + timedelta(days=1))
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(or_(
            SdTicket.token_no.like(like), SdTicket.subject.like(like), SdTicket.description.like(like),
            SdDepartment.name.like(like), SdTicket.priority.like(like), SdTicket.status.like(like),
        ))
    rows = query.order_by(SdTicket.id.desc()).all()
    return [_sd_ticket_out(t, dn, an) for t, dn, an in rows]

@router.get("/service-desk/stats")
def sd_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _sd_require_head(current_user)
    counts = {s: c for s, c in db.query(SdTicket.status, func.count(SdTicket.id)).group_by(SdTicket.status).all()}
    return {
        "total": sum(counts.values()),
        "open": counts.get("open", 0),
        "assigned": counts.get("assigned", 0),
        "completed": counts.get("completed", 0),
        "verified": counts.get("verified", 0),
        "reopened": counts.get("reopened", 0),
    }

@router.get("/service-desk/tickets/{ticket_id}")
def sd_ticket_detail(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _sd_get_ticket_for_user(db, ticket_id, current_user)
    t, dn, an = _sd_ticket_query(db).filter(SdTicket.id == ticket_id).first()
    logs = (
        db.query(SdTicketLog, User.name)
        .outerjoin(User, User.id == SdTicketLog.action_by)
        .filter(SdTicketLog.ticket_id == ticket_id)
        .order_by(SdTicketLog.id)
        .all()
    )
    atts = db.query(SdAttachment).filter(SdAttachment.ticket_id == ticket_id).order_by(SdAttachment.id).all()
    return {
        "ticket": _sd_ticket_out(t, dn, an),
        "logs": [
            {"id": l.id, "action": l.action, "remarks": l.remarks, "action_by": l.action_by,
             "action_by_name": name, "created_at": _sd_iso(l.created_at)}
            for l, name in logs
        ],
        "attachments": [
            {"id": a.id, "file_name": a.file_name, "uploaded_stage": a.uploaded_stage, "created_at": _sd_iso(a.created_at)}
            for a in atts
        ],
    }

# ---- Head / Master actions -------------------------------------------------
@router.post("/service-desk/tickets/{ticket_id}/assign")
def sd_assign(ticket_id: int, data: SdAssign, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _sd_require_head(current_user)
    ticket = _sd_ticket_or_404(db, ticket_id)
    if ticket.status not in ("open", "reopened"):
        raise HTTPException(status_code=400, detail="Only open or reopened tokens can be assigned")
    member = db.query(SdDepartmentMember).filter(
        SdDepartmentMember.user_id == data.staff_id,
        SdDepartmentMember.department_id == ticket.target_department_id,
    ).first()
    staff = db.query(User).filter(User.id == data.staff_id).first()
    if not member or not staff:
        raise HTTPException(status_code=400, detail="Selected staff does not belong to this department")
    ticket.assigned_to = staff.id
    ticket.assigned_by = current_user.id
    ticket.assigned_at = func.now()
    ticket.status = "assigned"
    _sd_log(db, ticket.id, "assigned", current_user.id, data.remarks or f"Assigned to {staff.name}")
    db.commit()
    return {"message": "Assigned"}

@router.post("/service-desk/tickets/{ticket_id}/verify")
def sd_verify(ticket_id: int, data: SdVerify, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _sd_require_head(current_user)
    ticket = _sd_ticket_or_404(db, ticket_id)
    if ticket.status != "completed":
        raise HTTPException(status_code=400, detail="Only completed tokens can be verified")
    ticket.verified_by = current_user.id
    ticket.verified_at = func.now()
    ticket.verification_remarks = (data.remarks or "").strip()
    ticket.status = "verified" if data.approve else "reopened"
    _sd_log(db, ticket.id, ticket.status, current_user.id, data.remarks or "")
    db.commit()
    return {"message": "Verified and closed" if data.approve else "Reopened"}

# ---- Staff actions ---------------------------------------------------------
@router.get("/service-desk/my-department")
def sd_my_department(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = (
        db.query(SdDepartmentMember.department_id, SdDepartment.name)
        .join(SdDepartment, SdDepartment.id == SdDepartmentMember.department_id)
        .filter(SdDepartmentMember.user_id == current_user.id)
        .first()
    )
    return {"department_id": row[0] if row else None, "department_name": row[1] if row else None}

@router.get("/service-desk/my-tasks")
def sd_my_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != SD_STAFF_ROLE:
        raise HTTPException(status_code=403, detail="Not authorized")
    rows = _sd_ticket_query(db).filter(SdTicket.assigned_to == current_user.id).order_by(SdTicket.id.desc()).all()
    return [_sd_ticket_out(t, dn, an) for t, dn, an in rows]

@router.post("/service-desk/tickets/{ticket_id}/complete")
def sd_complete(ticket_id: int, data: SdComplete, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = _sd_ticket_or_404(db, ticket_id)
    if current_user.role != SD_STAFF_ROLE or ticket.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="This token is not assigned to you")
    if ticket.status not in ("assigned", "reopened"):
        raise HTTPException(status_code=400, detail="This token is not waiting for completion")
    ticket.status = "completed"
    ticket.completed_at = func.now()
    ticket.completion_remarks = (data.remarks or "").strip()
    _sd_log(db, ticket.id, "completed", current_user.id, data.remarks or "Marked completed")
    db.commit()
    return {"message": "Marked complete"}

# ---- Staff management (head / master) --------------------------------------
@router.get("/service-desk/staff")
def sd_staff_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _sd_require_head(current_user)
    rows = (
        db.query(SdDepartmentMember, User, SdDepartment.name)
        .join(User, User.id == SdDepartmentMember.user_id)
        .outerjoin(SdDepartment, SdDepartment.id == SdDepartmentMember.department_id)
        .order_by(SdDepartment.name, User.name)
        .all()
    )
    return [
        {"member_id": m.id, "user_id": u.id, "department_id": m.department_id,
         "department_name": dn, "name": u.name, "email": u.email}
        for m, u, dn in rows
    ]

@router.post("/service-desk/staff")
def sd_staff_add(data: SdStaffCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _sd_require_head(current_user)
    name, email = data.name.strip(), data.email.strip().lower()
    if not name or len(name) > 100:
        raise HTTPException(status_code=400, detail="Name is required (max 100 characters)")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) or len(email) > 100:
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    dept = db.query(SdDepartment).filter(SdDepartment.id == data.departmentId, SdDepartment.is_active == 1).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Invalid department")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="This email is already in use")
    try:
        user = User(name=name, email=email, password_hash=hash_password(data.password),
                    role=SD_STAFF_ROLE, school_id=None, is_active=1)
        db.add(user)
        db.flush()
        db.add(SdDepartmentMember(department_id=dept.id, user_id=user.id))
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not add staff: {str(e)}")
    return {"message": "Staff added", "user_id": user.id}

@router.delete("/service-desk/staff/{member_id}")
def sd_staff_remove(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _sd_require_head(current_user)
    m = db.query(SdDepartmentMember).filter(SdDepartmentMember.id == member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Staff member not found")
    db.delete(m)      # membership only - the login account is kept
    db.commit()
    return {"message": "Staff removed"}

# ═══════════════════════════════════════════════
# LICENSE MANAGEMENT  (role: master only)
# ═══════════════════════════════════════════════
LICENSE_ALLOWED_EMAILS = {"yash@isf.com"}  # <- Yash ka asli login email yahan daalo (agar alag ho to badal dena)


def _require_license_access(user: User):
    if (user.email or "").lower() not in LICENSE_ALLOWED_EMAILS:
        raise HTTPException(status_code=403, detail="Not authorized for License Management")


def _gen_license_key(org_type: str) -> str:
    type_code = "".join(ch for ch in (org_type or "ORG") if ch.isalnum())[:4].upper() or "ORG"
    year = datetime.utcnow().year
    seq = secrets.token_hex(2).upper()
    rand = secrets.token_hex(2).upper()
    return f"ER-{year}-{type_code}-{seq}-{rand}"


@router.get("/licenses/stats")
def license_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    licenses = db.query(License).all()
    total_schools = db.query(School).count()
    licensed_school_ids = {l.organization_id for l in licenses if l.organization_id and l.status == "active"}
    return {
        "total_licenses": len(licenses),
        "active_licenses": sum(1 for l in licenses if l.status == "active"),
        "expired_licenses": sum(1 for l in licenses if l.status == "expired"),
        "suspended_licenses": sum(1 for l in licenses if l.status == "suspended"),
        "licensed_schools": len(licensed_school_ids),
        "total_schools": total_schools,
    }


@router.get("/licenses/")
def list_licenses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    licenses = db.query(License).order_by(License.id.desc()).all()
    result = []
    for l in licenses:
        school = db.query(School).filter(School.id == l.organization_id).first() if l.organization_id else None
        result.append({
            "id": l.id,
            "license_key": l.license_key,
            "organization_id": l.organization_id,
            "organization_name": school.name if school else None,
            "organization_type": l.organization_type,
            "max_students": l.max_students,
            "max_mentors": l.max_mentors,
            "max_classrooms": l.max_classrooms,
            "subscription_type": l.subscription_type,
            "subscription_start_date": l.subscription_start_date,
            "subscription_end_date": l.subscription_end_date,
            "grace_period_days": l.grace_period_days,
            "status": l.status,
            "notes": l.notes,
            "created_at": l.created_at,
            "expires_at": l.expires_at,
            "activated_at": l.activated_at,
            "product_url": l.product_url,
        })
    return result


@router.post("/licenses/")
def create_license(data: LicenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    if data.organization_id:
        school = db.query(School).filter(School.id == data.organization_id).first()
        if not school:
            raise HTTPException(status_code=404, detail="Organization not found")
        existing = db.query(License).filter(
            License.organization_id == data.organization_id, License.status == "active"
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="This organization already has an active license")

    expires_at = None
    if data.demo_minutes:
        expires_at = datetime.utcnow() + timedelta(minutes=data.demo_minutes)
        end_date = expires_at.date()
    else:
        end_date = data.start_date + timedelta(days=30 * max(data.subscription_months, 1))
    lic = License(
        license_key=_gen_license_key(data.organization_type),
        organization_id=data.organization_id,
        organization_type=data.organization_type,
        max_students=data.max_students,
        max_mentors=data.max_mentors,
        max_classrooms=data.max_classrooms,
        subscription_type="demo" if data.demo_minutes else data.subscription_type,
        subscription_start_date=data.start_date,
        subscription_end_date=end_date,
        expires_at=expires_at,
        product_url=(data.product_url or None),
        grace_period_days=data.grace_period_days,
        notes=data.notes,
        created_by=current_user.email,
    )
    db.add(lic)
    db.commit()
    db.refresh(lic)
    db.add(LicenseUsageLog(license_id=lic.id, action_type="activation",
                            description="License generated", created_by=current_user.email))
    db.commit()
    return {"message": "License generated", "license_id": lic.id, "license_key": lic.license_key}


@router.get("/licenses/{license_id}")
def get_license(license_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Not found")
    return lic


@router.put("/licenses/{license_id}")
def update_license(license_id: int, data: LicenseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Not found")

    updates = data.dict(exclude_unset=True)
    for field, value in updates.items():
        setattr(lic, field, value)

    action = "renewal" if updates.get("status") == "active" else "suspension" if updates.get("status") == "suspended" else "device_change"
    db.add(LicenseUsageLog(license_id=lic.id, action_type=action,
                            description=f"Updated by {current_user.email}", created_by=current_user.email))
    db.commit()
    return {"message": "License updated"}


@router.delete("/licenses/{license_id}")
def delete_license(license_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Not found")
    if lic.organization_id:
        raise HTTPException(status_code=400, detail="Cannot delete a license that is assigned to a school. Unassign it first.")
    db.query(LicenseUsageLog).filter(LicenseUsageLog.license_id == license_id).delete()
    db.query(LicenseViolation).filter(LicenseViolation.license_id == license_id).delete()
    db.delete(lic)
    db.commit()
    return {"message": "License deleted"}


@router.post("/licenses/{license_id}/assign")
def assign_license(license_id: int, data: LicenseAssignBody, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Not found")
    school = db.query(School).filter(School.id == data.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    existing = db.query(License).filter(
        License.organization_id == data.school_id, License.status == "active"
    ).first()
    if existing and existing.id != lic.id:
        raise HTTPException(status_code=400, detail="This school already has an active license")

    lic.organization_id = data.school_id
    db.add(LicenseUsageLog(license_id=lic.id, action_type="activation",
                            description=f"Assigned to {school.name}", created_by=current_user.email))
    db.commit()
    return {"message": "License assigned"}


@router.post("/licenses/{license_id}/unassign")
def unassign_license(license_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Not found")
    school = db.query(School).filter(School.id == lic.organization_id).first() if lic.organization_id else None
    lic.organization_id = None
    db.add(LicenseUsageLog(license_id=lic.id, action_type="device_change",
                            description=f"Unassigned from {school.name if school else 'organization'}",
                            created_by=current_user.email))
    db.commit()
    return {"message": "License unassigned"}


@router.get("/licenses/usage/logs")
def get_usage_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    logs = db.query(LicenseUsageLog).order_by(LicenseUsageLog.id.desc()).limit(300).all()
    result = []
    for log in logs:
        lic = db.query(License).filter(License.id == log.license_id).first()
        school = db.query(School).filter(School.id == lic.organization_id).first() if lic and lic.organization_id else None
        result.append({
            "id": log.id,
            "license_id": log.license_id,
            "license_key": lic.license_key if lic else None,
            "organization_name": school.name if school else None,
            "action_type": log.action_type,
            "description": log.description,
            "created_by": log.created_by,
            "created_at": log.created_at,
        })
    return result


@router.get("/licenses/violations/")
def get_violations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    violations = db.query(LicenseViolation).order_by(LicenseViolation.id.desc()).all()
    result = []
    for v in violations:
        lic = db.query(License).filter(License.id == v.license_id).first()
        school = db.query(School).filter(School.id == lic.organization_id).first() if lic and lic.organization_id else None
        result.append({
            "id": v.id,
            "license_id": v.license_id,
            "license_key": lic.license_key if lic else None,
            "organization_name": school.name if school else None,
            "violation_type": v.violation_type,
            "severity": v.severity,
            "description": v.description,
            "is_resolved": v.is_resolved,
            "resolved_by": v.resolved_by,
            "resolved_at": v.resolved_at,
            "created_at": v.created_at,
        })
    return result


@router.post("/licenses/violations/{violation_id}/resolve")
def resolve_violation(violation_id: int, data: ViolationResolveBody, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    v = db.query(LicenseViolation).filter(LicenseViolation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Not found")
    v.is_resolved = 1
    v.resolved_by = current_user.email
    v.resolved_at = datetime.utcnow()
    if data.remarks:
        v.description = (v.description or "") + f"\n[Resolved] {data.remarks}"
    db.commit()
    return {"message": "Violation resolved"}

# ═══════════════════════════════════════════════
# PRODUCT-FACING: VERIFY + DAILY CHECKPOINTS
# (product server -> InfraPoint; JWT nahi, license key hi credential hai)
# ═══════════════════════════════════════════════
CRON_SECRET = os.environ.get("LICENSE_CRON_SECRET", "dev-cron-secret")
STATS_PATH = "/infra_license_stats.php"   # EasyLearn root me jo file rakhenge


class LicenseVerifyBody(BaseModel):
    license_key: str
    role: Optional[str] = "Student"   # EasyLearn el_accounts.permissions: Student / Mentor / School ...
    email: Optional[str] = None


def _effective_expiry(lic: License) -> datetime:
    if lic.expires_at:                       # demo: exact time, koi grace nahi
        return lic.expires_at
    return (datetime.combine(lic.subscription_end_date, datetime.max.time())
            + timedelta(days=lic.grace_period_days or 0))


def _expire_if_needed(db: Session, lic: License, reason: str) -> bool:
    if datetime.utcnow() <= _effective_expiry(lic):
        return False
    if lic.status == "active":
        lic.status = "expired"
        db.add(LicenseUsageLog(license_id=lic.id, action_type="suspension",
                               description=f"Auto-expired (detected via {reason})", created_by="system"))
        db.add(LicenseViolation(license_id=lic.id, violation_type="expired_license", severity="medium",
                                description=f"License expired; detected via {reason}"))
        db.commit()
    return True


@router.post("/license/verify")
def verify_license(data: LicenseVerifyBody, db: Session = Depends(get_db)):
    lic = db.query(License).filter(License.license_key == data.license_key.strip().upper()).first()
    if not lic:
        return {"valid": False, "reason": "invalid_key"}
    if lic.status in ("suspended", "revoked"):
        return {"valid": False, "reason": lic.status}
    if _expire_if_needed(db, lic, "login"):
        return {"valid": False, "reason": "expired",
                "expired_at": _effective_expiry(lic).isoformat() + "Z"}

    # latest good checkpoint (roz 12 AM ka snapshot) - login pe koi product DB query nahi
    cp = (db.query(LicenseCheckpoint)
            .filter(LicenseCheckpoint.license_id == lic.id, LicenseCheckpoint.error.is_(None))
            .order_by(LicenseCheckpoint.id.desc()).first())
    students = cp.students if cp else 0
    if cp and students > (lic.max_students or 0):   # school apni student-limit cross kar chuka hai
        already = db.query(LicenseViolation).filter(
            LicenseViolation.license_id == lic.id,
            LicenseViolation.violation_type == "exceeded_limit",
            LicenseViolation.is_resolved == 0).first()
        if not already:
            db.add(LicenseViolation(license_id=lic.id, violation_type="exceeded_limit", severity="high",
                                    description=f"{students} students > limit {lic.max_students}"))
            db.commit()
        return {"valid": False, "reason": "limit_reached",
                "students": students, "max_students": lic.max_students}

    if not lic.activated_at:
        lic.activated_at = datetime.utcnow()
        db.add(LicenseUsageLog(license_id=lic.id, action_type="activation",
                               description="First activation from product", created_by="system"))
    db.add(LicenseUsageLog(license_id=lic.id, action_type="login",
                           description=f"{data.role} login allowed ({data.email or 'n/a'})", created_by="system"))
    db.commit()
    exp = _effective_expiry(lic)
    return {"valid": True, "expires_at": exp.isoformat() + "Z",
            "seconds_left": int((exp - datetime.utcnow()).total_seconds()),
            "students": students, "max_students": lic.max_students}


def _fetch_user_count(lic: License) -> dict:
    req = urllib.request.Request(
        lic.product_url.rstrip("/") + STATS_PATH, data=b"{}", method="POST",
        headers={"X-License-Key": lic.license_key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())


@router.post("/license/run-checkpoints")   # cron isko roz 12:00 AM hit karega
def run_checkpoints(request: Request, db: Session = Depends(get_db)):
    if request.headers.get("x-cron-secret") != CRON_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    done = []
    for lic in db.query(License).filter(License.status == "active").all():
        if _expire_if_needed(db, lic, "daily checkpoint"):
            done.append({"license": lic.license_key, "result": "expired"})
            continue
        if not lic.product_url:
            continue
        try:
            d = _fetch_user_count(lic)
            db.add(LicenseCheckpoint(license_id=lic.id, students=int(d.get("students", 0)),
                                     teachers=int(d.get("teachers", 0))))
            done.append({"license": lic.license_key, "result": d})
        except Exception as e:
            db.add(LicenseCheckpoint(license_id=lic.id, error=str(e)[:500]))
            done.append({"license": lic.license_key, "error": str(e)})
    db.commit()
    return {"checked": done}


@router.get("/license/checkpoints")   # testing ke liye: latest snapshots dekhne ke liye (admin login)
def list_checkpoints(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_license_access(current_user)
    rows = db.query(LicenseCheckpoint).order_by(LicenseCheckpoint.id.desc()).limit(50).all()
    out = []
    for c in rows:
        lic = db.query(License).filter(License.id == c.license_id).first()
        out.append({"id": c.id, "license_key": lic.license_key if lic else None,
                    "students": c.students, "teachers": c.teachers,
                    "error": c.error, "checked_at": c.checked_at})
    return out


# ═══════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════
@router.get("/health")
def health():
    return {"status": "ok", "service": "easyreach", "version": "1.0.0"}


# ═══════════════════════════════════════════════
# FORTIMATES MODULE  (ISF Infra → FortiMates admin dashboard)
# Routes: /easyreach/fortimates/...  — same DB, same users table, same JWT login.
# Tables (auto-created, prefixed fm_):
#   fm_users    – registrations (Requests page + Users stats)
#   fm_kyc      – verified KYC records (KYC List)
#   fm_mails    – mail tracker log (Mails, Mail Tracker, Total Mails donut)
#   fm_calls    – verification calls (Call Tracker)
#   fm_admins   – people with FortiMates dashboard access (Admin page)
#   fm_settings – per-user profile + notification settings (Configurations)
# ═══════════════════════════════════════════════
from typing import Dict
# EasyReach roles allowed to change FortiMates data (approve/reject, manage admins).
# Every logged-in EasyReach user can VIEW the FortiMates dashboard.
FM_WRITE_ROLES = ["admin", "master", "developer"]

ACCOUNT_TYPES = {
    "passport": "With Passport",
    "no_passport": "Without Passport",
    "corporate": "Corporate",
}
ACCOUNT_TYPE_BY_LABEL = {v: k for k, v in ACCOUNT_TYPES.items()}
MAIL_CATEGORIES = ["Primary", "Social", "Promotional", "Updates", "Forums", "Spams"]
ADMIN_ROLES = ["Super Admin", "Security Admin", "Support Admin", "Fraud Analyst"]

# KYC documents
FM_DOC_TYPES = {
    "passport": "Passport",
    "government_id": "Government ID (Aadhaar / PAN / Driving licence)",
    "company_registration": "Company registration certificate",
    "address_proof": "Address proof",
    "bank_proof": "Bank proof (cancelled cheque / statement)",
}
# the one document each account type MUST have before it can be approved
FM_REQUIRED_DOC = {"passport": "passport", "no_passport": "government_id", "corporate": "company_registration"}
FM_DOC_ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".pdf"}
FM_DOC_MAX_BYTES = 5 * 1024 * 1024
FM_UPLOAD_DIR = os.path.join(os.path.dirname(SD_UPLOAD_DIR), "fortimates_kyc")   # next to service-desk uploads


# ═══════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════
class FmUser(Base):
    __tablename__ = "fm_users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False, index=True)
    country = Column(String(80), nullable=True)
    account_type = Column(String(20), nullable=False, default="no_passport")  # passport / no_passport / corporate
    phone = Column(String(20), nullable=True)
    id_number = Column(String(50), nullable=True)       # passport no. / govt ID no. / company reg. no.
    bank_name = Column(String(150), nullable=True)
    bank_category = Column(String(50), nullable=True)   # Retail / Corporate
    status = Column(String(20), nullable=False, default="pending")            # pending / approved / rejected
    decided_by = Column(String(100), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)


class FmKyc(Base):
    __tablename__ = "fm_kyc"
    id = Column(Integer, primary_key=True, index=True)
    fm_user_id = Column(Integer, nullable=True, index=True)
    name = Column(String(150), nullable=False)
    bank_name = Column(String(150), nullable=True)
    bank_category = Column(String(50), nullable=True)   # Retail / Corporate
    status = Column(String(20), default="verified")
    created_at = Column(DateTime, server_default=func.now())


class FmMail(Base):
    __tablename__ = "fm_mails"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String(50), nullable=True)
    sender_name = Column(String(150), nullable=True)
    email = Column(String(150), nullable=True)
    subject = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    location = Column(String(100), nullable=True)
    category = Column(String(20), default="Primary")    # Primary / Social / Promotional / Updates / Forums / Spams
    status = Column(String(20), default="Delivered")    # Delivered / Queued
    risk = Column(String(10), default="Low")            # Low / Medium / High
    to_email = Column(String(150), nullable=True, index=True)   # recipient (mails sent by FortiMates)
    error = Column(String(500), nullable=True)                  # SMTP error when status = Failed
    direction = Column(String(10), nullable=True, index=True)   # outbound (sent by FortiMates) / inbound (inbox)
    imap_folder = Column(String(50), nullable=True)             # inbox mails: INBOX / Spam folder
    imap_uid = Column(Integer, nullable=True)                   # inbox mails: IMAP UID (to fetch only new mails)
    risk_reasons = Column(Text, nullable=True)                  # inbox mails: JSON list of why risk is Medium/High
    created_at = Column(DateTime, server_default=func.now(), index=True)


class FmCall(Base):
    __tablename__ = "fm_calls"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    outcome = Column(String(40), default="Verified")    # Verified / Follow-up needed / No answer / Declined
    recording_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class FmAdmin(Base):
    __tablename__ = "fm_admins"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    role = Column(String(40), default="Support Admin")
    status = Column(String(20), default="Invited")      # Active / Invited
    invited_by = Column(String(100), nullable=True)
    created_user_id = Column(Integer, nullable=True)    # EasyReach users.id created by this invite (None = existing account)
    created_at = Column(DateTime, server_default=func.now())


class FmSetting(Base):
    __tablename__ = "fm_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False, index=True)   # EasyReach users.id
    display_name = Column(String(150), nullable=True)
    alert_email = Column(String(150), nullable=True)
    notifications_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class FmDocument(Base):
    __tablename__ = "fm_documents"
    id = Column(Integer, primary_key=True, index=True)
    fm_user_id = Column(Integer, nullable=False, index=True)
    doc_type = Column(String(40), nullable=False)       # passport / government_id / company_registration / address_proof / bank_proof
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    uploaded_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


try:
    Base.metadata.create_all(bind=engine, tables=[
        FmUser.__table__, FmKyc.__table__, FmMail.__table__,
        FmCall.__table__, FmAdmin.__table__, FmSetting.__table__, FmDocument.__table__,
    ])
except Exception as e:
    import logging
    logging.getLogger(__name__).error(f"FortiMates DB init failed: {e}")


def _fm_ensure_columns():
    """fm_users was first created without the applicant columns — add them if missing
    (create_all never alters an existing table). Safe to run on every start."""
    from sqlalchemy import inspect, text
    try:
        wanted = {
            "fm_users": {
                "phone": "VARCHAR(20)",
                "id_number": "VARCHAR(50)",
                "bank_name": "VARCHAR(150)",
                "bank_category": "VARCHAR(50)",
            },
            "fm_admins": {
                "created_user_id": "INT",
            },
            "fm_mails": {
                "to_email": "VARCHAR(150)",
                "error": "VARCHAR(500)",
                "direction": "VARCHAR(10)",
                "imap_folder": "VARCHAR(50)",
                "imap_uid": "INT",
                "risk_reasons": "TEXT",
            },
        }
        insp = inspect(engine)
        with engine.begin() as conn:
            for table, cols in wanted.items():
                existing = {c["name"] for c in insp.get_columns(table)}
                for col, ddl in cols.items():
                    if col not in existing:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl} NULL"))
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"FortiMates column check failed: {e}")


_fm_ensure_columns()


# ═══════════════════════════════════════════════
# DEMO SEED — only runs when the fm_ tables are EMPTY, so the dashboard isn't
# blank on first run. Disabled unless env FORTIMATES_SEED_DEMO=1 is set.
# Real data never gets overwritten.
# ═══════════════════════════════════════════════
def _fm_seed_demo():
    # OFF by default — demo rows are only added when FORTIMATES_SEED_DEMO=1 is set (local testing only)
    if os.environ.get("FORTIMATES_SEED_DEMO", "0") != "1":
        return
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        if db.query(FmUser).count() == 0:
            demo = [
                ("Wren Okafor", "wren.okafor@nyla.io", "Nigeria", "passport"),
                ("Lena Petrova", "lena.p@vektor.dev", "Latvia", "no_passport"),
                ("Marco Silva", "marco.silva@obra.co", "Brazil", "corporate"),
                ("Hana Suzuki", "hana.s@karesu.jp", "Japan", "passport"),
                ("Tariq Aziz", "tariq@duneworks.ae", "UAE", "corporate"),
                ("Ines Moreau", "ines.m@meridien.fr", "France", "passport"),
                ("Arjun Mehta", "arjun.m@tallyline.in", "India", "no_passport"),
            ]
            for i, (n, e, c, t) in enumerate(demo):
                db.add(FmUser(name=n, email=e, country=c, account_type=t,
                              status="pending", created_at=now - timedelta(days=i * 2, hours=i)))
        if db.query(FmKyc).count() == 0:
            for n, b, cat in [("Wren Okafor", "Zenith Trust", "Retail"), ("Marco Silva", "Obra Capital", "Corporate"),
                              ("Hana Suzuki", "Karesu Bank", "Retail"), ("Tariq Aziz", "Duneworks Financial", "Corporate"),
                              ("Ines Moreau", "Meridien Bank", "Retail")]:
                db.add(FmKyc(name=n, bank_name=b, bank_category=cat))
        if False:  # demo mails disabled — Mail Tracker now logs the real mails FortiMates sends
            mails = [
                ("FortiMates Alerts", "alerts@fortimates.com", "Unusual login detected", "Mumbai, IN", "Primary", "Delivered", "Medium"),
                ("FortiMates Billing", "billing@fortimates.com", "Payment verification needed", "Austin, US", "Updates", "Queued", "Low"),
                ("FortiMates KYC", "kyc@fortimates.com", "Your KYC has been approved", "Lagos, NG", "Primary", "Delivered", "Low"),
                ("FortiMates Alerts", "alerts@fortimates.com", "Suspicious device sign-in", "Riga, LV", "Primary", "Delivered", "High"),
                ("No-Reply", "no-reply@fortimates.com", "Password reset requested", "Tokyo, JP", "Updates", "Delivered", "Low"),
                ("FortiMates News", "news@fortimates.com", "What's new this month", "Dubai, AE", "Promotional", "Delivered", "Low"),
                ("Community", "forum@fortimates.com", "New reply in your thread", "Berlin, DE", "Forums", "Delivered", "Low"),
                ("Unknown", "win-prize@spam.biz", "You have won!!!", "Unknown", "Spams", "Delivered", "High"),
            ]
            for i, (s, e, sub, loc, cat, st, risk) in enumerate(mails):
                db.add(FmMail(message_id=(now - timedelta(days=i)).strftime("%d%m%Y") + str(i),
                              sender_name=s, email=e, subject=sub, message=sub, location=loc,
                              category=cat, status=st, risk=risk, created_at=now - timedelta(days=i, hours=i)))
        if db.query(FmCall).count() == 0:
            base = now.replace(hour=9, minute=0, second=0, microsecond=0)
            for i, (n, mins, outcome, rec) in enumerate([
                ("Wren Okafor", 12, "Verified", True), ("Lena Petrova", 14, "Follow-up needed", True),
                ("Marco Silva", 3, "No answer", False), ("Hana Suzuki", 13, "Verified", True),
                ("Tariq Aziz", 7, "Declined", True),
            ]):
                st = base + timedelta(hours=i, minutes=i * 7)
                db.add(FmCall(name=n, start_time=st, end_time=st + timedelta(minutes=mins), outcome=outcome,
                              recording_url="demo" if rec else None))
        db.commit()
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger(__name__).error(f"FortiMates demo seed failed: {e}")
    finally:
        db.close()


_fm_seed_demo()


# ═══════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════
def _iso(d):
    return d.isoformat() if d else None


def _require_write(user: User, db: Session = None, manage_admins: bool = False):
    """EasyReach admin/master/developer can do everything. Invited FortiMates admins:
    Super/Security/Support Admin can approve & manage KYC; only Super Admin can manage admins.
    Fraud Analyst is view-only."""
    if user.role in FM_WRITE_ROLES:
        return
    if db is not None:
        a = db.query(FmAdmin).filter(FmAdmin.email == (user.email or "").lower()).first()
        if a:
            allowed = ["Super Admin"] if manage_admins else ["Super Admin", "Security Admin", "Support Admin"]
            if a.role in allowed:
                return
    raise HTTPException(status_code=403, detail="Not authorized to change FortiMates data")


def _fm_mark_active(db: Session, user: User):
    """An invited admin becomes Active the first time they open FortiMates."""
    a = db.query(FmAdmin).filter(FmAdmin.email == (user.email or "").lower(), FmAdmin.status == "Invited").first()
    if a:
        a.status = "Active"
        db.commit()


def _pct(part: int, total: int) -> int:
    return round(part * 100 / total) if total else 0


def _user_out(u: FmUser):
    return {
        "id": u.id, "name": u.name, "email": u.email, "country": u.country,
        "type": ACCOUNT_TYPES.get(u.account_type, u.account_type),
        "phone": u.phone, "id_number": u.id_number,
        "bank_name": u.bank_name, "bank_category": u.bank_category,
        "status": u.status, "decided_by": u.decided_by, "decided_at": _iso(u.decided_at),
        "created_at": _iso(u.created_at),
    }


def _fm_reasons(raw):
    try:
        v = json.loads(raw) if raw else []
        return v if isinstance(v, list) else []
    except ValueError:
        return []


def _mail_out(m: FmMail):
    return {
        "id": m.id, "message_id": m.message_id or str(m.id), "from": m.sender_name, "email": m.email,
        "subject": m.subject, "message": m.message, "location": m.location, "category": m.category,
        "status": m.status, "risk": m.risk, "to": m.to_email, "error": m.error,
        "direction": m.direction or "outbound", "risk_reasons": _fm_reasons(m.risk_reasons),
        "date": m.created_at.strftime("%d %b %Y") if m.created_at else None,
        "time": m.created_at.strftime("%H:%M GMT") if m.created_at else None,
        "created_at": _iso(m.created_at),
    }


DEFAULT_NOTIFICATIONS = {"fraudAlerts": True, "weeklyReport": True, "kycApprovals": False, "newAdminLogin": True}


# ═══════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════
class FmUserCreate(BaseModel):
    name: str
    email: str
    country: Optional[str] = None
    type: str = "Without Passport"          # With Passport / Without Passport / Corporate
    phone: Optional[str] = None
    id_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_category: Optional[str] = None


class FmDecision(BaseModel):
    decision: str                           # approved / rejected
    bank_name: Optional[str] = None         # optional: saved to KYC list on approval
    bank_category: Optional[str] = None


class FmAdminCreate(BaseModel):
    name: str
    email: str
    role: str = "Support Admin"


class FmAdminUpdate(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None


class FmSettingsUpdate(BaseModel):
    display_name: Optional[str] = None
    alert_email: Optional[str] = None
    notifications: Optional[Dict[str, bool]] = None


class FmPasswordChange(BaseModel):
    current_password: str
    new_password: str


# ═══════════════════════════════════════════════
# HOME / OVERVIEW  (Users panel, Mails table, Registrations chart, Total Mails donut)
# ═══════════════════════════════════════════════
@router.get("/fortimates/overview")
def fm_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _fm_mark_active(db, current_user)
    counts = dict(db.query(FmUser.account_type, func.count(FmUser.id)).group_by(FmUser.account_type).all())
    total = sum(counts.values())

    # Registrations: last 7 days (this week) vs the 7 days before (last week), per weekday
    today = datetime.utcnow().date()
    start = today - timedelta(days=13)
    rows = db.query(FmUser.created_at).filter(FmUser.created_at >= datetime.combine(start, datetime.min.time())).all()
    per_day = {}
    for (created,) in rows:
        if created:
            d = created.date()
            per_day[d] = per_day.get(d, 0) + 1
    registrations = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        registrations.append({
            "day": d.strftime("%a"),
            "today": per_day.get(d, 0),                            # this week
            "yesterday": per_day.get(d - timedelta(days=7), 0),    # same weekday last week
        })

    # split by mail type (Admin invite, ...) — value = number of mails
    mail_counts = dict(db.query(FmMail.category, func.count(FmMail.id)).group_by(FmMail.category).all())
    mail_total = sum(mail_counts.values())
    mail_split = [
        {"name": c or "Other", "value": n, "count": n,
         "percent": round(n * 100 / mail_total, 1) if mail_total else 0}
        for c, n in sorted(mail_counts.items(), key=lambda kv: -kv[1])
    ]

    recent = db.query(FmMail).order_by(FmMail.created_at.desc(), FmMail.id.desc()).limit(8).all()

    return {
        "users": {
            "with_passport": _pct(counts.get("passport", 0), total),
            "without_passport": _pct(counts.get("no_passport", 0), total),
            "corporate": _pct(counts.get("corporate", 0), total),
            "total": total,
        },
        "registrations": registrations,
        "mail_split": mail_split,
        "mail_total": mail_total,
        "recent_mails": [_mail_out(m) for m in recent],
    }


# ═══════════════════════════════════════════════
# REQUESTS (registrations waiting for approval)
# ═══════════════════════════════════════════════
@router.get("/fortimates/requests")
def fm_requests(status: Optional[str] = None, type: Optional[str] = None,
                db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(FmUser)
    if status:
        q = q.filter(FmUser.status == status)
    if type and type in ACCOUNT_TYPE_BY_LABEL:
        q = q.filter(FmUser.account_type == ACCOUNT_TYPE_BY_LABEL[type])
    return [_user_out(u) for u in q.order_by(FmUser.id.desc()).all()]


@router.post("/fortimates/requests")
def fm_create_request(data: FmUserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    name, email = data.name.strip(), data.email.strip().lower()
    if not name or len(name) > 150:
        raise HTTPException(status_code=400, detail="Name is required (max 150 characters)")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if data.type not in ACCOUNT_TYPE_BY_LABEL:
        raise HTTPException(status_code=400, detail="Invalid account type")
    u = FmUser(name=name, email=email, country=(data.country or "").strip() or None,
               account_type=ACCOUNT_TYPE_BY_LABEL[data.type], status="pending",
               phone=(data.phone or "").strip() or None, id_number=(data.id_number or "").strip() or None,
               bank_name=(data.bank_name or "").strip() or None, bank_category=(data.bank_category or "").strip() or None)
    db.add(u)
    db.commit()
    db.refresh(u)
    return _user_out(u)


@router.post("/fortimates/requests/{request_id}/decision")
def fm_decide(request_id: int, data: FmDecision, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_write(current_user, db)
    if data.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Decision must be 'approved' or 'rejected'")
    u = db.query(FmUser).filter(FmUser.id == request_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Request not found")
    if u.status != "pending":
        raise HTTPException(status_code=400, detail=f"This request is already {u.status}")
    if data.decision == "approved":
        required = FM_REQUIRED_DOC.get(u.account_type)
        if required and not db.query(FmDocument).filter(FmDocument.fm_user_id == u.id, FmDocument.doc_type == required).first():
            raise HTTPException(status_code=400,
                                detail=f"Upload the {FM_DOC_TYPES[required]} before approving this request")
    u.status = data.decision
    u.decided_by = current_user.email
    u.decided_at = datetime.utcnow()
    # Approved users appear in the KYC List
    if data.decision == "approved" and not db.query(FmKyc).filter(FmKyc.fm_user_id == u.id).first():
        db.add(FmKyc(fm_user_id=u.id, name=u.name, bank_name=data.bank_name or u.bank_name,
                     bank_category=data.bank_category or u.bank_category or ("Corporate" if u.account_type == "corporate" else "Retail")))
    db.commit()
    return _user_out(u)


# ═══════════════════════════════════════════════
# KYC LIST
# ═══════════════════════════════════════════════
@router.get("/fortimates/kyc")
def fm_kyc_list(q: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(FmKyc)
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(or_(FmKyc.name.like(like), FmKyc.bank_name.like(like)))
    rows = query.order_by(FmKyc.id.desc()).all()
    return [{"id": k.id, "name": k.name, "bankName": k.bank_name or "—", "bankCategory": k.bank_category or "—",
             "status": k.status, "created_at": _iso(k.created_at)} for k in rows]


# ═══════════════════════════════════════════════
# MAIL TRACKER
# ═══════════════════════════════════════════════
@router.get("/fortimates/mails")
def fm_mails(q: Optional[str] = None, limit: int = 100, direction: Optional[str] = None,
             db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(FmMail)
    if direction == "inbound":
        query = query.filter(FmMail.direction == "inbound")
    elif direction == "outbound":
        query = query.filter(or_(FmMail.direction == "outbound", FmMail.direction.is_(None)))
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(or_(FmMail.sender_name.like(like), FmMail.email.like(like),
                                 FmMail.location.like(like), FmMail.subject.like(like),
                                 FmMail.to_email.like(like), FmMail.status.like(like),
                                 FmMail.category.like(like)))
    rows = query.order_by(FmMail.created_at.desc(), FmMail.id.desc()).limit(max(1, min(limit, 500))).all()
    return [_mail_out(m) for m in rows]


# ═══════════════════════════════════════════════
# CALL TRACKER
# ═══════════════════════════════════════════════
@router.get("/fortimates/calls")
def fm_calls(q: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(FmCall)
    if q and q.strip():
        query = query.filter(FmCall.name.like(f"%{q.strip()}%"))
    rows = query.order_by(FmCall.start_time.desc(), FmCall.id.desc()).all()
    return [{
        "id": c.id, "name": c.name,
        "start": c.start_time.strftime("%I:%M %p") if c.start_time else "—",
        "end": c.end_time.strftime("%I:%M %p") if c.end_time else "—",
        "date": c.start_time.strftime("%d %b %Y") if c.start_time else None,
        "outcome": c.outcome, "recording": bool(c.recording_url),
        "recording_url": c.recording_url if c.recording_url and c.recording_url != "demo" else None,
    } for c in rows]


# ═══════════════════════════════════════════════
# ADMIN ACCOUNTS
# ═══════════════════════════════════════════════
def _admin_out(a: FmAdmin):
    return {"id": a.id, "name": a.name, "email": a.email, "role": a.role, "status": a.status,
            "account_created": bool(a.created_user_id), "created_at": _iso(a.created_at)}


@router.get("/fortimates/admins")
def fm_admins(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # EasyReach admin/master/developer always appear as an active Super Admin
    if current_user.role in FM_WRITE_ROLES and \
            not db.query(FmAdmin).filter(FmAdmin.email == current_user.email.lower()).first():
        db.add(FmAdmin(name=current_user.name, email=current_user.email.lower(), role="Super Admin",
                       status="Active", invited_by="system"))
        db.commit()
    return [_admin_out(a) for a in db.query(FmAdmin).order_by(FmAdmin.id).all()]


# ─── Invite mail (SMTP from environment variables) ───────────────────────────
#   SMTP_HOST, SMTP_PORT (587 = STARTTLS, 465 = SSL), SMTP_USERNAME, SMTP_PASSWORD,
#   SMTP_FROM_NAME  (FM_SMTP_* names also accepted and take priority; FM_SMTP_TLS default 1)
#   FM_LOGIN_URL — link shown in the mail (default: live EasyReach login page)
# SMTP credentials (Gmail). setdefault → a value set in the server's environment
# variables (e.g. DigitalOcean) still takes priority over these.
os.environ.setdefault("SMTP_HOST", "smtp.gmail.com")
os.environ.setdefault("SMTP_PORT", "587")
os.environ.setdefault("SMTP_USERNAME", "isfinformaticaanalytica@gmail.com")
os.environ.setdefault("SMTP_PASSWORD", "ckxgudajplzzpdol")
os.environ.setdefault("SMTP_FROM_NAME", "EasyReach(Fortimates)")

FM_INVITE_ROLE = "fortimates"   # EasyReach role given to accounts created by an invite
FM_LOGIN_URL = os.environ.get("FM_LOGIN_URL", "https://easyreach.easylearn.org.in/login")


def _fm_generate_password(length: int = 10) -> str:
    """Readable temporary password with upper, lower, digit and a symbol."""
    upper, lower, digits, symbols = "ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "@#$%"
    chars = [secrets.choice(upper), secrets.choice(lower), secrets.choice(digits), secrets.choice(symbols)]
    pool = upper + lower + digits
    chars += [secrets.choice(pool) for _ in range(length - len(chars))]
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


def _fm_log_mail(to_email: str, subject: str, text_body: str, mail_type: str, sender_name: str,
                 sender_email: str, sent: bool, error: Optional[str]):
    """Every mail FortiMates sends is recorded in fm_mails → Mail Tracker.
    Own DB session, so logging can never break the request that sent the mail."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        preview = " ".join((text_body or "").split())
        preview = re.sub(r"(Password:\s*)\S+", r"\1••••••", preview)   # never store a password in the log
        m = FmMail(
            message_id=now.strftime("%d%m%y%H%M%S") + secrets.token_hex(2).upper(),
            sender_name=sender_name or None, email=sender_email or None, to_email=to_email,
            subject=(subject or "")[:255], message=preview[:500], location=None,
            category=mail_type, status="Delivered" if sent else "Failed", risk=None, direction="outbound",
            error=(error or None) and error[:500], created_at=now,
        )
        db.add(m)
        db.commit()
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger(__name__).error(f"FortiMates mail log failed: {e}")
    finally:
        db.close()


def _fm_send_mail(to_email: str, subject: str, html: str, text_body: str, mail_type: str = "Notification"):
    """Returns (sent: bool, error: str|None). Never raises — an invite still succeeds if mail fails.
    Every attempt (sent or failed) is logged to the Mail Tracker."""
    sent, error, from_name, sender = _fm_smtp_send(to_email, subject, html, text_body)
    _fm_log_mail(to_email, subject, text_body, mail_type, from_name, sender, sent, error)
    return sent, error


def _fm_smtp_send(to_email: str, subject: str, html: str, text_body: str):
    import smtplib
    import ssl
    from email.message import EmailMessage
    from email.utils import formataddr

    def env(*names, default=""):
        for n in names:
            v = os.environ.get(n, "")
            if v and v.strip():
                return v.strip()
        return default

    host = env("FM_SMTP_HOST", "SMTP_HOST")
    user = env("FM_SMTP_USER", "SMTP_USERNAME")
    password = env("FM_SMTP_PASSWORD", "SMTP_PASSWORD")
    sender = env("FM_SMTP_FROM") or user
    from_name = env("SMTP_FROM_NAME")
    try:
        port = int(env("FM_SMTP_PORT", "SMTP_PORT", default="587"))
    except ValueError:
        port = 587
    if not host or not sender:
        return False, "Email is not configured on the server (SMTP_HOST / SMTP_USERNAME missing)", from_name, sender

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, sender)) if from_name else sender
    msg["To"] = to_email
    msg.set_content(text_body)
    msg.add_alternative(html, subtype="html")
    try:
        context = ssl.create_default_context()
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=context, timeout=20) as smtp:
                if user:
                    smtp.login(user, password)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=20) as smtp:
                if os.environ.get("FM_SMTP_TLS", "1") != "0":   # FM_SMTP_TLS=0 only for a local test mail server
                    smtp.starttls(context=context)
                if user:
                    smtp.login(user, password)
                smtp.send_message(msg)
        return True, None, from_name, sender
    except Exception as e:
        return False, f"Could not send email: {e}", from_name, sender


def _fm_invite_mail(name: str, email: str, role: str, invited_by: str, password: Optional[str]):
    """Mail body. password=None → the person already has an EasyReach login."""
    from html import escape
    if password:
        cred_html = f"""
          <tr><td style="padding:6px 0;color:#7C8CAF;width:110px">Login ID</td>
              <td style="padding:6px 0;color:#F4F7FC;font-weight:600">{escape(email)}</td></tr>
          <tr><td style="padding:6px 0;color:#7C8CAF">Password</td>
              <td style="padding:6px 0;color:#F5AE0E;font-weight:600;font-family:Consolas,monospace;font-size:15px">{escape(password)}</td></tr>"""
        cred_text = f"Login ID: {email}\nPassword: {password}\n"
        note = "This is a temporary password. Please change it after your first login from FortiMates → Configurations → Security."
    else:
        cred_html = f"""
          <tr><td style="padding:6px 0;color:#7C8CAF;width:110px">Login ID</td>
              <td style="padding:6px 0;color:#F4F7FC;font-weight:600">{escape(email)}</td></tr>
          <tr><td style="padding:6px 0;color:#7C8CAF">Password</td>
              <td style="padding:6px 0;color:#F4F7FC">Your existing EasyReach password</td></tr>"""
        cred_text = f"Login ID: {email}\nPassword: your existing EasyReach password\n"
        note = "You already have an EasyReach account, so your password has not been changed."

    subject = "Your FortiMates admin access — ISF Infra"
    html = f"""<!doctype html><html><body style="margin:0;padding:24px;background:#050B18;font-family:Arial,Helvetica,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#0A1730;border:1px solid #1C3F80">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #153061">
          <span style="color:#4FD6E8;font-size:20px;font-weight:700">Forti</span><span style="color:#F5AE0E;font-size:20px;font-weight:700">Mates</span>
          <span style="color:#7C8CAF;font-size:12px;margin-left:8px">ISF Infra</span></td></tr>
        <tr><td style="padding:28px">
          <p style="color:#F4F7FC;font-size:15px;margin:0 0 12px">Hello {escape(name)},</p>
          <p style="color:#AAB8D6;font-size:14px;line-height:1.6;margin:0 0 20px">
            {escape(invited_by)} has invited you to the <b style="color:#F4F7FC">FortiMates admin dashboard</b>
            as <b style="color:#F4F7FC">{escape(role)}</b>. Use the details below to sign in to EasyReach (ISF Infra).</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;background:#050B18;border:1px solid #153061;padding:14px 18px;font-size:14px">{cred_html}
          </table>
          <p style="margin:24px 0">
            <a href="{escape(FM_LOGIN_URL)}" style="background:#F5AE0E;color:#050B18;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;display:inline-block">Sign in to EasyReach</a></p>
          <p style="color:#7C8CAF;font-size:12px;line-height:1.6;margin:0">{note}<br>
            After signing in, open <b>FortiMates</b> from the left menu.</p>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #153061;color:#3E4F73;font-size:11px">
          © ISF Analytica &amp; Informatica Pvt. Ltd. — If you were not expecting this invite, you can ignore this email.</td></tr>
      </table></body></html>"""
    text_body = (f"Hello {name},\n\n{invited_by} has invited you to the FortiMates admin dashboard as {role}.\n\n"
                 f"{cred_text}\nSign in: {FM_LOGIN_URL}\n\n{note}\nAfter signing in, open FortiMates from the left menu.\n")
    return subject, html, text_body


def _fm_invite_result(a: FmAdmin, sent: bool, error: Optional[str], password: Optional[str]):
    out = _admin_out(a)
    out["email_sent"] = sent
    out["email_error"] = error
    # Only when the mail could NOT be sent: return the temporary password once,
    # so the inviter can share it manually. Never stored in plain text.
    out["temp_password"] = password if (password and not sent) else None
    return out


@router.post("/fortimates/admins")
def fm_admin_invite(data: FmAdminCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_write(current_user, db, manage_admins=True)
    name, email = data.name.strip(), data.email.strip().lower()
    if not name or len(name) > 100:
        raise HTTPException(status_code=400, detail="Name is required (max 100 characters)")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) or len(email) > 100:
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if data.role not in ADMIN_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    if db.query(FmAdmin).filter(FmAdmin.email == email).first():
        raise HTTPException(status_code=400, detail="This email already has access")

    existing = db.query(User).filter(User.email == email).first()
    password = None
    created_user_id = None
    if existing and existing.role == FM_INVITE_ROLE:
        # Login created by an earlier FortiMates invite (and locked when that access
        # was removed) → re-invite: new temporary password and unlock it
        password = _fm_generate_password()
        existing.password_hash = hash_password(password)
        existing.is_active = 1
        existing.name = name
        created_user_id = existing.id
    elif not existing:
        # New EasyReach login: Login ID = the invited email, temporary password mailed to them
        password = _fm_generate_password()
        u = User(name=name, email=email, password_hash=hash_password(password), role=FM_INVITE_ROLE,
                 school_id=None, is_active=1)
        db.add(u)
        db.flush()
        created_user_id = u.id

    a = FmAdmin(name=name, email=email, role=data.role, status="Invited",
                invited_by=current_user.email, created_user_id=created_user_id)
    db.add(a)
    db.commit()
    db.refresh(a)

    subject, html, text_body = _fm_invite_mail(name, email, data.role, current_user.name or current_user.email, password)
    sent, error = _fm_send_mail(email, subject, html, text_body, "Admin invite")
    return _fm_invite_result(a, sent, error, password)


@router.post("/fortimates/admins/{admin_id}/resend")
def fm_admin_resend(admin_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Re-sends the invite. For accounts created by an invite a NEW temporary password is generated."""
    _require_write(current_user, db, manage_admins=True)
    a = db.query(FmAdmin).filter(FmAdmin.id == admin_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Admin not found")
    password = None
    u = None
    if a.created_user_id:
        u = db.query(User).filter(User.id == a.created_user_id).first()
    else:
        # older invite rows have no link saved → find the login by email
        u = db.query(User).filter(User.email == a.email).first()
        if u and u.role == FM_INVITE_ROLE:
            a.created_user_id = u.id
    if u and u.role == FM_INVITE_ROLE:
        password = _fm_generate_password()
        u.password_hash = hash_password(password)
        u.is_active = 1
    elif u is None:
        # no EasyReach login exists for this email (e.g. invited before logins were created)
        # → create it now, same as a fresh invite
        password = _fm_generate_password()
        u = User(name=a.name[:100], email=a.email, password_hash=hash_password(password), role=FM_INVITE_ROLE,
                 school_id=None, is_active=1)
        db.add(u)
        db.flush()
        a.created_user_id = u.id
    db.commit()
    subject, html, text_body = _fm_invite_mail(a.name, a.email, a.role, current_user.name or current_user.email, password)
    sent, error = _fm_send_mail(a.email, subject, html, text_body, "Admin invite")
    return _fm_invite_result(a, sent, error, password)


@router.put("/fortimates/admins/{admin_id}")
def fm_admin_update(admin_id: int, data: FmAdminUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_write(current_user, db, manage_admins=True)
    a = db.query(FmAdmin).filter(FmAdmin.id == admin_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Admin not found")
    if data.role is not None:
        if data.role not in ADMIN_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")
        a.role = data.role
    if data.status is not None:
        if data.status not in ("Active", "Invited"):
            raise HTTPException(status_code=400, detail="Invalid status")
        a.status = data.status
    db.commit()
    return _admin_out(a)


@router.delete("/fortimates/admins/{admin_id}")
def fm_admin_remove(admin_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_write(current_user, db, manage_admins=True)
    a = db.query(FmAdmin).filter(FmAdmin.id == admin_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Admin not found")
    if a.email == current_user.email.lower():
        raise HTTPException(status_code=400, detail="You cannot remove your own access")
    # A login that was created only for this invite is locked (random password),
    # so the person can no longer sign in. Existing EasyReach accounts are not touched.
    if a.created_user_id:
        u = db.query(User).filter(User.id == a.created_user_id).first()
        if u and u.role == FM_INVITE_ROLE:
            u.password_hash = hash_password(secrets.token_urlsafe(32))
            u.is_active = 0
    db.delete(a)
    db.commit()
    return {"message": "Access removed"}


# ═══════════════════════════════════════════════
# CONFIGURATIONS (logged-in user's own settings)
# ═══════════════════════════════════════════════
def _settings_out(s: Optional[FmSetting], user: User):
    notif = dict(DEFAULT_NOTIFICATIONS)
    if s and s.notifications_json:
        try:
            notif.update(json.loads(s.notifications_json))
        except ValueError:
            pass
    return {
        "name": user.name, "email": user.email, "role": user.role,
        "display_name": (s.display_name if s and s.display_name else user.name),
        "alert_email": (s.alert_email if s and s.alert_email else user.email),
        "notifications": notif,
    }


@router.get("/fortimates/settings")
def fm_settings_get(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _fm_mark_active(db, current_user)
    s = db.query(FmSetting).filter(FmSetting.user_id == current_user.id).first()
    return _settings_out(s, current_user)


@router.put("/fortimates/settings")
def fm_settings_update(data: FmSettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(FmSetting).filter(FmSetting.user_id == current_user.id).first()
    if not s:
        s = FmSetting(user_id=current_user.id)
        db.add(s)
    if data.display_name is not None:
        name = data.display_name.strip()
        if not name or len(name) > 150:
            raise HTTPException(status_code=400, detail="Display name is required (max 150 characters)")
        s.display_name = name
    if data.alert_email is not None:
        email = data.alert_email.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            raise HTTPException(status_code=400, detail="Enter a valid alert email")
        s.alert_email = email
    if data.notifications is not None:
        clean = {k: bool(v) for k, v in data.notifications.items() if k in DEFAULT_NOTIFICATIONS}
        current = dict(DEFAULT_NOTIFICATIONS)
        if s.notifications_json:
            try:
                current.update(json.loads(s.notifications_json))
            except ValueError:
                pass
        current.update(clean)
        s.notifications_json = json.dumps(current)
    db.commit()
    return _settings_out(s, current_user)


@router.post("/fortimates/settings/password")
def fm_change_password(data: FmPasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Changes the EasyReach login password (same account used for FortiMates)
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated"}


# ─── FortiMates: applications with KYC documents ───────────────────────────
def _fm_doc_out(d: FmDocument):
    return {"id": d.id, "doc_type": d.doc_type, "label": FM_DOC_TYPES.get(d.doc_type, d.doc_type),
            "file_name": d.file_name, "file_size": d.file_size, "uploaded_by": d.uploaded_by,
            "created_at": _iso(d.created_at)}


def _fm_read_doc(f: UploadFile):
    original = os.path.basename(f.filename or "")
    ext = os.path.splitext(original)[1].lower()
    if ext not in FM_DOC_ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Only JPG, PNG or PDF allowed: {original}")
    content = f.file.read(FM_DOC_MAX_BYTES + 1)
    if len(content) > FM_DOC_MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"{original} is larger than 5 MB")
    if not content:
        raise HTTPException(status_code=400, detail=f"{original} is empty")
    return original, ext, content


def _fm_save_doc(db: Session, fm_user_id: int, doc_type: str, original: str, ext: str, content: bytes, by: str):
    folder = os.path.join(FM_UPLOAD_DIR, str(fm_user_id))
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, f"{doc_type}_{secrets.token_hex(8)}{ext}")
    with open(path, "wb") as fh:
        fh.write(content)
    doc = FmDocument(fm_user_id=fm_user_id, doc_type=doc_type, file_name=original, file_path=path,
                     file_size=len(content), uploaded_by=by)
    db.add(doc)
    return doc, path


@router.get("/fortimates/document-types")
def fm_document_types(current_user: User = Depends(get_current_user)):
    return {"types": FM_DOC_TYPES,
            "required": {ACCOUNT_TYPES[k]: v for k, v in FM_REQUIRED_DOC.items()}}


@router.post("/fortimates/applications")
def fm_create_application(
    name: str = Form(...),
    email: str = Form(...),
    type: str = Form(...),                   # With Passport / Without Passport / Corporate
    country: str = Form(""),
    phone: str = Form(""),
    id_number: str = Form(""),
    bank_name: str = Form(""),
    bank_category: str = Form(""),
    main_document: UploadFile = File(...),   # passport / govt ID / company registration (by type)
    address_proof: Optional[UploadFile] = File(None),
    bank_proof: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """New applicant + KYC documents in one step (Requests → New Application form)."""
    name, email = name.strip(), email.strip().lower()
    if not name or len(name) > 150:
        raise HTTPException(status_code=400, detail="Name is required (max 150 characters)")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if type not in ACCOUNT_TYPE_BY_LABEL:
        raise HTTPException(status_code=400, detail="Invalid account type")
    if phone.strip() and not re.match(r"^[0-9+\-\s]{7,20}$", phone.strip()):
        raise HTTPException(status_code=400, detail="Enter a valid phone number")
    if db.query(FmUser).filter(FmUser.email == email, FmUser.status == "pending").first():
        raise HTTPException(status_code=400, detail="A pending application with this email already exists")

    account_type = ACCOUNT_TYPE_BY_LABEL[type]
    # validate + read every file before touching the DB / disk
    prepared = [(FM_REQUIRED_DOC[account_type],) + _fm_read_doc(main_document)]
    if address_proof is not None and address_proof.filename:
        prepared.append(("address_proof",) + _fm_read_doc(address_proof))
    if bank_proof is not None and bank_proof.filename:
        prepared.append(("bank_proof",) + _fm_read_doc(bank_proof))

    u = FmUser(name=name, email=email, country=country.strip() or None, account_type=account_type,
               status="pending", phone=phone.strip() or None, id_number=id_number.strip() or None,
               bank_name=bank_name.strip() or None,
               bank_category=bank_category.strip() or ("Corporate" if account_type == "corporate" else "Retail"))
    db.add(u)
    db.flush()
    written = []
    try:
        for doc_type, original, ext, content in prepared:
            _, path = _fm_save_doc(db, u.id, doc_type, original, ext, content, current_user.email)
            written.append(path)
        db.commit()
    except Exception:
        db.rollback()
        for pth in written:
            try:
                os.remove(pth)
            except OSError:
                pass
        raise HTTPException(status_code=500, detail="Could not save the application documents")
    db.refresh(u)
    out = _user_out(u)
    out["documents"] = [_fm_doc_out(d) for d in db.query(FmDocument).filter(FmDocument.fm_user_id == u.id).all()]
    return out


@router.get("/fortimates/requests/{request_id}")
def fm_request_detail(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    u = db.query(FmUser).filter(FmUser.id == request_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Request not found")
    out = _user_out(u)
    docs = db.query(FmDocument).filter(FmDocument.fm_user_id == u.id).order_by(FmDocument.id).all()
    out["documents"] = [_fm_doc_out(d) for d in docs]
    required = FM_REQUIRED_DOC.get(u.account_type)
    out["required_document"] = {"doc_type": required, "label": FM_DOC_TYPES.get(required)} if required else None
    return out


@router.post("/fortimates/requests/{request_id}/documents")
def fm_upload_document(request_id: int, doc_type: str = Form(...), file: UploadFile = File(...),
                       db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    u = db.query(FmUser).filter(FmUser.id == request_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Request not found")
    if u.status != "pending":
        raise HTTPException(status_code=400, detail=f"This request is already {u.status}")
    if doc_type not in FM_DOC_TYPES:
        raise HTTPException(status_code=400, detail="Invalid document type")
    original, ext, content = _fm_read_doc(file)
    try:
        doc, path = _fm_save_doc(db, u.id, doc_type, original, ext, content, current_user.email)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save the document")
    db.refresh(doc)
    return _fm_doc_out(doc)


@router.get("/fortimates/documents/{doc_id}/download")
def fm_download_document(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = db.query(FmDocument).filter(FmDocument.id == doc_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    real = os.path.realpath(d.file_path)
    if not real.startswith(os.path.realpath(FM_UPLOAD_DIR) + os.sep) or not os.path.isfile(real):
        raise HTTPException(status_code=404, detail="Document file not found")
    media = {".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
    return FileResponse(real, filename=d.file_name,
                        media_type=media.get(os.path.splitext(real)[1].lower(), "application/octet-stream"),
                        content_disposition_type="inline")


@router.delete("/fortimates/documents/{doc_id}")
def fm_delete_document(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_write(current_user, db)
    d = db.query(FmDocument).filter(FmDocument.id == doc_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    u = db.query(FmUser).filter(FmUser.id == d.fm_user_id).first()
    if u and u.status != "pending":
        raise HTTPException(status_code=400, detail="Documents of a decided request cannot be removed")
    path = d.file_path
    db.delete(d)
    db.commit()
    try:
        real = os.path.realpath(path)
        if real.startswith(os.path.realpath(FM_UPLOAD_DIR) + os.sep):
            os.remove(real)
    except OSError:
        pass
    return {"message": "Document removed"}


# ═══════════════════════════════════════════════
# FORTIMATES — INBOX TRACKING (IMAP)
# Reads new mails from the mailbox (same Gmail + App password as SMTP), saves
# header + text into fm_mails (direction = "inbound") with category, location and
# a phishing risk score. Attachments are never downloaded — only their names are read.
#   FM_IMAP_HOST (default imap.gmail.com), FM_IMAP_PORT (993),
#   FM_IMAP_USER / FM_IMAP_PASSWORD (default: SMTP_USERNAME / SMTP_PASSWORD),
#   FM_IMAP_SYNC_MINUTES (auto sync interval, default 5; 0 = only "Sync now"),
#   FM_IMAP_INITIAL (how many latest mails the very first sync imports, default 50)
# ═══════════════════════════════════════════════
import threading as _fm_threading

_FM_SYNC_LOCK = _fm_threading.Lock()


class FmKV(Base):
    """Small key/value store — keeps inbox sync status across backend restarts."""
    __tablename__ = "fm_kv"
    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


try:
    Base.metadata.create_all(bind=engine, tables=[FmKV.__table__])
except Exception as _e:
    print(f"[FortiMates] fm_kv init failed: {_e}", flush=True)


def _fm_sync_state_get():
    db = SessionLocal()
    try:
        row = db.query(FmKV).filter(FmKV.key == "inbox_sync").first()
        return json.loads(row.value) if row and row.value else {}
    except Exception:
        return {}
    finally:
        db.close()


def _fm_sync_state_set(**kw):
    db = SessionLocal()
    try:
        row = db.query(FmKV).filter(FmKV.key == "inbox_sync").first()
        state = {}
        if row and row.value:
            try:
                state = json.loads(row.value)
            except ValueError:
                state = {}
        state.update(kw)
        if not row:
            row = FmKV(key="inbox_sync")
            db.add(row)
        row.value = json.dumps(state)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[FortiMates] could not save sync status: {e}", flush=True)
    finally:
        db.close()

FM_GMAIL_CATEGORIES = {   # Gmail tab → our category
    "social": "Social", "promotions": "Promotional", "updates": "Updates", "forums": "Forums",
}
FM_DANGEROUS_EXT = {".exe", ".scr", ".js", ".vbs", ".bat", ".cmd", ".com", ".jar", ".msi", ".ps1",
                    ".hta", ".iso", ".img", ".lnk", ".wsf", ".docm", ".xlsm", ".pptm"}
FM_SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "ow.ly", "cutt.ly", "rb.gy", "shorturl.at", "tiny.cc"}
FM_BRANDS = {"paypal": "paypal.com", "google": "google.com", "microsoft": "microsoft.com", "apple": "apple.com",
             "amazon": "amazon.com", "facebook": "facebook.com", "instagram": "instagram.com", "netflix": "netflix.com",
             "linkedin": "linkedin.com", "hdfcbank": "hdfcbank.com", "icicibank": "icicibank.com", "sbi": "sbi.co.in",
             "axisbank": "axisbank.com", "paytm": "paytm.com", "phonepe": "phonepe.com", "fortimates": "fortimates.com"}
FM_URGENT_PHRASES = ["verify your account", "account suspended", "account will be closed", "confirm your password",
                     "update your payment", "unusual sign-in", "urgent action", "act now", "within 24 hours",
                     "you have won", "claim your prize", "reset your password immediately", "kyc expired",
                     "your account is locked", "click here to verify"]


def _fm_imap_config():
    def env(*names, default=""):
        for n in names:
            v = os.environ.get(n, "")
            if v and v.strip():
                return v.strip()
        return default
    try:
        port = int(env("FM_IMAP_PORT", default="993"))
    except ValueError:
        port = 993
    return {
        "host": env("FM_IMAP_HOST", default="imap.gmail.com"),
        "port": port,
        "user": env("FM_IMAP_USER", "FM_SMTP_USER", "SMTP_USERNAME"),
        "password": env("FM_IMAP_PASSWORD", "FM_SMTP_PASSWORD", "SMTP_PASSWORD"),
    }


def _fm_decode(value) -> str:
    """Decode =?utf-8?...?= encoded headers."""
    from email.header import decode_header, make_header
    if not value:
        return ""
    try:
        return str(make_header(decode_header(str(value))))
    except Exception:
        return str(value)


def _fm_domain(addr: str) -> str:
    return addr.rsplit("@", 1)[-1].lower().strip(" >") if addr and "@" in addr else ""


def _fm_base_domain(domain: str) -> str:
    parts = [p for p in (domain or "").lower().split(".") if p]
    if len(parts) >= 3 and parts[-2] in ("co", "com", "org", "net", "gov", "ac") and len(parts[-1]) == 2:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def _fm_public_ip_from_received(msg):
    """Earliest public IP in the Received chain = sender's server (approximate)."""
    import ipaddress
    received = msg.get_all("Received") or []
    for header in reversed(received):          # bottom-most header = first hop
        for ip in re.findall(r"\[(\d{1,3}(?:\.\d{1,3}){3})\]", str(header)) + \
                re.findall(r"\((?:[^()]*\s)?(\d{1,3}(?:\.\d{1,3}){3})\)", str(header)):
            try:
                if ipaddress.ip_address(ip).is_global:
                    return ip
            except ValueError:
                continue
    return None


def _fm_geo(ip, cache):
    if not ip:
        return None
    if ip in cache:
        return cache[ip]
    loc = None
    try:
        if cache.get("__lookups__", 0) >= 40:      # ip-api free limit is 45 per minute
            return None
        cache["__lookups__"] = cache.get("__lookups__", 0) + 1
        with urllib.request.urlopen(f"http://ip-api.com/json/{ip}?fields=status,city,countryCode", timeout=3) as r:
            d = json.loads(r.read().decode("utf-8", "replace"))
        if d.get("status") == "success":
            loc = ", ".join([x for x in (d.get("city"), d.get("countryCode")) if x]) or None
    except Exception:
        loc = None
    cache[ip] = loc
    return loc


def _fm_message_text(msg, limit=20000):
    """Plain text (or stripped HTML) + raw HTML + attachment names. Attachments are not read."""
    from html import unescape
    text, html, attachments = "", "", []
    for part in (msg.walk() if msg.is_multipart() else [msg]):
        if part.is_multipart():
            continue
        disp = (part.get_content_disposition() or "").lower()
        fname = part.get_filename()
        if disp == "attachment" or fname:
            if fname:
                attachments.append(_fm_decode(fname))
            continue
        ctype = part.get_content_type()
        if ctype not in ("text/plain", "text/html"):
            continue
        try:
            payload = part.get_payload(decode=True) or b""
            body = payload[:limit * 4].decode(part.get_content_charset() or "utf-8", "replace")
        except Exception:
            continue
        if ctype == "text/plain" and not text:
            text = body
        elif ctype == "text/html" and not html:
            html = body
    if not text and html:
        text = unescape(re.sub(r"<[^>]+>", " ", re.sub(r"(?is)<(script|style).*?</\1>", " ", html)))
    return " ".join(text.split())[:limit], html[:limit * 4], attachments


def _fm_mail_risk(msg, from_name, from_addr, text, html, attachments, in_spam):
    """Returns (risk, reasons). Score: 0-1 Low, 2-3 Medium, 4+ High."""
    score, reasons = 0, []
    from_domain = _fm_domain(from_addr)

    auth = " ".join(str(h) for h in (msg.get_all("Authentication-Results") or [])).lower()
    if auth:
        if re.search(r"\bdmarc=fail", auth):
            score += 3; reasons.append("DMARC check failed — sender domain may be spoofed")
        if re.search(r"\bspf=(fail|softfail)", auth):
            score += 2; reasons.append("SPF check failed — not sent from the domain's real mail server")
        if re.search(r"\bdkim=(fail|none|neutral)", auth) or "dkim=" not in auth:
            score += 1; reasons.append("No valid DKIM signature")

    if in_spam:
        score += 3; reasons.append("Gmail placed this mail in Spam")

    reply_to = _fm_decode(msg.get("Reply-To", ""))
    if reply_to:
        from email.utils import parseaddr
        rt_domain = _fm_domain(parseaddr(reply_to)[1])
        if rt_domain and from_domain and _fm_base_domain(rt_domain) != _fm_base_domain(from_domain):
            score += 2; reasons.append(f"Reply-To goes to a different domain ({rt_domain})")

    # display name pretends to be someone else
    shown = re.search(r"[\w.+-]+@([\w-]+(?:\.[\w-]+)+)", from_name or "")
    if shown and from_domain and _fm_base_domain(shown.group(1)) != _fm_base_domain(from_domain):
        score += 2; reasons.append("Display name shows a different email address")
    name_l = re.sub(r"[^a-z]", "", (from_name or "").lower())
    for brand, real in FM_BRANDS.items():
        if brand in name_l and from_domain and _fm_base_domain(from_domain) != real:
            score += 2; reasons.append(f"Name says '{brand}' but mail is from {from_domain}")
            break

    # lookalike sender domain (paypa1.com, g00gle.com)
    if from_domain:
        label = _fm_base_domain(from_domain).split(".")[0]
        normal = label.replace("0", "o").replace("1", "l").replace("3", "e").replace("5", "s").replace("rn", "m").replace("vv", "w")
        for brand, real in FM_BRANDS.items():
            if normal == brand and _fm_base_domain(from_domain) != real:
                score += 3; reasons.append(f"Lookalike domain imitating {real}")
                break

    # attachments
    bad = [a for a in attachments if os.path.splitext(a.lower())[1] in FM_DANGEROUS_EXT]
    if bad:
        score += 3; reasons.append("Risky attachment: " + ", ".join(bad[:3]))

    # links
    links = re.findall(r"""href\s*=\s*["']([^"']+)["']""", html or "", flags=re.I) + \
        re.findall(r"https?://[^\s<>\"']+", text or "")
    hosts = set()
    for u in links:
        m = re.match(r"https?://([^/:?#\s]+)", u.strip(), flags=re.I)
        if m:
            hosts.add(m.group(1).lower())
    if any(re.fullmatch(r"\d{1,3}(?:\.\d{1,3}){3}", h) for h in hosts):
        score += 2; reasons.append("Link points to a raw IP address")
    if hosts & FM_SHORTENERS:
        score += 1; reasons.append("Uses a link shortener")
    for href, label in re.findall(r"""<a[^>]+href\s*=\s*["'](https?://[^"']+)["'][^>]*>(.*?)</a>""", html or "", flags=re.I | re.S):
        shown_host = re.search(r"(?:https?://)?((?:[\w-]+\.)+[a-z]{2,})", re.sub(r"<[^>]+>", "", label), flags=re.I)
        real_host = re.match(r"https?://([^/:?#]+)", href, flags=re.I)
        if shown_host and real_host and _fm_base_domain(shown_host.group(1)) != _fm_base_domain(real_host.group(1)):
            score += 2; reasons.append(f"Link text shows {shown_host.group(1)} but opens {real_host.group(1)}")
            break

    # urgency / phishing wording
    body_l = ((text or "") + " " + _fm_decode(msg.get("Subject", ""))).lower()
    hits = [p for p in FM_URGENT_PHRASES if p in body_l]
    if hits:
        score += min(2, len(hits)); reasons.append("Pressure wording: " + ", ".join(hits[:3]))

    risk = "High" if score >= 4 else "Medium" if score >= 2 else "Low"
    return risk, reasons


def _fm_imap_folders(imap):
    """INBOX + the Spam/Junk folder (name differs by language, found by its \\Junk flag)."""
    folders = [("INBOX", False)]
    try:
        typ, data = imap.list()
        for line in data or []:
            line = line.decode("utf-8", "replace") if isinstance(line, bytes) else str(line)
            if "\\Junk" in line or "\\Spam" in line:
                name = line.rsplit(' "/" ', 1)[-1].strip()
                folders.append((name, True))
                break
    except Exception:
        pass
    return folders


def _fm_sync_inbox():
    """One sync run. Returns number of new mails saved. Safe to call from a thread."""
    import imaplib
    import email as _email
    from email.utils import parseaddr, parsedate_to_datetime
    from datetime import timezone

    if not _FM_SYNC_LOCK.acquire(blocking=False):
        return 0   # another sync is already running
    started = datetime.utcnow()
    print("[FortiMates] inbox sync started", flush=True)
    added = 0
    skipped = 0
    error_msg = None
    db = SessionLocal()
    try:
        cfg = _fm_imap_config()
        if not cfg["user"] or not cfg["password"]:
            raise RuntimeError("Mailbox is not configured (SMTP_USERNAME / SMTP_PASSWORD missing)")
        try:
            initial = max(1, min(int(os.environ.get("FM_IMAP_INITIAL", "50")), 500))
        except ValueError:
            initial = 50
        geo_cache = {}
        imap = imaplib.IMAP4_SSL(cfg["host"], cfg["port"], timeout=30)
        try:
            imap.login(cfg["user"], cfg["password"])
            for folder, in_spam in _fm_imap_folders(imap):
                typ, _ = imap.select(f'"{folder}"' if " " in folder and not folder.startswith('"') else folder, readonly=True)
                if typ != "OK":
                    continue
                last_uid = db.query(func.max(FmMail.imap_uid)).filter(
                    FmMail.direction == "inbound", FmMail.imap_folder == folder).scalar() or 0
                typ, data = imap.uid("search", None, f"UID {int(last_uid) + 1}:*" if last_uid else "ALL")
                uids = [int(u) for u in (data[0].split() if data and data[0] else []) if int(u) > last_uid]
                if not uids:
                    continue
                uids = sorted(uids)[-(initial if not last_uid else 200):]

                # Gmail tabs (only Gmail supports X-GM-RAW; other servers → everything is Primary)
                cat_of = {}
                if not in_spam:
                    lo, hi = uids[0], uids[-1]
                    for tab, label in FM_GMAIL_CATEGORIES.items():
                        try:
                            t, d = imap.uid("search", None, f"UID {lo}:{hi}", "X-GM-RAW", f'"category:{tab}"')
                            for u in (d[0].split() if d and d[0] else []):
                                cat_of[int(u)] = label
                        except Exception:
                            break

                print(f"[FortiMates]   {folder}: {len(uids)} new mail(s) to read", flush=True)
                for uid in uids:
                  try:
                    t, d = imap.uid("fetch", str(uid), "(RFC822.SIZE)")
                    size = 0
                    m = re.search(rb"RFC822\.SIZE (\d+)", d[0] if d and isinstance(d[0], bytes) else b"")
                    if m:
                        size = int(m.group(1))
                    # big mails (attachments): read only the header + first 200 KB of the body
                    part = "BODY.PEEK[]" if size and size <= 3_000_000 else "BODY.PEEK[]<0.200000>"
                    t, d = imap.uid("fetch", str(uid), f"({part})")
                    raw = next((x[1] for x in (d or []) if isinstance(x, tuple)), None)
                    if not raw:
                        continue
                    msg = _email.message_from_bytes(raw)
                    from_name, from_addr = parseaddr(_fm_decode(msg.get("From", "")))
                    subject = _fm_decode(msg.get("Subject", "")) or "(no subject)"
                    text, html, attachments = _fm_message_text(msg)
                    try:
                        when = parsedate_to_datetime(msg.get("Date"))
                        if when.tzinfo:
                            when = when.astimezone(timezone.utc).replace(tzinfo=None)
                    except Exception:
                        when = datetime.utcnow()
                    risk, reasons = _fm_mail_risk(msg, from_name, from_addr, text, html, attachments, in_spam)
                    location = _fm_geo(_fm_public_ip_from_received(msg), geo_cache) or "Unknown"
                    db.add(FmMail(
                        message_id=f"{uid}", sender_name=(from_name or from_addr)[:150] or None,
                        email=(from_addr or "")[:150] or None, to_email=(cfg["user"] or "")[:150],
                        subject=subject[:255], message=text[:500], location=location[:100],
                        category="Spams" if in_spam else cat_of.get(uid, "Primary"),
                        status="Received", risk=risk, risk_reasons=json.dumps(reasons),
                        direction="inbound", imap_folder=folder[:50], imap_uid=uid, created_at=when,
                    ))
                    db.commit()
                    added += 1
                  except Exception as mail_err:
                    # one broken mail must not stop the whole sync
                    db.rollback()
                    skipped += 1
                    print(f"[FortiMates]   skipped mail UID {uid} in {folder}: {mail_err}", flush=True)
        finally:
            try:
                imap.logout()
            except Exception:
                pass
    except Exception as e:
        db.rollback()
        msg = str(e)
        if "AUTHENTICATIONFAILED" in msg.upper() or "Invalid credentials" in msg:
            msg = "Mailbox login failed — check the Gmail address / App password, and that IMAP is enabled in Gmail settings"
        elif "timed out" in msg.lower() or "getaddrinfo" in msg.lower():
            msg = f"Could not reach the mail server ({msg})"
        error_msg = msg[:300]
    finally:
        db.close()
        _fm_sync_state_set(last_sync_at=datetime.utcnow().isoformat(), last_added=added,
                           last_skipped=skipped, last_error=error_msg)
        print(f"[FortiMates] inbox sync finished: {added} new, {skipped} skipped"
              + (f", ERROR: {error_msg}" if error_msg else "")
              + f" ({(datetime.utcnow() - started).seconds}s)", flush=True)
        _FM_SYNC_LOCK.release()
    return added


def _fm_auto_sync_loop():
    import time as _time
    _time.sleep(20)   # let the app finish starting
    while True:
        try:
            minutes = float(os.environ.get("FM_IMAP_SYNC_MINUTES", "5"))
        except ValueError:
            minutes = 5
        if minutes > 0:
            _fm_sync_inbox()
            _time.sleep(max(60, minutes * 60))
        else:
            _time.sleep(300)


if os.environ.get("FM_IMAP_SYNC_MINUTES", "5") not in ("0", "0.0"):
    print(f"[FortiMates] inbox auto-sync every {os.environ.get('FM_IMAP_SYNC_MINUTES', '5')} min (first run ~20s after start)", flush=True)
    _fm_threading.Thread(target=_fm_auto_sync_loop, name="fortimates-inbox-sync", daemon=True).start()


@router.post("/fortimates/mails/sync")
def fm_mails_sync(current_user: User = Depends(get_current_user)):
    """'Sync now' — starts one inbox sync in the background and returns at once;
    the page polls /mails/sync-status until running = false."""
    if not _FM_SYNC_LOCK.locked():
        _fm_threading.Thread(target=_fm_sync_inbox, name="fortimates-inbox-sync-now", daemon=True).start()
    return {"started": True, **_fm_sync_status_out(force_running=True)}


def _fm_sync_status_out(force_running: bool = False):
    cfg = _fm_imap_config()
    st = _fm_sync_state_get()
    return {"mailbox": cfg["user"] or None, "last_sync_at": st.get("last_sync_at"),
            "last_error": st.get("last_error"), "last_added": st.get("last_added", 0),
            "last_skipped": st.get("last_skipped", 0),
            "running": force_running or _FM_SYNC_LOCK.locked()}


@router.get("/fortimates/mails/sync-status")
def fm_mails_sync_status(current_user: User = Depends(get_current_user)):
    return _fm_sync_status_out()


@router.get("/fortimates/mails/stats")
def fm_mails_stats(direction: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Donut data for one tab: inbound → by category, outbound → by mail type."""
    q = db.query(FmMail.category, func.count(FmMail.id))
    if direction == "inbound":
        q = q.filter(FmMail.direction == "inbound")
    elif direction == "outbound":
        q = q.filter(or_(FmMail.direction == "outbound", FmMail.direction.is_(None)))
    counts = dict(q.group_by(FmMail.category).all())
    total = sum(counts.values())
    split = [{"name": c or "Other", "value": n, "count": n} for c, n in sorted(counts.items(), key=lambda kv: -kv[1])]
    risk = {}
    if direction == "inbound":
        risk = dict(db.query(FmMail.risk, func.count(FmMail.id)).filter(FmMail.direction == "inbound").group_by(FmMail.risk).all())
    return {"total": total, "split": split, "risk": risk}