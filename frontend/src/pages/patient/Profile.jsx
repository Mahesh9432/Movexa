import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  LayoutDashboard,
  Menu,
  Pencil,
  Settings,
  Siren,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { getPatientProfile, updatePatientProfile } from "../../api/profile";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { name: "My Exercises", icon: ClipboardList, view: "exercises" },
  { name: "Exercise Library", icon: BookOpen, view: "library" },
  { name: "Progress", icon: Activity, view: "progress" },
  { name: "Appointments", icon: CalendarDays, view: "appointments" },
  { name: "Profile", icon: UserRound, view: "profile" },
];

const emptyProfile = {
  full_name: "",
  email: "",
  phone_number: "",
  date_of_birth: "",
  gender: "",
  injury: "",
  affected_area: "",
  treatment_start_date: "",
  emergency_contact_name: "",
  emergency_contact_relationship: "",
  emergency_contact_phone: "",
};

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function mapProfileResponse(response) {
  const user = response?.user ?? {};
  const profile = response?.profile ?? {};

  return {
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    phone_number: user.phone_number ?? "",
    date_of_birth: toDateInput(profile.date_of_birth),
    gender: profile.gender ?? "",
    injury: profile.injury ?? "",
    affected_area: profile.affected_area ?? "",
    treatment_start_date: toDateInput(profile.treatment_start_date),
    emergency_contact_name: profile.emergency_contact_name ?? "",
    emergency_contact_relationship:
      profile.emergency_contact_relationship ?? "",
    emergency_contact_phone: profile.emergency_contact_phone ?? "",
  };
}

function displayValue(value) {
  return value?.trim() ? value : "Not provided";
}

