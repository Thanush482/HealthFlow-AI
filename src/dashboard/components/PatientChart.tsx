import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import type { Patient, VitalSign, MedicationRecord, TreatmentPlanItem, Role } from "../types";
import { theme } from "../theme";
import { ESIBadge } from "./Badges";
import { RevealGroup, revealItem } from "../../shared/motion";

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${theme.border}`,
  fontFamily: theme.sans,
  fontSize: 13,
  backgroundColor: "#fff",
  boxSizing: "border-box",
};

export default function PatientChart({ patient, role, onClose }: { patient: Patient; role: Role; onClose: () => void }) {
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [plan, setPlan] = useState<TreatmentPlanItem[]>([]);
  const [tab, setTab] = useState<"vitals" | "medications" | "plan">("vitals");
  const canEdit = role === "doctor" || role === "nurse" || role === "admin";

  const refresh = () => {
    api.vitals(patient.id).then(setVitals).catch(() => {});
    api.medications(patient.id).then(setMedications).catch(() => {});
    api.treatmentPlan(patient.id).then(setPlan).catch(() => {});
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "#fff", borderRadius: 20, padding: 28, maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: theme.faint, marginBottom: 4 }}>PATIENT CHART</div>
            <h3 style={{ fontFamily: theme.serif, fontSize: 22, color: theme.ink, margin: 0 }}>{patient.name}</h3>
            <div style={{ fontSize: 12, color: theme.faint }}>{patient.id}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ESIBadge level={patient.esi_level} />
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.sub, fontSize: 18 }}>✕</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 16, backgroundColor: "#F7F5F2", borderRadius: 10, padding: 4 }}>
          {(["vitals", "medications", "plan"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", backgroundColor: tab === t ? "#111" : "transparent", color: tab === t ? "#fff" : theme.sub, fontFamily: theme.sans, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}
            >
              {t === "plan" ? "Treatment Plan" : t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "vitals" && <VitalsTab key="vitals" patientId={patient.id} vitals={vitals} canEdit={canEdit} onAdded={refresh} />}
          {tab === "medications" && <MedicationsTab key="medications" patientId={patient.id} medications={medications} canEdit={canEdit} onAdded={refresh} />}
          {tab === "plan" && <PlanTab key="plan" patientId={patient.id} plan={plan} canEdit={canEdit} onAdded={refresh} />}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function VitalsTab({ patientId, vitals, canEdit, onAdded }: { patientId: string; vitals: VitalSign[]; canEdit: boolean; onAdded: () => void }) {
  const [hr, setHr] = useState("");
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temp, setTemp] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.addVitals(patientId, {
        heart_rate: hr ? parseInt(hr) : undefined,
        systolic_bp: sys ? parseInt(sys) : undefined,
        diastolic_bp: dia ? parseInt(dia) : undefined,
        spo2: spo2 ? parseInt(spo2) : undefined,
        temperature_c: temp ? parseFloat(temp) : undefined,
      });
      setHr(""); setSys(""); setDia(""); setSpo2(""); setTemp("");
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {canEdit && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", backgroundColor: "#F7F5F2", padding: 12, borderRadius: 10 }}>
          <input style={{ ...inputStyle, width: 70 }} placeholder="HR" value={hr} onChange={(e) => setHr(e.target.value)} />
          <input style={{ ...inputStyle, width: 60 }} placeholder="Sys" value={sys} onChange={(e) => setSys(e.target.value)} />
          <input style={{ ...inputStyle, width: 60 }} placeholder="Dia" value={dia} onChange={(e) => setDia(e.target.value)} />
          <input style={{ ...inputStyle, width: 60 }} placeholder="SpO2" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
          <input style={{ ...inputStyle, width: 70 }} placeholder="Temp °C" value={temp} onChange={(e) => setTemp(e.target.value)} />
          <motion.button whileHover={{ scale: 1.05 }} disabled={busy} onClick={submit} style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "#111", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {busy ? "Saving…" : "Record"}
          </motion.button>
        </div>
      )}
      {vitals.length === 0 ? (
        <div style={{ fontSize: 13, color: theme.faint }}>No vitals recorded yet.</div>
      ) : (
        <RevealGroup style={{ display: "flex", flexDirection: "column", gap: 6 }} stagger={0.04}>
          {vitals.map((v) => (
            <motion.div key={v.id} variants={revealItem} style={{ display: "flex", gap: 14, fontSize: 12, color: theme.sub, padding: "8px 12px", backgroundColor: "#FAF9F7", borderRadius: 8 }}>
              <span style={{ color: theme.faint, minWidth: 60 }}>{new Date(v.recorded_at + "Z").toLocaleTimeString()}</span>
              {v.heart_rate !== null && <span>❤️ {v.heart_rate}</span>}
              {v.spo2 !== null && <span>🫁 {v.spo2}%</span>}
              {v.systolic_bp !== null && <span>🩸 {v.systolic_bp}/{v.diastolic_bp}</span>}
              {v.temperature_c !== null && <span>🌡️ {v.temperature_c}°C</span>}
            </motion.div>
          ))}
        </RevealGroup>
      )}
    </motion.div>
  );
}

function MedicationsTab({ patientId, medications, canEdit, onAdded }: { patientId: string; medications: MedicationRecord[]; canEdit: boolean; onAdded: () => void }) {
  const [drug, setDrug] = useState("");
  const [dosage, setDosage] = useState("");
  const [freq, setFreq] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!drug.trim()) return;
    setBusy(true);
    try {
      await api.addMedication(patientId, { drug_name: drug.trim(), dosage, frequency: freq });
      setDrug(""); setDosage(""); setFreq("");
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {canEdit && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", backgroundColor: "#F7F5F2", padding: 12, borderRadius: 10 }}>
          <input style={{ ...inputStyle, flex: 2 }} placeholder="Drug name" value={drug} onChange={(e) => setDrug(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Frequency" value={freq} onChange={(e) => setFreq(e.target.value)} />
          <motion.button whileHover={{ scale: 1.05 }} disabled={busy} onClick={submit} style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "#111", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {busy ? "Saving…" : "Prescribe"}
          </motion.button>
        </div>
      )}
      {medications.length === 0 ? (
        <div style={{ fontSize: 13, color: theme.faint }}>No medications prescribed yet.</div>
      ) : (
        <RevealGroup style={{ display: "flex", flexDirection: "column", gap: 6 }} stagger={0.04}>
          {medications.map((m) => (
            <motion.div key={m.id} variants={revealItem} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", backgroundColor: "#FAF9F7", borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>{m.drug_name}</div>
                <div style={{ fontSize: 11, color: theme.faint }}>{m.dosage} · {m.frequency}</div>
              </div>
              <div style={{ fontSize: 11, color: theme.faint }}>{m.prescribed_by}</div>
            </motion.div>
          ))}
        </RevealGroup>
      )}
    </motion.div>
  );
}

function PlanTab({ patientId, plan, canEdit, onAdded }: { patientId: string; plan: TreatmentPlanItem[]; canEdit: boolean; onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await api.addTreatmentPlanItem(patientId, { title: title.trim() });
      setTitle("");
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  const cycleStatus = async (item: TreatmentPlanItem) => {
    const next = item.status === "pending" ? "in_progress" : item.status === "in_progress" ? "done" : "pending";
    await api.updateTreatmentPlanItem(patientId, item.id, next);
    onAdded();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {canEdit && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, backgroundColor: "#F7F5F2", padding: 12, borderRadius: 10 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g. 12-lead ECG" value={title} onChange={(e) => setTitle(e.target.value)} />
          <motion.button whileHover={{ scale: 1.05 }} disabled={busy} onClick={submit} style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "#111", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {busy ? "Adding…" : "Add"}
          </motion.button>
        </div>
      )}
      {plan.length === 0 ? (
        <div style={{ fontSize: 13, color: theme.faint }}>No treatment plan items yet.</div>
      ) : (
        <RevealGroup style={{ display: "flex", flexDirection: "column", gap: 6 }} stagger={0.04}>
          {plan.map((t) => {
            const statusColor = t.status === "done" ? "#2F7A3C" : t.status === "in_progress" ? "#B4600A" : theme.faint;
            return (
              <motion.button
                key={t.id}
                variants={revealItem}
                onClick={() => canEdit && cycleStatus(t)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", backgroundColor: "#FAF9F7", borderRadius: 8, border: "none", textAlign: "left", cursor: canEdit ? "pointer" : "default", width: "100%" }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: statusColor, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: theme.ink, flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: 10, color: statusColor, fontWeight: 600, textTransform: "uppercase" }}>{t.status.replace("_", " ")}</span>
              </motion.button>
            );
          })}
        </RevealGroup>
      )}
    </motion.div>
  );
}
