import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import type { Patient, Role } from "../types";
import { theme } from "../theme";
import { ESIBadge } from "./Badges";

export default function TriageQueue({
  patients,
  onRefresh,
  onExplain,
  onOpenChart,
  role,
}: {
  patients: Patient[];
  onRefresh: () => void;
  onExplain: (patientId: string) => void;
  onOpenChart: (patient: Patient) => void;
  role: Role;
}) {
  const canChangeCondition = role === "doctor" || role === "admin";
  const [changingId, setChangingId] = useState<string | null>(null);
  const [changeText, setChangeText] = useState("");
  const [busy, setBusy] = useState(false);

  const submitChange = async (id: string) => {
    if (!changeText.trim()) return;
    setBusy(true);
    try {
      await api.conditionChange(id, changeText.trim());
      setChangingId(null);
      setChangeText("");
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...patients].sort((a, b) => {
    const ea = a.esi_level ?? 99;
    const eb = b.esi_level ?? 99;
    return ea - eb;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h3 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, marginBottom: 4, color: theme.ink }}>
            Live Triage Queue
          </h3>
          <p style={{ fontSize: 13, color: theme.sub, fontFamily: theme.sans }}>
            Sorted by ESI priority. Simulate a patient's condition changing to trigger live re-triage and reallocation.
          </p>
        </div>
        <motion.button
          onClick={onRefresh}
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          style={{
            fontFamily: theme.sans,
            fontSize: 12,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          ⟳ Refresh
        </motion.button>
      </div>

      {sorted.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 32, textAlign: "center", color: theme.faint, fontFamily: theme.sans, fontSize: 13, border: `1px dashed ${theme.border}`, borderRadius: 12 }}>
          No patients yet — submit an intake to populate the queue.
        </motion.div>
      )}

      {sorted.length > 0 && (
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: theme.sans }}>
            <thead>
              <tr style={{ backgroundColor: "#FAF9F7", textAlign: "left" }}>
                {["Patient", "ESI", "Pathway", "Status", "Bed", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", fontSize: 11, color: theme.faint, fontWeight: 600, letterSpacing: "0.04em" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {sorted.map((p) => (
                  <motion.tr
                    key={p.id}
                    layout
                    initial={{ opacity: 0, backgroundColor: "#FDF6DC" }}
                    animate={{ opacity: 1, backgroundColor: "#ffffff" }}
                    exit={{ opacity: 0 }}
                    transition={{ layout: { duration: 0.35 }, backgroundColor: { duration: 1.2 } }}
                    style={{ borderTop: `1px solid ${theme.border}` }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: theme.faint }}>{p.id}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <ESIBadge level={p.esi_level} />
                      {p.red_flag_triggered && (
                        <div style={{ fontSize: 10, color: "#B0201F", marginTop: 4, fontWeight: 600 }}>⚠ {p.red_flag_rule}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: theme.sub, maxWidth: 180 }}>
                      {p.matched_pathway_name || "—"}
                  </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: theme.sub, textTransform: "capitalize" }}>{p.status}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: theme.ink, fontWeight: 600 }}>
                      {p.assigned_bed_id || <span style={{ color: theme.faint, fontWeight: 400 }}>queued</span>}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onOpenChart(p)}
                          style={{
                            fontFamily: theme.sans,
                            fontSize: 11,
                            padding: "5px 10px",
                            borderRadius: 6,
                            border: `1px solid ${theme.border}`,
                            backgroundColor: "#F7F5F2",
                            cursor: "pointer",
                          }}
                        >
                          📋 Chart
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onExplain(p.id)}
                          style={{
                            fontFamily: theme.sans,
                            fontSize: 11,
                            padding: "5px 10px",
                            borderRadius: 6,
                            border: `1px solid ${theme.border}`,
                            backgroundColor: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Why this bed?
                        </motion.button>
                        {canChangeCondition && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setChangingId(changingId === p.id ? null : p.id)}
                            style={{
                              fontFamily: theme.sans,
                              fontSize: 11,
                              padding: "5px 10px",
                              borderRadius: 6,
                              border: `1px solid ${theme.border}`,
                              backgroundColor: changingId === p.id ? "#111" : "#fff",
                              color: changingId === p.id ? "#fff" : theme.ink,
                              cursor: "pointer",
                            }}
                          >
                            Condition change
                          </motion.button>
                        )}
                      </div>
                      <AnimatePresence>
                        {changingId === p.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ marginTop: 8, display: "flex", gap: 6, overflow: "hidden" }}
                          >
                            <input
                              value={changeText}
                              onChange={(e) => setChangeText(e.target.value)}
                              placeholder="e.g. now developing difficulty breathing"
                              style={{
                                fontFamily: theme.sans,
                                fontSize: 12,
                                padding: "6px 8px",
                                borderRadius: 6,
                                border: `1px solid ${theme.border}`,
                                flex: 1,
                                minWidth: 180,
                              }}
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={busy}
                              onClick={() => submitChange(p.id)}
                              style={{
                                fontFamily: theme.sans,
                                fontSize: 12,
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "none",
                                backgroundColor: "#111",
                                color: "#fff",
                                cursor: "pointer",
                                opacity: busy ? 0.6 : 1,
                              }}
                            >
                              Apply
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
