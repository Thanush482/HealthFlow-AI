"""
C. Real-Time Hospital State Intelligence layer.

Maintains the live normalized bed/patient state (in SQLite) and pushes
updates to connected clinician dashboards over WebSocket whenever an
event (admission, discharge, cleaning, maintenance, condition change)
causes the optimization engine to recalculate. A lightweight in-process
ConnectionManager stands in for a full message-broker (Redis/RabbitMQ)
deployment, which is the documented production path for this layer.
"""
import json
from typing import List
from fastapi import WebSocket
from sqlalchemy.orm import Session

from .. import models
from . import allocation, audit


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


def _patient_to_dict(p: models.Patient) -> dict:
    return {
        "id": p.id,
        "esi_level": p.esi_level,
        "required_ward": p.required_ward,
        "required_equipment": p.required_equipment or [],
        "isolation_required": p.isolation_required,
        "status": p.status,
    }


def _bed_to_dict(b: models.Bed) -> dict:
    return {
        "id": b.id,
        "ward_id": b.ward_id,
        "equipment": b.equipment or [],
        "isolation": b.isolation,
        "nursing_station_distance": b.nursing_station_distance,
        "status": b.status,
    }


def recalculate_allocations(db: Session, reason: str, hospital_id: str = None) -> dict:
    """
    Recompute the optimal patient-bed assignment across waiting patients and
    available beds WITHIN A SINGLE HOSPITAL (each hospital's capacity is
    independent), apply the results to the DB, and log an audit entry.
    If hospital_id is omitted, recalculates across every hospital that has
    at least one waiting patient (used after cross-cutting DB seeding).
    """
    if hospital_id:
        hospital_ids = [hospital_id]
    else:
        hospital_ids = [
            row[0]
            for row in db.query(models.Patient.hospital_id)
            .filter(models.Patient.status == "waiting", models.Patient.hospital_id.isnot(None))
            .distinct()
            .all()
        ]

    all_assignments = []
    for hid in hospital_ids:
        waiting_patients = (
            db.query(models.Patient)
            .filter(models.Patient.status == "waiting", models.Patient.hospital_id == hid)
            .order_by(models.Patient.esi_level.asc(), models.Patient.created_at.asc())
            .all()
        )
        all_beds = db.query(models.Bed).filter(models.Bed.hospital_id == hid).all()

        if not waiting_patients:
            continue

        patient_dicts = [_patient_to_dict(p) for p in waiting_patients]
        bed_dicts = [_bed_to_dict(b) for b in all_beds]

        results = allocation.optimize_allocation(patient_dicts, bed_dicts)

        for p in waiting_patients:
            r = results[p.id]
            p.allocation_explanation = r["explanation"]
            if r["bed_id"]:
                p.assigned_bed_id = r["bed_id"]
                p.status = "admitted"
                bed = next(b for b in all_beds if b.id == r["bed_id"])
                bed.status = "occupied"
                bed.occupant_patient_id = p.id
                all_assignments.append({"patient_id": p.id, "patient_name": p.name, "bed_id": r["bed_id"], "score": r["score"], "hospital_id": hid})
                audit.log(
                    db,
                    "allocation",
                    f"Patient {p.name} (ESI-{p.esi_level}) assigned to bed {r['bed_id']} — {reason}",
                    patient_id=p.id,
                    bed_id=r["bed_id"],
                    hospital_id=hid,
                    detail=r["explanation"],
                )
            else:
                p.assigned_bed_id = None

    db.commit()
    return {"reason": reason, "assignments": all_assignments}
