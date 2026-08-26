import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { api } from "../api";
import { theme } from "../theme";
import type { AuditEntry, Role } from "../types";
import { PulseDot } from "../../shared/motion";

const EVENT_COLORS: Record<string, { bg: string; fg: string }> = {
  intake: { bg: "#E9F0FB", fg: "#295DA8" },
  triage: { bg: "#FDF6DC", fg: "#8A6D00" },
  red_flag: { bg: "#FDE7E7", fg: "#B0201F" },
  allocation: { bg: "#E9F3E7", fg: "#2F7A3C" },
  state_event: { bg: "#F1F1F1", fg: "#555555" },
  ambulance_prealert: { bg: "#F3E8FD", fg: "#7C3AED" },
};

function fmtTime(ts: string) {
  try {
    return new Date(ts + (ts.endsWith("Z") ? "" : "Z")).toLocaleTimeString();
  } catch {
    return ts;
  }
}

export default function AuditLog({ entries, onRefresh, role }: { entries: AuditEntry[]; onRefresh: () => void; role: Role }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const canExport = role === "admin";

  const doExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await api.exportAuditCsv();
    } catch (err: any) {
      setExportError(err.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, marginBottom: 4, color: theme.ink }}>
            Audit & Decision Trail
          </h3>
          <p style={{ fontSize: 13, color: theme.sub, fontFamily: theme.sans }}>
            Append-only log of every intake, triage decision, safety override, allocation, and hospital-state
            event — for authorized clinical/operational review.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {canExport ? (
            <motion.button
              onClick={doExport}
              disabled={exporting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                fontFamily: theme.sans,
                fontSize: 12,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#111",
                color: "#fff",
                cursor: exporting ? "default" : "pointer",
                opacity: exporting ? 0.6 : 1,
              }}
            >
              {exporting ? "Exporting…" : "⬇ Export CSV"}
            </motion.button>
          ) : (
            <span
              title={`Role '${role}' cannot export — sign in as Admin`}
              style={{ fontFamily: theme.sans, fontSize: 11, color: theme.faint, padding: "8px 4px" }}
            >
              Export requires Admin
            </span>
          )}
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
      </div>

      <AnimatePresence>
        {exportError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "#B0201F", fontSize: 12, fontFamily: theme.sans, marginBottom: 12, overflow: "hidden" }}>
            {exportError}
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 32, textAlign: "center", color: theme.faint, fontFamily: theme.sans, fontSize: 13, border: `1px dashed ${theme.border}`, borderRadius: 12 }}>
          No audit entries yet.
        </motion.div>
      )}

      {entries.length > 0 && (
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, backgroundColor: "#fff", maxHeight: 560, overflowY: "auto" }}>
          <AnimatePresence initial={false}>
            {entries.map((e, i) => {
              const c = EVENT_COLORS[e.event_type] || EVENT_COLORS.state_event;
              const isCritical = e.event_type === "red_flag";
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -12, backgroundColor: isCritical ? "#FDE7E7" : "#FDF6DC" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "#ffffff" }}
                  transition={{ x: { duration: 0.25 }, opacity: { duration: 0.25 }, backgroundColor: { duration: 1.4, delay: i * 0.02 } }}
                  style={{ display: "flex", gap: 12, padding: "12px 16px", borderTop: `1px solid ${theme.border}` }}
                >
                  <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, width: 76, flexShrink: 0, paddingTop: 3 }}>
                    {fmtTime(e.timestamp)}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: theme.sans,
                      backgroundColor: c.bg,
                      color: c.fg,
                      padding: "3px 8px",
                      borderRadius: 999,
                      height: "fit-content",
                    flexShrink: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                  >
                    {e.event_type.replace("_", " ")}
                  </span>
                  <div style={{ fontSize: 13, color: theme.ink, fontFamily: theme.sans, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6 }}>
                    {isCritical && <PulseDot color="#B0201F" size={6} />}
                    {e.summary}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
