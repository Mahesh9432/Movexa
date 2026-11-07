import React, { useState } from 'react';

const navItems = [
  { name: 'Dashboard', icon: '📊', view: 'physio-dashboard' },
  { name: 'Profile', icon: '👤', view: 'physio-profile' },
];

export default function PhysioProfile({ onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Mapped strictly to leader's database schema for physiotherapists
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

  const handleNavClick = (view) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleInputChange = (e) => {
    setPhysioData({
      ...physioData,
      [e.target.name]: e.target.value,
    });
  };

  const renderNavigation = () => (
    <nav className="space-y-1.5">
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => handleNavClick(item.view)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            item.view === 'physio-profile'
              ? 'bg-[#EAF1F8] text-[#087F73]'
              : 'text-gray-600 hover:bg-gray-50 hover:text-[#193B62]'
          }`}
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.name}</span>
        </button>
      ))}
    </nav>
  );

  const Field = ({ label, name, value, editable = true }) => (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </label>

      {isEditing && editable ? (
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-lg text-xs font-semibold text-[#193B62] focus:outline-none focus:border-[#087F73]"
        />
      ) : (
        <p className="text-sm font-semibold text-[#193B62] break-words">
          {value}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#D9E3ED] p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">
              MOVEẊA
            </div>
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">
              Physio Portal
            </span>
          </div>

          {renderNavigation()}
        </div>

        <div className="pt-4 border-t border-[#D9E3ED] space-y-3">
          <div className="bg-[#F4F7FB] p-3 rounded-lg border border-[#D9E3ED]">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              Clinical Workspace
            </p>
            <p className="text-xs font-semibold">
              Apex Orthopaedics Clinic
            </p>
          </div>

          <button
            onClick={onLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2 rounded-lg cursor-pointer"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 min-w-0">

        {/* MOBILE HEADER */}
        <header className="md:hidden bg-white border-b border-[#D9E3ED] px-4 py-3 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-xl"
              aria-label="Open navigation"
            >
              ☰
            </button>

            <span className="bg-[#087F73] text-white font-bold text-xs px-2 py-1 rounded">
              MOVEẊA
            </span>
          </div>

          <button
            onClick={() => onNavigate('physio-dashboard')}
            className="w-8 h-8 rounded-full bg-[#087F73] text-white text-xs font-bold flex items-center justify-center"
          >
            MV
          </button>
        </header>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative w-72 max-w-[85vw] bg-white h-full p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <span className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">
                    MOVEẊA
                  </span>

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl"
                    aria-label="Close navigation"
                  >
                    ✕
                  </button>
                </div>

                {renderNavigation()}
              </div>

              <button
                onClick={onLogout}
                className="w-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg cursor-pointer"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP HEADER */}
        <header className="hidden md:flex bg-white border-b border-[#D9E3ED] px-8 py-3.5 justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">
            Apex Orthopaedics • <span className="text-[#193B62] font-bold">Physiotherapist Portal</span>
          </div>

          <button
            onClick={() => onNavigate('physio-dashboard')}
            className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-full bg-[#087F73] text-white flex items-center justify-center text-xs font-bold">
              MV
            </span>
            <span className="text-xs font-bold">{physioData.fullName}</span>
          </button>
        </header>

        {/* PROFILE CONTENT */}
        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

          {/* PAGE TITLE */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
              Professional Credentials & Practice
            </p>
            <h1 className="text-3xl font-bold mt-1 text-[#20252B]">
              Physiotherapist Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your credentials, clinical practice, and verification records.
            </p>
          </div>

          {/* PROFILE HERO */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-5">

            <div className="flex items-center gap-5 w-full min-w-0">

              {/* AVATAR */}
              <div className="w-20 h-20 shrink-0 rounded-full bg-[#EAF1F0] flex items-center justify-center font-bold text-2xl text-[#087F73]">
                🩺
              </div>

              {/* PHYSIO DETAILS */}
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-[#20252B] break-words">
                  {physioData.fullName}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Registration No: #{physioData.registration_number}
                </p>

                <div className="inline-flex items-center gap-2 mt-2 bg-[#E4F5EA] text-[#16865D] px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#16865D]" />
                  <span className="text-[10px] font-bold">
                    {physioData.verification_status} Practitioner
                  </span>
                </div>
              </div>
            </div>

            {/* EDIT BUTTON */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-[#087F73] hover:bg-[#06655c] text-white px-5 py-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 cursor-pointer"
            >
              {isEditing ? (
                <>
                  <span>✓</span>
                  Save Profile
                </>
              ) : (
                <>
                  <span>✏️</span>
                  Edit Profile
                </>
              )}
            </button>
          </section>

          {/* PERSONAL INFORMATION */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              👤 Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Full Name" name="fullName" value={physioData.fullName} />
              <Field label="Email Address" name="email" value={physioData.email} />
              <Field label="Phone Number" name="phone" value={physioData.phone} />
            </div>
          </section>

          {/* PROFESSIONAL CREDENTIALS (Leader's Database Schema) */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              📋 Professional Credentials & Schema Fields
            </h3>

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

          {/* CLINIC INFORMATION */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              🏥 Clinic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Clinic Name" name="clinic_name" value={physioData.clinic_name} />
              <Field label="Clinic Address" name="clinic_address" value={physioData.clinic_address} />
            </div>
          </section>

          {/* ACCOUNT SETTINGS */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-5">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              ⚙️ Account Settings
            </h3>

            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h4 className="text-xs font-bold">Password</h4>
                <p className="text-[11px] text-gray-400 mt-1">
                  Manage your account password
                </p>
              </div>

              <button
                onClick={() => alert('Password reset will be connected soon.')}
                className="border border-[#D9E3ED] px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Change Password
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h4 className="text-xs font-bold">Session</h4>
                <p className="text-[11px] text-gray-400 mt-1">
                  Signed in from your current browser
                </p>
              </div>

              <button
                onClick={onLogout}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                🚪 Log Out
              </button>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}