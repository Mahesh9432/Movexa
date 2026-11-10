import React from 'react';
import PatientLayout from '../../layouts/PatientLayout';

export default function PatientDashboard({ onLogout, onNavigate }) {
  return (
    <PatientLayout currentView="dashboard" onLogout={onLogout} onNavigate={onNavigate}>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#193B62]">
          Good morning, Sarah
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          ● Dr. Marcus Vance, PT • Apex Orthopaedics
        </p>
      </div>

      {/* TODAY'S ROUTINE */}
      <section className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
            Today's Prescribed Routine
          </span>
          <span className="text-xs text-gray-500">
            18 mins • 3 exercises
          </span>
        </div>

        <div>
          <h3 className="text-lg md:text-xl font-bold text-[#193B62]">
            Knee Mobility & Quad Re-education Phase 2
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            📹 AI Motion Tracking enabled (Simulated Placeholder)
          </p>
        </div>

        <button
          onClick={() => onNavigate('session')}
          className="w-full bg-[#087F73] hover:bg-[#06655c] text-white font-semibold py-3 rounded-xl text-sm cursor-pointer shadow-xs transition-all"
        >
          ▶ Start Today's Session
        </button>
      </section>

      {/* CLINICAL TELEMETRY */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#193B62]">
            Clinical Telemetry
          </h3>
          <span className="text-xs text-[#087F73] font-semibold">
            Active Week 4
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border border-[#D9E3ED] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-gray-500 font-semibold">Weekly Adherence</p>
            <p className="text-2xl font-bold text-[#193B62] mt-2">85%</p>
            <div className="w-full bg-[#EAF1F8] h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#087F73] h-2 w-[85%] rounded-full" />
            </div>
            <p className="text-[10px] text-emerald-600 mt-2 font-semibold">
              6 of 8 target sessions • On Track
            </p>
          </div>

          <div className="bg-white border border-[#D9E3ED] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-gray-500 font-semibold">Form Accuracy</p>
            <p className="text-2xl font-bold text-[#193B62] mt-2">94.2%</p>
            <p className="text-[10px] text-emerald-600 mt-2 font-semibold">
              ▲ 3.1% vs last week
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              Excellent joint alignment
            </p>
          </div>

          <div className="bg-white border border-[#D9E3ED] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-gray-500 font-semibold">Completed Sessions</p>
            <p className="text-2xl font-bold text-[#193B62] mt-2">14</p>
            <p className="text-[10px] text-[#087F73] mt-2 font-semibold">
              🔥 4-day recovery streak
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              Consistent compliance
            </p>
          </div>
        </div>
      </section>

      {/* ASSIGNED EXERCISES SUMMARY */}
      <section className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-sm text-[#193B62]">
            Assigned Exercises
          </h3>
          <button
            onClick={() => onNavigate('exercises')}
            className="text-xs text-[#087F73] font-semibold cursor-pointer hover:underline"
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
            className="flex flex-wrap justify-between items-center gap-2 border border-[#D9E3ED] rounded-xl p-3 bg-[#F4F7FB]"
          >
            <div>
              <p className="text-sm font-semibold text-[#193B62]">{name}</p>
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
    </PatientLayout>
  );
}