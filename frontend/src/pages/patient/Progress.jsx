import React, { useState } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

export default function PatientProgress({ onLogout, onNavigate }) {
  const [timeframe, setTimeframe] = useState('This Week');

  // Dynamic telemetry data mapped to the selected timeframe filter
  const telemetryData = {
    'This Week': {
      adherence: '88%',
      adherenceTrend: '+4.2%',
      adherenceSubtext: '14 of 16 sessions completed',
      avgAccuracy: '95.4%',
      accuracyTrend: '+1.8%',
      accuracySubtext: 'High joint stability score',
      maxExtension: '0°',
      extensionSubtext: 'Full active lock achieved',
      streak: '4 Days',
      streakSubtext: 'Consistent daily compliance',
      graphTitle: 'Weekly Range of Motion (ROM) Trend',
      graphDescription: 'Your knee extension angle recovery has shown steady improvements week over week, maintaining stable alignment during band resistance sequences.',
      targetBadge: 'Target: 0° - 90°',
    },
    'This Month': {
      adherence: '84%',
      adherenceTrend: '+2.1%',
      adherenceSubtext: '48 of 57 sessions completed',
      avgAccuracy: '93.1%',
      accuracyTrend: '+0.5%',
      accuracySubtext: 'Consistent form stability across phases',
      maxExtension: '1°',
      extensionSubtext: 'Near-complete extension unlocked',
      streak: '12 Days',
      streakSubtext: 'Outstanding monthly consistency',
      graphTitle: 'Monthly Range of Motion (ROM) Progress',
      graphDescription: 'Aggregated monthly telemetry indicates a steady downward trend in extension deficits, dropping from 6° down to 1° over 4 weeks.',
      targetBadge: 'Target: 0° - 90°',
    },
    'All Time': {
      adherence: '91%',
      adherenceTrend: '+6.5%',
      adherenceSubtext: '128 of 140 total sessions completed',
      avgAccuracy: '94.8%',
      accuracyTrend: '+3.2%',
      accuracySubtext: 'Exceptional long-term rehabilitation compliance',
      maxExtension: '0°',
      extensionSubtext: 'Post-op baseline fully recovered',
      streak: '21 Days',
      streakSubtext: 'Longest unbroken recovery streak',
      graphTitle: 'Cumulative Recovery Timeline (All-Time)',
      graphDescription: 'Complete post-operative tracking history from initial Phase 1 mobilization through advanced strength protocols, confirming full joint stability.',
      targetBadge: 'Target: 0° - 90°',
    }
  };

  const currentStats = telemetryData[timeframe];

  return (
    <PatientLayout currentView="progress" onLogout={onLogout} onNavigate={onNavigate}>
      <PageHeader
        category="Patient Telemetry & Analytics"
        title="Recovery Progress"
        subtitle="Track your clinical adherence, joint range of motion, and historical session performance."
        action={
          <div className="flex items-center gap-1.5 bg-white border border-[#D9E3ED] p-1 rounded-xl shadow-xs">
            {['This Week', 'This Month', 'All Time'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#087F73] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#193B62]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        }
      />

      {/* METRIC CARDS DYNAMICALLY UPDATED BY TIMEFRAME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="OVERALL ADHERENCE" 
          value={currentStats.adherence} 
          trend={currentStats.adherenceTrend} 
          icon="📊" 
          subtext={currentStats.adherenceSubtext} 
        />
        <StatCard 
          label="AVG FORM ACCURACY" 
          value={currentStats.avgAccuracy} 
          trend={currentStats.accuracyTrend} 
          icon="🎯" 
          subtext={currentStats.accuracySubtext} 
        />
        <StatCard 
          label="MAX KNEE EXTENSION" 
          value={currentStats.maxExtension} 
          icon="🩺" 
          subtext={currentStats.extensionSubtext} 
        />
        <StatCard 
          label="RECOVERY STREAK" 
          value={currentStats.streak} 
          icon="🔥" 
          subtext={currentStats.streakSubtext} 
        />
      </div>

      {/* RANGE OF MOTION & KINEMATIC CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#D9E3ED] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#D9E3ED] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#193B62]">{currentStats.graphTitle}</h2>
              <p className="text-xs text-gray-500">Knee extension angle recovery over time ({timeframe.toLowerCase()})</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#087F73] bg-[#EAF1F8] px-2.5 py-1 rounded-md">
              {currentStats.targetBadge}
            </span>
          </div>

          <div className="h-64 bg-[#F4F7FB] border border-[#D9E3ED] rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#087F73]/10 text-[#087F73] flex items-center justify-center text-xl font-bold">
              📈
            </div>
            <div>
              <p className="text-xs font-bold text-[#193B62]">Kinematic Angle Progression ({timeframe})</p>
              <p className="text-[11px] text-gray-500 max-w-md mt-1 leading-relaxed">
                {currentStats.graphDescription}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-[#087F73]"></span> Live Sensor Feed Active
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-2"></span> Clinical Sync OK
            </div>
          </div>
        </div>

        {/* MILESTONES & ACHIEVEMENTS */}
        <div className="bg-white border border-[#D9E3ED] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#193B62] border-b border-[#D9E3ED] pb-3">
            🏆 Milestone Checklist
          </h2>

          <div className="space-y-3 text-xs">
            {[
              { title: 'Initial Post-Op Mobility', status: 'Completed', date: 'Oct 11, 2026' },
              { title: 'Active ROM & Quad Activation', status: 'Completed', date: 'Oct 24, 2026' },
              { title: 'Advanced Strength & Resistance', status: 'In Progress', date: 'Active Phase' },
              { title: 'Unassisted Normal Gait', status: 'Upcoming', date: 'Est. Nov 20, 2026' },
            ].map((milestone, idx) => (
              <div key={idx} className="bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#193B62]">{milestone.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    milestone.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                    milestone.status === 'In Progress' ? 'bg-[#EAF1F8] text-[#087F73]' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {milestone.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">{milestone.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}