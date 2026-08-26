"""
Lightweight role-based auth for the demo.

Uses JWT bearer tokens issued at /api/auth/login. Three demo roles reflect
the target users named in the problem statement: doctor (clinical triage
authority), nurse (bed/ward operations), admin (full access + audit).

This is intentionally simple (in-memory demo credentials, no password
hashing infra) since the MVP scope explicitly uses synthetic/demo data —
but the JWT + role-dependency mechanism itself is production-shaped and
can be swapped to a real user store without changing route code.
"""
import datetime
import os
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

SECRET_KEY = os.environ.get("HEALTHFLOW_JWT_SECRET", "healthflow-ai-demo-secret-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 12

# Demo user directory. Password is intentionally shown in the login UI
# (quick-fill buttons) since this is a hackathon demo, not a production
# credential store.
DEMO_USERS = {
    "doctor": {"password": "doctor123", "name": "Dr. Sarah Jain", "role": "doctor"},
    "nurse": {"password": "nurse123", "name": "Nurse Alex Menon", "role": "nurse"},
    "admin": {"password": "admin123", "name": "Admin Priya Rao", "role": "admin"},
    "ambulance": {"password": "ambulance123", "name": "Ambulance Unit 7", "role": "ambulance"},
}

# What each role is permitted to do. Enforced server-side via require_role().
ROLE_PERMISSIONS = {
    "doctor": {"intake", "condition_change", "view", "medical_records"},
    "nurse": {"bed_event", "view", "medical_records", "ambulance_confirm"},
    "admin": {"intake", "condition_change", "bed_event", "view", "export", "medical_records", "hospital_admin", "ambulance_confirm"},
    "ambulance": {"ambulance_dispatch", "ambulance_confirm", "view"},
    "patient": {"view_own"},
}

security = HTTPBearer(auto_error=False)


class TokenData(BaseModel):
    username: str
    name: str
    role: str


def create_token(username: str, name: str, role: str) -> str:
    payload = {
        "sub": username,
        "name": name,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return TokenData(username=payload["sub"], name=payload["name"], role=payload["role"])


def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> TokenData:
    if creds is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return decode_token(creds.credentials)


def require_permission(permission: str):
    """FastAPI dependency factory: raises 403 unless the caller's role has this permission."""

    def _check(user: TokenData = Depends(get_current_user)) -> TokenData:
        allowed = ROLE_PERMISSIONS.get(user.role, set())
        if permission not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' is not permitted to perform '{permission}'",
            )
        return user

    return _check
