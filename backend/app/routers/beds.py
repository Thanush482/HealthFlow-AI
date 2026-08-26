from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import require_permission, TokenData
from ..services import audit, state

router = APIRouter(prefix="/api/beds", tags=["beds"])

_VALID_TRANSITIONS = {
    "discharge": "cleaning",       # occupied -> cleaning (bed needs turnover)
    "start_cleaning": "cleaning",
    "finish_cleaning": "available",
    "maintenance": "maintenance",
    "restore": "available",
    "cancel_reservation": "available",
}


@router.get("", response_model=list[schemas.BedOut])
def list_beds(hospital_id: str = None, db: Session = Depends(get_db)):
    q = db.query(models.Bed)
    if hospital_id:
        q = q.filter(models.Bed.hospital_id == hospital_id)
    return q.all()


@router.post("/{bed_id}/event", response_model=schemas.BedOut)
async def bed_event(
    bed_id: str,
    payload: schemas.BedEvent,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("bed_event")),
):
    bed = db.query(models.Bed).filter(models.Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(404, "Bed not found")

    if payload.event not in _VALID_TRANSITIONS:
        raise HTTPException(400, f"Unknown event '{payload.event}'")

    new_status = _VALID_TRANSITIONS[payload.event]
    old_status = bed.status

    if payload.event == "discharge":
        if bed.occupant_patient_id:
            occupant = db.query(models.Patient).filter(models.Patient.id == bed.occupant_patient_id).first()
            if occupant:
                occupant.status = "discharged"
        bed.occupant_patient_id = None

    if payload.event == "cancel_reservation":
        if bed.occupant_patient_id:
            occupant = db.query(models.Patient).filter(models.Patient.id == bed.occupant_patient_id).first()
            if occupant:
                occupant.status = "waiting"
                occupant.assigned_bed_id = None
        bed.occupant_patient_id = None

    bed.status = new_status
    db.commit()
    db.refresh(bed)

    audit.log(
        db,
        "state_event",
        f"Bed {bed_id} transitioned {old_status} -> {new_status} ({payload.event}) by {user.name} ({user.role})",
        bed_id=bed_id,
        hospital_id=bed.hospital_id,
        detail={"event": payload.event, "old_status": old_status, "new_status": new_status, "actor": user.name},
    )

    # C. Recalculate allocation since capacity changed (scoped to this bed's hospital)
    summary = state.recalculate_allocations(db, reason=f"Bed {bed_id} event: {payload.event}", hospital_id=bed.hospital_id)
    await state.manager.broadcast({"type": "allocation_update", "hospital_id": bed.hospital_id, **summary})
    await state.manager.broadcast({"type": "bed_update", "bed_id": bed_id, "hospital_id": bed.hospital_id, "status": new_status})

    return bed
