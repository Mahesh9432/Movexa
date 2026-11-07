import React, { useState } from 'react';

export default function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [role, setRole] = useState('patient'); // 'patient' or 'physio'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    // Patient specific fields
    date_of_birth: '',
    gender: '',
    injury: '',
    affected_area: '',
    treatment_start_date: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    // Physio specific fields
    qualification: '',
    specialization: '',
    years_experience: '',
    clinic_name: '',
    clinic_address: '',
    professional_bio: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    alert(`Successfully registered as a ${role === 'patient' ? 'Patient' : 'Physiotherapist'}! Registration number auto-assigned. Please sign in.`);
    if (onRegisterSuccess) onRegisterSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7FB]">
      <div className="max-w-2xl w-full bg-white border border-[#D9E3ED] rounded-2xl p-8 md:p-10 shadow-sm">
        
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-wider text-[#087F73] font-bold">MOVEẊA</span>
          <h1 className="text-2xl font-bold text-[#193B62] mt-1">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Register to access your portal</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 bg-[#F4F7FB] p-1.5 rounded-xl border border-[#D9E3ED] mb-8">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === 'patient' ? 'bg-white text-[#193B62] shadow-sm' : 'text-gray-500 hover:text-[#193B62]'
            }`}
          >
            🧑‍⚕️ Patient Portal
          </button>
          <button
            type="button"
            onClick={() => setRole('physio')}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === 'physio' ? 'bg-white text-[#193B62] shadow-sm' : 'text-gray-500 hover:text-[#193B62]'
            }`}
          >
            🩺 Physiotherapist Portal
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          
          {/* COMMON AUTH FIELDS */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={role === 'patient' ? 'Sarah Jenkins' : 'Dr. Marcus Vance'} 
                  className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#087F73] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@domain.com" 
                  className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#087F73] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Password</label>
              <input 
                type="password" 
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••" 
                className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#087F73] text-sm"
              />
            </div>
          </div>

          {/* DYNAMIC FIELDS BASED ON ROLE */}
          {role === 'patient' ? (
            <div className="space-y-5 border-t border-[#D9E3ED] pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#087F73]">Patient Clinical Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Date of Birth</label>
                  <input 
                    type="date" 
                    name="date_of_birth"
                    required
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Gender</label>
                  <select 
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-3.5 py-2.5 rounded-xl text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Treatment Start Date</label>
                  <input 
                    type="date" 
                    name="treatment_start_date"
                    required
                    value={formData.treatment_start_date}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Injury / Condition</label>
                  <input 
                    type="text" 
                    name="injury"
                    required
                    value={formData.injury}
                    onChange={handleChange}
                    placeholder="e.g. Post-Op ACL Reconstruction" 
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Affected Area</label>
                  <input 
                    type="text" 
                    name="affected_area"
                    required
                    value={formData.affected_area}
                    onChange={handleChange}
                    placeholder="e.g. Left Knee Joint" 
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Emergency Contact Name</label>
                  <input 
                    type="text" 
                    name="emergency_contact_name"
                    required
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="David Jenkins" 
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Relationship</label>
                  <input 
                    type="text" 
                    name="emergency_contact_relationship"
                    required
                    value={formData.emergency_contact_relationship}
                    onChange={handleChange}
                    placeholder="Spouse" 
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Emergency Phone</label>
                  <input 
                    type="tel" 
                    name="emergency_contact_phone"
                    required
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 987-6543" 
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 border-t border-[#D9E3ED] pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#087F73]">Physiotherapist Professional Credentials</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Qualification</label>
                  <input 
                    type="text" 
                    name="qualification"
                    required
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="Doctor of Physical Therapy (DPT)" 
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Specialization</label>
                  <input 
                    type="text" 
                    name="specialization"
                    required
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Orthopedic Rehabilitation" 
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Years of Experience</label>
                  <input 
                    type="text" 
                    name="years_experience"
                    required
                    value={formData.years_experience}
                    onChange={handleChange}
                    placeholder="12 Years" 
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Clinic Name</label>
                  <input 
                    type="text" 
                    name="clinic_name"
                    required
                    value={formData.clinic_name}
                    onChange={handleChange}
                    placeholder="Apex Orthopaedics Clinic" 
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Clinic Address</label>
                <input 
                  type="text" 
                  name="clinic_address"
                  required
                  value={formData.clinic_address}
                  onChange={handleChange}
                  placeholder="123 Healthcare Ave, Suite 400" 
                  className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#193B62] mb-1.5">Professional Bio</label>
                <textarea 
                  name="professional_bio"
                  rows="2"
                  value={formData.professional_bio}
                  onChange={handleChange}
                  placeholder="Specialized in post-operative recovery..." 
                  className="w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl text-sm"
                />
              </div>

              <p className="text-xs text-gray-400 italic bg-[#F4F7FB] p-3 rounded-xl border border-[#D9E3ED]">
                ℹ️ Note: Medical registration number will be auto-generated by the system upon verification.
              </p>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-[#087F73] hover:bg-[#06655c] text-white font-medium py-3 rounded-xl transition-all shadow-sm cursor-pointer mt-6 text-sm"
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