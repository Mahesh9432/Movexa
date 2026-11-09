import React, { useState } from 'react';

const navItems = [
  { name: 'Dashboard', icon: '📊', view: 'dashboard' },
  { name: 'My Exercises', icon: '📋', view: 'exercises' },
  { name: 'Exercise Library', icon: '📚', view: 'library' },
  { name: 'Progress', icon: '📈', view: 'progress' },
  { name: 'Appointments', icon: '📅', view: 'appointments' },
  { name: 'Profile', icon: '👤', view: 'profile' },
];

export default function PatientExercises({ onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'Completed' | 'Up Next' | 'Queued'

  const handleNavClick = (view) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#D9E3ED] p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">
              MOVEẊA
            </div>
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">
              Patient Portal
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  item.view === 'exercises'
                    ? 'bg-[#EAF1F8] text-[#087F73]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#193B62]'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#D9E3ED]">
          <button
            onClick={onLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg cursor-pointer"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0">

        {/* MOBILE HEADER */}
        <header className="md:hidden bg-white border-b border-[#D9E3ED] px-4 py-3 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-xl"
              aria-label="Open navigation"
            >
              ☰
            </button>
            <span className="bg-[#087F73] text-white font-bold text-xs px-2 py-1 rounded">
              MOVEẊA
            </span>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full bg-[#193B62] text-white text-xs font-bold flex items-center justify-center"
          >
            S
          </button>
        </header>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <span className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">
                    MOVEẊA
                  </span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-xl">✕</button>
                </div>
                <nav className="space-y-1.5">
                  {navItems.map((item) => (
                    <button
                      key={item.view}
                      onClick={() => handleNavClick(item.view)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${
                        item.view === 'exercises' ? 'bg-[#EAF1F8] text-[#087F73]' : 'text-gray-600'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
              <button onClick={onLogout} className="w-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg">
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP HEADER */}
        <header className="hidden md:flex bg-white border-b border-[#D9E3ED] px-8 py-3.5 justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">
            Apex Orthopaedics • <span className="text-[#193B62] font-bold">Patient Portal</span>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-full bg-[#193B62] text-white flex items-center justify-center text-xs font-bold">
              S
            </span>
            <span className="text-xs font-bold">Sarah Jenkins</span>
          </button>
        </header>

        {/* PAGE BODY */}
        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

          {/* PAGE TITLE & SUBTITLE + EXPORT BUTTON */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E3ED] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
                Prescription & Care Plan
              </p>
              <h1 className="text-3xl font-bold mt-1 text-[#20252B]">
                My Exercises
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Exercises assigned by your physiotherapist with target angles and instructions.
              </p>
            </div>

            <button
              onClick={() => alert('Exporting PDF clinical summary...')}
              className="bg-white border border-[#D9E3ED] hover:bg-gray-50 text-[#193B62] text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>📄</span> Export PDF
            </button>
          </div>

          {/* METRIC SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                <span>DAILY PROGRESS</span>
                <span className="text-emerald-600">✓</span>
              </div>
              <p className="text-2xl font-bold text-[#193B62]">1 <span className="text-xs text-gray-400 font-normal">of 4 completed</span></p>
              <div className="w-full bg-[#EAF1F8] h-2 rounded-full overflow-hidden">
                <div className="bg-[#087F73] h-full w-1/4 rounded-full" />
              </div>
            </div>

            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                <span>KINEMATIC SCORE</span>
                <span className="text-[#087F73]">📈</span>
              </div>
              <p className="text-2xl font-bold text-[#193B62]">98% <span className="text-xs font-bold text-emerald-600">+2% target</span></p>
              <p className="text-[11px] text-gray-500">Optimal joint alignment</p>
            </div>

            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                <span>KNEE EXTENSION</span>
                <span className="text-[#087F73]">🩺</span>
              </div>
              <p className="text-2xl font-bold text-[#193B62]">0° <span className="text-xs text-gray-400 font-normal">Full active lock</span></p>
              <p className="text-[11px] text-[#087F73] font-semibold">Hyperextension safe</p>
            </div>

            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                <span>WEEKLY STREAK</span>
                <span className="text-amber-500">⚡</span>
              </div>
              <p className="text-2xl font-bold text-[#193B62]">6 <span className="text-xs text-gray-400 font-normal">Days active</span></p>
              <p className="text-[11px] text-gray-500">Protocol adherent</p>
            </div>

          </div>

          {/* SECTION HEADER & FILTER OPTIONS */}
          <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#193B62]">
                Today's Session Sequence
              </h2>
              <p className="text-[11px] text-[#087F73] font-bold mt-0.5">
                ASSISTED VIA OPTICAL POSE TRACKING
              </p>
            </div>

            {/* FILTER BUTTONS */}
            <div className="flex items-center gap-1.5 bg-white border border-[#D9E3ED] p-1 rounded-xl shadow-xs">
              {['All', 'Completed', 'Up Next', 'Queued'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filterStatus === status
                      ? 'bg-[#087F73] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#193B62]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* EXERCISE SEQUENCE CARDS (Filtered dynamically) */}
          <div className="space-y-4">

            {/* CARD 1: COMPLETED */}
            {(filterStatus === 'All' || filterStatus === 'Completed') && (
              <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row gap-6 items-center">
                <div className="relative w-full md:w-64 h-36 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#193B62]/60 to-transparent flex items-end p-3">
                    <span className="bg-[#087F73] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      98% Form Score
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Completed 08:14 AM
                  </div>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span>✓</span> Completed
                      </span>
                      <span className="text-xs text-gray-400">Set 1/1</span>
                    </div>
                    <span className="text-xs text-gray-400">10 mins</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#193B62]">Isometric Quad Sets with Towel Roll</h3>
                    <div className="grid grid-cols-3 gap-2 bg-[#F4F7FB] p-3 rounded-xl border border-[#D9E3ED] mt-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Volume</span>
                        <strong className="text-[#193B62]">3 Sets x 10 Reps</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Hold</span>
                        <strong className="text-[#193B62]">10-sec Holds</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Target</span>
                        <strong className="text-[#087F73]">0 deg Full Extension</strong>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      <strong className="text-[#193B62]">Dr. Vance:</strong> Complete quad lock before relaxing; keep toes pointing upwards.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => alert('Redo session initiated.')} className="border border-[#D9E3ED] hover:bg-gray-50 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">
                      🔄 Redo
                    </button>
                    <button onClick={() => alert('Telemetry report opened.')} className="border border-[#D9E3ED] hover:bg-gray-50 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">
                      📊 Telemetry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CARD 2: UP NEXT (ACTIVE AI TRACKING) */}
            {(filterStatus === 'All' || filterStatus === 'Up Next') && (
              <div className="bg-white border-2 border-[#087F73] rounded-2xl p-5 md:p-6 shadow-md flex flex-col md:flex-row gap-6 items-center">
                <div className="relative w-full md:w-64 h-36 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#193B62]/60 to-transparent flex items-end p-3">
                    <span className="bg-[#193B62] text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <span>📹</span> Camera Ready
                    </span>
                  </div>
                  <div className="absolute top-2 left-2 bg-[#087F73] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    ● Up Next
                  </div>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2.5 py-1 rounded-full">
                        ● Up Next
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">Medium Resistance • ~6 mins</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#193B62]">Terminal Knee Extensions (TKE)</h3>
                    <div className="grid grid-cols-3 gap-2 bg-[#F4F7FB] p-3 rounded-xl border border-[#D9E3ED] mt-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Prescription</span>
                        <strong className="text-[#193B62]">3 Sets x 12 Reps</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Resistance</span>
                        <strong className="text-[#087F73]">Green Band</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Tempo</span>
                        <strong className="text-[#193B62]">2s Hold • 3s Return</strong>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      <strong className="text-[#193B62]">Dr. Vance:</strong> Slow controlled return. Do not allow knee to hyperextend quickly under band snapback.
                    </p>
                  </div>

                  <div className="flex justify-end items-center gap-3 pt-1">
                    <button onClick={() => alert('Demo video preview loaded.')} className="text-xs font-semibold text-gray-600 hover:underline cursor-pointer">
                      Preview Demo
                    </button>
                    <button
                      onClick={() => onNavigate('session')}
                      className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <span>▶</span> Start with AI Motion Tracking
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CARD 3: QUEUED */}
            {(filterStatus === 'All' || filterStatus === 'Queued') && (
              <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row gap-6 items-center opacity-85">
                <div className="relative w-full md:w-64 h-36 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  <div className="absolute top-2 left-2 bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Queue #3
                  </div>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Queued
                    </span>
                    <span className="text-xs text-gray-400">Hip Flexor & Quad • ~5 mins</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#193B62]">Supine Straight Leg Raises (SLR)</h3>
                    <div className="grid grid-cols-3 gap-2 bg-[#F4F7FB] p-3 rounded-xl border border-[#D9E3ED] mt-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Volume</span>
                        <strong className="text-[#193B62]">3 Sets x 15 Reps</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Elevation</span>
                        <strong className="text-[#193B62]">45 deg Peak Arc</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Hold</span>
                        <strong className="text-[#193B62]">3-sec Hold</strong>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      <strong className="text-[#193B62]">Dr. Vance:</strong> Lock knee completely straight before lifting heel off mat.
                    </p>
                  </div>

                  <div className="flex justify-end items-center gap-3 pt-1">
                    <button onClick={() => alert('Previewing exercise.')} className="text-xs font-semibold text-gray-600 hover:underline cursor-pointer">
                      Preview
                    </button>
                    <button onClick={() => onNavigate('session')} className="border border-[#D9E3ED] bg-gray-50 hover:bg-gray-100 text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer">
                      ▶ Start
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}