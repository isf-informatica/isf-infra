from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.models.school_model import School
from app.models.command_model import Command
from app.models.log_model import SchoolLog
from app.api.auth_controller import get_current_user
from app.models.user_model import User

router = APIRouter()

class KillRequest(BaseModel):
    reason: Optional[str] = None
    confirmation_code: Optional[str] = None

@router.post("/{school_id}/level/{level}")
def kill_school(
    school_id: int,
    level: int,
    kill_data: KillRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "developer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if level not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Invalid kill level")

    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # Level 3 needs confirmation code
    if level == 3:
        expected = f"CONFIRM WIPE {school.code.upper()}"
        if kill_data.confirmation_code != expected:
            raise HTTPException(
                status_code=400,
                detail=f"Type exactly: {expected}"
            )

    # Map level to command
    command_map = {
        1: "KILL_1",
        2: "KILL_2",
        3: "KILL_3"
    }

    # Queue command
    command = Command(
        school_id=school_id,
        command_type=command_map[level],
        payload_json={"reason": kill_data.reason},
        status="pending",
        created_by=current_user.email
    )
    db.add(command)

    # Update school status
    school.kill_level = level
    school.status = "killed"

    # Log
    log = SchoolLog(
        school_id=school_id,
        log_type="kill",
        message=f"Level {level} kill triggered by {current_user.email}. Reason: {kill_data.reason}"
    )
    db.add(log)
    db.commit()

    return {
        "message": f"Level {level} kill switch activated",
        "school": school.name,
        "command_id": command.id
    }

@router.post("/{school_id}/restore/{level}")
def restore_school(
    school_id: int,
    level: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "developer"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if level not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Invalid restore level")

    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    command_map = {
        1: "RESTORE_1",
        2: "RESTORE_2",
        3: "RESTORE_3"
    }

    command = Command(
        school_id=school_id,
        command_type=command_map[level],
        payload_json={},
        status="pending",
        created_by=current_user.email
    )
    db.add(command)

    school.kill_level = 0
    school.status = "active"

    log = SchoolLog(
        school_id=school_id,
        log_type="restore",
        message=f"Level {level} restore triggered by {current_user.email}"
    )
    db.add(log)
    db.commit()

    return {
        "message": f"Level {level} restore initiated",
        "school": school.name,
        "command_id": command.id
    }