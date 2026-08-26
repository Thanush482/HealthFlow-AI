"""
Ambulance multi-hospital routing.

Models the real EMS decision: given a patient's condition and the
ambulance's current location, which nearby hospital can actually take
them right now? Combines the same Understand->Ground->Triage->Guard
pipeline used everywhere else with live per-hospital bed compatibility
and great-circle distance, so the ambulance crew sees a ranked list of
real options rather than just "the closest hospital" (which might have
no compatible bed) or "the biggest hospital" (which might be far away).
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import require_permission, TokenData
from ..services import intake, ontology, triage, guardrails, audit, state, allocation, geo

router = APIRouter(prefix="/api/ambulance", tags=["ambulance"])


def _run_pipeline(complaint: str):
    symptoms, duration, severity = intake.structured_extract(complaint)
    pathway = ontology.retrieve_pathway(symptoms)
    triage_result = triage.run_triage(symptoms, severity, pathway)
    red_flag = guardrails.check_red_flags(symptoms)

    red_flag_rule = None
    if red_flag:
        triage_result["esi_level"] = red_flag["forced_esi"]
        triage_result["required_ward"] = red_flag["required_ward"]
        triage_result["required_equipment"] = red_flag["required_equipment"]
        triage_result["isolation_required"] = red_flag["isolation_required"]
        triage_result["evidence"] = red_flag["message"] + " (Original AI evidence: " + triage_result["evidence"] + ")"
        red_flag_rule = red_flag["rule_name"]

    return symptoms, duration, severity, triage_result, red_flag, red_flag_rule


@router.post("/nearby-hospitals", response_model=schemas.NearbyHospitalsResponse)
def nearby_hospitals(
    payload: schemas.NearbyHospitalsRequest,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("ambulance_dispatch")),
):
    symptoms, duration, severity, triage_result, red_flag, red_flag_rule = _run_pipeline(payload.complaint)

    patient_dict = {
        "esi_level": triage_result["esi_level"],
        "required_ward": triage_result["required_ward"],
        "required_equipment": triage_result["required_equipment"],
        "isolation_required": triage_result["isolation_required"],
    }

    hospitals = db.query(models.Hospital).all()
    results = []
    for h in hospitals:
        beds = db.query(models.Bed).filter(models.Bed.hospital_id == h.id).all()
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
        matrix = allocation.build_compatibility_matrix([{**patient_dict, "id": "preview"}], bed_dicts)["preview"]
        compatible_count = sum(1 for cell in matrix.values() if cell["compatible"])
        available_count = sum(1 for b in beds if b.status == "available")

        distance_km = round(geo.haversine_km(payload.latitude, payload.longitude, h.latitude, h.longitude), 2)
        eta = geo.estimate_eta_minutes(distance_km)

        results.append(
            schemas.HospitalWithCapacity(
                id=h.id, name=h.name, address=h.address, latitude=h.latitude, longitude=h.longitude, phone=h.phone,
                total_beds=len(beds), available_beds=available_count,
                distance_km=distance_km, compatible_beds=compatible_count, eta_minutes=eta,
            )
        )

    # Rank: hospitals with a compatible bed first (closest first among those),
    # then hospitals with none (still shown, closest first, for transparency).
    results.sort(key=lambda r: (r.compatible_beds == 0, r.distance_km))

    return schemas.NearbyHospitalsResponse(
        triage_preview=schemas.TriagePreview(
            extracted_symptoms=symptoms,
            duration=duration,
            severity=severity,
            esi_level=triage_result["esi_level"],
            confidence=triage_result["confidence"],
            evidence=triage_result["evidence"],
            red_flag_triggered=bool(red_flag),
            red_flag_rule=red_flag_rule,
            required_ward=triage_result["required_ward"],
            required_equipment=triage_result["required_equipment"],
            isolation_required=triage_result["isolation_required"],
        ),
        hospitals=results,
    )


@router.post("/dispatch", response_model=schemas.PatientOut)
async def dispatch(
    payload: schemas.DispatchRequest,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("ambulance_dispatch")),
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == payload.hospital_id).first()
    if not hospital:
        raise HTTPException(404, "Hospital not found")

    symptoms, duration, severity, triage_result, red_flag, red_flag_rule = _run_pipeline(payload.complaint)
    patient_id = f"AMB-{uuid.uuid4().hex[:6].upper()}"

    patient = models.Patient(
        id=patient_id,
        hospital_id=payload.hospital_id,
        name=payload.name,
        age=payload.age,
        sex=payload.sex,
        raw_complaint=f"[Ambulance dispatch by {user.name}, ETA {payload.eta_minutes} min] {payload.complaint}",
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
        escalated=bool(red_flag),
        required_ward=triage_result["required_ward"],
        required_equipment=triage_result["required_equipment"],
        isolation_required=triage_result["isolation_required"],
        status="incoming",
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    audit.log(
        db,
        "ambulance_prealert",
        f"Ambulance dispatch by {user.name}: {patient.name} -> {hospital.name}, ETA {payload.eta_minutes} min, "
        f"pre-triaged ESI-{patient.esi_level}" + (f" (red flag: {red_flag_rule})" if red_flag else ""),
        patient_id=patient.id,
        hospital_id=payload.hospital_id,
        detail={**triage_result, "eta_minutes": payload.eta_minutes, "hospital_name": hospital.name},
    )

    # Attempt to reserve the best compatible bed at the chosen hospital ahead of arrival.
    patient_dict = {
        "id": patient.id,
        "esi_level": patient.esi_level,
        "required_ward": patient.required_ward,
        "required_equipment": patient.required_equipment or [],
        "isolation_required": patient.isolation_required,
    }
    hospital_beds = db.query(models.Bed).filter(models.Bed.hospital_id == payload.hospital_id).all()
    bed_dicts = [
        {
            "id": b.id,
            "ward_id": b.ward_id,
            "equipment": b.equipment or [],
            "isolation": b.isolation,
            "nursing_station_distance": b.nursing_station_distance,
            "status": b.status,
        }
        for b in hospital_beds
    ]
    matrix = allocation.build_compatibility_matrix([patient_dict], bed_dicts)[patient.id]
    compatible = [(bid, cell["score"]) for bid, cell in matrix.items() if cell["compatible"]]

    if compatible:
        best_bed_id = max(compatible, key=lambda x: x[1])[0]
        bed = db.query(models.Bed).filter(models.Bed.id == best_bed_id).first()
        bed.status = "reserved"
        bed.occupant_patient_id = patient.id
        patient.assigned_bed_id = best_bed_id
        patient.allocation_explanation = matrix[best_bed_id] | {"reserved_ahead_of_arrival": True, "eta_minutes": payload.eta_minutes}
        db.commit()
        db.refresh(patient)

        audit.log(
            db,
            "allocation",
            f"Bed {best_bed_id} RESERVED at {hospital.name} ahead of arrival for {patient.name} (ETA {payload.eta_minutes} min)",
            patient_id=patient.id,
            bed_id=best_bed_id,
            hospital_id=payload.hospital_id,
            detail=matrix[best_bed_id],
        )
        await state.manager.broadcast({"type": "bed_update", "bed_id": best_bed_id, "hospital_id": payload.hospital_id, "status": "reserved"})
    else:
        patient.status = "waiting"
        db.commit()
        summary = state.recalculate_allocations(db, reason=f"Ambulance dispatch queued: {patient.name}", hospital_id=payload.hospital_id)
        await state.manager.broadcast({"type": "allocation_update", "hospital_id": payload.hospital_id, **summary})

    db.refresh(patient)
    return patient


@router.post("/{patient_id}/arrive", response_model=schemas.PatientOut)
async def ambulance_arrive(
    patient_id: str,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_permission("ambulance_confirm")),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    if patient.assigned_bed_id:
        bed = db.query(models.Bed).filter(models.Bed.id == patient.assigned_bed_id).first()
        if bed and bed.status == "reserved":
            bed.status = "occupied"
            patient.status = "admitted"
            db.commit()
            audit.log(
                db,
                "allocation",
                f"Ambulance arrival confirmed by {user.name}: {patient.name} admitted to reserved bed {bed.id}",
                patient_id=patient.id,
                bed_id=bed.id,
                hospital_id=patient.hospital_id,
            )
            await state.manager.broadcast({"type": "bed_update", "bed_id": bed.id, "hospital_id": patient.hospital_id, "status": "occupied"})
    else:
        patient.status = "waiting"
        db.commit()
        summary = state.recalculate_allocations(db, reason=f"Ambulance arrival, no reservation: {patient.name}", hospital_id=patient.hospital_id)
        await state.manager.broadcast({"type": "allocation_update", "hospital_id": patient.hospital_id, **summary})

    db.refresh(patient)
    return patient
