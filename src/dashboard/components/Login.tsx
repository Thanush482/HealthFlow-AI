import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, storeAuth } from "../api";
import type { AuthUser, DemoAccount, Role } from "../types";
import { theme, roleColors } from "../theme";
import { GradientBlob } from "../../shared/motion";
import { PulseBadge } from "../../shared/illustrations";

type Portal = "select" | "admin" | "staff" | "ambulance" | "patient";

const PORTAL_CARDS: { id: Portal; role: Role | null; icon: string; title: string; subtitle: string }[] = [
  { id: "admin", role: "admin", icon: "🏥", title: "Hospital Admin", subtitle: "Manage the hospital network" },
  { id: "staff", role: null, icon: "🩺", title: "Doctor / Staff", subtitle: "Triage, monitoring & care" },
  { id: "ambulance", role: "ambulance", icon: "🚑", title: "Ambulance", subtitle: "Route to the best hospital" },
  { id: "patient", role: null, icon: "🧾", title: "Patient", subtitle: "View your own records" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 8,
  border: `1px solid ${theme.border}`,
  fontFamily: theme.sans,
  fontSize: 14,
  backgroundColor: "#fff",
  boxSizing: "border-box",
};

export default function Login({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [portal, setPortal] = useState<Portal>("select");
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patientPassword, setPatientPassword] = useState("patient123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.demoAccounts().then(setAccounts).catch(() => {});
  }, []);

  const reset = () => {
    setPortal("select");
    setUsername("");
    setPassword("");
    setError(null);
  };

  const doStaffLogin = async (u: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(u, p);
      const user: AuthUser = { token: res.token, username: res.username, name: res.name, role: res.role as Role };
      storeAuth(user);
      onLogin(user);
    } catch (err: any) {
      setError(err.message?.includes("401") ? "Invalid username or password." : "Login failed — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const doPatientLogin = async (id: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patientLogin(id.trim().toUpperCase(), p.trim());
      const user: AuthUser = { token: res.token, username: res.username, name: res.name, role: "patient" };
      storeAuth(user);
      onLogin(user);
    } catch (err: any) {
      setError(err.message?.includes("401") ? "Invalid patient ID or password." : "Login failed — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Enter both username and password.");
      return;
    }
    doStaffLogin(username.trim(), password.trim());
  };

  const submitPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim() || !patientPassword.trim()) {
      setError("Enter your Patient ID and password.");
      return;
    }
    doPatientLogin(patientId, patientPassword);
  };

  const doctorAccount = accounts.find((a) => a.role === "doctor");
  const nurseAccount = accounts.find((a) => a.role === "nurse");
  const adminAccount = accounts.find((a) => a.role === "admin");
  const ambulanceAccount = accounts.find((a) => a.role === "ambulance");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: 24 }}>
      <GradientBlob color="#111111" size={480} top={-160} left={-120} opacity={0.05} duration={12} />
      <GradientBlob color="#16A34A" size={420} bottom={-140} right={-100} opacity={0.05} duration={14} />

      <div style={{ maxWidth: portal === "select" ? 780 : 460, width: "100%", position: "relative", zIndex: 1, transition: "max-width 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 36 }}>
          <PulseBadge size={40} />
          <span style={{ fontFamily: theme.serif, fontSize: 22, color: theme.ink }}>HEALTHFLOW AI</span>
        </div>

        <AnimatePresence mode="wait">
          {portal === "select" && (
            <motion.div key="select" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h2 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 400, color: theme.ink, marginBottom: 8 }}>
                  One network. Four logins.
                </h2>
                <p style={{ fontSize: 14, color: theme.sub, fontFamily: theme.sans, maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
                  Each seat sees a completely different experience. Choose one to sign in.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="portal-grid">
                <style>{`@media (max-width: 600px) { .portal-grid { grid-template-columns: 1fr !important; } }`}</style>
                {PORTAL_CARDS.map((card, i) => {
                  const c = roleColors[card.role || "doctor"];
                  return (
                    <motion.button
                      key={card.id}
                      onClick={() => setPortal(card.id)}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(17,17,17,0.10)", borderColor: c.fg }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        textAlign: "left",
                        backgroundColor: "#fff",
                        border: `1.5px solid ${theme.border}`,
                        borderRadius: 16,
                        padding: 24,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>
                        {card.icon}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: theme.ink, fontFamily: theme.sans, marginBottom: 4 }}>{card.title}</div>
                      <div style={{ fontSize: 12, color: theme.faint, fontFamily: theme.sans }}>{card.subtitle}</div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {portal === "admin" && adminAccount && (
            <PortalPanel key="admin" icon="🏥" title="Hospital Admin" role="admin" onBack={reset}>
              <p style={{ fontSize: 13, color: theme.sub, marginBottom: 20, lineHeight: 1.6 }}>
                Full network oversight: manage hospitals, view analytics, export the audit trail, and
                access every clinical/operational function.
              </p>
              <OneTapLogin account={adminAccount} loading={loading} onClick={() => doStaffLogin(adminAccount.username, adminAccount.password)} />
              <ManualLoginForm username={username} setUsername={setUsername} password={password} setPassword={setPassword} loading={loading} onSubmit={submitManual} />
            </PortalPanel>
          )}

          {portal === "staff" && (
            <PortalPanel key="staff" icon="🩺" title="Doctor / Staff" role="doctor" onBack={reset}>
              <p style={{ fontSize: 13, color: theme.sub, marginBottom: 20, lineHeight: 1.6 }}>
                Pick your role below. Doctors run triage, vitals, medications and treatment plans.
                Nurses run bed operations and confirm ambulance arrivals.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {doctorAccount && <RoleLoginCard account={doctorAccount} loading={loading} onClick={() => doStaffLogin(doctorAccount.username, doctorAccount.password)} description="Intake, triage evidence, patient charts" />}
                {nurseAccount && <RoleLoginCard account={nurseAccount} loading={loading} onClick={() => doStaffLogin(nurseAccount.username, nurseAccount.password)} description="Bed map, discharge/clean/maintenance" />}
              </div>
              <ManualLoginForm username={username} setUsername={setUsername} password={password} setPassword={setPassword} loading={loading} onSubmit={submitManual} />
            </PortalPanel>
          )}

          {portal === "ambulance" && ambulanceAccount && (
            <PortalPanel key="ambulance" icon="🚑" title="Ambulance" role="ambulance" onBack={reset}>
              <p style={{ fontSize: 13, color: theme.sub, marginBottom: 20, lineHeight: 1.6 }}>
                Enter a patient's condition and location, get every hospital in the network ranked by
                distance and live compatible-bed availability, and dispatch.
              </p>
              <OneTapLogin account={ambulanceAccount} loading={loading} onClick={() => doStaffLogin(ambulanceAccount.username, ambulanceAccount.password)} />
              <ManualLoginForm username={username} setUsername={setUsername} password={password} setPassword={setPassword} loading={loading} onSubmit={submitManual} />
            </PortalPanel>
          )}

          {portal === "patient" && (
            <PortalPanel key="patient" icon="🧾" title="Patient Portal" role="patient" onBack={reset}>
              <p style={{ fontSize: 13, color: theme.sub, marginBottom: 20, lineHeight: 1.6 }}>
                Enter the Patient ID given at intake (e.g. <code style={{ backgroundColor: "#F7F5F2", padding: "1px 5px", borderRadius: 4 }}>PT-A1B2C3</code>).
                Demo password for every patient is <code style={{ backgroundColor: "#F7F5F2", padding: "1px 5px", borderRadius: 4 }}>patient123</code>.
              </p>
              <form onSubmit={submitPatient}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, display: "block", marginBottom: 4 }}>Patient ID</label>
                  <input style={inputStyle} placeholder="PT-A1B2C3" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: theme.sub, fontFamily: theme.sans, display: "block", marginBottom: 4 }}>Password</label>
                  <input style={inputStyle} type="password" value={patientPassword} onChange={(e) => setPatientPassword(e.target.value)} />
                </div>
                <SubmitButton loading={loading} label="View My Records" color="#8A6D00" />
              </form>
            </PortalPanel>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ color: "#B0201F", fontSize: 12, fontFamily: theme.sans, marginTop: 14, textAlign: "center", overflow: "hidden" }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PortalPanel({ icon, title, role, onBack, children }: { icon: string; title: string; role: Role; onBack: () => void; children: React.ReactNode }) {
  const c = roleColors[role];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{ backgroundColor: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 32px 80px rgba(0,0,0,0.12)", borderTop: `3px solid ${c.fg}` }}
    >
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: theme.faint, fontSize: 12, fontFamily: theme.sans, marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
        ← All portals
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
        <h3 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, color: theme.ink, margin: 0 }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function OneTapLogin({ account, loading, onClick }: { account: DemoAccount; loading: boolean; onClick: () => void }) {
  const c = roleColors[account.role];
  return (
    <div style={{ marginBottom: 20 }}>
      <motion.button
        type="button"
        disabled={loading}
        onClick={onClick}
        whileHover={!loading ? { scale: 1.02 } : {}}
        whileTap={!loading ? { scale: 0.98 } : {}}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "14px 16px",
          borderRadius: 12,
          border: `1px solid ${c.fg}`,
          backgroundColor: c.bg,
          cursor: loading ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink, fontFamily: theme.sans }}>{account.name}</div>
          <div style={{ fontSize: 11, color: theme.sub, fontFamily: theme.sans, marginTop: 2 }}>Demo account — one-tap sign in</div>
        </div>
        <span style={{ fontSize: 20 }}>{loading ? "…" : "→"}</span>
      </motion.button>
      <ManualDivider />
    </div>
  );
}

function RoleLoginCard({ account, description, loading, onClick }: { account: DemoAccount; description: string; loading: boolean; onClick: () => void }) {
  const c = roleColors[account.role];
  return (
    <motion.button
      type="button"
      disabled={loading}
      onClick={onClick}
      whileHover={!loading ? { scale: 1.02, borderColor: c.fg } : {}}
      whileTap={!loading ? { scale: 0.98 } : {}}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 16px",
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
        backgroundColor: "#fff",
        cursor: loading ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.ink, fontFamily: theme.sans }}>{account.name}</div>
        <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, marginTop: 2 }}>{description}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, backgroundColor: c.bg, color: c.fg, fontFamily: theme.sans, textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
        {account.role}
      </span>
    </motion.button>
  );
}

function ManualDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: theme.faint, fontSize: 11, fontFamily: theme.sans }}>
      <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      OR ENTER MANUALLY
      <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
    </div>
  );
}

function ManualLoginForm({
  username, setUsername, password, setPassword, loading, onSubmit,
}: {
  username: string; setUsername: (v: string) => void; password: string; setPassword: (v: string) => void; loading: boolean; onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input style={inputStyle} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input style={inputStyle} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <SubmitButton loading={loading} label="Sign In" color="#111" />
    </form>
  );
}

function SubmitButton({ loading, label, color }: { loading: boolean; label: string; color: string }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={!loading ? { scale: 1.02 } : {}}
      whileTap={!loading ? { scale: 0.98 } : {}}
      style={{
        width: "100%",
        backgroundColor: color,
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "12px 0",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: theme.sans,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        marginTop: 4,
      }}
    >
      {loading ? "Signing in…" : label}
    </motion.button>
  );
}