function Field({
  label,
  name,
  value,
  type = "text",
  editable = true,
  isEditing,
  onChange,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"
      >
        {label}
      </label>

      {isEditing && editable ? (
        <input
          id={name}
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-lg text-xs font-semibold text-[#193B62] focus:outline-none focus:border-[#087F73]"
        />
      ) : (
        <p className="text-sm font-semibold text-[#193B62] break-words">
          {type === "date" && value
            ? formatDate(value)
            : displayValue(value)}
        </p>
      )}
    </div>
  );
}

export default function PatientProfile({ onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState(emptyProfile);
  const [originalData, setOriginalData] = useState(emptyProfile);
  const [assignedPhysiotherapist, setAssignedPhysiotherapist] = useState(null);
  const [patientId, setPatientId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await getPatientProfile();

        if (!active) return;

        const mappedProfile = mapProfileResponse(response);

        setProfileData(mappedProfile);
        setOriginalData(mappedProfile);
        setAssignedPhysiotherapist(
          response?.assigned_physiotherapist ?? null
        );
        setPatientId(response?.profile?.id ?? "");
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleNavClick = (view) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setProfileData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!profileData.full_name.trim()) {
    setError("Full name is required.");
    return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      full_name: profileData.full_name.trim(),
      phone_number: profileData.phone_number.trim() || null,
      date_of_birth: profileData.date_of_birth || null,
      gender: profileData.gender.trim() || null,
      emergency_contact_name:
        profileData.emergency_contact_name.trim() || null,
      emergency_contact_relationship:
        profileData.emergency_contact_relationship.trim() || null,
      emergency_contact_phone:
        profileData.emergency_contact_phone.trim() || null,
    };

    try {
      const response = await updatePatientProfile(payload);
      const mappedProfile = mapProfileResponse(response);

      setProfileData(mappedProfile);
      setOriginalData(mappedProfile);
      setAssignedPhysiotherapist(
        response?.assigned_physiotherapist ?? null
      );
      setPatientId(response?.profile?.id ?? patientId);
      setIsEditing(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const renderNavigation = () => (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
        <button
          key={item.view}
          onClick={() => handleNavClick(item.view)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            item.view === "profile"
              ? "bg-[#EAF1F8] text-[#087F73]"
              : "text-gray-600 hover:bg-gray-50 hover:text-[#193B62]"
          }`}
        >
          <Icon size={16} strokeWidth={1.8} />
          <span>{item.name}</span>
        </button>
        );
      })}
    </nav>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#087F73] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-500">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (error && !profileData.email && !profileData.full_name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] p-6">
        <div className="bg-white border border-[#D9E3ED] rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-lg font-bold text-[#193B62]">
            Unable to load profile
          </h2>
          <p className="text-sm text-red-600 mt-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 bg-[#087F73] text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#D9E3ED] p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">
              MOVEXA
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
              Patient Portal
            </p>
            <p className="text-xs font-semibold">
              Your rehabilitation account
            </p>
          </div>

          <button
            onClick={onLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2 rounded-lg"
          >
            <DoorOpen size={14} className="inline mr-1" /> Sign Out
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
              <Menu size={20} />
            </button>
            <span className="bg-[#087F73] text-white font-bold text-xs px-2 py-1 rounded">
              MOVEXA
            </span>
          </div>

          <button
            onClick={() => onNavigate("dashboard")}
            className="w-8 h-8 rounded-full bg-[#193B62] text-white text-xs font-bold"
          >
            {(profileData.full_name || "P").charAt(0).toUpperCase()}
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
                    MOVEXA
                  </span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl"
                    aria-label="Close navigation"
                  >
                    <X size={20} />
                  </button>
                </div>
                {renderNavigation()}
              </div>

              <button
                onClick={onLogout}
                className="w-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg"
              >
                <DoorOpen size={14} className="inline mr-1" /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP HEADER */}
        <header className="hidden md:flex bg-white border-b border-[#D9E3ED] px-8 py-3.5 justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">
            Movexa •{" "}
            <span className="text-[#193B62] font-bold">Patient Portal</span>
          </div>

          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4"
          >
            <span className="w-8 h-8 rounded-full bg-[#193B62] text-white flex items-center justify-center text-xs font-bold">
              {(profileData.full_name || "P").charAt(0).toUpperCase()}
            </span>
            <span className="text-xs font-bold">
              {profileData.full_name || "Patient"}
            </span>
          </button>
        </header>

        {/* PROFILE CONTENT */}
        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
              {success}
            </div>
          )}

          {/* PROFILE HERO */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-5">
            <div className="flex items-center gap-5 w-full min-w-0">
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

              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-[#20252B] break-words">
                  {profileData.full_name || "Patient"}
                </h2>
                <p className="text-xs text-gray-500 mt-1 break-all">
                  Patient ID: {patientId || "Not available"}
                </p>
                <div className="inline-flex items-center gap-2 mt-2 bg-[#E4F5EA] text-[#16865D] px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#16865D]" />
                  <span className="text-[10px] font-bold">
                    Registered Patient
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="border border-[#D9E3ED] text-[#193B62] px-4 py-3 rounded-lg font-semibold text-xs w-full sm:w-auto disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#087F73] hover:bg-[#06655c] text-white px-5 py-3 rounded-lg font-semibold text-xs w-full sm:w-auto disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setSuccess("");
                    setIsEditing(true);
                  }}
                  className="bg-[#087F73] hover:bg-[#06655c] text-white px-5 py-3 rounded-lg font-semibold text-xs w-full sm:w-auto"
                >
                  <Pencil size={14} /> Edit Profile
                </button>
              )}
            </div>
          </section>

          {/* PERSONAL INFORMATION */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              <UserRound size={16} className="inline mr-2 text-[#087F73]" /> Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field
                label="Full Name"
                name="full_name"
                value={profileData.full_name}
                isEditing={isEditing}
                onChange={handleInputChange}
              />
              <Field
                label="Date of Birth"
                name="date_of_birth"
                value={profileData.date_of_birth}
                type="date"
                isEditing={isEditing}
                onChange={handleInputChange}
              />

              <div>
                <label
                  htmlFor="gender"
                  className="block text-[10px] font-bold text-gray-400 uppercase mb-1"
                >
                  Gender
                </label>

                {isEditing ? (
                  <select
                    id="gender"
                    name="gender"
                    value={profileData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-lg text-xs"
                  >
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">
                      Prefer not to say
                    </option>
                  </select>
                ) : (
                  <p className="text-sm font-semibold">
                    {displayValue(profileData.gender)}
                  </p>
                )}
              </div>

              <Field
                label="Email Address"
                name="email"
                value={profileData.email}
                editable={false}
                isEditing={isEditing}
                onChange={handleInputChange}
              />
              <Field
                label="Phone Number"
                name="phone_number"
                value={profileData.phone_number}
                isEditing={isEditing}
                onChange={handleInputChange}
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Email address is linked to your account and cannot be changed here.
            </p>
          </section>

          {/* MEDICAL INFORMATION */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              <Activity size={16} className="inline mr-2 text-[#087F73]" /> Medical Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field
                label="Recovery Condition"
                name="injury"
                value={profileData.injury}
                editable={false}
                isEditing={isEditing}
                onChange={handleInputChange}
              />
              <Field
                label="Affected Body Part"
                name="affected_area"
                value={profileData.affected_area}
                editable={false}
                isEditing={isEditing}
                onChange={handleInputChange}
              />
              <Field
                label="Treatment Start Date"
                name="treatment_start_date"
                value={profileData.treatment_start_date}
                type="date"
                editable={false}
                isEditing={isEditing}
                onChange={handleInputChange}
              />
            </div>
          </section>

          {/* ASSIGNED PHYSIOTHERAPIST */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#D9E3ED] pb-3">
              <h3 className="font-bold text-sm">
                <Stethoscope size={16} className="inline mr-2 text-[#087F73]" /> Assigned Physiotherapist
              </h3>
              {assignedPhysiotherapist && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full">
                  {assignedPhysiotherapist.assignment_status || "Assigned"}
                </span>
              )}
            </div>

            {assignedPhysiotherapist ? (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-sm">
                    {assignedPhysiotherapist.full_name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {assignedPhysiotherapist.qualification}
                    {assignedPhysiotherapist.specialization
                      ? ` • ${assignedPhysiotherapist.specialization}`
                      : ""}
                  </p>
                  {assignedPhysiotherapist.clinic_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      {assignedPhysiotherapist.clinic_name}
                    </p>
                  )}
                  {assignedPhysiotherapist.phone_number && (
                    <p className="text-xs text-[#087F73] mt-1">
                      {assignedPhysiotherapist.phone_number}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                You do not have an assigned physiotherapist yet.
              </p>
            )}
          </section>

          {/* EMERGENCY CONTACT */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              <Siren size={16} className="inline mr-2 text-[#087F73]" /> Emergency Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field
                label="Contact Name"
                name="emergency_contact_name"
                value={profileData.emergency_contact_name}
                isEditing={isEditing}
                onChange={handleInputChange}
              />
              <Field
                label="Relationship"
                name="emergency_contact_relationship"
                value={profileData.emergency_contact_relationship}
                isEditing={isEditing}
                onChange={handleInputChange}
              />
              <Field
                label="Phone Number"
                name="emergency_contact_phone"
                value={profileData.emergency_contact_phone}
                isEditing={isEditing}
                onChange={handleInputChange}
              />
            </div>
          </section>

          {/* ACCOUNT SETTINGS */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-5">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              <Settings size={16} className="inline mr-2 text-[#087F73]" /> Account Settings
            </h3>

            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h4 className="text-xs font-bold">Password</h4>
                <p className="text-[11px] text-gray-400 mt-1">
                  Manage your account password
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Password management is not connected yet.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold">Session</h4>
              <p className="text-[11px] text-gray-400 mt-1">
                Signed in from your current browser.
              </p>
              <button
                onClick={onLogout}
                className="mt-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                <DoorOpen size={14} className="inline mr-1" /> Log Out
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
