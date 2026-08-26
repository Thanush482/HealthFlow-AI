import { useState } from "react";
import { getStoredAuth } from "./api";
import type { AuthUser } from "./types";
import Login from "./components/Login";
import StaffDashboard from "./components/StaffDashboard";
import AmbulanceDispatch from "./components/AmbulanceDispatch";
import PatientPortal from "./components/PatientPortal";

export default function Dashboard() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth());

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === "ambulance") {
    return <AmbulanceDispatch user={user} onLogout={() => setUser(null)} />;
  }

  if (user.role === "patient") {
    return <PatientPortal user={user} onLogout={() => setUser(null)} />;
  }

  // doctor | nurse | admin
  return <StaffDashboard user={user} onLogout={() => setUser(null)} />;
}
