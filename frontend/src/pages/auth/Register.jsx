import React, { useState } from 'react';

export default function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [role, setRole] = useState('patient'); // 'patient' or 'physio'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    gender: '',
    registrationNumber: '' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    alert(`Successfully registered as a ${role === 'patient' ? 'Patient' : 'Physiotherapist'}! Please sign in.`);
    if (onRegisterSuccess) onRegisterSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F7FB]">
      <div className="max-w-md w-full bg-white border border-[#D9E3ED] rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-wider text-[#087F73] font-bold">Movexa</span>
          <h1 className="text-2xl font-bold text-[#193B62] mt-1">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Register to access your portal</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-[#F4F7FB] p-1 rounded-xl border border-[#D9E3ED] mb-4">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === 'patient' ? 'bg-white text-[#193B62] shadow-sm' : 'text-gray-500 hover:text-[#193B62]'
            }`}
          >
            🧑‍⚕️ Patient
          </button>
          <button
            type="button"
            onClick={() => setRole('physio')}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === 'physio' ? 'bg-white text-[#193B62] shadow-sm' : 'text-gray-500 hover:text-[#193B62]'
            }`}
          >
            🩺 Physiotherapist
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#193B62] mb-1">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder={role === 'patient' ? 'John Doe' : 'Dr. Marcus Vance'} 
              className="w-full bg-white border border-[#D9E3ED] text-[#193B62] px-3.5 py-2 rounded-lg focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#193B62] mb-1">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="example@domain.com" 
              className="w-full bg-white border border-[#D9E3ED] text-[#193B62] px-3.5 py-2 rounded-lg focus:outline-none text-sm"
            />
          </div>

          {role === 'physio' && (
            <div>
              <label className="block text-xs font-medium text-[#193B62] mb-1">Medical Registration Number</label>
              <input 
                type="text" 
                name="registrationNumber"
                required
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="PT-99482-OR" 
                className="w-full bg-white border border-[#D9E3ED] text-[#193B62] px-3.5 py-2 rounded-lg focus:outline-none text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#193B62] mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••" 
              className="w-full bg-white border border-[#D9E3ED] text-[#193B62] px-3.5 py-2 rounded-lg focus:outline-none text-sm"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#087F73] hover:bg-[#06655c] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm cursor-pointer mt-4 text-sm"
          >
            Register as {role === 'patient' ? 'Patient' : 'Physiotherapist'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-500">
          Already have an account?{' '}
          <button 
            onClick={onSwitchToLogin}
            className="text-[#087F73] font-semibold hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}