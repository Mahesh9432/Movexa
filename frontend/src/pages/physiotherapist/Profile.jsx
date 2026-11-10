
import React, { useEffect, useState } from "react";
import {
  getPhysiotherapistProfile,
  updatePhysiotherapistProfile,
} from "../../api/profile";

const navItems = [
  { name: "Dashboard", icon: "📊", view: "physio-dashboard" },
  { name: "Profile", icon: "👤", view: "physio-profile" },
];

const emptyProfile = {
  full_name: "",
  email: "",
  phone_number: "",
  qualification: "",
  specialization: "",
  registration_number: "",
  years_experience: 0,
  clinic_name: "",
  clinic_address: "",
  professional_bio: "",
  verification_status: "",
};

function mapProfileResponse(response) {
  const user = response?.user ?? {};
  const profile = response?.profile ?? {};

  return {
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    phone_number: user.phone_number ?? "",
    qualification: profile.qualification ?? "",
    specialization: profile.specialization ?? "",
    registration_number: profile.registration_number ?? "",
    years_experience: profile.years_experience ?? 0,
    clinic_name: profile.clinic_name ?? "",
    clinic_address: profile.clinic_address ?? "",
    professional_bio: profile.professional_bio ?? "",
    verification_status: profile.verification_status ?? "UNKNOWN",
  };
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function formatVerificationStatus(status) {
  return String(status || "UNKNOWN")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Defined outside PhysioProfile to prevent input remounting.
function Field({
  label,
  name,
  value,
  editable = true,
  type = "text",
  isEditing,
  onChange,
  disabled = false,
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
          min={type === "number" ? 0 : undefined}
          step={type === "number" ? 1 : undefined}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-lg text-xs font-semibold text-[#193B62] focus:outline-none focus:border-[#087F73] disabled:opacity-60"
        />
      ) : (
        <p className="text-sm font-semibold text-[#193B62] break-words">
          {displayValue(value)}
        </p>
      )}
    </div>
  );
}

// Also defined outside PhysioProfile to preserve textarea focus.
function TextAreaField({
  label,
  name,
  value,
  isEditing,
  onChange,
  disabled = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"
      >
        {label}
      </label>

      {isEditing ? (
        <textarea
          id={name}
          name={name}
          rows={4}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          className="w-full resize-y bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-lg text-xs font-semibold text-[#193B62] focus:outline-none focus:border-[#087F73] disabled:opacity-60"
        />
      ) : (
        <p className="text-sm font-semibold text-[#193B62] whitespace-pre-wrap break-words">
          {displayValue(value)}
        </p>
      )}
    </div>
  );
}

export default function PhysioProfile({ onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [physioData, setPhysioData] = useState(emptyProfile);
  const [originalData, setOriginalData] = useState(emptyProfile);

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
        const response = await getPhysiotherapistProfile();

        if (!active) return;

        const mappedProfile = mapProfileResponse(response);

        setPhysioData(mappedProfile);
        setOriginalData(mappedProfile);
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load your physiotherapist profile."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
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

    setPhysioData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setPhysioData(originalData);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!physioData.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!physioData.qualification.trim()) {
      setError("Qualification is required.");
      return;
    }

    const experience = Number(physioData.years_experience);

    if (
      !Number.isInteger(experience) ||
      experience < 0
    ) {
      setError(
        "Years of experience must be a valid non-negative number."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      full_name: physioData.full_name.trim(),
      phone_number: physioData.phone_number.trim() || null,
      qualification: physioData.qualification.trim(),
      specialization: physioData.specialization.trim() || null,
      years_experience: experience,
      clinic_name: physioData.clinic_name.trim() || null,
      clinic_address: physioData.clinic_address.trim() || null,
      professional_bio: physioData.professional_bio.trim() || null,
    };

    try {
      const response = await updatePhysiotherapistProfile(payload);
      const mappedProfile = mapProfileResponse(response);

      setPhysioData(mappedProfile);
      setOriginalData(mappedProfile);
      setIsEditing(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      handleCancel();
      return;
    }

    setError("");
    setSuccess("");
    setIsEditing(true);
  };

  const renderNavigation = () => (
    <nav className="space-y-1.5">
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => handleNavClick(item.view)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            item.view === "physio-profile"
              ? "bg-[#EAF1F8] text-[#087F73]"
              : "text-gray-600 hover:bg-gray-50 hover:text-[#193B62]"
          }`}
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.name}</span>
        </button>
      ))}
    </nav>
  );

  const verificationStatus = physioData.verification_status;

  const isVerified = ["VERIFIED", "APPROVED"].includes(
    String(verificationStatus).toUpperCase()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-6">
        <div className="bg-white border border-[#D9E3ED] rounded-xl p-8 text-center max-w-sm w-full">
          <div className="w-8 h-8 border-4 border-[#D9E3ED] border-t-[#087F73] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-[#193B62]">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (error && !physioData.full_name && !physioData.email) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-6">
        <div className="bg-white border border-[#D9E3ED] rounded-xl p-6 max-w-md w-full">
          <h2 className="text-lg font-bold text-[#193B62] mb-2">
            Unable to load profile
          </h2>

          <p className="text-sm text-red-600 mb-5">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="bg-[#087F73] text-white px-5 py-2.5 rounded-lg text-xs font-semibold"
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
              {displayValue(physioData.clinic_name)}
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
              MOVEXA
            </span>
          </div>

          <button
            onClick={() => onNavigate("physio-dashboard")}
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
                    MOVEXA
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
            {displayValue(physioData.clinic_name)}{" "}
            <span className="text-[#193B62] font-bold">
              • Physiotherapist Portal
            </span>
          </div>

          <button
            onClick={() => onNavigate("physio-dashboard")}
            className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-full bg-[#087F73] text-white flex items-center justify-center text-xs font-bold">
              MV
            </span>

            <span className="text-xs font-bold">
              {physioData.full_name}
            </span>
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

          {/* FEEDBACK */}
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-xs font-medium"
            >
              {success}
            </div>
          )}

          {/* PROFILE HERO */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-5">
            <div className="flex items-center gap-5 w-full min-w-0">
              <div className="w-20 h-20 shrink-0 rounded-full bg-[#EAF1F0] flex items-center justify-center font-bold text-2xl text-[#087F73]">
                🩺
              </div>

              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-[#20252B] break-words">
                  {displayValue(physioData.full_name)}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Registration No: #
                  {displayValue(physioData.registration_number)}
                </p>

                <div
                  className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${
                    isVerified
                      ? "bg-[#E4F5EA] text-[#16865D]"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isVerified ? "bg-[#16865D]" : "bg-amber-500"
                    }`}
                  />

                  <span className="text-[10px] font-bold">
                    {formatVerificationStatus(verificationStatus)} Practitioner
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
              {isEditing && (
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="border border-[#D9E3ED] text-[#193B62] px-5 py-3 rounded-lg font-semibold text-xs disabled:opacity-60"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={isEditing ? handleSave : handleEditToggle}
                disabled={saving}
                className="bg-[#087F73] hover:bg-[#06655c] text-white px-5 py-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Save Profile"
                    : "Edit Profile"}
              </button>
            </div>
          </section>

          {/* PERSONAL INFORMATION */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              👤 Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field
                label="Full Name"
                name="full_name"
                value={physioData.full_name}
                isEditing={isEditing}
                onChange={handleInputChange}
                disabled={saving}
              />

              <Field
                label="Email Address"
                name="email"
                value={physioData.email}
                editable={false}
                isEditing={isEditing}
              />

              <Field
                label="Phone Number"
                name="phone_number"
                value={physioData.phone_number}
                isEditing={isEditing}
                onChange={handleInputChange}
                disabled={saving}
              />
            </div>
          </section>

          {/* PROFESSIONAL CREDENTIALS */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              📋 Professional Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field
                label="Qualification"
                name="qualification"
                value={physioData.qualification}
                isEditing={isEditing}
                onChange={handleInputChange}
                disabled={saving}
              />

              <Field
                label="Specialization"
                name="specialization"
                value={physioData.specialization}
                isEditing={isEditing}
                onChange={handleInputChange}
                disabled={saving}
              />

              <Field
                label="Registration Number"
                name="registration_number"
                value={physioData.registration_number}
                editable={false}
                isEditing={isEditing}
              />

              <Field
                label="Years of Experience"
                name="years_experience"
                type="number"
                value={physioData.years_experience}
                isEditing={isEditing}
                onChange={handleInputChange}
                disabled={saving}
              />

              <Field
                label="Verification Status"
                name="verification_status"
                value={formatVerificationStatus(
                  physioData.verification_status
                )}
                editable={false}
                isEditing={isEditing}
              />
            </div>

            <div className="pt-2">
              <TextAreaField
                label="Professional Bio"
                name="professional_bio"
                value={physioData.professional_bio}
                isEditing={isEditing}
                onChange={handleInputChange}
                disabled={saving}
              />
            </div>
          </section>

          {/* CLINIC INFORMATION */}
          <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-sm border-b border-[#D9E3ED] pb-3">
              🏥 Clinic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                label="Clinic Name"
                name="clinic_name"
                value={physioData.clinic_name}
                isEditing={isEditing}
                onChange={handleInputChange}
                disabled={saving}
              />

              <Field
                label="Clinic Address"
                name="clinic_address"
                value={physioData.clinic_address}
                isEditing={isEditing}
                onChange={handleInputChange}
                disabled={saving}
              />
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
                onClick={() =>
                  window.alert("Password reset will be connected soon.")
                }
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
