import React from 'react';

export default function PhysioDashboard({ onLogout, onNavigate }) {
  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#D9E3ED] p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">MOVEẊA</div>
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Physio Portal</span>
          </div>

          <nav className="space-y-1.5">
            <button onClick={() => onNavigate && onNavigate('physio-dashboard')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#EAF1F8] text-[#087F73]">
              <span>📊</span> Dashboard
            </button>
            <button onClick={() => onNavigate && onNavigate('physio-profile')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <span>👤</span> Profile & Credentials
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-[#D9E3ED]">
          <button onClick={onLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2 rounded-lg">🚪 Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#D9E3ED] px-8 py-3.5 flex justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">Apex Orthopaedics • <span className="text-[#193B62] font-bold">Physiotherapist Dashboard</span></div>
          <button onClick={() => onNavigate && onNavigate('physio-profile')} className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4 cursor-pointer">
            <span className="w-8 h-8 rounded-full bg-[#087F73] text-white flex items-center justify-center text-xs font-bold">MV</span>
            <span className="text-xs font-bold">Dr. Marcus Vance</span>
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-[#193B62]">Physiotherapist Control Center</h1>
          <p className="text-sm text-gray-500">Welcome back, Dr. Vance. Review assigned patients and active prescriptions below.</p>
          
          <div className="bg-white border border-[#D9E3ED] rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-[#193B62] mb-2">Assigned Patients Roster</h3>
            <p className="text-xs text-gray-500">Active Patient: Sarah Michelle Jenkins (Post-Operative ACL Reconstruction)</p>
          </div>
        </main>
      </div>
    </div>
  );
}