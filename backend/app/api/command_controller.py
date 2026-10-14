from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.models.command_model import Command
from app.models.school_model import School
from app.models.log_model import SchoolLog
from app.api.auth_controller import get_current_user
from app.models.user_model import User

router = APIRouter()

class CommandCreate(BaseModel):
    school_id: int
    command_type: str
    payload_json: Optional[dict] = None

class CommandResult(BaseModel):
    status: str
    result_json: Optional[dict] = None

@router.post("/")
def create_command(
    cmd: CommandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    school = db.query(School).filter(School.id == cmd.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    command = Command(
        school_id=cmd.school_id,
        command_type=cmd.command_type,
        payload_json=cmd.payload_json,
        status="pending",
        created_by=current_user.email
    )
    db.add(command)

    log = SchoolLog(
        school_id=cmd.school_id,
        log_type="command",
        message=f"Command {cmd.command_type} issued by {current_user.email}"
    )
    db.add(log)
    db.commit()
    db.refresh(command)
    return {"message": "Command queued", "id": command.id}

@router.get("/pending/{school_id}")
def get_pending_commands(school_id: int, token: str, db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school or school.agent_token != token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    commands = db.query(Command).filter(
        Command.school_id == school_id,
        Command.status == "pending"
    ).all()

    for cmd in commands:
        cmd.status = "executing"
    db.commit()

    return commands

@router.put("/{command_id}/result")
def update_command_result(
    command_id: int,
    result: CommandResult,
    token: str,
    db: Session = Depends(get_db)
):
    command = db.query(Command).filter(Command.id == command_id).first()
    if not command:
        raise HTTPException(status_code=404, detail="Command not found")

    school = db.query(School).filter(School.id == command.school_id).first()
    if not school or school.agent_token != token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    command.status = result.status
    command.result_json = result.result_json
    command.executed_at = datetime.utcnow()

    log = SchoolLog(
        school_id=command.school_id,
        log_type="command_result",
        message=f"Command {command.command_type} {result.status}",
        details_json=result.result_json
    )
    db.add(log)
    db.commit()
    return {"message": "Result updated"}

@router.get("/{school_id}")
def get_school_commands(
    school_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    commands = db.query(Command).filter(
        Command.school_id == school_id
    ).order_by(Command.created_at.desc()).limit(20).all()
    return commands