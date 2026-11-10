import React from 'react';

export default function FormField({ label, name, type = 'text', value, onChange, placeholder, required = false, options = [] }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-[#193B62] mb-1">{label}</label>
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3.5 py-2.5 rounded-xl font-semibold text-[#193B62] text-xs focus:outline-none focus:border-[#087F73]"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows="3"
          className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3.5 py-2.5 rounded-xl font-semibold text-[#193B62] text-xs focus:outline-none focus:border-[#087F73]"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3.5 py-2.5 rounded-xl font-semibold text-[#193B62] text-xs focus:outline-none focus:border-[#087F73]"
        />
      )}
    </div>
  );
}