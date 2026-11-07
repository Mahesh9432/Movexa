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

  // Schema mapped to patient database requirements: date_of_birth, injury, affected_area, relevant_history[cite: 10]
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
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
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
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Patient Portal</span>
          </div>
          {renderNavigation()}
        </div>
        <div className="pt-4 border-t border-[#D9E3ED]">
          <button onClick={onLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg">🚪 Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="hidden md:flex bg-white border-b border-[#D9E3ED] px-8 py-3.5 justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">Apex Orthopaedics • <span className="text-[#193B62] font-bold">Patient Portal</span></div>
          <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4 cursor-pointer">
            <span className="w-8 h-8 rounded-full bg-[#193B62] text-white flex items-center justify-center text-xs font-bold">S</span>
            <span className="text-xs font-bold">Sarah Jenkins</span>
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mt-1 text-[#20252B]">My Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your personal and medical information.</p>
          </div>

          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 flex justify-between items-center gap-5">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#EAF1F0] flex items-center justify-center font-bold text-xl">👩‍⚕️</div>
              <div>
                <h2 className="text-xl font-bold">{profileData.fullName}</h2>
                <p className="text-xs text-gray-500 mt-1">Patient ID: #PT-884291</p>
              </div>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className="bg-[#087F73] text-white px-5 py-3 rounded-lg font-semibold text-xs cursor-pointer">
              {isEditing ? '✓ Save Profile' : '✏️ Edit Profile'}
            </button>
          </section>

          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">👤 Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label="Full Name" name="fullName" value={profileData.fullName} />
              <Field label="Date of Birth" name="dob" value={profileData.dob} />
              <Field label="Email Address" name="email" value={profileData.email} />
            </div>
          </section>

          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">🩺 Medical Information (Database Profile)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label="Recovery Condition / Injury" name="condition" value={profileData.condition} editable={false} />
              <Field label="Affected Area / Body Part" name="affectedBodypart" value={profileData.affectedBodypart} editable={false} />
              <Field label="Treatment Start Date" name="treatmentStart" value={profileData.treatmentStart} editable={false} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}