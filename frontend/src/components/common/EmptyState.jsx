import React from 'react';

export default function EmptyState({ title, description }) {
  return (
    <div className="bg-white border border-[#D9E3ED] rounded-2xl p-8 text-center space-y-2">
      <p className="text-sm font-bold text-[#193B62]">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}