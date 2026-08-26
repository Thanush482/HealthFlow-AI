import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import require_permission, TokenData

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("", response_model=list[schemas.AuditOut])
def get_audit_log(limit: int = 200, db: Session = Depends(get_db)):
    entries = (
        db.query(models.AuditEntry)
        .order_by(models.AuditEntry.timestamp.desc())
        .limit(limit)
        .all()
    )
    return entries


@router.get("/export")
def export_audit_csv(
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("export")),
):
    """Regulator-ready CSV export of the full decision trail (Admin only)."""
    entries = db.query(models.AuditEntry).order_by(models.AuditEntry.timestamp.asc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "timestamp", "event_type", "patient_id", "bed_id", "summary"])
    for e in entries:
        writer.writerow([e.id, e.timestamp.isoformat(), e.event_type, e.patient_id or "", e.bed_id or "", e.summary])
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=healthflow_audit_export.csv"},
    )
