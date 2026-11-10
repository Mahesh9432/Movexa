import React, { useState } from 'react';
import PatientLayout from '../../layouts/PatientLayout';

export default function PatientExercises({ onLogout, onNavigate }) {
  const [filterStatus, setFilterStatus] = useState('All');

  return (
    <PatientLayout currentView="exercises" onLogout={onLogout} onNavigate={onNavigate}>
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

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#193B62]">
            Today's Session Sequence
          </h2>
          <p className="text-[11px] text-[#087F73] font-bold mt-0.5">
            ASSISTED VIA OPTICAL POSE TRACKING (Simulated Placeholder)
          </p>
        </div>

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

      {/* EXERCISE CARDS */}
      <div className="space-y-4">
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
              <div className="flex justify-between items-center">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  ✓ Completed
                </span>
                <span className="text-xs text-gray-400">10 mins</span>
              </div>
              <h3 className="text-base font-bold text-[#193B62]">Isometric Quad Sets with Towel Roll</h3>
              <div className="grid grid-cols-3 gap-2 bg-[#F4F7FB] p-3 rounded-xl border border-[#D9E3ED] text-xs">
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
            </div>
          </div>
        )}

        {(filterStatus === 'All' || filterStatus === 'Up Next') && (
          <div className="bg-white border-2 border-[#087F73] rounded-2xl p-5 md:p-6 shadow-md flex flex-col md:flex-row gap-6 items-center">
            <div className="relative w-full md:w-64 h-36 bg-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
              <span className="text-xs text-gray-400 font-mono">📹 Camera Ready</span>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="flex justify-between items-center">
                <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2.5 py-1 rounded-full">
                  ● Up Next
                </span>
                <span className="text-xs text-gray-400">Medium Resistance • ~6 mins</span>
              </div>
              <h3 className="text-base font-bold text-[#193B62]">Terminal Knee Extensions (TKE)</h3>
              <div className="grid grid-cols-3 gap-2 bg-[#F4F7FB] p-3 rounded-xl border border-[#D9E3ED] text-xs">
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
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onNavigate('session')}
                  className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <span>▶</span> Start with AI Motion Tracking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}