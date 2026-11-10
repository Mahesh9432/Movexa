import React, { useState } from 'react';

const navItems = [
  { name: 'Dashboard', icon: '📊', view: 'dashboard' },
  { name: 'My Exercises', icon: '📋', view: 'exercises' },
  { name: 'Exercise Library', icon: '📚', view: 'library' },
  { name: 'Progress', icon: '📈', view: 'progress' },
  { name: 'Profile', icon: '👤', view: 'profile' },
];

export default function PatientLayout({ children, currentView, onLogout, onNavigate }) {
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
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            item.view === currentView
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
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">MOVEẊA</div>
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Patient Portal</span>
          </div>
          {renderNavigation()}
        </div>

        <div className="pt-4 border-t border-[#D9E3ED]">
          <button onClick={onLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg cursor-pointer">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0">
        {/* MOBILE HEADER */}
        <header className="md:hidden bg-white border-b border-[#D9E3ED] px-4 py-3 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="text-xl cursor-pointer" aria-label="Open navigation">☰</button>
            <span className="bg-[#087F73] text-white font-bold text-xs px-2 py-1 rounded">MOVEẊA</span>
          </div>
          <button onClick={() => onNavigate('profile')} className="w-8 h-8 rounded-full bg-[#193B62] text-white text-xs font-bold flex items-center justify-center cursor-pointer">
            S
          </button>
        </header>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <span className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">MOVEẊA</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-xl cursor-pointer">✕</button>
                </div>
                {renderNavigation()}
              </div>
              <button onClick={onLogout} className="w-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg cursor-pointer">
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
          <button onClick={() => onNavigate('profile')} className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4 cursor-pointer">
            <span className="w-8 h-8 rounded-full bg-[#193B62] text-white flex items-center justify-center text-xs font-bold">S</span>
            <span className="text-xs font-bold">Sarah Jenkins</span>
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}