import React, { useState } from 'react';
import PhysioLayout from '../../layouts/PhysioLayout';

export default function PhysioProfile({ onLogout, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [physioData, setPhysioData] = useState({
    fullName: 'Dr. Marcus Vance, PT, DPT',
    email: 'marcus.vance@apexortho.com',
    phone: '+1 (555) 839-2019',
    qualification: 'Doctor of Physical Therapy (DPT)',
    specialization: 'Orthopedic Rehabilitation & Knee Arthroplasty',
    registration_number: 'PT-99482-OR',
    years_experience: '12 Years',
    clinic_name: 'Apex Orthopaedics Clinic',
    clinic_address: '123 Healthcare Ave, Suite 400',
    professional_bio: 'Specialized in post-operative knee recovery and sports trauma rehabilitation.',
    verification_status: 'Verified',
  });

  const handleInputChange = (e) => {
    setPhysioData({ ...physioData, [e.target.name]: e.target.value });
  };

  const Field = ({ label, name, value, editable = true }) => (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
      {isEditing && editable ? (
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-lg text-xs font-semibold text-[#193B62] focus:outline-none focus:border-[#087F73]"
        />
      ) : (
        <p className="text-sm font-semibold text-[#193B62] break-words">{value}</p>
      )}
    </div>
  );

  return (
    <PhysioLayout currentView="physio-profile" onLogout={onLogout} onNavigate={onNavigate}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">Professional Credentials & Practice</p>
        <h1 className="text-3xl font-bold mt-1 text-[#20252B]">Physiotherapist Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your credentials, clinical practice, and verification records.</p>
      </div>

      {/* PROFILE HERO */}
      <section className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-5 shadow-xs">
        <div className="flex items-center gap-5 w-full min-w-0">
          <div className="w-20 h-20 shrink-0 rounded-full bg-[#EAF1F0] flex items-center justify-center font-bold text-2xl text-[#087F73]">
            🩺
          </div>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-[#20252B] break-words">{physioData.fullName}</h2>
            <p className="text-xs text-gray-500 mt-1">Registration No: #{physioData.registration_number}</p>
            <div className="inline-flex items-center gap-2 mt-2 bg-[#E4F5EA] text-[#16865D] px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#16865D]" />
              <span className="text-[10px] font-bold">{physioData.verification_status} Practitioner</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-[#087F73] hover:bg-[#06655c] text-white px-5 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 cursor-pointer shadow-xs"
        >
          {isEditing ? <><span>✓</span> Save Profile</> : <><span>✏️</span> Edit Profile</>}
        </button>
      </section>

      {/* PERSONAL INFO */}
      <section className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3 text-[#193B62]">👤 Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Full Name" name="fullName" value={physioData.fullName} />
          <Field label="Email Address" name="email" value={physioData.email} />
          <Field label="Phone Number" name="phone" value={physioData.phone} />
        </div>
      </section>

      {/* PROFESSIONAL CREDENTIALS */}
      <section className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3 text-[#193B62]">📋 Professional Credentials</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="Qualification" name="qualification" value={physioData.qualification} />
          <Field label="Specialization" name="specialization" value={physioData.specialization} />
          <Field label="Registration Number" name="registration_number" value={physioData.registration_number} />
          <Field label="Years of Experience" name="years_experience" value={physioData.years_experience} />
          <Field label="Verification Status" name="verification_status" value={physioData.verification_status} editable={false} />
        </div>
        <div className="pt-2">
          <Field label="Professional Bio" name="professional_bio" value={physioData.professional_bio} />
        </div>
      </section>

      {/* CLINIC INFO */}
      <section className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3 text-[#193B62]">🏥 Clinic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Clinic Name" name="clinic_name" value={physioData.clinic_name} />
          <Field label="Clinic Address" name="clinic_address" value={physioData.clinic_address} />
        </div>
      </section>
    </PhysioLayout>
  );
}