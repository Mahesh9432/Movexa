import React, { useState } from 'react';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import PatientProfile from './pages/patient/Profile';
import PatientExercises from './pages/patient/Exercises';
import ExerciseLibrary from './pages/patient/ExerciseLibrary';
import PatientProgress from './pages/patient/Progress';
import PatientSession from './pages/patient/Session';

// Physiotherapist Pages
import PhysioDashboard from './pages/physiotherapist/Dashboard';
import PhysioProfile from './pages/physiotherapist/Profile';
import PhysioPatients from './pages/physiotherapist/Patients';
import Prescriptions from './pages/physiotherapist/Prescriptions';

const pageNames = {
  appointments: 'Appointments',
  care: 'Care Team',
};

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [activePatientName, setActivePatientName] = useState('Sarah Michelle Jenkins');
  const [userRole, setUserRole] = useState('patient'); // 'patient' or 'physio'

  // Lifted Shared State for Patient Roster
  const [patients, setPatients] = useState([
    {
      id: 'PT-884291',
      name: 'Sarah Michelle Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+1 (555) 234-8901',
      condition: 'Post-Operative ACL Reconstruction',
      affected_area: 'Left Knee Joint',
      treatment_start: '2026-09-26',
      adherence: '85%',
      kinematic_score: '96%',
      status: 'Active • Primary Care',
      last_session: 'Today, 08:14 AM',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      current_prescription: {
        title: 'Phase 2: Active ROM & Quad Strengthening',
        plan: 'Post-Op Knee Rehabilitation Protocol',
        start_date: '2026-10-12',
        duration: '4 Weeks',
        exercises: [
          {
            id: 'EX-01',
            name: 'Isometric Quad Sets with Towel Roll',
            category: 'Knee Extension',
            sets: 3,
            reps: 10,
            hold: '10-sec Hold',
            rest: '30s Rest',
            target_rom: '0° Full Extension',
            notes: 'Complete quad lock before relaxing; keep toes pointing upwards.',
            thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&auto=format&fit=crop&q=80',
          },
          {
            id: 'EX-02',
            name: 'Terminal Knee Extensions (TKE)',
            category: 'Resistance Band',
            sets: 3,
            reps: 12,
            hold: '2s Hold • 3s Return',
            rest: '45s Rest',
            target_rom: '0° - 90° ROM',
            notes: 'Slow controlled return under band tension.',
            thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80',
          },
        ]
      },
      history: [
        { id: 'RX-101', title: 'Phase 1: Initial Post-Op Mobility', date: '2026-09-26 to 2026-10-11', exercises_count: 3, status: 'Completed', adherence: '91%' }
      ]
    },
    {
      id: 'PT-992104',
      name: 'James Anderson',
      email: 'james.anderson@example.com',
      phone: '+1 (555) 432-1982',
      condition: 'Rotator Cuff Tendinopathy',
      affected_area: 'Right Shoulder',
      treatment_start: '2026-10-02',
      adherence: '78%',
      kinematic_score: '88%',
      status: 'Active • In Progress',
      last_session: 'Yesterday, 02:30 PM',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      current_prescription: {
        title: 'Shoulder Mobility & Rotator Cuff Stability',
        plan: 'Rotator Cuff Rehabilitation Protocol',
        start_date: '2026-10-05',
        duration: '4 Weeks',
        exercises: [
          {
            id: 'EX-03',
            name: 'External Rotation with Resistance Band',
            category: 'Shoulder Stability',
            sets: 3,
            reps: 15,
            hold: '1s Hold',
            rest: '30s Rest',
            target_rom: '0° - 45° External Rotation',
            notes: 'Keep elbow pinned to your side.',
            thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&auto=format&fit=crop&q=80',
          }
        ]
      },
      history: []
    },
    {
      id: 'PT-334102',
      name: 'Emily Rose',
      email: 'emily.rose@example.com',
      phone: '+1 (555) 892-3019',
      condition: 'Chronic Lower Back Pain',
      affected_area: 'Lumbar Spine',
      treatment_start: '2026-09-15',
      adherence: '92%',
      kinematic_score: '94%',
      status: 'Active • On Track',
      last_session: '3 days ago',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      current_prescription: {
        title: 'Lumbar Spine Core Stabilization',
        plan: 'Core Strengthening Protocol',
        start_date: '2026-09-20',
        duration: '6 Weeks',
        exercises: [
          {
            id: 'EX-04',
            name: 'Bird-Dog Core Hold',
            category: 'Core Stability',
            sets: 3,
            reps: 10,
            hold: '5-sec Hold',
            rest: '30s Rest',
            target_rom: 'Neutral Spine Alignment',
            notes: 'Avoid lower back arching.',
            thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
          }
        ]
      },
      history: []
    }
  ]);

  // Lifted Shared State for Prescription History
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'RX-8841',
      patient: 'Sarah Michelle Jenkins',
      title: 'Phase 2: Active ROM & Quad Strengthening',
      treatmentPlan: 'Post-Op Knee Rehabilitation Protocol',
      date: '2026-10-12',
      duration: '4 Weeks',
      frequency: 'Daily',
      exercises: [],
      exercisesCount: 2,
      notes: 'Keep toes pointing upwards.',
      precautions: 'Stop if pain occurs.',
      status: 'Active',
    },
    {
      id: 'RX-7723',
      patient: 'James Anderson',
      title: 'Shoulder Mobility & Rotator Cuff Stability',
      treatmentPlan: 'Rotator Cuff Protocol',
      date: '2026-10-05',
      duration: '4 Weeks',
      frequency: 'Daily',
      exercises: [],
      exercisesCount: 3,
      notes: 'Controlled return.',
      precautions: 'Avoid sharp pain.',
      status: 'Active',
    },
    {
      id: 'RX-6619',
      patient: 'Emily Rose',
      title: 'Lumbar Spine Core Stabilization',
      treatmentPlan: 'Core Strengthening',
      date: '2026-09-20',
      duration: '6 Weeks',
      frequency: '3x/week',
      exercises: [],
      exercisesCount: 4,
      notes: 'Neutral spine.',
      precautions: 'None',
      status: 'Completed',
    },
    {
      id: 'RX-5512',
      patient: 'Sarah Michelle Jenkins',
      title: 'Phase 1: Initial Post-Op Mobility',
      treatmentPlan: 'Mobility Protocol',
      date: '2026-09-01',
      duration: '2 Weeks',
      frequency: 'Daily',
      exercises: [],
      exercisesCount: 3,
      notes: 'Gentle ROM.',
      precautions: 'Rest if sore.',
      status: 'Completed',
    }
  ]);

  const handleLogout = () => {
    setCurrentView('login');
    setUserRole('patient');
    setActivePatientName('Sarah Michelle Jenkins');
  };

  const handleNavigate = (view, paramName) => {
    if (paramName) {
      setActivePatientName(paramName);
    }
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {currentView === 'login' && (
        <Login
          onSwitchToRegister={() => setCurrentView('register')}
          onLoginSuccess={(role) => {
            setUserRole(role);
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

      {/* PATIENT PORTAL ROUTES */}
      {currentView === 'dashboard' && (
        <PatientDashboard onLogout={handleLogout} onNavigate={handleNavigate} />
      )}
      {currentView === 'profile' && (
        <PatientProfile onLogout={handleLogout} onNavigate={handleNavigate} />
      )}
      {currentView === 'exercises' && (
        <PatientExercises onLogout={handleLogout} onNavigate={handleNavigate} />
      )}
      {currentView === 'library' && (
        <ExerciseLibrary onLogout={handleLogout} onNavigate={handleNavigate} />
      )}
      {currentView === 'progress' && (
        <PatientProgress onLogout={handleLogout} onNavigate={handleNavigate} />
      )}
      {currentView === 'session' && (
        <PatientSession onLogout={handleLogout} onNavigate={handleNavigate} />
      )}

      {/* PHYSIOTHERAPIST PORTAL ROUTES */}
      {currentView === 'physio-dashboard' && (
        <PhysioDashboard onLogout={handleLogout} onNavigate={handleNavigate} />
      )}
      {currentView === 'physio-profile' && (
        <PhysioProfile onLogout={handleLogout} onNavigate={handleNavigate} />
      )}
      {currentView === 'physio-patients' && (
        <PhysioPatients 
          patients={patients}
          setPatients={setPatients}
          onLogout={handleLogout} 
          onNavigate={handleNavigate} 
        />
      )}
      {currentView === 'physio-prescriptions' && (
        <Prescriptions 
          patientName={activePatientName} 
          patients={patients}
          setPatients={setPatients}
          prescriptions={prescriptions}
          setPrescriptions={setPrescriptions}
          onLogout={handleLogout} 
          onNavigate={handleNavigate} 
        />
      )}

      {/* PLACEHOLDER VIEWS */}
      {pageNames[currentView] && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-[#D9E3ED] p-8 text-center max-w-md w-full shadow-md">
            <h1 className="text-xl font-bold text-[#193B62]">
              {pageNames[currentView]}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              This page is currently under development.
            </p>
            <button
              onClick={() => setCurrentView(userRole === 'physio' ? 'physio-dashboard' : 'dashboard')}
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