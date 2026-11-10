import { useState } from "react";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import PatientDashboard from "./pages/patient/Dashboard";
import PatientExercises from "./pages/patient/Exercises";
import PatientSession from "./pages/patient/Session";
import PatientProfile from "./pages/patient/Profile";

import PhysioDashboard from "./pages/physiotherapist/Dashboard";
import PhysioPatients from "./pages/physiotherapist/Patients";
import PhysioPrescriptions from "./pages/physiotherapist/Prescriptions";
import PhysioProfile from "./pages/physiotherapist/Profile";

import { useAuth } from "./context/useAuth";

const pageNames = {
  library: "Exercise Library",
  progress: "Progress",
  appointments: "Appointments",
  care: "Care Team",
};

const patientViews = new Set([
  "dashboard",
  "exercises",
  "session",
  "profile",
]);

const physiotherapistViews = new Set([
  "physio-dashboard",
  "physio-patients",
  "physio-prescriptions",
  "physio-profile",
]);

export default function App() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  const [currentView, setCurrentView] = useState("login");
  const [sessionPrescriptionId, setSessionPrescriptionId] = useState("");

  const isPhysio = user?.role === "PHYSIOTHERAPIST";
  const dashboardView = isPhysio ? "physio-dashboard" : "dashboard";


  const handleLogout = () => {
    logout();
    setSessionPrescriptionId("");
    setCurrentView("login");
  };

  const handleNavigate = (view, prescriptionId = null) => {
    if (view === "session") {
      setSessionPrescriptionId(
        prescriptionId ? String(prescriptionId) : ""
      );
    }

    setCurrentView(view);
  };

  const handleLoginSuccess = (authenticatedUser) => {
    setCurrentView(
      authenticatedUser?.role === "PHYSIOTHERAPIST"
        ? "physio-dashboard"
        : "dashboard"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#087F73] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-500">
            Restoring your Movexa session...
          </p>
        </div>
      </div>
    );
  }

  const isAllowedAuthenticatedView =
    isAuthenticated &&
    (isPhysio
      ? physiotherapistViews.has(currentView) || Boolean(pageNames[currentView])
      : patientViews.has(currentView) || Boolean(pageNames[currentView]));

  const shouldShowAuthenticatedFallback =
    isAuthenticated && !isAllowedAuthenticatedView;

  const shouldShowLoginFallback =
    !isAuthenticated && currentView !== "register";

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {!isAuthenticated && currentView === "login" && (
        <Login
          onSwitchToRegister={() => setCurrentView("register")}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {!isAuthenticated && currentView === "register" && (
        <Register
          onSwitchToLogin={() => setCurrentView("login")}
          onRegisterSuccess={handleLoginSuccess}
        />
      )}

      {isAuthenticated && !isPhysio && currentView === "dashboard" && (
        <PatientDashboard
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {isAuthenticated && !isPhysio && currentView === "exercises" && (
        <PatientExercises
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {isAuthenticated && !isPhysio && currentView === "session" && (
        <PatientSession
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          initialPrescriptionId={sessionPrescriptionId}
        />
      )}

      {isAuthenticated && !isPhysio && currentView === "profile" && (
        <PatientProfile
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {isAuthenticated && isPhysio && currentView === "physio-dashboard" && (
        <PhysioDashboard
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {isAuthenticated && isPhysio && currentView === "physio-patients" && (
        <PhysioPatients
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {isAuthenticated && isPhysio && currentView === "physio-prescriptions" && (
        <PhysioPrescriptions
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {isAuthenticated && isPhysio && currentView === "physio-profile" && (
        <PhysioProfile
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {isAuthenticated && pageNames[currentView] && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-[#D9E3ED] p-8 text-center max-w-md w-full">
            <h1 className="text-xl font-bold text-[#193B62]">
              {pageNames[currentView]}
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              This page is currently under development.
            </p>

            <button
              onClick={() => setCurrentView(dashboardView)}
              className="mt-5 bg-[#087F73] hover:bg-[#06655c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {shouldShowAuthenticatedFallback && (
        <>
          {isPhysio ? (
            <PhysioDashboard
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          ) : (
            <PatientDashboard
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          )}
        </>
      )}

      {shouldShowLoginFallback && (
        <Login
          onSwitchToRegister={() => setCurrentView("register")}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
