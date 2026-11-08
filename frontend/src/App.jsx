import React, { useEffect, useState } from "react";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import PatientDashboard from "./pages/patient/Dashboard";
import PatientProfile from "./pages/patient/Profile";

import PhysioDashboard from "./pages/physiotherapist/Dashboard";
import PhysioProfile from "./pages/physiotherapist/Profile";

import { useAuth } from "./context/AuthContext";

const pageNames = {
  exercises: "My Exercises",
  library: "Exercise Library",
  progress: "Progress",
  appointments: "Appointments",
  care: "Care Team",
};

export default function App() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  const [currentView, setCurrentView] = useState("login");

  const isPhysio = user?.role === "PHYSIOTHERAPIST";

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      setCurrentView("login");
      return;
    }

    setCurrentView(isPhysio ? "physio-dashboard" : "dashboard");
  }, [loading, isAuthenticated, isPhysio]);

  const handleLogout = () => {
    logout();
    setCurrentView("login");
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const handleLoginSuccess = (authenticatedUser) => {
    setCurrentView(
      authenticatedUser.role === "PHYSIOTHERAPIST"
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
              onClick={() =>
                setCurrentView(
                  isPhysio ? "physio-dashboard" : "dashboard"
                )
              }
              className="mt-5 bg-[#087F73] hover:bg-[#06655c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}