from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import (
    auth_controller,
    school_controller,
    command_controller,
    status_controller,
    kill_controller,
    config_controller,
    agent_controller,
    setup_controller,
    device_controller
)
import app.models

app = FastAPI(
    title="EasyReach API",
    description="ISF MediaSync - On-Premise Media Server Management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://easyreach.easylearn.org.in",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_controller.router, prefix="/api/auth", tags=["Auth"])
app.include_router(school_controller.router, prefix="/api/schools", tags=["Institutions"])
app.include_router(command_controller.router, prefix="/api/commands", tags=["Commands"])
app.include_router(status_controller.router, prefix="/api/status", tags=["Status"])
app.include_router(kill_controller.router, prefix="/api/kill", tags=["Kill Switch"])
app.include_router(config_controller.router, prefix="/api/config", tags=["Config Generator"])
app.include_router(agent_controller.router, prefix="/api/agent", tags=["Agent"])
app.include_router(setup_controller.router, prefix="/api/setup", tags=["Setup"])
app.include_router(device_controller.router, prefix="/api/schools", tags=["Devices"])

@app.get("/")
def root():
    return {"message": "EasyReach API Running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}