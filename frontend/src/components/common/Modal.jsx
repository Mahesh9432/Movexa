import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-[#D9E3ED] my-8 max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex justify-between items-center border-b border-[#D9E3ED] pb-3">
          <h2 className="font-bold text-base text-[#193B62]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg cursor-pointer">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}