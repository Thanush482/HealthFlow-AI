import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { api, useHospitalSocket, clearAuth, getStoredHospitalId, storeHospitalId } from "../api";
import type { Patient, Bed, Ward, AuditEntry, AuthUser, HospitalWithCapacity, Role } from "../types";
import { theme, roleColors } from "../theme";
import { PulseDot, CountUp, GradientBlob } from "../../shared/motion";
import IntakeForm from "./IntakeForm";
import TriageQueue from "./TriageQueue";
import BedMap from "./BedMap";
import ExplainPanel from "./ExplainPanel";
import AuditLog from "./AuditLog";
import Analytics from "./Analytics";
import HospitalsAdmin from "./HospitalsAdmin";
import PatientChart from "./PatientChart";

type Tab = "hospitals" | "intake" | "queue" | "beds" | "explain" | "analytics" | "audit";

const TAB_META: Record<Tab, { label: string; icon: string }> = {
  hospitals: { label: "Hospital Management", icon: "🏥" },
  intake: { label: "Intake", icon: "📝" },
  queue: { label: "Triage Queue", icon: "🩺" },
  beds: { label: "Bed Map", icon: "🛏️" },
  explain: { label: "Explainability", icon: "🔍" },
  analytics: { label: "Analytics", icon: "📊" },
  audit: { label: "Audit Trail", icon: "📜" },
};

// Each role sees a genuinely different navigation set, not just gated buttons —
// this is what actually makes the three logins feel like different products.
const ROLE_TABS: Record<Role, Tab[]> = {
  admin: ["hospitals", "analytics", "audit", "queue", "beds", "intake", "explain"],
  doctor: ["intake", "queue", "explain"],
  nurse: ["beds", "queue", "explain"],
  ambulance: [],
  patient: [],
};

const ROLE_TAGLINE: Record<Role, string> = {
  admin: "Hospital Management Console",
  doctor: "Clinical Care Workspace",
  nurse: "Bed & Patient Operations",
  ambulance: "",
  patient: "",
};

