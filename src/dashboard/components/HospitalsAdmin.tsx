import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import type { HospitalWithCapacity } from "../types";
import { theme } from "../theme";
import { Reveal, RevealGroup, revealItem } from "../../shared/motion";

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

export default function HospitalsAdmin({ activeHospitalId, onSelectHospital, onChanged }: { activeHospitalId: string | null; onSelectHospital: (id: string) => void; onChanged?: () => void }) {
  const [hospitals, setHospitals] = useState<HospitalWithCapacity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.hospitals().then(setHospitals).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !lat || !lng) {
      setError("Name, latitude, and longitude are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.createHospital({ name: name.trim(), address: address.trim() || undefined, latitude: parseFloat(lat), longitude: parseFloat(lng) });
      setName(""); setAddress(""); setLat(""); setLng("");
      setShowForm(false);
      load();
      onChanged?.();
    } catch (err: any) {
      setError(err.message || "Could not create hospital.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, marginBottom: 4, color: theme.ink }}>Hospital Network</h3>
          <p style={{ fontSize: 13, color: theme.sub, fontFamily: theme.sans }}>
            All hospitals in the network. Click one to make it your active operating hospital for Intake, Triage Queue, and Bed Map.
          </p>
        </div>
        <motion.button
          onClick={() => setShowForm((s) => !s)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ fontFamily: theme.sans, fontSize: 12, padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: "#111", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {showForm ? "Cancel" : "+ Add Hospital"}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", backgroundColor: "#fff", border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}
          >
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: 2, minWidth: 200 }} placeholder="Hospital name" value={name} onChange={(e) => setName(e.target.value)} />
              <input style={{ ...inputStyle, flex: 2, minWidth: 200 }} placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input style={inputStyle} placeholder="Latitude (e.g. 22.31)" value={lat} onChange={(e) => setLat(e.target.value)} />
              <input style={inputStyle} placeholder="Longitude (e.g. 73.18)" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
            {error && <div style={{ color: "#B0201F", fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <motion.button whileHover={{ scale: 1.02 }} disabled={busy} type="submit" style={{ backgroundColor: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {busy ? "Creating…" : "Create Hospital"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <RevealGroup style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} stagger={0.06} className="hospitals-grid">
        <style>{`@media (max-width: 700px) { .hospitals-grid { grid-template-columns: 1fr !important; } }`}</style>
        {hospitals.map((h) => {
          const pct = h.total_beds ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100) : 0;
          const isActive = h.id === activeHospitalId;
          return (
            <motion.button
              key={h.id}
              variants={revealItem}
              onClick={() => onSelectHospital(h.id)}
              whileHover={{ y: -3, boxShadow: "0 10px 24px rgba(0,0,0,0.08)" }}
              style={{
                textAlign: "left",
                border: `2px solid ${isActive ? "#111" : theme.border}`,
                borderRadius: 14,
                padding: 20,
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{h.name}</div>
                {isActive && <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#111", color: "#fff", padding: "2px 8px", borderRadius: 999 }}>ACTIVE</span>}
              </div>
              <div style={{ fontSize: 12, color: theme.faint, marginBottom: 12 }}>{h.address}</div>
              <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 20, fontFamily: theme.serif, color: theme.ink }}>{h.total_beds}</div>
                  <div style={{ fontSize: 10, color: theme.faint }}>TOTAL BEDS</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontFamily: theme.serif, color: "#2F7A3C" }}>{h.available_beds}</div>
                  <div style={{ fontSize: 10, color: theme.faint }}>AVAILABLE</div>
                </div>
              </div>
              <div style={{ height: 6, backgroundColor: "#F0EDE9", borderRadius: 3, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} style={{ height: "100%", backgroundColor: pct >= 80 ? "#DC2626" : pct >= 60 ? "#EA580C" : "#16A34A" }} />
              </div>
            </motion.button>
          );
        })}
      </RevealGroup>
    </div>
  );
}
