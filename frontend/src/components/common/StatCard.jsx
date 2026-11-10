import React from 'react';

export default function StatCard({ label, value, subtext, icon, trend }) {
  return (
    <div className="bg-white border border-[#D9E3ED] rounded-2xl p-5 shadow-xs space-y-2">
      <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
        <span>{label}</span>
        {icon && <span>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-[#193B62]">{value}</p>
        {trend && <span className="text-xs font-semibold text-emerald-600">{trend}</span>}
      </div>
      {subtext && <p className="text-[11px] text-gray-500">{subtext}</p>}
    </div>
  );
}