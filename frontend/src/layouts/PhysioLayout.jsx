import { ShieldCheck, LogOut } from 'lucide-react';

export default function PhysioLayout({ children, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Professional Therapist Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between border-t-2 border-t-cyan-500">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">
              MOVEXA <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md font-normal ml-2">Clinician Portal</span>
            </h1>
            <p className="text-xs text-slate-400">Patient Monitoring & Prescription Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">Dr. Sarah Jenkins</p>
            <p className="text-[10px] text-slate-400">Lead Physiotherapist</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>
    </div>
  );
}