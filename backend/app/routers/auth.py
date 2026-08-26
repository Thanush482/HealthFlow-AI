from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import DEMO_USERS, create_token
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class PatientLoginRequest(BaseModel):
    patient_id: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    name: str
    role: str


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    user = DEMO_USERS.get(payload.username.lower())
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token(payload.username.lower(), user["name"], user["role"])
    return LoginResponse(token=token, username=payload.username.lower(), name=user["name"], role=user["role"])


@router.post("/patient-login", response_model=LoginResponse)
def patient_login(payload: PatientLoginRequest, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == payload.patient_id.upper()).first()
    if not patient or patient.portal_password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid patient ID or password")
    token = create_token(patient.id, patient.name, "patient")
    return LoginResponse(token=token, username=patient.id, name=patient.name, role="patient")


@router.get("/demo-accounts")
def demo_accounts():
    """Exposes the demo credentials so the frontend can render one-tap login buttons."""
    return [
        {"username": u, "password": v["password"], "name": v["name"], "role": v["role"]}
        for u, v in DEMO_USERS.items()
    ]
