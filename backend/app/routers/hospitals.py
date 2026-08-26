from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from .. import models, schemas
from ..database import get_db
from ..auth import require_permission, TokenData

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


def _with_capacity(db: Session, h: models.Hospital) -> schemas.HospitalWithCapacity:
    beds = db.query(models.Bed).filter(models.Bed.hospital_id == h.id).all()
    total = len(beds)
    available = sum(1 for b in beds if b.status == "available")
    return schemas.HospitalWithCapacity(
        id=h.id, name=h.name, address=h.address, latitude=h.latitude, longitude=h.longitude, phone=h.phone,
        total_beds=total, available_beds=available,
    )


@router.get("", response_model=list[schemas.HospitalWithCapacity])
def list_hospitals(db: Session = Depends(get_db)):
    hospitals = db.query(models.Hospital).all()
    return [_with_capacity(db, h) for h in hospitals]


@router.get("/{hospital_id}", response_model=schemas.HospitalWithCapacity)
def get_hospital(hospital_id: str, db: Session = Depends(get_db)):
    h = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(404, "Hospital not found")
    return _with_capacity(db, h)


@router.post("", response_model=schemas.HospitalOut)
def create_hospital(
    payload: schemas.HospitalCreate,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("hospital_admin")),
):
    h = models.Hospital(id=f"HOSP-{uuid.uuid4().hex[:5].upper()}", **payload.dict())
    db.add(h)
    db.commit()
    db.refresh(h)
    return h