export default function StaffDashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [hospitals, setHospitals] = useState<HospitalWithCapacity[]>([]);
  const [hospitalId, setHospitalId] = useState<string | null>(getStoredHospitalId());
  const tabsForRole = ROLE_TABS[user.role];
  const [tab, setTab] = useState<Tab>(tabsForRole[0] || "queue");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [explainId, setExplainId] = useState<string | null>(null);
  const [chartPatient, setChartPatient] = useState<Patient | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  const refreshHospitals = useCallback(() => {
    api.hospitals().then((hs) => {
      setHospitals(hs);
      setHospitalId((current) => {
        if (current) return current;
        if (hs.length > 0) {
          storeHospitalId(hs[0].id);
          return hs[0].id;
        }
        return current;
      });
    });
  }, []);

  useEffect(() => {
    refreshHospitals();
  }, [refreshHospitals]);

  const selectHospital = (id: string) => {
    setHospitalId(id);
    storeHospitalId(id);
  };

  const refreshQueue = useCallback(() => {
    if (!hospitalId) return;
    api.queue(hospitalId).then(setPatients).catch(() => {});
  }, [hospitalId]);
  const refreshBeds = useCallback(() => {
    if (!hospitalId) return;
    api.beds(hospitalId).then(setBeds).catch(() => {});
  }, [hospitalId]);
  const refreshAudit = useCallback(() => {
    api.audit(300).then(setAudit).catch(() => {});
  }, []);
  const refreshAll = useCallback(() => {
    refreshQueue();
    refreshBeds();
    refreshAudit();
    refreshHospitals(); // keeps header "beds free" count and dropdown capacity numbers in sync
  }, [refreshQueue, refreshBeds, refreshAudit, refreshHospitals]);

  useEffect(() => {
    api.health().then(() => setBackendOk(true)).catch(() => setBackendOk(false));
    api.wards().then(setWards).catch(() => {});
  }, []);

  useEffect(() => {
    refreshQueue();
    refreshBeds();
    refreshAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  const wsConnected = useHospitalSocket((msg) => {
    if (msg.hospital_id && msg.hospital_id !== hospitalId) return; // ignore other hospitals' events
    refreshQueue();
    refreshBeds();
    refreshAudit();
    refreshHospitals();
  });

  const handleIntake = (p: Patient) => {
    setPatients((prev) => [...prev, p]);
    refreshAll();
  };

  const criticalCount = useMemo(() => patients.filter((p) => p.esi_level === 1).length, [patients]);
  const waitingCount = useMemo(() => patients.filter((p) => p.status === "waiting").length, [patients]);
  const availableBeds = useMemo(() => beds.filter((b) => b.status === "available").length, [beds]);
  const attentionBeds = useMemo(() => beds.filter((b) => b.status === "cleaning" || b.status === "maintenance").length, [beds]);
  const incomingCount = useMemo(() => patients.filter((p) => p.status === "incoming").length, [patients]);
  const networkTotals = useMemo(
    () => hospitals.reduce((acc, h) => ({ beds: acc.beds + h.total_beds, available: acc.available + h.available_beds }), { beds: 0, available: 0 }),
    [hospitals]
  );

  const roleColor = roleColors[user.role] || roleColors.doctor;
  const activeHospital = hospitals.find((h) => h.id === hospitalId);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, fontFamily: theme.sans }}>
      <motion.div
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        style={{
          borderBottom: `1px solid ${theme.border}`,
          borderTop: `3px solid ${roleColor.fg}`,
          backgroundColor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <motion.span whileHover={{ opacity: 0.7 }} style={{ fontFamily: theme.serif, fontSize: 20, color: theme.ink }}>
              HEALTHFLOW AI
            </motion.span>
          </a>
          <span style={{ fontSize: 12, color: roleColor.fg, fontWeight: 700 }}>{ROLE_TAGLINE[user.role]}</span>
          {tabsForRole.length > 1 && (
            <select
              value={hospitalId || ""}
              onChange={(e) => selectHospital(e.target.value)}
              style={{ fontFamily: theme.sans, fontSize: 12, padding: "6px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: "#F7F5F2", color: theme.ink, fontWeight: 600 }}
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>🏥 {h.name}</option>
              ))}
            </select>
          )}
          {activeHospital && (
            <span style={{ fontSize: 11, color: theme.faint }}>{activeHospital.available_beds}/{activeHospital.total_beds} beds free</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.sub }}>
            <PulseDot color={wsConnected ? "#3FA556" : "#D9A916"} size={8} />
            {wsConnected ? "Live" : "Reconnecting…"}
          </div>
          {backendOk === false && <span style={{ fontSize: 12, color: "#B0201F" }}>Backend unreachable — is it running on :8000?</span>}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, backgroundColor: roleColor.bg, color: roleColor.fg, fontFamily: theme.sans, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {user.role}
            </span>
            <span style={{ fontSize: 13, color: theme.ink, fontFamily: theme.sans, fontWeight: 500 }}>{user.name}</span>
            <motion.button onClick={() => { clearAuth(); onLogout(); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ fontFamily: theme.sans, fontSize: 12, padding: "6px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: "#fff", cursor: "pointer" }}>
              Log out
            </motion.button>
          </div>
        </div>
      </motion.div>

      <RoleHero
        role={user.role}
        hospitalName={activeHospital?.name}
        waitingCount={waitingCount}
        criticalCount={criticalCount}
        availableBeds={availableBeds}
        attentionBeds={attentionBeds}
        incomingCount={incomingCount}
        hospitalCount={hospitals.length}
        networkBeds={networkTotals.beds}
        networkAvailable={networkTotals.available}
      />

      <LayoutGroup>
        <div style={{ display: "flex", gap: 4, padding: "0 32px", borderBottom: `1px solid ${theme.border}`, backgroundColor: "rgba(255,255,255,0.9)", overflowX: "auto" }}>
          {tabsForRole.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                position: "relative",
                border: "none",
                background: "none",
                padding: "14px 18px",
                fontFamily: theme.sans,
                fontSize: 13,
                fontWeight: 600,
                color: tab === t ? theme.ink : theme.faint,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 13 }}>{TAB_META[t].icon}</span>
              {TAB_META[t].label}
              {tab === t && (
                <motion.div layoutId="tab-underline" style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, backgroundColor: roleColor.fg }} transition={{ type: "spring", stiffness: 500, damping: 40 }} />
              )}
            </button>
          ))}
        </div>
      </LayoutGroup>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px" }}>
        {!hospitalId ? (
          <div style={{ padding: 60, textAlign: "center", color: theme.faint }}>Loading hospital network…</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
              {tab === "intake" && <IntakeForm onIntake={handleIntake} role={user.role} hospitalId={hospitalId} />}
              {tab === "queue" && (
                <TriageQueue
                  patients={patients}
                  onRefresh={refreshAll}
                  role={user.role}
                  onExplain={(id) => { setExplainId(id); setTab("explain"); }}
                  onOpenChart={setChartPatient}
                />
              )}
              {tab === "beds" && <BedMap beds={beds} wards={wards} patients={patients} onRefresh={refreshAll} role={user.role} />}
              {tab === "explain" && <ExplainPanel patients={patients} selectedId={explainId} onSelect={setExplainId} />}
              {tab === "analytics" && <Analytics hospitalId={hospitalId} />}
              {tab === "audit" && <AuditLog entries={audit} onRefresh={refreshAudit} role={user.role} />}
              {tab === "hospitals" && user.role === "admin" && (
                <HospitalsAdmin activeHospitalId={hospitalId} onSelectHospital={selectHospital} onChanged={refreshHospitals} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {chartPatient && <PatientChart patient={chartPatient} role={user.role} onClose={() => setChartPatient(null)} />}
      </AnimatePresence>
    </div>
  );
}

function RoleHero({
  role,
  hospitalName,
  waitingCount,
  criticalCount,
  availableBeds,
  attentionBeds,
  incomingCount,
  hospitalCount,
  networkBeds,
  networkAvailable,
}: {
  role: Role;
  hospitalName?: string;
  waitingCount: number;
  criticalCount: number;
  availableBeds: number;
  attentionBeds: number;
  incomingCount: number;
  hospitalCount: number;
  networkBeds: number;
  networkAvailable: number;
}) {
  const roleColor = roleColors[role] || roleColors.doctor;

  const content: { title: string; subtitle: string; stats: { label: string; value: number; color?: string; pulse?: boolean }[] } | null =
    role === "admin"
      ? {
          title: "Network Overview",
          subtitle: "Full oversight across every hospital in the network.",
          stats: [
            { label: "Hospitals", value: hospitalCount },
            { label: "Network Beds", value: networkBeds },
            { label: "Available Now", value: networkAvailable, color: "#2F7A3C" },
          ],
        }
      : role === "doctor"
      ? {
          title: hospitalName ? `Clinical Care — ${hospitalName}` : "Clinical Care",
          subtitle: "Patients awaiting triage, and anything critical that needs your eyes now.",
          stats: [
            { label: "Waiting", value: waitingCount },
            { label: "Critical (ESI-1)", value: criticalCount, color: criticalCount > 0 ? "#B0201F" : undefined, pulse: criticalCount > 0 },
          ],
        }
      : role === "nurse"
      ? {
          title: hospitalName ? `Bed Operations — ${hospitalName}` : "Bed Operations",
          subtitle: "Live capacity, beds needing turnover, and ambulances inbound.",
          stats: [
            { label: "Available Beds", value: availableBeds, color: "#2F7A3C" },
            { label: "Needs Attention", value: attentionBeds, color: attentionBeds > 0 ? "#B4600A" : undefined },
            { label: "Inbound", value: incomingCount, color: incomingCount > 0 ? "#7C3AED" : undefined, pulse: incomingCount > 0 },
          ],
        }
      : null;

  if (!content) return null;

  return (
    <div style={{ position: "relative", overflow: "hidden", backgroundColor: "#fff", borderBottom: `1px solid ${theme.border}` }}>
      <GradientBlob color={roleColor.fg} size={360} top={-160} right={-80} opacity={0.06} duration={14} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px", position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, color: theme.ink, margin: 0, marginBottom: 4 }}>{content.title}</h2>
          <p style={{ fontSize: 13, color: theme.sub, margin: 0 }}>{content.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {content.stats.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {s.pulse && <PulseDot color={s.color || "#111"} size={7} />}
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color || theme.ink, fontFamily: theme.serif, lineHeight: 1 }}>
                  <CountUp value={s.value} />
                </div>
                <div style={{ fontSize: 10, color: theme.faint, letterSpacing: "0.05em", marginTop: 2 }}>{s.label.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
