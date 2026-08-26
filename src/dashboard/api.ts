import { useEffect, useRef, useState } from "react";
import type {
  Patient, Bed, Ward, AuditEntry, Pathway, RedFlagRule, AuthUser, DemoAccount,
  AnalyticsSummary, ForecastResponse, Hospital, HospitalWithCapacity,
  VitalSign, MedicationRecord, TreatmentPlanItem, PatientPortalView, NearbyHospitalsResponse,
} from "./types";

export const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");
const AUTH_STORAGE_KEY = "healthflow_auth";
const HOSPITAL_STORAGE_KEY = "healthflow_active_hospital";

// ── Auth token storage ──────────────────────────────────────────────────────
// Real deployed app (not a sandboxed artifact), so localStorage is fine here.

export function getStoredAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function storeAuth(user: AuthUser) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(HOSPITAL_STORAGE_KEY);
}

export function getStoredHospitalId(): string | null {
  return localStorage.getItem(HOSPITAL_STORAGE_KEY);
}

export function storeHospitalId(id: string) {
  localStorage.setItem(HOSPITAL_STORAGE_KEY, id);
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const auth = getStoredAuth();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth?.token) headers["Authorization"] = `Bearer ${auth.token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      detail = JSON.parse(text).detail || text;
    } catch {
      /* not JSON */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json();
}

export const api = {
  health: () => req<{ status: string; service: string }>("/api/health"),
  wards: () => req<Ward[]>("/api/wards"),
  pathways: () => req<{ pathways: Pathway[]; red_flag_rules: RedFlagRule[] }>("/api/ontology/pathways"),

  login: (username: string, password: string) =>
    req<{ token: string; username: string; name: string; role: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  patientLogin: (patient_id: string, password: string) =>
    req<{ token: string; username: string; name: string; role: string }>("/api/auth/patient-login", {
      method: "POST",
      body: JSON.stringify({ patient_id, password }),
    }),
  demoAccounts: () => req<DemoAccount[]>("/api/auth/demo-accounts"),

  // ── Hospital network ────────────────────────────────────────────────────
  hospitals: () => req<HospitalWithCapacity[]>("/api/hospitals"),
  hospital: (id: string) => req<HospitalWithCapacity>(`/api/hospitals/${id}`),
  createHospital: (payload: { name: string; address?: string; latitude: number; longitude: number; phone?: string }) =>
    req<Hospital>("/api/hospitals", { method: "POST", body: JSON.stringify(payload) }),

  // ── Intake / triage queue (hospital-scoped) ────────────────────────────
  intake: (payload: { hospital_id: string; name: string; age?: number; sex?: string; complaint: string }) =>
    req<Patient>("/api/intake", { method: "POST", body: JSON.stringify(payload) }),
  queue: (hospitalId?: string) => req<Patient[]>(`/api/intake/queue${hospitalId ? `?hospital_id=${hospitalId}` : ""}`),

  // ── Beds (hospital-scoped) ──────────────────────────────────────────────
  beds: (hospitalId?: string) => req<Bed[]>(`/api/beds${hospitalId ? `?hospital_id=${hospitalId}` : ""}`),
  bedEvent: (bedId: string, event: string) =>
    req<Bed>(`/api/beds/${bedId}/event`, { method: "POST", body: JSON.stringify({ event }) }),

  // ── Patients ─────────────────────────────────────────────────────────────
  patient: (id: string) => req<Patient>(`/api/patients/${id}`),
  explain: (id: string) => req<{ patient_id: string; assigned_bed_id: string | null; stored_explanation: any; live_compatibility: any }>(
    `/api/patients/${id}/explain`
  ),
  conditionChange: (id: string, new_complaint: string) =>
    req<Patient>(`/api/patients/${id}/condition-change`, { method: "POST", body: JSON.stringify({ new_complaint }) }),

  // ── Healthcare monitoring: vitals, medications, treatment plan ──────────
  portal: (patientId: string) => req<PatientPortalView>(`/api/patients/${patientId}/portal`),
  vitals: (patientId: string) => req<VitalSign[]>(`/api/patients/${patientId}/vitals`),
  addVitals: (patientId: string, payload: { heart_rate?: number; systolic_bp?: number; diastolic_bp?: number; spo2?: number; temperature_c?: number }) =>
    req<VitalSign>(`/api/patients/${patientId}/vitals`, { method: "POST", body: JSON.stringify(payload) }),
  medications: (patientId: string) => req<MedicationRecord[]>(`/api/patients/${patientId}/medications`),
  addMedication: (patientId: string, payload: { drug_name: string; dosage?: string; frequency?: string; notes?: string }) =>
    req<MedicationRecord>(`/api/patients/${patientId}/medications`, { method: "POST", body: JSON.stringify(payload) }),
  treatmentPlan: (patientId: string) => req<TreatmentPlanItem[]>(`/api/patients/${patientId}/treatment-plan`),
  addTreatmentPlanItem: (patientId: string, payload: { title: string; description?: string }) =>
    req<TreatmentPlanItem>(`/api/patients/${patientId}/treatment-plan`, { method: "POST", body: JSON.stringify(payload) }),
  updateTreatmentPlanItem: (patientId: string, itemId: number, status: string) =>
    req<TreatmentPlanItem>(`/api/patients/${patientId}/treatment-plan/${itemId}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // ── Audit ────────────────────────────────────────────────────────────────
  audit: (limit = 200) => req<AuditEntry[]>(`/api/audit?limit=${limit}`),
  exportAuditCsv: async () => {
    const auth = getStoredAuth();
    const res = await fetch(`${API_BASE}/api/audit/export`, {
      headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "healthflow_audit_export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // ── Analytics (hospital-scoped) ─────────────────────────────────────────
  analyticsSummary: (hospitalId?: string) => req<AnalyticsSummary>(`/api/analytics/summary${hospitalId ? `?hospital_id=${hospitalId}` : ""}`),
  analyticsForecast: (horizonHours = 6, hospitalId?: string) =>
    req<ForecastResponse>(`/api/analytics/forecast?horizon_hours=${horizonHours}${hospitalId ? `&hospital_id=${hospitalId}` : ""}`),

  // ── Ambulance multi-hospital routing ────────────────────────────────────
  nearbyHospitals: (payload: { name: string; age?: number; sex?: string; complaint: string; latitude: number; longitude: number }) =>
    req<NearbyHospitalsResponse>("/api/ambulance/nearby-hospitals", { method: "POST", body: JSON.stringify(payload) }),
  dispatch: (payload: { hospital_id: string; name: string; age?: number; sex?: string; complaint: string; eta_minutes: number }) =>
    req<Patient>("/api/ambulance/dispatch", { method: "POST", body: JSON.stringify(payload) }),
  ambulanceArrive: (patientId: string) => req<Patient>(`/api/ambulance/${patientId}/arrive`, { method: "POST" }),
};

export type WSMessage = { type: string; [key: string]: any };

/** Connects to the real-time hospital state WebSocket and calls onMessage for every push. */
export function useHospitalSocket(onMessage: (msg: WSMessage) => void) {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: any = null;
    let closedByUs = false;

    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/ws/state`);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closedByUs) retryTimer = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws?.close();
      ws.onmessage = (evt) => {
        try {
          cbRef.current(JSON.parse(evt.data));
        } catch {
          /* ignore malformed frames */
        }
      };
    };
    connect();

    return () => {
      closedByUs = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, []);

  return connected;
}
