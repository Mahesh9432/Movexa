import React, { useState } from 'react';

export default function PhysioProfile({ onLogout, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);

  // Mapped strictly to leader's database schema for physiotherapists
  const [physioData, setPhysioData] = useState({
    qualification: 'Doctor of Physical Therapy (DPT)',
    specialization: 'Orthopedic Rehabilitation & Knee Arthroplasty',
    registration_number: 'PT-99482-OR',
    years_experience: '12 Years',
    clinic_name: 'Apex Orthopaedics Clinic',
    clinic_address: '123 Healthcare Ave, Suite 400',
    professional_bio: 'Specialized in post-operative knee recovery and sports trauma rehabilitation.',
    verification_status: 'Verified',
    fullName: 'Dr. Marcus Vance, PT, DPT',
    email: 'marcus.vance@apexortho.com',
    phone: '+1 (555) 839-2019'
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
          className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-lg text-xs font-semibold text-[#193B62]"
        />
      ) : (
        <p className="text-sm font-semibold text-[#193B62] break-words">{value}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#D9E3ED] p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">MOVEẊA</div>
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Physio Portal</span>
          </div>

          <nav className="space-y-1.5">
            <button onClick={() => onNavigate && onNavigate('physio-dashboard')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <span>📊</span> Dashboard
            </button>
            <button onClick={() => onNavigate && onNavigate('physio-profile')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#EAF1F8] text-[#087F73]">
              <span>👤</span> Profile & Credentials
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-[#D9E3ED]">
          <button onClick={onLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2 rounded-lg">🚪 Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#D9E3ED] px-8 py-3.5 flex justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">Apex Orthopaedics • <span className="text-[#193B62] font-bold">Physiotherapist Portal</span></div>
          <button onClick={() => onNavigate && onNavigate('physio-dashboard')} className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4 cursor-pointer">
            <span className="w-8 h-8 rounded-full bg-[#087F73] text-white flex items-center justify-center text-xs font-bold">MV</span>
            <span className="text-xs font-bold">{physioData.fullName}</span>
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mt-1 text-[#20252B]">Physiotherapist Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your backend-aligned professional schema fields.</p>
          </div>

          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 flex justify-between items-center gap-5">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#EAF1F0] flex items-center justify-center font-bold text-xl">🩺</div>
              <div>
                <h2 className="text-xl font-bold">{physioData.fullName}</h2>
                <p className="text-xs text-gray-500 mt-1">Registration No: #{physioData.registration_number}</p>
              </div>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className="bg-[#087F73] text-white px-5 py-3 rounded-lg font-semibold text-xs cursor-pointer">
              {isEditing ? '✓ Save Changes' : '✏️ Edit Profile'}
            </button>
          </section>

          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">📋 Professional Schema Fields</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Qualification" name="qualification" value={physioData.qualification} />
              <Field label="Specialization" name="specialization" value={physioData.specialization} />
              <Field label="Registration Number" name="registration_number" value={physioData.registration_number} />
              <Field label="Years of Experience" name="years_experience" value={physioData.years_experience} />
              <Field label="Clinic Name" name="clinic_name" value={physioData.clinic_name} />
              <Field label="Clinic Address" name="clinic_address" value={physioData.clinic_address} />
              <Field label="Verification Status" name="verification_status" value={physioData.verification_status} editable={false} />
            </div>
            <div className="pt-2">
              <Field label="Professional Bio" name="professional_bio" value={physioData.professional_bio} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}