import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-700',
    Completed: 'bg-emerald-50 text-emerald-700',
    'On Track': 'bg-emerald-50 text-emerald-700',
    'In Progress': 'bg-amber-50 text-amber-700',
    Pending: 'bg-amber-50 text-amber-700',
    Queued: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}