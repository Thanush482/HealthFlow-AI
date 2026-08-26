"""
D. Audit & Explainability layer.

Every decision (intake extraction, triage classification, red-flag
override, allocation, reallocation, hospital-state event) is written to
an append-only audit log with full rationale, so authorized staff can
review why the system did what it did.
"""
from sqlalchemy.orm import Session
from ..models import AuditEntry


def log(db: Session, event_type: str, summary: str, patient_id: str = None, bed_id: str = None, hospital_id: str = None, detail: dict = None):
    entry = AuditEntry(
        event_type=event_type,
        patient_id=patient_id,
        bed_id=bed_id,
        hospital_id=hospital_id,
        summary=summary,
        detail=detail or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
