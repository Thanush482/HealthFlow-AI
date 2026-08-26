import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import type { Patient, Role } from "../types";
import { theme } from "../theme";
import { ESIBadge, Pill } from "./Badges";
import { Reveal, RevealGroup, revealItem, PulseDot } from "../../shared/motion";
import { PulseBadge } from "../../shared/illustrations";

const SAMPLE_CASES = [
  {
    label: "Chest pain (red-flag ACS)",
    name: "Ramesh Iyer",
    age: 58,
    sex: "male",
    complaint: "Severe crushing chest pain since 20 minutes, sweating a lot, and pain going to my left arm",
  },
  {
    label: "Stroke (FAST positive)",
    name: "Ahmed Khan",
    age: 67,
    sex: "male",
    complaint: "Sudden slurred speech and facial droop, also confusion since just now",
  },
  {
    label: "Mild UTI (non-urgent)",
    name: "Priya Nair",
    age: 29,
    sex: "female",
    complaint: "Mild burning urination and frequent urination since 2 days",
  },
  {
    label: "Anaphylaxis (airway red-flag)",
    name: "Zara Sheikh",
    age: 24,
    sex: "female",
    complaint: "Difficulty breathing and throat swelling with hives after eating peanuts, sudden onset",
  },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${theme.border}`,
  fontFamily: theme.sans,
  fontSize: 14,
  backgroundColor: "#fff",
  boxSizing: "border-box",
};

const PIPELINE_STEPS = ["Understand", "Ground", "Triage", "Guard"];

export default function IntakeForm({ onIntake, role, hospitalId }: { onIntake: (p: Patient) => void; role: Role; hospitalId: string }) {
  const canSubmit = role === "doctor" || role === "admin";
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [complaint, setComplaint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Patient | null>(null);
  const [pipelineStep, setPipelineStep] = useState(0);

  const fillSample = (s: (typeof SAMPLE_CASES)[number]) => {
    setName(s.name);
    setAge(String(s.age));
    setSex(s.sex);
    setComplaint(s.complaint);
    setResult(null);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !complaint.trim()) {
      setError("Name and complaint are required.");
      return;
    }
    setLoading(true);
    setError(null);
    setPipelineStep(0);
    const stepTimer = setInterval(() => {
      setPipelineStep((s) => (s < PIPELINE_STEPS.length - 1 ? s + 1 : s));
    }, 260);
    try {
      const patient = await api.intake({
        hospital_id: hospitalId,
        name: name.trim(),
        age: age ? parseInt(age, 10) : undefined,
        sex: sex || undefined,
        complaint: complaint.trim(),
      });
      setPipelineStep(PIPELINE_STEPS.length - 1);
      setResult(patient);
      onIntake(patient);
    } catch (err: any) {
      setError(err.message || "Intake failed.");
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="intake-grid">
      <style>{`@media (max-width: 900px) { .intake-grid { grid-template-columns: 1fr !important; } }`}</style>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <PulseBadge size={36} />
          <h3 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, color: theme.ink, margin: 0 }}>
            Patient Intake
          </h3>
        </div>
        <p style={{ fontSize: 13, color: theme.sub, fontFamily: theme.sans, marginBottom: 16 }}>
          Conversational complaint intake. Structured extraction, ontology grounding, ESI triage and
          the deterministic safety guardrail all run automatically on submit.
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, marginBottom: 8, letterSpacing: "0.05em" }}>
            QUICK-FILL DEMO CASES
          </div>
          {SAMPLE_CASES.map((s) => (
            <motion.button
              key={s.label}
              type="button"
              onClick={() => fillSample(s)}
              whileHover={{ scale: 1.05, backgroundColor: "#111", color: "#fff" }}
              whileTap={{ scale: 0.96 }}
              style={{
                fontFamily: theme.sans,
                fontSize: 12,
                padding: "6px 12px",
                marginRight: 8,
                marginBottom: 8,
                borderRadius: 999,
                border: `1px solid ${theme.border}`,
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              {s.label}
            </motion.button>
          ))}
        </div>

        <form onSubmit={submit}>
          {!canSubmit && (
            <div style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontFamily: theme.sans, marginBottom: 12 }}>
              Your role ({role}) can view intake but not submit new patients — sign in as Doctor or Admin to run the pipeline.
            </div>
          )}
          <fieldset disabled={!canSubmit} style={{ border: "none", padding: 0, margin: 0, opacity: canSubmit ? 1 : 0.6 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, display: "block", marginBottom: 4 }}>
                Patient name
              </label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anjali Rao" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, display: "block", marginBottom: 4 }}>
                Age
              </label>
              <input style={inputStyle} value={age} onChange={(e) => setAge(e.target.value)} placeholder="42" inputMode="numeric" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, display: "block", marginBottom: 4 }}>
                Sex
              </label>
              <select style={inputStyle} value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <label style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, display: "block", marginBottom: 4 }}>
            Patient complaint (natural language)
          </label>
          <textarea
            style={{ ...inputStyle, minHeight: 100, resize: "vertical", marginBottom: 12 }}
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Describe symptoms in the patient's own words..."
          />

          {error && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} style={{ color: "#B0201F", fontSize: 13, fontFamily: theme.sans, marginBottom: 12 }}>
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.03 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            style={{
              backgroundColor: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: theme.sans,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.85 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading && (
              <motion.span
                style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", display: "inline-block" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              />
            )}
            {loading ? "Processing pipeline…" : "Run Intake Pipeline"}
          </motion.button>

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: "flex", gap: 8, marginTop: 16, overflow: "hidden" }}
              >
                {PIPELINE_STEPS.map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <motion.div
                      animate={{
                        backgroundColor: i <= pipelineStep ? "#111" : "#F0EDE9",
                        color: i <= pipelineStep ? "#fff" : theme.faint,
                        scale: i === pipelineStep ? 1.12 : 1,
                      }}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: theme.sans,
                      }}
                    >
                      {i + 1}
                    </motion.div>
                    <span style={{ fontSize: 11, fontFamily: theme.sans, color: i <= pipelineStep ? theme.ink : theme.faint, fontWeight: i === pipelineStep ? 700 : 400 }}>
                      {s}
                    </span>
                    {i < PIPELINE_STEPS.length - 1 && <span style={{ color: theme.border }}>→</span>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          </fieldset>
        </form>
      </div>

      <div>
        <h3 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, marginBottom: 4, color: theme.ink }}>
          Pipeline Result
        </h3>
        <p style={{ fontSize: 13, color: theme.sub, fontFamily: theme.sans, marginBottom: 16 }}>
          Understand → Ground → Triage → Guard, shown with full evidence.
        </p>

        {!result && (
          <div
            style={{
              border: `1px dashed ${theme.border}`,
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              color: theme.faint,
              fontFamily: theme.sans,
              fontSize: 13,
            }}
          >
            Submit an intake to see the structured extraction, grounded pathway, ESI classification and
            allocation outcome here.
          </div>
        )}

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, backgroundColor: "#fff" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: theme.sans, fontWeight: 600, fontSize: 15, color: theme.ink }}>{result.name}</div>
                  <div style={{ fontFamily: theme.sans, fontSize: 12, color: theme.faint }}>{result.id}</div>
                </div>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 300 }}>
                  <ESIBadge level={result.esi_level} />
                </motion.div>
              </div>

              {result.red_flag_triggered && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    backgroundColor: "#FDE7E7",
                    color: "#B0201F",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontFamily: theme.sans,
                    fontWeight: 600,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <PulseDot color="#B0201F" size={7} />
                  Safety Guardrail Override: {result.red_flag_rule}
                </motion.div>
              )}

              <RevealGroup stagger={0.08}>
                <motion.div variants={revealItem} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, marginBottom: 6 }}>EXTRACTED SYMPTOMS</div>
                  <div>
                    {result.extracted_symptoms.length === 0 && (
                      <span style={{ fontSize: 12, color: theme.faint, fontFamily: theme.sans }}>none matched</span>
                    )}
                    {result.extracted_symptoms.map((s) => (
                      <Pill key={s}>{s}</Pill>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, marginTop: 4 }}>
                    Duration: {result.duration} · Severity: {result.severity}
                  </div>
                </motion.div>

                <motion.div variants={revealItem} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, marginBottom: 6 }}>GROUNDED PATHWAY</div>
                  <div style={{ fontSize: 13, fontFamily: theme.sans, color: theme.ink }}>
                    {result.matched_pathway_name || "No pathway matched"}{" "}
                    {result.match_score !== null && (
                      <span style={{ color: theme.faint }}>(retrieval score {result.match_score})</span>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={revealItem} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, marginBottom: 6 }}>
                    EVIDENCE (confidence {result.confidence !== null ? Math.round(result.confidence * 100) : "—"}%)
                  </div>
                  <div style={{ fontSize: 13, fontFamily: theme.sans, color: theme.ink, lineHeight: 1.5 }}>{result.evidence}</div>
                </motion.div>

                <motion.div variants={revealItem}>
                  <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, marginBottom: 6 }}>ALLOCATION</div>
                  <div style={{ fontSize: 13, fontFamily: theme.sans, color: theme.ink }}>
                    {result.assigned_bed_id ? (
                      <>
                        Assigned to bed <b>{result.assigned_bed_id}</b> in {result.required_ward}
                      </>
                    ) : (
                      <span style={{ color: "#B4600A" }}>No compatible bed currently available — queued.</span>
                    )}
                  </div>
                </motion.div>
              </RevealGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
