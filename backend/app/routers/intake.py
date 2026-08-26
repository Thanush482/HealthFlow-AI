import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import require_permission, TokenData
from ..services import intake, ontology, triage, guardrails, audit, state

router = APIRouter(prefix="/api/intake", tags=["intake"])


@router.post("", response_model=schemas.PatientOut)
async def intake_patient(
    payload: schemas.IntakeRequest,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("intake")),
):
    patient_id = f"PT-{uuid.uuid4().hex[:6].upper()}"

    # A1. Understand
    symptoms, duration, severity = intake.structured_extract(payload.complaint)

    # A2. Ground
    pathway = ontology.retrieve_pathway(symptoms)

    # A3. Triage (probabilistic/heuristic reasoning)
    triage_result = triage.run_triage(symptoms, severity, pathway)

    # A4. Guard (deterministic override — runs AFTER reasoning, can override it)
    red_flag = guardrails.check_red_flags(symptoms)
    escalated = False
    red_flag_rule = None
    if red_flag:
        triage_result["esi_level"] = red_flag["forced_esi"]
        triage_result["required_ward"] = red_flag["required_ward"]
        triage_result["required_equipment"] = red_flag["required_equipment"]
        triage_result["isolation_required"] = red_flag["isolation_required"]
        triage_result["evidence"] = red_flag["message"] + " (Original AI evidence: " + triage_result["evidence"] + ")"
        escalated = True
        red_flag_rule = red_flag["rule_name"]

    patient = models.Patient(
        id=patient_id,
        hospital_id=payload.hospital_id,
        name=payload.name,
        age=payload.age,
        sex=payload.sex,
        raw_complaint=payload.complaint,
        extracted_symptoms=symptoms,
        duration=duration,
        severity=severity,
        matched_pathway_id=triage_result["matched_pathway_id"],
        matched_pathway_name=triage_result["matched_pathway_name"],
        match_score=triage_result["match_score"],
        esi_level=triage_result["esi_level"],
        confidence=triage_result["confidence"],
        evidence=triage_result["evidence"],
        red_flag_triggered=bool(red_flag),
        red_flag_rule=red_flag_rule,
        escalated=escalated,
        required_ward=triage_result["required_ward"],
        required_equipment=triage_result["required_equipment"],
        isolation_required=triage_result["isolation_required"],
        status="waiting",
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    audit.log(
        db,
        "intake",
        f"Patient {patient.name} intake processed by {user.name} ({user.role}): symptoms={symptoms}, matched={triage_result['matched_pathway_name']}",
        patient_id=patient.id,
        hospital_id=payload.hospital_id,
        detail={"symptoms": symptoms, "duration": duration, "severity": severity, "recorded_by": user.name},
    )
    audit.log(
        db,
        "red_flag" if red_flag else "triage",
        (red_flag["message"] if red_flag else f"Triage classified ESI-{triage_result['esi_level']} (confidence {triage_result['confidence']})"),
        patient_id=patient.id,
        hospital_id=payload.hospital_id,
        detail=triage_result if not red_flag else red_flag,
    )

    # C/B. Trigger allocation recalculation within this hospital's waiting queue
    summary = state.recalculate_allocations(db, reason=f"New intake: {patient.name}", hospital_id=payload.hospital_id)
    await state.manager.broadcast({"type": "allocation_update", "hospital_id": payload.hospital_id, **summary})

    db.refresh(patient)
    return patient


@router.get("/queue", response_model=list[schemas.PatientOut])
def get_queue(hospital_id: str = None, db: Session = Depends(get_db)):
    q = db.query(models.Patient)
    if hospital_id:
        q = q.filter(models.Patient.hospital_id == hospital_id)
    return q.order_by(models.Patient.esi_level.asc().nulls_last(), models.Patient.created_at.asc()).all()
