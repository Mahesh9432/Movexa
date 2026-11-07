import React, { useState } from 'react';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/Dashboard';
import PatientProfile from './pages/patient/Profile';
import PhysioDashboard from './pages/physiotherapist/Dashboard';
import PhysioProfile from './pages/physiotherapist/Profile';

const pageNames = {
  exercises: 'My Exercises',
  library: 'Exercise Library',
  progress: 'Progress',
  appointments: 'Appointments',
  care: 'Care Team',
};

export default function App() {
  const [currentView, setCurrentView] = useState('login');

  const handleLogout = () => setCurrentView('login');
  const handleNavigate = (view) => setCurrentView(view);

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {currentView === 'login' && (
        <Login
          onSwitchToRegister={() => setCurrentView('register')}
          onLoginSuccess={(role) => {
            if (role === 'physio') {
              setCurrentView('physio-dashboard');
            } else {
              setCurrentView('dashboard');
            }
          }}
        />
      )}

      {currentView === 'register' && (
        <Register
          onSwitchToLogin={() => setCurrentView('login')}
          onRegisterSuccess={() => setCurrentView('login')}
        />
      )}

      {currentView === 'dashboard' && (
        <PatientDashboard onLogout={handleLogout} onNavigate={handleNavigate} />
      )}

      {currentView === 'profile' && (
        <PatientProfile onLogout={handleLogout} onNavigate={handleNavigate} />
      )}

      {currentView === 'physio-dashboard' && (
        <PhysioDashboard onLogout={handleLogout} onNavigate={handleNavigate} />
      )}

      {currentView === 'physio-profile' && (
        <PhysioProfile onLogout={handleLogout} onNavigate={handleNavigate} />
      )}

      {pageNames[currentView] && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-[#D9E3ED] p-8 text-center max-w-md w-full">
            <h1 className="text-xl font-bold text-[#193B62]">
              {pageNames[currentView]}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              This page is currently under development.
            </p>
            <button
              onClick={() => setCurrentView('dashboard')}
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