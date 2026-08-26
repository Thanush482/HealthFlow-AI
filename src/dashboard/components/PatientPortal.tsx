import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, clearAuth } from "../api";
import type { AuthUser, PatientPortalView } from "../types";
import { theme } from "../theme";
import { ESIBadge, Pill } from "./Badges";
import { Reveal, RevealGroup, revealItem, GradientBlob } from "../../shared/motion";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: "Waiting for a bed", color: "#B4600A" },
  incoming: { label: "Ambulance en route", color: "#7C3AED" },
  admitted: { label: "Admitted", color: "#2F7A3C" },
  discharged: { label: "Discharged", color: "#666" },
};

function VitalsTrend({ vitals }: { vitals: PatientPortalView["vitals"] }) {
  if (vitals.length === 0) {
    return <div style={{ fontSize: 13, color: theme.faint, fontFamily: theme.sans }}>No vitals recorded yet.</div>;
  }
  const sorted = [...vitals].reverse(); // oldest first for chart
  const hrValues = sorted.map((v) => v.heart_rate).filter((v): v is number => v !== null);
  const maxHr = Math.max(...hrValues, 100);
  const w = 560, h = 120, pad = 20;

  const points = sorted
    .map((v, i) => {
      if (v.heart_rate === null) return null;
      const x = pad + (i / Math.max(1, sorted.length - 1)) * (w - pad * 2);
      const y = h - pad - (v.heart_rate / maxHr) * (h - pad * 2);
      return { x, y, v };
    })
    .filter((p): p is { x: number; y: number; v: (typeof sorted)[0] } => p !== null);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      <motion.path d={path} fill="none" stroke="#B0201F" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
      {points.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="3" fill="#B0201F" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }} />
      ))}
    </svg>
  );
}

export default function PatientPortal({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [data, setData] = useState<PatientPortalView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .portal(user.username)
      .then(setData)
      .catch((e) => setError(e.message || "Could not load your records."))
      .finally(() => setLoading(false));
  }, [user.username]);

  const status = data ? STATUS_LABELS[data.patient.status] || { label: data.patient.status, color: theme.sub } : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, fontFamily: theme.sans, position: "relative", overflow: "hidden" }}>
      <GradientBlob color="#8A6D00" size={420} top={-160} left={-120} opacity={0.04} duration={14} />

      <div style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🧾</span>
          <span style={{ fontFamily: theme.serif, fontSize: 20, color: theme.ink }}>HEALTHFLOW AI</span>
          <span style={{ fontSize: 12, color: theme.faint }}>Patient Portal</span>
        </div>
        <motion.button onClick={() => { clearAuth(); onLogout(); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ fontFamily: theme.sans, fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: "#fff", cursor: "pointer" }}>
          Log out
        </motion.button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 32, position: "relative", zIndex: 1 }}>
        {loading && <div style={{ textAlign: "center", padding: 60, color: theme.faint }}>Loading your records…</div>}
        {error && <div style={{ textAlign: "center", padding: 40, color: "#B0201F" }}>{error}</div>}

        {data && (
          <>
            <Reveal>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 400, color: theme.ink, marginBottom: 4 }}>
                  Welcome, {data.patient.name}
                </h2>
                <div style={{ fontSize: 13, color: theme.faint }}>{data.patient.id}</div>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div style={{ backgroundColor: "#fff", border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: theme.faint, marginBottom: 4 }}>CURRENT STATUS</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: status?.color }}>{status?.label}</div>
                  </div>
                  <ESIBadge level={data.patient.esi_level} />
                </div>
                {data.hospital && (
                  <div style={{ fontSize: 13, color: theme.ink, marginBottom: 6 }}>
                    🏥 <b>{data.hospital.name}</b> — {data.hospital.address}
                  </div>
                )}
                {data.patient.assigned_bed_id && (
                  <div style={{ fontSize: 13, color: theme.sub, marginBottom: 6 }}>
                    Bed: <b style={{ color: theme.ink }}>{data.patient.assigned_bed_id}</b> ({data.patient.required_ward})
                  </div>
                )}
                <div style={{ fontSize: 13, color: theme.sub, lineHeight: 1.6, marginTop: 10 }}>{data.patient.evidence}</div>
                <div style={{ marginTop: 10 }}>{data.patient.extracted_symptoms.map((s) => <Pill key={s}>{s}</Pill>)}</div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div style={{ backgroundColor: "#fff", border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, marginBottom: 12 }}>Heart Rate Trend</div>
                <VitalsTrend vitals={data.vitals} />
                {data.vitals[0] && (
                  <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: theme.sub, flexWrap: "wrap" }}>
                    {data.vitals[0].heart_rate !== null && <span>❤️ {data.vitals[0].heart_rate} bpm</span>}
                    {data.vitals[0].spo2 !== null && <span>🫁 SpO₂ {data.vitals[0].spo2}%</span>}
                    {data.vitals[0].systolic_bp !== null && <span>🩸 {data.vitals[0].systolic_bp}/{data.vitals[0].diastolic_bp} mmHg</span>}
                    {data.vitals[0].temperature_c !== null && <span>🌡️ {data.vitals[0].temperature_c}°C</span>}
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div style={{ backgroundColor: "#fff", border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, marginBottom: 12 }}>Medications</div>
                {data.medications.length === 0 ? (
                  <div style={{ fontSize: 13, color: theme.faint }}>No medications on record.</div>
                ) : (
                  <RevealGroup style={{ display: "flex", flexDirection: "column", gap: 8 }} stagger={0.05}>
                    {data.medications.map((m) => (
                      <motion.div key={m.id} variants={revealItem} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#F7F5F2", borderRadius: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>{m.drug_name}</div>
                          <div style={{ fontSize: 11, color: theme.faint }}>{m.dosage} · {m.frequency}</div>
                        </div>
                        <div style={{ fontSize: 11, color: theme.faint, textAlign: "right" }}>{m.prescribed_by}</div>
                      </motion.div>
                    ))}
                  </RevealGroup>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div style={{ backgroundColor: "#fff", border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, marginBottom: 12 }}>Treatment Plan</div>
                {data.treatment_plan.length === 0 ? (
                  <div style={{ fontSize: 13, color: theme.faint }}>No treatment plan items yet.</div>
                ) : (
                  <RevealGroup style={{ display: "flex", flexDirection: "column", gap: 8 }} stagger={0.05}>
                    {data.treatment_plan.map((t) => {
                      const statusColor = t.status === "done" ? "#2F7A3C" : t.status === "in_progress" ? "#B4600A" : theme.faint;
                      return (
                        <motion.div key={t.id} variants={revealItem} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", backgroundColor: "#F7F5F2", borderRadius: 10 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: statusColor, marginTop: 5, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>{t.title}</div>
                            {t.description && <div style={{ fontSize: 12, color: theme.sub, marginTop: 2 }}>{t.description}</div>}
                            <div style={{ fontSize: 10, color: statusColor, marginTop: 4, fontWeight: 600, textTransform: "uppercase" }}>{t.status.replace("_", " ")}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </RevealGroup>
                )}
              </div>
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
}
