import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, clearAuth } from "../api";
import type { AuthUser, HospitalWithCapacity, NearbyHospitalsResponse, Patient } from "../types";
import { theme } from "../theme";
import { ESIBadge, Pill } from "./Badges";
import { PulseDot, GradientBlob } from "../../shared/motion";
import { VitalsWave } from "../../shared/illustrations";

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

// Default fallback location (Vadodara city center) if geolocation is denied/unavailable.
const DEFAULT_LOCATION = { lat: 22.3072, lng: 73.1812 };

export default function AmbulanceDispatch({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [complaint, setComplaint] = useState("");
  const [lat, setLat] = useState(DEFAULT_LOCATION.lat);
  const [lng, setLng] = useState(DEFAULT_LOCATION.lng);
  const [locating, setLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Default: Vadodara city center (edit manually or use device location)");

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NearbyHospitalsResponse | null>(null);
  const [dispatched, setDispatched] = useState<Patient | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [arrived, setArrived] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationLabel("Geolocation not supported by this browser — using default location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationLabel(`Device location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocating(false);
      },
      () => {
        setLocationLabel("Location access denied — using default location.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !complaint.trim()) {
      setError("Patient name and condition are required.");
      return;
    }
    setSearching(true);
    setError(null);
    setResults(null);
    setDispatched(null);
    setArrived(false);
    try {
      const res = await api.nearbyHospitals({
        name: name.trim(),
        age: age ? parseInt(age, 10) : undefined,
        sex: sex || undefined,
        complaint: complaint.trim(),
        latitude: lat,
        longitude: lng,
      });
      setResults(res);
    } catch (err: any) {
      setError(err.message || "Could not reach nearby hospitals.");
    } finally {
      setSearching(false);
    }
  };

  const dispatchTo = async (hospital: HospitalWithCapacity) => {
    setDispatchingId(hospital.id);
    setError(null);
    try {
      const patient = await api.dispatch({
        hospital_id: hospital.id,
        name: name.trim(),
        age: age ? parseInt(age, 10) : undefined,
        sex: sex || undefined,
        complaint: complaint.trim(),
        eta_minutes: hospital.eta_minutes || 10,
      });
      setDispatched(patient);
    } catch (err: any) {
      setError(err.message || "Dispatch failed.");
    } finally {
      setDispatchingId(null);
    }
  };

  const confirmArrival = async () => {
    if (!dispatched) return;
    setConfirming(true);
    try {
      await api.ambulanceArrive(dispatched.id);
      setArrived(true);
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setName("");
    setAge("");
    setSex("");
    setComplaint("");
    setResults(null);
    setDispatched(null);
    setArrived(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, fontFamily: theme.sans, position: "relative", overflow: "hidden" }}>
      <GradientBlob color="#B0201F" size={420} top={-160} right={-120} opacity={0.04} duration={14} />

      <div style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ fontSize: 22 }}>🚑</motion.span>
          <span style={{ fontFamily: theme.serif, fontSize: 20, color: theme.ink }}>HEALTHFLOW AI</span>
          <span style={{ fontSize: 12, color: theme.faint }}>Ambulance Dispatch — {user.name}</span>
        </div>
        <motion.button onClick={() => { clearAuth(); onLogout(); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ fontFamily: theme.sans, fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: "#fff", cursor: "pointer" }}>
          Log out
        </motion.button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 32, position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {!dispatched && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontFamily: theme.serif, fontSize: 26, fontWeight: 400, color: theme.ink, marginBottom: 6 }}>
                Which hospital can take this patient?
              </h2>
              <p style={{ fontSize: 14, color: theme.sub, marginBottom: 24, lineHeight: 1.6 }}>
                Describe the patient's condition and your current location. HealthFlow pre-triages instantly and
                ranks every network hospital by distance <em>and</em> whether they actually have a compatible bed
                free right now — not just whichever is closest.
              </p>

              <form onSubmit={search} style={{ backgroundColor: "#fff", border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: 12, color: theme.sub, display: "block", marginBottom: 4 }}>Patient name</label>
                    <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kiran Patel" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: theme.sub, display: "block", marginBottom: 4 }}>Age</label>
                    <input style={inputStyle} value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" placeholder="45" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: theme.sub, display: "block", marginBottom: 4 }}>Sex</label>
                    <select style={inputStyle} value={sex} onChange={(e) => setSex(e.target.value)}>
                      <option value="">—</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <label style={{ fontSize: 12, color: theme.sub, display: "block", marginBottom: 4 }}>Condition (paramedic report)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical", marginBottom: 14 }}
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="e.g. Unresponsive after fall from height, heavy bleeding from head wound"
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, backgroundColor: "#F7F5F2", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: theme.sub }}>📍 {locationLabel}</div>
                  <motion.button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ fontFamily: theme.sans, fontSize: 11, padding: "6px 12px", borderRadius: 999, border: `1px solid ${theme.border}`, backgroundColor: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {locating ? "Locating…" : "📡 Use my location"}
                  </motion.button>
                </div>

                {error && <div style={{ color: "#B0201F", fontSize: 13, marginBottom: 12 }}>{error}</div>}

                <motion.button
                  type="submit"
                  disabled={searching}
                  whileHover={!searching ? { scale: 1.02 } : {}}
                  whileTap={!searching ? { scale: 0.98 } : {}}
                  style={{ width: "100%", backgroundColor: "#B0201F", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 14, fontWeight: 600, cursor: searching ? "default" : "pointer", opacity: searching ? 0.7 : 1 }}
                >
                  {searching ? "Pre-triaging & checking hospitals…" : "Find Nearest Compatible Hospital"}
                </motion.button>
              </form>

              <AnimatePresence>
                {results && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={{ backgroundColor: results.triage_preview.red_flag_triggered ? "#FDE7E7" : "#fff", border: `1px solid ${results.triage_preview.red_flag_triggered ? "#F5C2C2" : theme.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: theme.faint }}>PRE-TRIAGE RESULT</span>
                        <ESIBadge level={results.triage_preview.esi_level} />
                      </div>
                      {results.triage_preview.red_flag_triggered && (
                        <div style={{ fontSize: 12, color: "#B0201F", fontWeight: 600, marginBottom: 6 }}>⚠ {results.triage_preview.red_flag_rule}</div>
                      )}
                      <div style={{ fontSize: 13, color: theme.ink, marginBottom: 8 }}>{results.triage_preview.evidence}</div>
                      <div>{results.triage_preview.extracted_symptoms.map((s) => <Pill key={s}>{s}</Pill>)}</div>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink, marginBottom: 10 }}>
                      Ranked hospitals ({results.hospitals.length})
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {results.hospitals.map((h, i) => (
                        <motion.div
                          key={h.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          style={{
                            border: `1px solid ${i === 0 && (h.compatible_beds || 0) > 0 ? "#16A34A" : theme.border}`,
                            borderRadius: 12,
                            padding: 16,
                            backgroundColor: "#fff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 16,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{h.name}</span>
                              {i === 0 && (h.compatible_beds || 0) > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "#DCFCE7", color: "#16A34A", padding: "2px 8px", borderRadius: 999 }}>BEST MATCH</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: theme.faint, marginTop: 2 }}>{h.address}</div>
                            <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12, color: theme.sub, flexWrap: "wrap" }}>
                              <span>📍 {h.distance_km} km · ~{h.eta_minutes} min</span>
                              <span style={{ color: (h.compatible_beds || 0) > 0 ? "#16A34A" : "#B0201F", fontWeight: 600 }}>
                                {h.compatible_beds || 0} compatible bed{h.compatible_beds === 1 ? "" : "s"}
                              </span>
                              <span>{h.available_beds}/{h.total_beds} beds free overall</span>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={dispatchingId === h.id}
                            onClick={() => dispatchTo(h)}
                            style={{
                              fontFamily: theme.sans,
                              fontSize: 13,
                              fontWeight: 600,
                              padding: "10px 20px",
                              borderRadius: 8,
                              border: "none",
                              backgroundColor: "#111",
                              color: "#fff",
                              cursor: "pointer",
                              opacity: dispatchingId === h.id ? 0.6 : 1,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {dispatchingId === h.id ? "Dispatching…" : "Dispatch Here"}
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {dispatched && (
            <motion.div key="dispatched" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: "center", paddingTop: 20 }}>
              <div style={{ marginBottom: 16, opacity: 0.5 }}>
                <VitalsWave width={320} height={80} stroke={arrived ? "#16A34A" : "#B0201F"} />
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <PulseDot color={arrived ? "#16A34A" : "#7C3AED"} size={10} />
                <span style={{ fontSize: 13, fontWeight: 600, color: arrived ? "#16A34A" : "#7C3AED" }}>
                  {arrived ? "ARRIVAL CONFIRMED" : "EN ROUTE — BED RESERVED"}
                </span>
              </div>
              <h2 style={{ fontFamily: theme.serif, fontSize: 26, fontWeight: 400, color: theme.ink, marginBottom: 10 }}>
                {dispatched.name} → {dispatched.hospital_id}
              </h2>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
                <Stat label="ESI Level" value={<ESIBadge level={dispatched.esi_level} />} />
                <Stat label="Assigned Bed" value={dispatched.assigned_bed_id || "Pending — queued"} />
                <Stat label="Status" value={dispatched.status} />
              </div>

              {dispatched.red_flag_triggered && (
                <div style={{ maxWidth: 420, margin: "0 auto 24px", backgroundColor: "#FDE7E7", border: "1px solid #F5C2C2", borderRadius: 10, padding: 12, fontSize: 12, color: "#B0201F", fontWeight: 600 }}>
                  ⚠ {dispatched.red_flag_rule}
                </div>
              )}

              {!arrived ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={confirming}
                  onClick={confirmArrival}
                  style={{ backgroundColor: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: confirming ? "default" : "pointer", opacity: confirming ? 0.7 : 1 }}
                >
                  {confirming ? "Confirming…" : "✓ Confirm Arrival at Hospital"}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={reset}
                  style={{ backgroundColor: "#fff", color: theme.ink, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                >
                  Dispatch Another Patient
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: theme.faint, letterSpacing: "0.05em", marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>{value}</div>
    </div>
  );
}
