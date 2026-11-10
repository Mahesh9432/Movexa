import React from 'react';
import PhysioLayout from '../../layouts/PhysioLayout';

export default function PhysioDashboard({ onLogout, onNavigate }) {
  const stats = [
    { label: 'Assigned Patients', value: '12', icon: '👥' },
    { label: 'Active Patients', value: '08', icon: '🩺' },
    { label: 'Sessions Today', value: '04', icon: '📅' },
    { label: 'Pending Reviews', value: '03', icon: '📋' },
  ];

  const patients = [
    { name: 'Sarah Michelle Jenkins', injury: 'ACL Reconstruction', progress: '72%', status: 'On Track' },
    { name: 'James Anderson', injury: 'Shoulder Injury', progress: '45%', status: 'In Progress' },
    { name: 'Emily Rose', injury: 'Lower Back Pain', progress: '88%', status: 'On Track' },
  ];

  return (
    <PhysioLayout currentView="physio-dashboard" onLogout={onLogout} onNavigate={onNavigate}>
      <div>
        <h1 className="text-2xl font-bold text-[#193B62]">
          Welcome back, Dr. Vance!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's an overview of your patients and rehabilitation activities.
        </p>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-semibold">{stat.label}</span>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-[#193B62] mt-3">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ASSIGNED PATIENTS */}
      <section className="bg-white border border-[#D9E3ED] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#D9E3ED] flex justify-between items-center">
          <div>
            <h2 className="font-bold text-sm text-[#193B62]">Assigned Patients</h2>
            <p className="text-xs text-gray-500 mt-1">Overview of your current patients</p>
          </div>
          <button
            onClick={() => onNavigate('physio-patients')}
            className="text-xs text-[#087F73] font-semibold hover:underline cursor-pointer"
          >
            View All Patients →
          </button>
        </div>

        <div className="divide-y divide-[#D9E3ED]">
          {patients.map((patient) => (
            <div key={patient.name} className="p-4 md:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#193B62]">{patient.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{patient.injury}</p>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-24">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-semibold text-[#193B62]">{patient.progress}</span>
                  </div>
                  <div className="h-1.5 bg-[#EAF1F8] rounded-full overflow-hidden">
                    <div className="h-full bg-[#087F73] rounded-full" style={{ width: patient.progress }} />
                  </div>
                </div>

                <span className="text-[10px] font-semibold text-[#16865D] bg-green-50 px-2.5 py-1 rounded-full">
                  {patient.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TODAY'S SESSIONS */}
      <section className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs">
        <h2 className="font-bold text-sm text-[#193B62]">Today's Sessions</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">Your upcoming rehabilitation appointments</p>

        <div className="space-y-3">
          {[
            { time: '10:00 AM', name: 'Sarah Michelle Jenkins', type: 'ACL Rehabilitation' },
            { time: '11:30 AM', name: 'James Anderson', type: 'Shoulder Therapy' },
            { time: '02:00 PM', name: 'Emily Rose', type: 'Back Pain Therapy' },
          ].map((session) => (
            <div key={session.time} className="flex items-center gap-4 bg-[#F4F7FB] rounded-xl p-3 border border-[#D9E3ED]">
              <span className="text-xs font-bold text-[#087F73] min-w-16">{session.time}</span>
              <div>
                <p className="text-xs font-semibold text-[#193B62]">{session.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{session.type}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PhysioLayout>
  );
}