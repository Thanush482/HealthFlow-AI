import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class IntakeRequest(BaseModel):
    hospital_id: str
    name: str
    age: Optional[int] = None
    sex: Optional[str] = None
    complaint: str


class AmbulanceIntakeRequest(BaseModel):
    name: str
    age: Optional[int] = None
    sex: Optional[str] = None
    complaint: str
    eta_minutes: int


class PatientOut(BaseModel):
    id: str
    hospital_id: Optional[str]
    name: str
    age: Optional[int]
    sex: Optional[str]
    raw_complaint: str
    extracted_symptoms: List[str]
    duration: Optional[str]
    severity: Optional[str]
    matched_pathway_id: Optional[str]
    matched_pathway_name: Optional[str]
    match_score: Optional[float]
    esi_level: Optional[int]
    confidence: Optional[float]
    evidence: Optional[str]
    red_flag_triggered: bool
    red_flag_rule: Optional[str]
    escalated: bool
    required_ward: Optional[str]
    required_equipment: List[str]
    isolation_required: bool
    assigned_bed_id: Optional[str]
    allocation_explanation: Optional[Dict[str, Any]]
    status: str

    class Config:
        from_attributes = True


class BedOut(BaseModel):
    id: str
    hospital_id: Optional[str]
    ward_id: str
    equipment: List[str]
    isolation: bool
    nursing_station_distance: int
    status: str
    occupant_patient_id: Optional[str]

    class Config:
        from_attributes = True


class BedEvent(BaseModel):
    event: str  # discharge | start_cleaning | finish_cleaning | maintenance | restore | cancel_reservation


class ConditionChangeRequest(BaseModel):
    new_complaint: str


class AuditOut(BaseModel):
    id: int
    timestamp: datetime.datetime
    event_type: str
    hospital_id: Optional[str]
    patient_id: Optional[str]
    bed_id: Optional[str]
    summary: str
    detail: Dict[str, Any]

    class Config:
        from_attributes = True


# ── Hospitals ────────────────────────────────────────────────────────────────

class HospitalOut(BaseModel):
    id: str
    name: str
    address: Optional[str]
    latitude: float
    longitude: float
    phone: Optional[str]

    class Config:
        from_attributes = True


class HospitalWithCapacity(HospitalOut):
    total_beds: int
    available_beds: int
    distance_km: Optional[float] = None
    compatible_beds: Optional[int] = None
    eta_minutes: Optional[int] = None


class HospitalCreate(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    phone: Optional[str] = None


# ── Healthcare monitoring: vitals, medications, treatment plan ────────────────

class VitalIn(BaseModel):
    heart_rate: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    spo2: Optional[int] = None
    temperature_c: Optional[float] = None


class VitalOut(VitalIn):
    id: int
    patient_id: str
    recorded_by: Optional[str]
    recorded_at: datetime.datetime

    class Config:
        from_attributes = True


class MedicationIn(BaseModel):
    drug_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    notes: Optional[str] = None


class MedicationOut(MedicationIn):
    id: int
    patient_id: str
    prescribed_by: Optional[str]
    active: bool
    prescribed_at: datetime.datetime

    class Config:
        from_attributes = True


class TreatmentPlanIn(BaseModel):
    title: str
    description: Optional[str] = None


class TreatmentPlanUpdate(BaseModel):
    status: str  # pending | in_progress | done


class TreatmentPlanOut(BaseModel):
    id: int
    patient_id: str
    title: str
    description: Optional[str]
    status: str
    created_by: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class PatientPortalView(BaseModel):
    """Combined read-only view for the patient portal login."""
    patient: PatientOut
    hospital: Optional[HospitalOut]
    vitals: List[VitalOut]
    medications: List[MedicationOut]
    treatment_plan: List[TreatmentPlanOut]


# ── Ambulance multi-hospital dispatch ──────────────────────────────────────────

class NearbyHospitalsRequest(BaseModel):
    name: str
    age: Optional[int] = None
    sex: Optional[str] = None
    complaint: str
    latitude: float
    longitude: float


class TriagePreview(BaseModel):
    extracted_symptoms: List[str]
    duration: str
    severity: str
    esi_level: int
    confidence: float
    evidence: str
    red_flag_triggered: bool
    red_flag_rule: Optional[str]
    required_ward: str
    required_equipment: List[str]
    isolation_required: bool


class NearbyHospitalsResponse(BaseModel):
    triage_preview: TriagePreview
    hospitals: List[HospitalWithCapacity]


class DispatchRequest(BaseModel):
    hospital_id: str
    name: str
    age: Optional[int] = None
    sex: Optional[str] = None
    complaint: str
    eta_minutes: int
