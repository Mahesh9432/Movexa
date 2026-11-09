import React, { useState } from 'react';

const navItems = [
  { name: 'Dashboard', icon: '📊', view: 'physio-dashboard' },
  { name: 'Patients', icon: '👥', view: 'physio-patients' },
  { name: 'Prescriptions', icon: '📋', view: 'physio-prescriptions' },
  { name: 'Profile', icon: '👤', view: 'physio-profile' },
];

export default function PhysioPatients({ onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatientForCarePlan, setSelectedPatientForCarePlan] = useState(null);

  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'Female',
    condition: '',
    affected_area: '',
    treatment_start: new Date().toISOString().split('T')[0],
  });

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

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.condition) return;

    const createdPatient = {
      id: `PT-${Math.floor(100000 + Math.random() * 900000)}`,
      name: newPatient.name,
      email: newPatient.email || 'patient@example.com',
      phone: newPatient.phone || '+1 (555) 000-0000',
      condition: newPatient.condition,
      affected_area: newPatient.affected_area || 'General Joint',
      treatment_start: newPatient.treatment_start,
      adherence: '100%',
      kinematic_score: 'N/A',
      status: 'Active • Newly Assigned',
      last_session: 'Just registered',
      avatar: null,
      current_prescription: { title: 'Initial Assessment Protocol', plan: 'General Care', start_date: newPatient.treatment_start, duration: '2 Weeks', exercises: [] },
      history: []
    };

    setPatients([createdPatient, ...patients]);
    setNewPatient({ name: '', email: '', phone: '', date_of_birth: '', gender: 'Female', condition: '', affected_area: '', treatment_start: new Date().toISOString().split('T')[0] });
    setShowAddModal(false);
  };

  const handleRemovePatient = (id) => {
    if (window.confirm('Are you sure you want to remove this patient from your active roster?')) {
      setPatients(patients.filter(p => p.id !== id));
      if (selectedPatientForCarePlan?.id === id) {
        setSelectedPatientForCarePlan(null);
      }
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#D9E3ED] p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">MOVEẊA</div>
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Physio Portal</span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  item.view === 'physio-patients' ? 'bg-[#EAF1F8] text-[#087F73]' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#D9E3ED]">
          <button onClick={onLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg cursor-pointer">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 min-w-0">
        <header className="hidden md:flex bg-white border-b border-[#D9E3ED] px-8 py-3.5 justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">Apex Orthopaedics • <span className="text-[#193B62] font-bold">Physiotherapist Portal</span></div>
          <button onClick={() => onNavigate('physio-profile')} className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4 cursor-pointer">
            <span className="w-8 h-8 rounded-full bg-[#087F73] text-white flex items-center justify-center text-xs font-bold">MV</span>
            <span className="text-xs font-bold">Dr. Marcus Vance</span>
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

          {/* CONDITIONAL VIEW: FULL PATIENT CARE PLAN INFO */}
          {selectedPatientForCarePlan ? (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedPatientForCarePlan(null)}
                    className="bg-white border border-[#D9E3ED] hover:bg-gray-50 text-[#193B62] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    ← Back to Patients Roster
                  </button>
                  <div>
                    <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2.5 py-0.5 rounded-md font-mono">
                      {selectedPatientForCarePlan.id}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold mt-0.5 text-[#20252B]">
                      {selectedPatientForCarePlan.name}
                    </h1>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('physio-prescriptions', selectedPatientForCarePlan.name)}
                  className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <span>＋</span> Add Prescription
                </button>
              </div>

              {/* OVERVIEW METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-2 md:col-span-2">
                  <p className="text-[10px] uppercase font-bold text-[#087F73]">Clinical Overview</p>
                  <h2 className="text-base font-bold text-[#193B62]">{selectedPatientForCarePlan.condition}</h2>
                  <p className="text-xs text-gray-500">Affected Area: <strong className="text-[#193B62]">{selectedPatientForCarePlan.affected_area}</strong></p>
                  <div className="pt-2 flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-100">
                    <span>📞 {selectedPatientForCarePlan.phone}</span>
                    <span>✉️ {selectedPatientForCarePlan.email}</span>
                    <span>📅 Started: {selectedPatientForCarePlan.treatment_start}</span>
                  </div>
                </div>

                <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Exercise Adherence</p>
                  <p className="text-3xl font-bold text-[#193B62]">{selectedPatientForCarePlan.adherence}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">✓ High protocol compliance</p>
                </div>

                <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Kinematic Score</p>
                  <p className="text-3xl font-bold text-[#193B62]">{selectedPatientForCarePlan.kinematic_score}</p>
                  <p className="text-[11px] text-[#087F73] font-semibold">Optimal joint alignment</p>
                </div>
              </div>

              {/* ACTIVE PRESCRIPTION & EXERCISES */}
              <div className="bg-white border border-[#D9E3ED] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#D9E3ED] pb-4">
                  <div>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Active Prescription Routine
                    </span>
                    <h2 className="text-lg font-bold text-[#193B62] mt-1">{selectedPatientForCarePlan.current_prescription.title}</h2>
                    <p className="text-xs text-gray-500">{selectedPatientForCarePlan.current_prescription.plan} • Started {selectedPatientForCarePlan.current_prescription.start_date} ({selectedPatientForCarePlan.current_prescription.duration})</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Assigned Exercises</h3>
                  
                  {selectedPatientForCarePlan.current_prescription.exercises.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {selectedPatientForCarePlan.current_prescription.exercises.map((ex, index) => (
                        <div key={ex.id} className="bg-[#F4F7FB] border border-[#D9E3ED] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
                          <img src={ex.thumbnail} alt={ex.name} className="w-full md:w-32 h-20 rounded-lg object-cover border border-[#D9E3ED] shrink-0" />
                          
                          <div className="flex-1 space-y-1 w-full">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-[#087F73] uppercase">{ex.category}</span>
                              <span className="text-xs text-gray-400 font-mono">Exercise #{index + 1}</span>
                            </div>
                            <h4 className="font-bold text-sm text-[#193B62]">{ex.name}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                              <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#D9E3ED]">
                                <span className="text-gray-400 block text-[10px]">Volume</span>
                                <strong className="text-[#193B62]">{ex.sets} Sets × {ex.reps} Reps</strong>
                              </div>
                              <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#D9E3ED]">
                                <span className="text-gray-400 block text-[10px]">Hold</span>
                                <strong className="text-[#193B62]">{ex.hold}</strong>
                              </div>
                              <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#D9E3ED]">
                                <span className="text-gray-400 block text-[10px]">Rest</span>
                                <strong className="text-[#193B62]">{ex.rest}</strong>
                              </div>
                              <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#D9E3ED]">
                                <span className="text-gray-400 block text-[10px]">Target ROM</span>
                                <strong className="text-[#087F73]">{ex.target_rom}</strong>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 pt-1">
                              <strong className="text-[#193B62]">Physio Note:</strong> {ex.notes}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-4 text-center">No active exercises currently prescribed in this routine.</p>
                  )}
                </div>
              </div>

              {/* TREATMENT HISTORY */}
              <div className="bg-white border border-[#D9E3ED] rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Treatment History</h3>
                
                {selectedPatientForCarePlan.history.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPatientForCarePlan.history.map((h) => (
                      <div key={h.id} className="border border-[#D9E3ED] rounded-xl p-4 flex justify-between items-center bg-gray-50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{h.id}</span>
                            <span className="text-xs text-emerald-600 font-bold">{h.status}</span>
                          </div>
                          <h4 className="font-bold text-sm text-[#193B62]">{h.title}</h4>
                          <p className="text-xs text-gray-500">Effective Dates: {h.date} • Exercises: {h.exercises_count}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Compliance</p>
                          <p className="text-sm font-bold text-[#193B62]">{h.adherence}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-2">No prior archived prescriptions found for this patient.</p>
                )}
              </div>

              {/* BOTTOM ADD PRESCRIPTION BUTTON */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onNavigate('physio-prescriptions', selectedPatientForCarePlan.name)}
                  className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  <span>＋</span> Add Prescription for {selectedPatientForCarePlan.name}
                </button>
              </div>

            </div>
          ) : (

            /* DEFAULT VIEW: PATIENT MANAGEMENT ROSTER */
            <>
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">Clinical Workspace</p>
                  <h1 className="text-3xl font-bold mt-1 text-[#20252B]">Patient Management</h1>
                  <p className="text-sm text-gray-500 mt-1">View assigned patients, clinical details, and care plans.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input type="text" placeholder="Search patients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white border border-[#D9E3ED] px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#087F73] w-full sm:w-64" />
                  <button onClick={() => setShowAddModal(true)} className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5">
                    <span>＋</span> Add Patient
                  </button>
                </div>
              </div>

              {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-[#D9E3ED] my-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center border-b border-[#D9E3ED] pb-3">
                      <h2 className="font-bold text-base text-[#193B62]">Register & Assign New Patient</h2>
                      <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700 text-lg cursor-pointer">✕</button>
                    </div>

                    <form onSubmit={handleAddPatient} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-[#193B62] mb-1">Full Name</label>
                        <input type="text" required placeholder="Sarah Jenkins" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3.5 py-2.5 rounded-xl font-semibold text-[#193B62]" />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#193B62] mb-1">Email Address</label>
                        <input type="email" required placeholder="sarah@example.com" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3.5 py-2.5 rounded-xl font-semibold text-[#193B62]" />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#193B62] mb-1">Condition / Injury</label>
                        <input type="text" required placeholder="ACL Reconstruction" value={newPatient.condition} onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3.5 py-2.5 rounded-xl font-semibold text-[#193B62]" />
                      </div>
                      <div className="pt-4 flex justify-end gap-2 border-t border-[#D9E3ED]">
                        <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 border border-[#D9E3ED] rounded-xl font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-[#087F73] text-white rounded-xl font-bold hover:bg-[#06655c] cursor-pointer shadow-xs">Save & Register Patient</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                    <div className="flex items-center gap-4">
                      {patient.avatar ? (
                        <img src={patient.avatar} alt={patient.name} className="w-14 h-14 rounded-full object-cover border border-[#D9E3ED] shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#EAF1F8] text-[#087F73] font-bold text-base flex items-center justify-center shrink-0 border border-[#D9E3ED]">
                          {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">{patient.id}</span>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{patient.status}</span>
                        </div>
                        <h3 className="text-base font-bold text-[#193B62]">{patient.name}</h3>
                        <p className="text-xs text-gray-600 font-medium">Injury: <span className="text-[#087F73] font-bold">{patient.condition}</span> ({patient.affected_area})</p>
                        <p className="text-[11px] text-gray-400">Phone: {patient.phone} • Started: {patient.treatment_start}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Adherence</p>
                        <p className="text-base font-bold text-[#193B62]">{patient.adherence}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => handleRemovePatient(patient.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-3 py-2.5 rounded-xl cursor-pointer transition-all" title="Remove Patient">🗑️</button>
                        <button onClick={() => setSelectedPatientForCarePlan(patient)} className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs">
                          Manage Care Plan →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}