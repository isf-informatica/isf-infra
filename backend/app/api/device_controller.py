from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.models.device_model import Device
from app.models.school_model import School
from app.api.auth_controller import get_current_user
from app.models.user_model import User

router = APIRouter()

class DeviceCreate(BaseModel):
    name: str
    device_type: str = "system"
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    os: Optional[str] = None
    notes: Optional[str] = None

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    os: Optional[str] = None
    notes: Optional[str] = None

class PingUpdate(BaseModel):
    token: str
    status: str = "online"

@router.get("/{school_id}/devices")
def get_devices(
    school_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    devices = db.query(Device).filter(Device.school_id == school_id).all()

    server = [d for d in devices if d.device_type == "server"]
    systems = [d for d in devices if d.device_type == "system"]

    return {
        "server": server,
        "systems": systems
    }

@router.post("/{school_id}/devices")
def add_device(
    school_id: int,
    device_data: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    device = Device(
        school_id=school_id,
        name=device_data.name,
        device_type=device_data.device_type,
        ip_address=device_data.ip_address,
        mac_address=device_data.mac_address,
        os=device_data.os,
        notes=device_data.notes,
        status="offline"
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return {"message": "Device added", "id": device.id}

@router.put("/{school_id}/devices/{device_id}")
def update_device(
    school_id: int,
    device_id: int,
    device_data: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.school_id == school_id
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    for key, value in device_data.dict(exclude_unset=True).items():
        setattr(device, key, value)

    db.commit()
    db.refresh(device)
    return {"message": "Device updated"}

@router.delete("/{school_id}/devices/{device_id}")
def delete_device(
    school_id: int,
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.school_id == school_id
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    db.delete(device)
    db.commit()
    return {"message": "Device deleted"}

@router.post("/{school_id}/devices/{device_id}/ping")
def device_ping(
    school_id: int,
    device_id: int,
    ping: PingUpdate,
    db: Session = Depends(get_db)
):
    school = db.query(School).filter(School.id == school_id).first()
    if not school or school.agent_token != ping.token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    device = db.query(Device).filter(
        Device.id == device_id,
        Device.school_id == school_id
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.status = ping.status
    device.last_seen = datetime.utcnow()
    db.commit()
    return {"message": "Ping received"}