export interface Patient {
  id: string;
  hospital_id: string | null;
  name: string;
  age: number | null;
  sex: string | null;
  raw_complaint: string;
  extracted_symptoms: string[];
  duration: string | null;
  severity: string | null;
  matched_pathway_id: string | null;
  matched_pathway_name: string | null;
  match_score: number | null;
  esi_level: number | null;
  confidence: number | null;
  evidence: string | null;
  red_flag_triggered: boolean;
  red_flag_rule: string | null;
  escalated: boolean;
  required_ward: string | null;
  required_equipment: string[];
  isolation_required: boolean;
  assigned_bed_id: string | null;
  allocation_explanation: Record<string, any> | null;
  status: string;
}

export interface Bed {
  id: string;
  hospital_id: string | null;
  ward_id: string;
  equipment: string[];
  isolation: boolean;
  nursing_station_distance: number;
  status: "available" | "occupied" | "reserved" | "cleaning" | "maintenance";
  occupant_patient_id: string | null;
}

export interface Ward {
  id: string;
  name: string;
  isolation_capable: boolean;
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  event_type: string;
  hospital_id: string | null;
  patient_id: string | null;
  bed_id: string | null;
  summary: string;
  detail: Record<string, any>;
}

export interface Pathway {
  id: string;
  name: string;
  snomed_ct: string;
  icd10: string;
  keywords: string[];
  base_esi: number;
  required_ward: string;
  required_equipment: string[];
  evidence: string;
  isolation_required: boolean;
}

export interface RedFlagRule {
  id: string;
  name: string;
  any_of: string[];
  with_any_of: string[];
  forced_esi: number;
  required_ward: string;
  required_equipment: string[];
  message: string;
}

export type Role = "doctor" | "nurse" | "admin" | "ambulance" | "patient";

export interface AuthUser {
  token: string;
  username: string;
  name: string;
  role: Role;
}

export interface DemoAccount {
  username: string;
  password: string;
  name: string;
  role: Role;
}

export interface AnalyticsSummary {
  total_patients: number;
  status_counts: Record<string, number>;
  esi_distribution: Record<string, number>;
  red_flag_count: number;
  red_flag_rate: number;
  avg_confidence: number | null;
  avg_allocation_score: number | null;
  total_beds: number;
  bed_status_counts: Record<string, number>;
  ward_utilization: Record<string, Record<string, number>>;
}

export interface ForecastPoint {
  label: string;
  value: number;
}

export interface ForecastResponse {
  method: string;
  slope_per_hour: number;
  history: ForecastPoint[];
  forecast: ForecastPoint[];
  beds_available_now: number;
  projected_admissions_next_hour: number;
  capacity_warning: boolean;
  capacity_warning_message: string;
}

// ── Multi-hospital network ─────────────────────────────────────────────────

export interface Hospital {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
}

export interface HospitalWithCapacity extends Hospital {
  total_beds: number;
  available_beds: number;
  distance_km?: number | null;
  compatible_beds?: number | null;
  eta_minutes?: number | null;
}

// ── Healthcare monitoring: vitals, medications, treatment plan ───────────────

export interface VitalSign {
  id: number;
  patient_id: string;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  spo2: number | null;
  temperature_c: number | null;
  recorded_by: string | null;
  recorded_at: string;
}

export interface MedicationRecord {
  id: number;
  patient_id: string;
  drug_name: string;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  prescribed_by: string | null;
  active: boolean;
  prescribed_at: string;
}

export interface TreatmentPlanItem {
  id: number;
  patient_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "done";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientPortalView {
  patient: Patient;
  hospital: Hospital | null;
  vitals: VitalSign[];
  medications: MedicationRecord[];
  treatment_plan: TreatmentPlanItem[];
}

// ── Ambulance multi-hospital dispatch ─────────────────────────────────────────

export interface TriagePreview {
  extracted_symptoms: string[];
  duration: string;
  severity: string;
  esi_level: number;
  confidence: number;
  evidence: string;
  red_flag_triggered: boolean;
  red_flag_rule: string | null;
  required_ward: string;
  required_equipment: string[];
  isolation_required: boolean;
}

export interface NearbyHospitalsResponse {
  triage_preview: TriagePreview;
  hospitals: HospitalWithCapacity[];
}
