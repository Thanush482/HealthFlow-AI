import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import type { Bed, Ward, Patient, Role } from "../types";
import { theme, bedStatusColors } from "../theme";
import { BedStatusBadge } from "./Badges";
import { RevealGroup, revealItem } from "../../shared/motion";

const NEXT_EVENTS: Record<string, { event: string; label: string }[]> = {
  available: [{ event: "maintenance", label: "Send to maintenance" }],
  occupied: [{ event: "discharge", label: "Discharge patient" }],
  reserved: [{ event: "cancel_reservation", label: "Cancel reservation" }],
  cleaning: [{ event: "finish_cleaning", label: "Mark clean & available" }],
  maintenance: [{ event: "restore", label: "Restore to available" }],
};

export default function BedMap({
  beds,
  wards,
  patients,
  onRefresh,
  role,
}: {
  beds: Bed[];
  wards: Ward[];
  patients: Patient[];
  onRefresh: () => void;
  role: Role;
}) {
  const canManageBeds = role === "nurse" || role === "admin";
  const [selected, setSelected] = useState<Bed | null>(null);
  const [busy, setBusy] = useState(false);

  const patientById = Object.fromEntries(patients.map((p) => [p.id, p]));

  const runEvent = async (bedId: string, event: string) => {
    setBusy(true);
    try {
      const updated = await api.bedEvent(bedId, event);
      setSelected(updated);
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 320px" : "1fr", gap: 24 }}>
      <div>
        <h3 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, marginBottom: 4, color: theme.ink }}>
          Hospital Bed Map
        </h3>
        <p style={{ fontSize: 13, color: theme.sub, fontFamily: theme.sans, marginBottom: 16 }}>
          Click a bed to inspect it or simulate an operational event (discharge, cleaning, maintenance).
          Every change triggers a live reallocation recalculation across the waiting queue.
        </p>

        {wards.map((ward) => {
          const wardBeds = beds.filter((b) => b.ward_id === ward.id);
          if (wardBeds.length === 0) return null;
          return (
            <motion.div key={ward.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.ink, fontFamily: theme.sans, marginBottom: 8 }}>
                {ward.name} {ward.isolation_capable && <span style={{ color: theme.faint, fontWeight: 400 }}>· isolation-capable</span>}
              </div>
              <RevealGroup style={{ display: "flex", flexWrap: "wrap", gap: 8 }} stagger={0.03}>
                {wardBeds.map((b) => {
                  const c = bedStatusColors[b.status];
                  const isSelected = selected?.id === b.id;
                  return (
                    <motion.button
                      key={b.id}
                      variants={revealItem}
                      layout
                      onClick={() => setSelected(b)}
                      whileHover={{ scale: 1.08, boxShadow: "0 6px 16px rgba(0,0,0,0.1)" }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        scale: isSelected ? 1.05 : 1,
                        borderColor: isSelected ? "#111111" : theme.border,
                        borderWidth: isSelected ? 2 : 1,
                      }}
                      style={{
                        width: 84,
                        height: 64,
                        borderRadius: 10,
                        borderStyle: "solid",
                        backgroundColor: c.bg,
                        color: c.fg,
                        fontFamily: theme.sans,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                        padding: 4,
                      }}
                      title={`${b.id} — ${b.status}`}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{b.id}</span>
                      {b.status === "available" ? (
                        <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: c.dot }} />
                      ) : (
                        <motion.span
                          style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: c.dot }}
                          animate={b.status === "occupied" || b.status === "reserved" ? { opacity: [1, 0.4, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </RevealGroup>
            </motion.div>
          );
        })}

        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {Object.entries(bedStatusColors).map(([status, c]) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: theme.sub, fontFamily: theme.sans }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: c.dot }} />
              <span style={{ textTransform: "capitalize" }}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, backgroundColor: "#fff", alignSelf: "start" }}
          >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: theme.sans, fontWeight: 700, fontSize: 15, color: theme.ink }}>{selected.id}</div>
              <div style={{ fontFamily: theme.sans, fontSize: 12, color: theme.faint }}>{selected.ward_id}</div>
            </div>
            <BedStatusBadge status={selected.status} />
          </div>

          <div style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, marginBottom: 4 }}>
            Nursing station distance: <b style={{ color: theme.ink }}>{selected.nursing_station_distance}</b>
          </div>
          <div style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, marginBottom: 4 }}>
            Isolation capable: <b style={{ color: theme.ink }}>{selected.isolation ? "Yes" : "No"}</b>
          </div>
          <div style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, marginBottom: 12 }}>
            Equipment: <b style={{ color: theme.ink }}>{selected.equipment.length ? selected.equipment.join(", ") : "none"}</b>
          </div>

          {selected.occupant_patient_id && patientById[selected.occupant_patient_id] && (
            <div style={{ marginBottom: 12, padding: 10, backgroundColor: "#FAF9F7", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, marginBottom: 2 }}>OCCUPANT</div>
              <div style={{ fontSize: 13, fontFamily: theme.sans, color: theme.ink, fontWeight: 600 }}>
                {patientById[selected.occupant_patient_id].name}
              </div>
              <div style={{ fontSize: 11, fontFamily: theme.sans, color: theme.sub }}>
                ESI-{patientById[selected.occupant_patient_id].esi_level}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, marginBottom: 8 }}>SIMULATE EVENT</div>
          {!canManageBeds && (
            <div style={{ backgroundColor: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", borderRadius: 8, padding: "8px 10px", fontSize: 11, fontFamily: theme.sans, marginBottom: 10 }}>
              Role '{role}' can view but not operate beds — sign in as Nurse or Admin.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {canManageBeds && (NEXT_EVENTS[selected.status] || []).map((ev) => (
              <motion.button
                key={ev.event}
                disabled={busy}
                onClick={() => runEvent(selected.id, ev.event)}
                whileHover={!busy ? { scale: 1.03 } : {}}
                whileTap={!busy ? { scale: 0.97 } : {}}
                style={{
                  fontFamily: theme.sans,
                  fontSize: 12,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: "#111",
                  color: "#fff",
                  cursor: "pointer",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {ev.label}
              </motion.button>
            ))}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
