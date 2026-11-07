
import React from 'react';

export default function PhysioDashboard({ onLogout, onNavigate }) {
  const stats = [
    { label: 'Assigned Patients', value: '12', icon: '👥' },
    { label: 'Active Patients', value: '08', icon: '🩺' },
    { label: 'Sessions Today', value: '04', icon: '📅' },
    { label: 'Pending Reviews', value: '03', icon: '📋' },
  ];

  const patients = [
    {
      name: 'Sarah Michelle Jenkins',
      injury: 'ACL Reconstruction',
      progress: '72%',
      status: 'On Track',
    },
    {
      name: 'James Anderson',
      injury: 'Shoulder Injury',
      progress: '45%',
      status: 'In Progress',
    },
    {
      name: 'Emily Rose',
      injury: 'Lower Back Pain',
      progress: '88%',
      status: 'On Track',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#D9E3ED] p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">
              MOVEXA
            </div>
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">
              Physio Portal
            </span>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => onNavigate?.('physio-dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#EAF1F8] text-[#087F73]"
            >
              <span>📊</span> Dashboard
            </button>

            <button
              onClick={() => onNavigate?.('physio-profile')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              <span>👤</span> Profile & Credentials
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-[#D9E3ED]">
          <button
            onClick={onLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2 rounded-lg"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-[#D9E3ED] px-4 md:px-8 py-3.5 flex justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">
            Apex Orthopaedics •{' '}
            <span className="text-[#193B62] font-bold">
              Physiotherapist Dashboard
            </span>
          </div>

          <button
            onClick={() => onNavigate?.('physio-profile')}
            className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4"
          >
            <span className="w-8 h-8 rounded-full bg-[#087F73] text-white flex items-center justify-center text-xs font-bold">
              MV
            </span>
            <span className="text-xs font-bold hidden sm:block">
              Dr. Marcus Vance
            </span>
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-7">

          {/* Welcome */}
          <div>
            <h1 className="text-2xl font-bold text-[#193B62]">
              Welcome back, Dr. Vance!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here's an overview of your patients and rehabilitation activities.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-[#D9E3ED] rounded-xl p-4 md:p-5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">
                    {stat.label}
                  </span>
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <p className="text-2xl font-bold text-[#193B62] mt-3">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Patient List */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#D9E3ED] flex justify-between items-center">
              <div>
                <h2 className="font-bold text-sm text-[#193B62]">
                  Assigned Patients
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Overview of your current patients
                </p>
              </div>
              <span className="text-xs text-[#087F73] font-semibold">
                12 Patients
              </span>
            </div>

            <div className="divide-y divide-[#D9E3ED]">
              {patients.map((patient) => (
                <div
                  key={patient.name}
                  className="p-4 md:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-[#193B62]">
                      {patient.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {patient.injury}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-semibold text-[#193B62]">
                          {patient.progress}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#EAF1F8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#087F73] rounded-full"
                          style={{ width: patient.progress }}
                        />
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

          {/* Upcoming Sessions */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5">
            <h2 className="font-bold text-sm text-[#193B62]">
              Today's Sessions
            </h2>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Your upcoming rehabilitation appointments
            </p>

            <div className="space-y-3">
              {[
                { time: '10:00 AM', name: 'Sarah Michelle Jenkins', type: 'ACL Rehabilitation' },
                { time: '11:30 AM', name: 'James Anderson', type: 'Shoulder Therapy' },
                { time: '02:00 PM', name: 'Emily Rose', type: 'Back Pain Therapy' },
              ].map((session) => (
                <div
                  key={session.time}
                  className="flex items-center gap-4 bg-[#F4F7FB] rounded-lg p-3"
                >
                  <span className="text-xs font-bold text-[#087F73] min-w-16">
                    {session.time}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#193B62]">
                      {session.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {session.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
