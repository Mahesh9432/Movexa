import React, { useState } from 'react';

const navItems = [
  { name: 'Dashboard', icon: '📊', view: 'dashboard' },
  { name: 'My Exercises', icon: '📋', view: 'exercises' },
  { name: 'Exercise Library', icon: '📚', view: 'library' },
  { name: 'Progress', icon: '📈', view: 'progress' },
  { name: 'Appointments', icon: '📅', view: 'appointments' },
  { name: 'Profile', icon: '👤', view: 'profile' },
];

export default function PatientDashboard({ onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const renderNavigation = () => (
    <nav className="space-y-1.5">
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => handleNavClick(item.view)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            item.view === 'dashboard'
              ? 'bg-[#EAF1F8] text-[#087F73]'
              : 'text-gray-600 hover:bg-gray-50 hover:text-[#193B62]'
          }`}
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.name}</span>
        </button>
      ))}
    </nav>
  );

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

          {renderNavigation()}
        </div>

        <div className="pt-4 border-t border-[#D9E3ED]">
          <button
            onClick={onLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="flex-1 min-w-0">

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
            className="w-8 h-8 rounded-full bg-[#193B62] text-white text-xs font-bold"
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

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl"
                    aria-label="Close navigation"
                  >
                    ✕
                  </button>
                </div>

                {renderNavigation()}
              </div>

              <button
                onClick={onLogout}
                className="w-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP HEADER */}
        <header className="hidden md:flex bg-white border-b border-[#D9E3ED] px-8 py-3.5 justify-between items-center sticky top-0 z-20">
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider">
              Dashboard Overview
            </h1>
            <p className="text-[10px] text-gray-500">
              Your rehabilitation journey
            </p>
          </div>

          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4"
          >
            <span className="w-8 h-8 rounded-full bg-[#193B62] text-white flex items-center justify-center text-xs font-bold">
              S
            </span>
            <span className="text-xs font-bold">Sarah Jenkins</span>
          </button>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Good morning, Sarah
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              ● Dr. Marcus Vance, PT • Apex Orthopaedics
            </p>
          </div>

          {/* TODAY'S ROUTINE */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                Today's Prescribed Routine
              </span>

              <span className="text-xs text-gray-500">
                18 mins • 3 exercises
              </span>
            </div>

            <div>
              <h3 className="text-lg md:text-xl font-bold">
                Knee Mobility & Quad Re-education Phase 2
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                📹 AI Motion Tracking enabled
              </p>
            </div>

            <button
              onClick={() => alert('Exercise session will be connected soon.')}
              className="w-full bg-[#087F73] hover:bg-[#06655c] text-white font-semibold py-3 rounded-xl text-sm"
            >
              ▶ Start Today's Session
            </button>
          </section>

          {/* CLINICAL TELEMETRY */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Clinical Telemetry
              </h3>
              <span className="text-xs text-[#087F73] font-semibold">
                Active Week 4
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <div className="bg-white border border-[#D9E3ED] rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Weekly Adherence</p>
                <p className="text-2xl font-bold mt-2">85%</p>
                <div className="w-full bg-[#EAF1F8] h-2 rounded-full mt-3">
                  <div className="bg-[#087F73] h-2 w-[85%] rounded-full" />
                </div>
                <p className="text-[10px] text-emerald-600 mt-2">
                  6 of 8 target sessions • On Track
                </p>
              </div>

              <div className="bg-white border border-[#D9E3ED] rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Form Accuracy</p>
                <p className="text-2xl font-bold mt-2">94.2%</p>
                <p className="text-[10px] text-emerald-600 mt-2">
                  ▲ 3.1% vs last week
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Excellent joint alignment
                </p>
              </div>

              <div className="bg-white border border-[#D9E3ED] rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500">Completed Sessions</p>
                <p className="text-2xl font-bold mt-2">14</p>
                <p className="text-[10px] text-[#087F73] mt-2">
                  🔥 4-day recovery streak
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Consistent compliance
                </p>
              </div>

            </div>
          </section>

          {/* NEXT SECTION */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm">
                Assigned Exercises
              </h3>
              <button
                onClick={() => onNavigate('exercises')}
                className="text-xs text-[#087F73] font-semibold"
              >
                View All →
              </button>
            </div>

            {[
              ['Knee Extension', '3 sets × 10 reps', 'Pending'],
              ['Straight Leg Raise', '2 sets × 12 reps', 'Completed'],
              ['Ankle Pumps', '3 sets × 15 reps', 'Pending'],
            ].map(([name, sets, status]) => (
              <div
                key={name}
                className="flex flex-wrap justify-between items-center gap-2 border border-[#D9E3ED] rounded-lg p-3 mb-3"
              >
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-gray-500">{sets}</p>
                </div>

                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </section>

        </main>
      </div>
    </div>
  );
}

