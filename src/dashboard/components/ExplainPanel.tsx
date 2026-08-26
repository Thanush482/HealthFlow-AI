import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import type { Patient } from "../types";
import { theme } from "../theme";
import { ESIBadge } from "./Badges";

export default function ExplainPanel({
  patients,
  selectedId,
  onSelect,
}: {
  patients: Patient[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) {
      setData(null);
      return;
    }
    setLoading(true);
    api
      .explain(selectedId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [selectedId]);

  const patient = patients.find((p) => p.id === selectedId) || null;

  return (
    <div>
      <h3 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, marginBottom: 4, color: theme.ink }}>
        Allocation Explainability
      </h3>
      <p style={{ fontSize: 13, color: theme.sub, fontFamily: theme.sans, marginBottom: 16 }}>
        Select any patient to see exactly which hard constraints each bed satisfied or failed, and the
        soft-constraint score the optimizer used to choose the assignment. This is the "ask the judge why"
        step of the demo.
      </p>

      <select
        value={selectedId || ""}
        onChange={(e) => onSelect(e.target.value || null)}
        style={{
          fontFamily: theme.sans,
          fontSize: 13,
          padding: "10px 12px",
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
          marginBottom: 20,
          minWidth: 280,
        }}
      >
        <option value="">Select a patient…</option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.id} (ESI-{p.esi_level})
          </option>
        ))}
      </select>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontFamily: theme.sans, fontSize: 13, color: theme.faint, display: "flex", alignItems: "center", gap: 8 }}>
            <motion.span
              style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${theme.border}`, borderTopColor: theme.ink, display: "inline-block" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />
            Loading…
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && patient && data && (
        <motion.div
          key={patient.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}
        >
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, backgroundColor: "#fff", alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontFamily: theme.sans, fontWeight: 700, fontSize: 14, color: theme.ink }}>{patient.name}</div>
              <ESIBadge level={patient.esi_level} />
            </div>
            <div style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, marginBottom: 4 }}>
              Required ward: <b style={{ color: theme.ink }}>{patient.required_ward}</b>
            </div>
            <div style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, marginBottom: 4 }}>
              Required equipment: <b style={{ color: theme.ink }}>{patient.required_equipment.join(", ") || "none"}</b>
            </div>
            <div style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, marginBottom: 4 }}>
              Isolation required: <b style={{ color: theme.ink }}>{patient.isolation_required ? "Yes" : "No"}</b>
            </div>
            <div style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans }}>
              Currently assigned:{" "}
              <b style={{ color: theme.ink }}>{data.assigned_bed_id || "unassigned — in queue"}</b>
            </div>
          </div>

          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: theme.sans }}>
              <thead>
                <tr style={{ backgroundColor: "#FAF9F7", textAlign: "left" }}>
                  {["Bed", "Compatible", "Score", "Reasoning"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", fontSize: 11, color: theme.faint, fontWeight: 600 }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.live_compatibility as Record<string, any>)
                  .sort(([, a]: any, [, b]: any) => {
                    if (a.compatible && !b.compatible) return -1;
                    if (!a.compatible && b.compatible) return 1;
                    return (b.score ?? -9999) - (a.score ?? -9999);
                  })
                  .map(([bedId, cell]: [string, any], i) => (
                    <motion.tr
                      key={bedId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ backgroundColor: "#FAF9F7" }}
                      style={{
                        borderTop: `1px solid ${theme.border}`,
                        backgroundColor: bedId === data.assigned_bed_id ? "#F0FDF4" : undefined,
                      }}
                    >
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: theme.ink }}>
                        {bedId}
                        {bedId === data.assigned_bed_id && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, delay: 0.2 }}
                            style={{ marginLeft: 6, fontSize: 10, color: "#2F7A3C", fontWeight: 700 }}
                          >
                            ★ CHOSEN
                          </motion.span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: cell.compatible ? "#2F7A3C" : "#B0201F", fontWeight: 600 }}>
                        {cell.compatible ? "Yes" : "No"}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: theme.sub }}>{cell.score ?? "—"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: theme.sub }}>
                        {cell.reasons.join("; ")}
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {!loading && !patient && (
        <div style={{ padding: 32, textAlign: "center", color: theme.faint, fontFamily: theme.sans, fontSize: 13, border: `1px dashed ${theme.border}`, borderRadius: 12 }}>
          Select a patient above to see the full explainability breakdown.
        </div>
      )}
    </div>
  );
}
