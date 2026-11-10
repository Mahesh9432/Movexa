import React, { useState, useEffect } from 'react';
import PhysioLayout from '../../layouts/PhysioLayout';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

const libraryExercises = [
  { id: 'LIB-01', name: 'Terminal Knee Extensions (TKE)', category: 'Resistance Band', thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80' },
  { id: 'LIB-02', name: 'Isometric Quad Sets with Towel Roll', category: 'Knee Extension', thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&auto=format&fit=crop&q=80' },
  { id: 'LIB-03', name: 'Supine Straight Leg Raises (SLR)', category: 'Hip Flexor & Quad', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&auto=format&fit=crop&q=80' },
];

export default function Prescriptions({ patientName = 'Sarah Michelle Jenkins', patients = [], setPatients, prescriptions = [], setPrescriptions, onLogout, onNavigate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [filterPatient, setFilterPatient] = useState('All');

  // Unified patient list sourced directly from the shared patient roster props plus any prescription history
  const availablePatients = Array.from(
    new Set([
      ...(patients || []).map(p => p.name),
      patientName,
      ...(prescriptions || []).map(rx => rx.patient)
    ])
  ).filter(Boolean);

  // Form State
  const [selectedPatient, setSelectedPatient] = useState(patientName);

  // Synchronize selectedPatient with patientName prop changes using useEffect
  useEffect(() => {
    if (patientName) {
      setSelectedPatient(patientName);
    }
  }, [patientName]);

  const [rxTitle, setRxTitle] = useState('Phase 3: Advanced Strength & Stability');
  const [treatmentPlan, setTreatmentPlan] = useState('Post-Op Knee Rehabilitation Protocol');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('4 Weeks');
  const [frequency, setFrequency] = useState('Daily (7 days/week)');
  const [selectedEx, setSelectedEx] = useState(libraryExercises[0]);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [hold, setHold] = useState('2s Hold • 3s Return');
  const [rom, setRom] = useState('0° - 90° ROM');
  const [notes, setNotes] = useState('Maintain proper form and controlled return under band resistance.');
  const [precautions, setPrecautions] = useState('Stop immediately if sharp pain occurs.');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newRx = {
      id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      patient: selectedPatient,
      title: rxTitle,
      treatmentPlan,
      date: startDate,
      duration,
      frequency,
      exercises: [
        { ...selectedEx, sets: Number(sets), reps: Number(reps), hold, rom, notes }
      ],
      exercisesCount: 1,
      notes,
      precautions,
      status: 'Active',
    };

    // 1. Update prescription history with functional state update
    if (setPrescriptions) {
      setPrescriptions(prev => [newRx, ...prev]);
    }

    // 2. Synchronize and update the matching patient's current_prescription and history
    if (setPatients) {
      setPatients(prevPatients => 
        prevPatients.map(pat => {
          if (pat.name === selectedPatient) {
            const previousPrescription = pat.current_prescription;
            const archivedHistoryItem = previousPrescription ? {
              id: `RX-HIST-${Math.floor(100 + Math.random() * 900)}`,
              title: previousPrescription.title,
              date: `${previousPrescription.start_date || startDate}`,
              exercises_count: previousPrescription.exercises ? previousPrescription.exercises.length : 1,
              status: 'Completed',
              adherence: pat.adherence || '90%'
            } : null;

            return {
              ...pat,
              current_prescription: {
                title: rxTitle,
                plan: treatmentPlan,
                start_date: startDate,
                duration: duration,
                exercises: [
                  { ...selectedEx, sets: Number(sets), reps: Number(reps), hold, target_rom: rom, notes }
                ]
              },
              history: archivedHistoryItem ? [archivedHistoryItem, ...(pat.history || [])] : (pat.history || [])
            };
          }
          return pat;
        })
      );
    }

    setSuccessBanner(true);
    setIsAdding(false);
    setTimeout(() => setSuccessBanner(false), 3000);
  };

  const filteredPrescriptions = filterPatient === 'All' 
    ? prescriptions 
    : prescriptions.filter(rx => rx.patient === filterPatient);

  const displayedPrescriptions = showAllHistory ? filteredPrescriptions : filteredPrescriptions.slice(0, 3);

  return (
    <PhysioLayout currentView="physio-prescriptions" onLogout={onLogout} onNavigate={onNavigate}>
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
          <span>✓</span> Prescription successfully created and synchronized with <strong className="underline">{selectedPatient}</strong>'s care plan!
        </div>
      )}

      {/* PAGE HEADER & ADD BUTTON */}
      <PageHeader
        category="Clinical Care Plans"
        title="Prescriptions Hub"
        subtitle="Manage active patient routines and issue new exercise prescriptions."
        action={
          !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2"
            >
              <span>＋</span> Add New Prescription
            </button>
          )
        }
      />

      {/* DETAILED ADD PRESCRIPTION FORM (Using Modal) */}
      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Create New Prescription">
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block font-bold text-[#193B62]">Select Patient</label>
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]">
              {availablePatients.map(pat => (
                <option key={pat} value={pat}>{pat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-[#193B62]">Prescription Title</label>
              <input type="text" required value={rxTitle} onChange={(e) => setRxTitle(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]" />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-[#193B62]">Rehabilitation Phase / Plan</label>
              <input type="text" required value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block font-bold text-[#193B62]">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]" />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-[#193B62]">Duration</label>
              <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]" />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-[#193B62]">Frequency</label>
              <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]" />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#D9E3ED]">
            <label className="block font-bold text-[#193B62]">Select Exercise from MOVEXA Library</label>
            <select onChange={(e) => { const found = libraryExercises.find(ex => ex.id === e.target.value); if (found) setSelectedEx(found); }} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]">
              {libraryExercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name} ({ex.category})</option>
              ))}
            </select>

            <div className="border border-[#D9E3ED] bg-[#F4F7FB] rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
              <img src={selectedEx.thumbnail} alt={selectedEx.name} className="w-24 h-16 rounded-lg object-cover border border-[#D9E3ED]" />
              <div className="flex-1 space-y-2 w-full">
                <h4 className="font-bold text-sm text-[#193B62]">{selectedEx.name}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Sets</span>
                    <input type="number" min="1" value={sets} onChange={(e) => setSets(e.target.value)} className="w-full bg-white border border-[#D9E3ED] px-2 py-1 rounded-lg font-semibold" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Reps</span>
                    <input type="number" min="1" value={reps} onChange={(e) => setReps(e.target.value)} className="w-full bg-white border border-[#D9E3ED] px-2 py-1 rounded-lg font-semibold" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Hold / Tempo</span>
                    <input type="text" value={hold} onChange={(e) => setHold(e.target.value)} className="w-full bg-white border border-[#D9E3ED] px-2 py-1 rounded-lg font-semibold" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Target ROM</span>
                    <input type="text" value={rom} onChange={(e) => setRom(e.target.value)} className="w-full bg-white border border-[#D9E3ED] px-2 py-1 rounded-lg font-semibold" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#D9E3ED]">
            <div className="space-y-1">
              <label className="block font-bold text-[#193B62]">Clinical Guidance & Notes</label>
              <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]" />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-[#193B62]">Safety Precautions & Warnings</label>
              <textarea rows="2" value={precautions} onChange={(e) => setPrecautions(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[#D9E3ED]">
            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border border-[#D9E3ED] rounded-xl font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-[#087F73] text-white rounded-xl font-bold hover:bg-[#06655c] cursor-pointer shadow-xs">Assign Prescription</button>
          </div>
        </form>
      </Modal>

      {/* FILTER & PREVIOUSLY ASSIGNED PRESCRIPTIONS */}
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Previously Assigned Prescriptions</h2>
            <select 
              value={filterPatient} 
              onChange={(e) => setFilterPatient(e.target.value)}
              className="bg-white border border-[#D9E3ED] text-xs font-semibold px-2.5 py-1 rounded-lg text-[#193B62]"
            >
              <option value="All">All Patients</option>
              {availablePatients.map(pat => (
                <option key={pat} value={pat}>{pat}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-xs font-bold text-[#087F73] hover:underline cursor-pointer"
          >
            {showAllHistory ? 'Show Less' : `See All (${filteredPrescriptions.length})`} →
          </button>
        </div>

        <div className="space-y-3">
          {displayedPrescriptions.length > 0 ? (
            displayedPrescriptions.map((rx) => (
              <div 
                key={rx.id} 
                className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2.5 py-0.5 rounded-md font-mono">
                      {rx.id}
                    </span>
                    <StatusBadge status={rx.status} />
                  </div>
                  <h3 className="text-base font-bold text-[#193B62]">{rx.title}</h3>
                  <p className="text-xs text-gray-600 font-medium">
                    Assigned Patient: <strong className="text-[#087F73]">{rx.patient}</strong> • Plan: {rx.treatmentPlan}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Issued Date: {rx.date} ({rx.duration} • {rx.frequency})
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Routine Volume</span>
                    <span className="text-xs font-bold text-[#193B62]">{rx.exercisesCount} Exercises</span>
                  </div>

                  <button 
                    onClick={() => alert(`Viewing routine details & notes for ${rx.id}:\n• ${rx.notes}\n• Precautions: ${rx.precautions}`)}
                    className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    View Routine →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-8 text-center text-xs text-gray-500">
              No prescriptions found for the selected patient.
            </div>
          )}
        </div>
      </div>
    </PhysioLayout>
  );
}