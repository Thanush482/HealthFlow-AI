import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String, primary_key=True)
    name = Column(String)
    address = Column(String, nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Bed(Base):
    __tablename__ = "beds"

    id = Column(String, primary_key=True)
    hospital_id = Column(String, ForeignKey("hospitals.id"), index=True)
    ward_id = Column(String, index=True)
    equipment = Column(JSON, default=list)
    isolation = Column(Boolean, default=False)
    nursing_station_distance = Column(Integer, default=3)
    status = Column(String, default="available")  # available | occupied | reserved | cleaning | maintenance
    occupant_patient_id = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True)
    hospital_id = Column(String, ForeignKey("hospitals.id"), index=True, nullable=True)
    name = Column(String)
    age = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)
    raw_complaint = Column(String)
    portal_password = Column(String, default="patient123")  # demo-only patient portal access

    # Understand (extraction)
    extracted_symptoms = Column(JSON, default=list)
    duration = Column(String, nullable=True)
    severity = Column(String, nullable=True)

    # Ground
    matched_pathway_id = Column(String, nullable=True)
    matched_pathway_name = Column(String, nullable=True)
    match_score = Column(Float, nullable=True)

    # Triage
    esi_level = Column(Integer, nullable=True)  # 1 (most urgent) - 5 (least urgent)
    confidence = Column(Float, nullable=True)
    evidence = Column(String, nullable=True)

    # Guard
    red_flag_triggered = Column(Boolean, default=False)
    red_flag_rule = Column(String, nullable=True)
    escalated = Column(Boolean, default=False)

    # Allocate
    required_ward = Column(String, nullable=True)
    required_equipment = Column(JSON, default=list)
    isolation_required = Column(Boolean, default=False)
    assigned_bed_id = Column(String, nullable=True)
    allocation_explanation = Column(JSON, nullable=True)

    status = Column(String, default="waiting")  # waiting | incoming | admitted | discharged
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class VitalSign(Base):
    """Healthcare monitoring: periodic vitals readings for an admitted/tracked patient."""
    __tablename__ = "vital_signs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.id"), index=True)
    heart_rate = Column(Integer, nullable=True)  # bpm
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)  # % oxygen saturation
    temperature_c = Column(Float, nullable=True)
    recorded_by = Column(String, nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)


class MedicationRecord(Base):
    """Healthcare monitoring: prescribed medications for a patient."""
    __tablename__ = "medication_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.id"), index=True)
    drug_name = Column(String)
    dosage = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    prescribed_by = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    prescribed_at = Column(DateTime, default=datetime.datetime.utcnow)


class TreatmentPlanItem(Base):
    """Healthcare monitoring: structured treatment plan / care checklist for a patient."""
    __tablename__ = "treatment_plan_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.id"), index=True)
    title = Column(String)
    description = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending | in_progress | done
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AuditEntry(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event_type = Column(String)  # intake | triage | red_flag | allocation | reallocation | state_event
    hospital_id = Column(String, nullable=True)
    patient_id = Column(String, nullable=True)
    bed_id = Column(String, nullable=True)
    summary = Column(String)
    detail = Column(JSON, default=dict)
