import React, { useState } from 'react';

const navItems = [
  { name: 'Dashboard', icon: '📊', view: 'dashboard' },
  { name: 'My Exercises', icon: '📋', view: 'exercises' },
  { name: 'Exercise Library', icon: '📚', view: 'library' },
  { name: 'Progress', icon: '📈', view: 'progress' },
  { name: 'Appointments', icon: '📅', view: 'appointments' },
  { name: 'Profile', icon: '👤', view: 'profile' },
];

export default function PatientProfile({ onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: 'Sarah Michelle Jenkins',
    dob: 'March 14, 1991',
    gender: 'Female',
    email: 'sarah.jenkins@example.com',
    phone: '+1 (555) 234-8901',
    condition: 'Post-Operative ACL Reconstruction',
    affectedBodypart: 'Left Knee Joint',
    treatmentStart: 'September 26, 2026',
    emergencyName: 'David Jenkins',
    emergencyRelation: 'Spouse',
    emergencyPhone: '+1 (555) 987-6543',
  });

  const handleNavClick = (view) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
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
            item.view === 'profile'
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
              Telemetry Rehab
            </span>
          </div>

          {renderNavigation()}
        </div>

        <div className="pt-4 border-t border-[#D9E3ED] space-y-3">
          <div className="bg-[#F4F7FB] p-3 rounded-lg border border-[#D9E3ED]">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              Clinical Portal
            </p>
            <p className="text-xs font-semibold">
              Apex Orthopaedics Clinic
            </p>
          </div>

          <button
            onClick={onLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2 rounded-lg"
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
            onClick={() => onNavigate('dashboard')}
            className="w-8 h-8 rounded-full bg-[#193B62] text-white text-xs font-bold"
          >
            S
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
                className="w-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP HEADER */}
        <header className="hidden md:flex bg-white border-b border-[#D9E3ED] px-8 py-3.5 justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">
            Apex Orthopaedics • <span className="text-[#193B62] font-bold">Patient Portal</span>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4"
          >
            <span className="w-8 h-8 rounded-full bg-[#193B62] text-white flex items-center justify-center text-xs font-bold">
              S
            </span>
            <span className="text-xs font-bold">Sarah Jenkins</span>
          </button>
        </header>

        {/* PROFILE CONTENT */}
        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

          {/* PAGE TITLE */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
              Patient Records & Telemetry
            </p>
            <h1 className="text-3xl font-bold mt-1 text-[#20252B]">
              My Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your personal and medical information.
            </p>
          </div>

          {/* PROFILE HERO */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-5">

            <div className="flex items-center gap-5 w-full min-w-0">

              {/* AVATAR */}
              <div className="w-20 h-20 shrink-0 rounded-full bg-[#EAF1F0] flex items-center justify-center">
                <svg
                  viewBox="0 0 64 64"
                  className="w-14 h-14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="32" cy="21" r="11" fill="#4A967D" />
                  <path
                    d="M12 53C12 41.954 20.954 33 32 33C43.046 33 52 41.954 52 53V56H12V53Z"
                    fill="#4A967D"
                  />
                </svg>
              </div>

              {/* PATIENT DETAILS */}
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-[#20252B] break-words">
                  {profileData.fullName}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Patient ID: #PT-884291
                </p>

                <div className="inline-flex items-center gap-2 mt-2 bg-[#E4F5EA] text-[#16865D] px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#16865D]" />
                  <span className="text-[10px] font-bold">
                    Active Patient
                  </span>
                </div>
              </div>
            </div>

            {/* EDIT BUTTON */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-[#087F73] hover:bg-[#06655c] text-white px-5 py-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
            >
              {isEditing ? (
                <>
                  <span>✓</span>
                  Save Profile
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </svg>
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
              <Field label="Full Name" name="fullName" value={profileData.fullName} />
              <Field label="Date of Birth" name="dob" value={profileData.dob} />

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Gender
                </label>

                {isEditing ? (
                  <select
                    name="gender"
                    value={profileData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-lg text-xs"
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                ) : (
                  <p className="text-sm font-semibold">{profileData.gender}</p>
                )}
              </div>

              <Field label="Email Address" name="email" value={profileData.email} />
              <Field label="Phone Number" name="phone" value={profileData.phone} />
            </div>
          </section>

          {/* MEDICAL INFORMATION */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              🩺 Medical Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Recovery Condition" name="condition" value={profileData.condition} editable={false} />
              <Field label="Affected Body Part" name="affectedBodypart" value={profileData.affectedBodypart} editable={false} />
              <Field label="Treatment Start Date" name="treatmentStart" value={profileData.treatmentStart} editable={false} />
            </div>
          </section>

          {/* ASSIGNED PHYSIOTHERAPIST */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#D9E3ED] pb-3">
              <h3 className="font-bold text-sm">
                👨‍⚕️ Assigned Physiotherapist
              </h3>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full">
                Active • Primary Care
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="font-bold text-sm">Dr. Marcus Vance, PT, DPT</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Orthopedic Rehabilitation & Knee Arthroplasty
                </p>
                <p className="text-xs text-[#087F73] mt-1">
                  Available Monday – Friday
                </p>
              </div>

              <button
                onClick={() => alert('Messaging will be available soon.')}
                className="bg-[#087F73] text-white px-4 py-2.5 rounded-lg text-xs font-semibold w-full sm:w-auto"
              >
                💬 Contact Physiotherapist
              </button>
            </div>
          </section>

          {/* EMERGENCY CONTACT */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              🚨 Emergency Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Contact Name" name="emergencyName" value={profileData.emergencyName} />
              <Field label="Relationship" name="emergencyRelation" value={profileData.emergencyRelation} />
              <Field label="Phone Number" name="emergencyPhone" value={profileData.emergencyPhone} />
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
                className="border border-[#D9E3ED] px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Change Password
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold">Notification Preferences</h4>
              <p className="text-[11px] text-gray-400 mt-1">
                Manage your reminders and updates
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <label className="flex items-center justify-between bg-[#F4F7FB] p-3 rounded-lg border border-[#D9E3ED] text-xs">
                  Email Notifications
                  <input type="checkbox" defaultChecked className="accent-[#087F73]" />
                </label>

                <label className="flex items-center justify-between bg-[#F4F7FB] p-3 rounded-lg border border-[#D9E3ED] text-xs">
                  SMS Alerts
                  <input type="checkbox" defaultChecked className="accent-[#087F73]" />
                </label>
              </div>
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
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-semibold"
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
