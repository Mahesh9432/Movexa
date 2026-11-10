import React, { useState } from 'react';
import PhysioLayout from '../../layouts/PhysioLayout';
import Modal from '../../components/common/Modal';

export default function PhysioPatients({ patients, setPatients, onLogout, onNavigate }) {
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
      current_prescription: { 
        title: 'Initial Assessment Protocol', 
        plan: 'General Care', 
        start_date: newPatient.treatment_start, 
        duration: '2 Weeks', 
        exercises: [] 
      },
      history: []
    };

    setPatients(prev => [createdPatient, ...prev]);
    setNewPatient({ 
      name: '', 
      email: '', 
      phone: '', 
      date_of_birth: '', 
      gender: 'Female', 
      condition: '', 
      affected_area: '', 
      treatment_start: new Date().toISOString().split('T')[0] 
    });
    setShowAddModal(false);
  };

  const handleRemovePatient = (id) => {
    if (window.confirm('Are you sure you want to remove this patient from your active roster?')) {
      setPatients(prev => prev.filter(p => p.id !== id));
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
    <PhysioLayout currentView="physio-patients" onLogout={onLogout} onNavigate={onNavigate}>
      {/* CONDITIONAL VIEW: FULL PATIENT CARE PLAN INFO */}
      {selectedPatientForCarePlan ? (
        <div className="space-y-6 animate-fadeIn">
          
          {/* CLEAN HEADER WITH ARROW & SINGLE ACTION BUTTON */}
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#D9E3ED] pb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedPatientForCarePlan(null)}
                className="text-gray-500 hover:text-[#193B62] font-bold text-base px-2 py-1 rounded-lg border border-[#D9E3ED] bg-white shadow-xs cursor-pointer"
                title="Back to Roster"
              >
                ←
              </button>
              <div>
                <div className="flex items-center gap-2.5 mb-0.5">
                  <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                    {selectedPatientForCarePlan.id}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {selectedPatientForCarePlan.status}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#20252B]">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-2">
              <p className="text-[10px] uppercase font-bold text-[#087F73]">Clinical Overview</p>
              <h2 className="text-base font-bold text-[#193B62]">{selectedPatientForCarePlan.condition}</h2>
              <p className="text-xs text-gray-500">Affected Area: <strong className="text-[#193B62]">{selectedPatientForCarePlan.affected_area}</strong></p>
              <div className="pt-2 flex flex-wrap gap-3 text-[11px] text-gray-500 border-t border-gray-100">
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
                <p className="text-xs text-gray-500">
                  {selectedPatientForCarePlan.current_prescription.plan} • Started {selectedPatientForCarePlan.current_prescription.start_date} ({selectedPatientForCarePlan.current_prescription.duration})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Assigned Exercises</h3>
              
              {selectedPatientForCarePlan.current_prescription.exercises && selectedPatientForCarePlan.current_prescription.exercises.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {selectedPatientForCarePlan.current_prescription.exercises.map((ex, index) => (
                    <div key={ex.id || index} className="bg-[#F4F7FB] border border-[#D9E3ED] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
                      {ex.thumbnail && (
                        <img src={ex.thumbnail} alt={ex.name} className="w-full md:w-32 h-20 rounded-lg object-cover border border-[#D9E3ED] shrink-0" />
                      )}
                      
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-[#087F73] uppercase">{ex.category || 'General'}</span>
                          <span className="text-xs text-gray-400 font-mono">Exercise #{index + 1}</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#193B62]">{ex.name}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-white px-3 py-2 rounded-lg border border-[#D9E3ED]">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Volume</span>
                            <strong className="text-[#193B62]">{ex.sets} Sets × {ex.reps} Reps</strong>
                          </div>
                          <div className="bg-white px-3 py-2 rounded-lg border border-[#D9E3ED]">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Hold</span>
                            <strong className="text-[#193B62]">{ex.hold}</strong>
                          </div>
                          <div className="bg-white px-3 py-2 rounded-lg border border-[#D9E3ED]">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Rest</span>
                            <strong className="text-[#193B62]">{ex.rest || '30s'}</strong>
                          </div>
                          <div className="bg-white px-3 py-2 rounded-lg border border-[#D9E3ED]">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Target ROM</span>
                            <strong className="text-[#087F73]">{ex.target_rom || ex.rom || 'Standard'}</strong>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          <strong className="text-[#193B62]">Physio Note:</strong> {ex.notes || 'Maintain strict form.'}
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
            
            {selectedPatientForCarePlan.history && selectedPatientForCarePlan.history.length > 0 ? (
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

          <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register & Assign New Patient">
            <form onSubmit={handleAddPatient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#193B62] mb-1">Full Name *</label>
                  <input type="text" required placeholder="Sarah Jenkins" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-xl font-semibold text-[#193B62]" />
                </div>
                <div>
                  <label className="block font-semibold text-[#193B62] mb-1">Email Address</label>
                  <input type="email" placeholder="sarah@example.com" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-xl font-semibold text-[#193B62]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#193B62] mb-1">Phone Number</label>
                  <input type="text" placeholder="+1 (555) 000-0000" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-xl font-semibold text-[#193B62]" />
                </div>
                <div>
                  <label className="block font-semibold text-[#193B62] mb-1">Gender</label>
                  <select value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-xl font-semibold text-[#193B62]">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#193B62] mb-1">Condition / Injury *</label>
                  <input type="text" required placeholder="ACL Reconstruction" value={newPatient.condition} onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-xl font-semibold text-[#193B62]" />
                </div>
                <div>
                  <label className="block font-semibold text-[#193B62] mb-1">Affected Area</label>
                  <input type="text" placeholder="Left Knee Joint" value={newPatient.affected_area} onChange={(e) => setNewPatient({ ...newPatient, affected_area: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-xl font-semibold text-[#193B62]" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#193B62] mb-1">Treatment Start Date</label>
                <input type="date" value={newPatient.treatment_start} onChange={(e) => setNewPatient({ ...newPatient, treatment_start: e.target.value })} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-xl font-semibold text-[#193B62]" />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#D9E3ED]">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 border border-[#D9E3ED] rounded-xl font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#087F73] text-white rounded-xl font-bold hover:bg-[#06655c] cursor-pointer shadow-xs">Save & Register Patient</button>
              </div>
            </form>
          </Modal>

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
    </PhysioLayout>
  );
}