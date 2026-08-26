from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import require_permission, get_current_user, TokenData
from ..services import intake, ontology, triage, guardrails, audit, state, allocation

router = APIRouter(prefix="/api/patients", tags=["patients"])


def _authorize_record_access(patient_id: str, user: TokenData):
    """Doctor/nurse/admin can access any patient's records; a patient can only access their own."""
    if user.role == "patient" and user.username != patient_id:
        raise HTTPException(403, "Patients may only access their own records")
    if user.role not in ("doctor", "nurse", "admin", "patient"):
        raise HTTPException(403, "Not authorized to view medical records")


@router.get("/{patient_id}", response_model=schemas.PatientOut)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    p = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    return p


@router.get("/{patient_id}/explain")
def explain_patient(patient_id: str, db: Session = Depends(get_db)):
    """Live 'why this bed / why not' compatibility breakdown across the current hospital state."""
    p = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    beds = db.query(models.Bed).filter(models.Bed.hospital_id == p.hospital_id).all()

    patient_dict = {
        "id": p.id,
        "esi_level": p.esi_level,
        "required_ward": p.required_ward,
        "required_equipment": p.required_equipment or [],
        "isolation_required": p.isolation_required,
    }
    bed_dicts = [
        {
            "id": b.id,
            "ward_id": b.ward_id,
            "equipment": b.equipment or [],
            "isolation": b.isolation,
            "nursing_station_distance": b.nursing_station_distance,
            "status": b.status,
        }
        for b in beds
    ]
    matrix = allocation.build_compatibility_matrix([patient_dict], bed_dicts)[p.id]
    return {
        "patient_id": p.id,
        "assigned_bed_id": p.assigned_bed_id,
        "stored_explanation": p.allocation_explanation,
        "live_compatibility": matrix,
    }


@router.post("/{patient_id}/condition-change", response_model=schemas.PatientOut)
async def condition_change(
    patient_id: str,
    payload: schemas.ConditionChangeRequest,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("condition_change")),
):
    """
    Simulate a patient's clinical requirement changing mid-stay (killer-demo
    step 10): re-run the full Understand -> Ground -> Triage -> Guard
    pipeline on the updated complaint, free their current bed if any, and
    trigger a full reallocation recalculation.
    """
    p = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")

    combined_complaint = f"{p.raw_complaint}. Update: {payload.new_complaint}"
    symptoms, duration, severity = intake.structured_extract(combined_complaint)
    pathway = ontology.retrieve_pathway(symptoms)
    triage_result = triage.run_triage(symptoms, severity, pathway)
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

    # free the current bed — condition change requires re-optimization
    if p.assigned_bed_id:
        old_bed = db.query(models.Bed).filter(models.Bed.id == p.assigned_bed_id).first()
        if old_bed:
            old_bed.status = "available"
            old_bed.occupant_patient_id = None

    p.raw_complaint = combined_complaint
    p.extracted_symptoms = symptoms
    p.duration = duration
    p.severity = severity
    p.matched_pathway_id = triage_result["matched_pathway_id"]
    p.matched_pathway_name = triage_result["matched_pathway_name"]
    p.match_score = triage_result["match_score"]
    p.esi_level = triage_result["esi_level"]
    p.confidence = triage_result["confidence"]
    p.evidence = triage_result["evidence"]
    p.red_flag_triggered = bool(red_flag)
    p.red_flag_rule = red_flag_rule
    p.escalated = escalated
    p.required_ward = triage_result["required_ward"]
    p.required_equipment = triage_result["required_equipment"]
    p.isolation_required = triage_result["isolation_required"]
    p.assigned_bed_id = None
    p.status = "waiting"

    db.commit()
    db.refresh(p)

    audit.log(
        db,
        "red_flag" if red_flag else "triage",
        f"Condition change for {p.name} (recorded by {user.name}): re-triaged to ESI-{p.esi_level}" + (f" via {red_flag_rule}" if red_flag else ""),
        patient_id=p.id,
        hospital_id=p.hospital_id,
        detail=triage_result,
    )

    summary = state.recalculate_allocations(db, reason=f"Condition change: {p.name}", hospital_id=p.hospital_id)
    await state.manager.broadcast({"type": "allocation_update", "hospital_id": p.hospital_id, **summary})

    db.refresh(p)
    return p


# ── Healthcare monitoring: vitals, medications, treatment plan ────────────────

