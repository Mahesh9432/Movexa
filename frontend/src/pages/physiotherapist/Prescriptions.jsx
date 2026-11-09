import React, { useState } from 'react';

const navItems = [
  { name: 'Dashboard', icon: '📊', view: 'physio-dashboard' },
  { name: 'Patients', icon: '👥', view: 'physio-patients' },
  { name: 'Prescriptions', icon: '📋', view: 'physio-prescriptions' },
  { name: 'Profile', icon: '👤', view: 'physio-profile' },
];

const libraryExercises = [
  { id: 'LIB-01', name: 'Terminal Knee Extensions (TKE)', category: 'Resistance Band', thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80' },
  { id: 'LIB-02', name: 'Isometric Quad Sets with Towel Roll', category: 'Knee Extension', thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&auto=format&fit=crop&q=80' },
  { id: 'LIB-03', name: 'Supine Straight Leg Raises (SLR)', category: 'Hip Flexor & Quad', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&auto=format&fit=crop&q=80' },
];

export default function Prescriptions({ onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  // Form State
  const [patientName, setPatientName] = useState('Sarah Michelle Jenkins');
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

  // Previously Added Prescriptions History
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'RX-8841',
      patient: 'Sarah Michelle Jenkins',
      title: 'Phase 2: Active ROM & Quad Strengthening',
      date: '2026-10-12',
      exercisesCount: 2,
      status: 'Active',
    },
    {
      id: 'RX-7723',
      patient: 'James Anderson',
      title: 'Shoulder Mobility & Rotator Cuff Stability',
      date: '2026-10-05',
      exercisesCount: 3,
      status: 'Active',
    },
    {
      id: 'RX-6619',
      patient: 'Emily Rose',
      title: 'Lumbar Spine Core Stabilization',
      date: '2026-09-20',
      exercisesCount: 4,
      status: 'Completed',
    },
    {
      id: 'RX-5512',
      patient: 'Sarah Michelle Jenkins',
      title: 'Phase 1: Initial Post-Op Mobility',
      date: '2026-09-01',
      exercisesCount: 3,
      status: 'Completed',
    }
  ]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newRx = {
      id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      patient: patientName,
      title: rxTitle,
      date: startDate,
      exercisesCount: 1,
      status: 'Active',
    };
    setPrescriptions([newRx, ...prescriptions]);
    setSuccessBanner(true);
    setIsAdding(false);
    setTimeout(() => setSuccessBanner(false), 3000);
  };

  const handleNavClick = (view) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const displayedPrescriptions = showAllHistory ? prescriptions : prescriptions.slice(0, 3);

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
                onClick={() => handleNavClick(item.view)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  item.view === 'physio-prescriptions' ? 'bg-[#EAF1F8] text-[#087F73]' : 'text-gray-600 hover:bg-gray-50'
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

        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

          {successBanner && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
              <span>✓</span> Prescription successfully created and assigned!
            </div>
          )}

          {/* PAGE HEADER & ADD BUTTON */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">Clinical Care Plans</p>
              <h1 className="text-3xl font-bold mt-1 text-[#20252B]">Prescriptions Hub</h1>
              <p className="text-sm text-gray-500 mt-1">Manage active patient routines and issue new exercise prescriptions.</p>
            </div>

            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2"
              >
                <span>＋</span> Add New Prescription
              </button>
            )}
          </div>

          {/* DETAILED ADD PRESCRIPTION FORM */}
          {isAdding && (
            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-6 md:p-8 shadow-md space-y-6">
              <div className="flex justify-between items-center border-b border-[#D9E3ED] pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">Care Plan Builder</p>
                  <h2 className="text-xl font-bold text-[#193B62]">Create New Prescription</h2>
                </div>
                <button onClick={() => setIsAdding(false)} className="text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer">
                  ✕ Close Form
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-[#193B62]">Select Patient</label>
                  <select value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]">
                    <option value="Sarah Michelle Jenkins">Sarah Michelle Jenkins</option>
                    <option value="James Anderson">James Anderson</option>
                    <option value="Emily Rose">Emily Rose</option>
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
                    <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]" />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-[#193B62]">Safety Precautions & Warnings</label>
                    <textarea rows="3" value={precautions} onChange={(e) => setPrecautions(e.target.value)} className="w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl font-semibold text-[#193B62]" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-[#D9E3ED]">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border border-[#D9E3ED] rounded-xl font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-[#087F73] text-white rounded-xl font-bold hover:bg-[#06655c] cursor-pointer shadow-xs">Assign Prescription</button>
                </div>
              </form>
            </div>
          )}

          {/* SEPARATE INDIVIDUAL CARDS FOR PREVIOUSLY ASSIGNED PRESCRIPTIONS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Previously Assigned Prescriptions</h2>
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="text-xs font-bold text-[#087F73] hover:underline cursor-pointer"
              >
                {showAllHistory ? 'Show Less' : `See All (${prescriptions.length})`} →
              </button>
            </div>

            <div className="space-y-3">
              {displayedPrescriptions.map((rx) => (
                <div 
                  key={rx.id} 
                  className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2.5 py-0.5 rounded-md font-mono">
                        {rx.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${rx.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {rx.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#193B62]">{rx.title}</h3>
                    <p className="text-xs text-gray-600 font-medium">
                      Assigned Patient: <strong className="text-[#087F73]">{rx.patient}</strong>
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Issued Date: {rx.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Routine Volume</span>
                      <span className="text-xs font-bold text-[#193B62]">{rx.exercisesCount} Exercises</span>
                    </div>

                    <button 
                      onClick={() => alert(`Viewing routine details for ${rx.id}`)}
                      className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      View Routine →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}