import React, { useState } from 'react';

export default function Login({ onSwitchToRegister, onLoginSuccess }) {
  const [role, setRole] = useState('patient'); // 'patient' or 'physio'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (onLoginSuccess) onLoginSuccess(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F7FB]">
      <div className="max-w-md w-full bg-white border border-[#D9E3ED] rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-wider text-[#087F73] font-bold">Movexa</span>
          <h1 className="text-2xl font-bold text-[#193B62] mt-1">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#193B62] mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'patient' ? 'patient@example.com' : 'dr.vance@apexortho.com'} 
              className="w-full bg-white border border-[#D9E3ED] text-[#193B62] px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087F73]/30 focus:border-[#087F73] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#193B62] mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-white border border-[#D9E3ED] text-[#193B62] px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087F73]/30 focus:border-[#087F73] text-sm"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#087F73] hover:bg-[#06655c] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm cursor-pointer mt-2"
          >
            Sign In as {role === 'patient' ? 'Patient' : 'Physiotherapist'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-500">
          Don't have an account?{' '}
          <button 
            onClick={onSwitchToRegister}
            className="text-[#087F73] font-semibold hover:underline cursor-pointer"
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}