@router.get("/{patient_id}/portal", response_model=schemas.PatientPortalView)
def patient_portal_view(patient_id: str, db: Session = Depends(get_db), user: TokenData = Depends(get_current_user)):
    """Combined read-only record for the patient portal (or staff viewing a chart)."""
    _authorize_record_access(patient_id, user)
    p = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    hospital = db.query(models.Hospital).filter(models.Hospital.id == p.hospital_id).first() if p.hospital_id else None
    vitals = db.query(models.VitalSign).filter(models.VitalSign.patient_id == patient_id).order_by(models.VitalSign.recorded_at.desc()).all()
    meds = db.query(models.MedicationRecord).filter(models.MedicationRecord.patient_id == patient_id).order_by(models.MedicationRecord.prescribed_at.desc()).all()
    plan = db.query(models.TreatmentPlanItem).filter(models.TreatmentPlanItem.patient_id == patient_id).order_by(models.TreatmentPlanItem.created_at.asc()).all()
    return schemas.PatientPortalView(patient=p, hospital=hospital, vitals=vitals, medications=meds, treatment_plan=plan)


@router.get("/{patient_id}/vitals", response_model=list[schemas.VitalOut])
def list_vitals(patient_id: str, db: Session = Depends(get_db), user: TokenData = Depends(get_current_user)):
    _authorize_record_access(patient_id, user)
    return db.query(models.VitalSign).filter(models.VitalSign.patient_id == patient_id).order_by(models.VitalSign.recorded_at.desc()).all()


@router.post("/{patient_id}/vitals", response_model=schemas.VitalOut)
def add_vitals(
    patient_id: str,
    payload: schemas.VitalIn,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("medical_records")),
):
    p = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    v = models.VitalSign(patient_id=patient_id, recorded_by=user.name, **payload.dict())
    db.add(v)
    db.commit()
    db.refresh(v)
    audit.log(
        db, "vitals", f"Vitals recorded for {p.name} by {user.name}",
        patient_id=patient_id, hospital_id=p.hospital_id,
        detail=payload.dict(),
    )
    return v


@router.get("/{patient_id}/medications", response_model=list[schemas.MedicationOut])
def list_medications(patient_id: str, db: Session = Depends(get_db), user: TokenData = Depends(get_current_user)):
    _authorize_record_access(patient_id, user)
    return db.query(models.MedicationRecord).filter(models.MedicationRecord.patient_id == patient_id).order_by(models.MedicationRecord.prescribed_at.desc()).all()


@router.post("/{patient_id}/medications", response_model=schemas.MedicationOut)
def add_medication(
    patient_id: str,
    payload: schemas.MedicationIn,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("medical_records")),
):
    p = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    m = models.MedicationRecord(patient_id=patient_id, prescribed_by=user.name, **payload.dict())
    db.add(m)
    db.commit()
    db.refresh(m)
    audit.log(
        db, "medication", f"{payload.drug_name} prescribed for {p.name} by {user.name}",
        patient_id=patient_id, hospital_id=p.hospital_id,
        detail=payload.dict(),
    )
    return m


@router.get("/{patient_id}/treatment-plan", response_model=list[schemas.TreatmentPlanOut])
def list_treatment_plan(patient_id: str, db: Session = Depends(get_db), user: TokenData = Depends(get_current_user)):
    _authorize_record_access(patient_id, user)
    return db.query(models.TreatmentPlanItem).filter(models.TreatmentPlanItem.patient_id == patient_id).order_by(models.TreatmentPlanItem.created_at.asc()).all()


@router.post("/{patient_id}/treatment-plan", response_model=schemas.TreatmentPlanOut)
def add_treatment_plan_item(
    patient_id: str,
    payload: schemas.TreatmentPlanIn,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("medical_records")),
):
    p = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    item = models.TreatmentPlanItem(patient_id=patient_id, created_by=user.name, **payload.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    audit.log(
        db, "treatment_plan", f"Treatment plan item '{payload.title}' added for {p.name} by {user.name}",
        patient_id=patient_id, hospital_id=p.hospital_id,
    )
    return item


@router.patch("/{patient_id}/treatment-plan/{item_id}", response_model=schemas.TreatmentPlanOut)
def update_treatment_plan_item(
    patient_id: str,
    item_id: int,
    payload: schemas.TreatmentPlanUpdate,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("medical_records")),
):
    item = db.query(models.TreatmentPlanItem).filter(models.TreatmentPlanItem.id == item_id, models.TreatmentPlanItem.patient_id == patient_id).first()
    if not item:
        raise HTTPException(404, "Treatment plan item not found")
    item.status = payload.status
    db.commit()
    db.refresh(item)
    audit.log(
        db, "treatment_plan", f"Treatment plan item '{item.title}' marked {payload.status} by {user.name}",
        patient_id=patient_id,
    )
    return item
