
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const { register } = useAuth();

  const [role, setRole] = useState("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",

    // Patient details
    date_of_birth: "",
    gender: "",
    injury: "",
    affected_area: "",
    treatment_start_date: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",

    // Physiotherapist details
    qualification: "",
    registration_number: "",
    specialization: "",
    years_experience: "0",
    clinic_name: "",
    clinic_address: "",
    professional_bio: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const commonData = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      let authenticatedUser;

      if (role === "patient") {
        const patientData = {
          ...commonData,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          injury: formData.injury.trim(),
          affected_area: formData.affected_area.trim(),
          treatment_start_date: formData.treatment_start_date,
          emergency_contact_name:
            formData.emergency_contact_name.trim(),
          emergency_contact_relationship:
            formData.emergency_contact_relationship.trim(),
          emergency_contact_phone:
            formData.emergency_contact_phone.trim(),
        };

        authenticatedUser = await register("patient", patientData);
      } else {
        const experience = Number(formData.years_experience);

        if (!Number.isInteger(experience) || experience < 0) {
          throw new Error(
            "Years of experience must be a valid non-negative whole number."
          );
        }

        const physiotherapistData = {
          ...commonData,
          qualification: formData.qualification.trim(),
          registration_number:
            formData.registration_number.trim(),
          specialization: formData.specialization.trim() || null,
          years_experience: experience,
          clinic_name: formData.clinic_name.trim() || null,
          clinic_address: formData.clinic_address.trim() || null,
          professional_bio: formData.professional_bio.trim() || null,
        };

        authenticatedUser = await register(
          "physio",
          physiotherapistData
        );
      }

      if (onRegisterSuccess) {
        onRegisterSuccess(authenticatedUser);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-[#F4F7FB] border border-[#D9E3ED] text-[#193B62] px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#087F73] text-sm disabled:opacity-60";

  const labelClass =
    "block text-xs font-semibold text-[#193B62] mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7FB]">
      <div className="max-w-2xl w-full bg-white border border-[#D9E3ED] rounded-2xl p-8 md:p-10 shadow-sm">

        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-wider text-[#087F73] font-bold">
            MOVEẊA
          </span>

          <h1 className="text-2xl font-bold text-[#193B62] mt-1">
            Create Account
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Register to access your portal
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3 bg-[#F4F7FB] p-1.5 rounded-xl border border-[#D9E3ED] mb-8">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setRole("patient");
              setError("");
            }}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === "patient"
                ? "bg-white text-[#193B62] shadow-sm"
                : "text-gray-500 hover:text-[#193B62]"
            }`}
          >
            🧑‍⚕️ Patient Portal
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setRole("physio");
              setError("");
            }}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === "physio"
                ? "bg-white text-[#193B62] shadow-sm"
                : "text-gray-500 hover:text-[#193B62]"
            }`}
          >
            🩺 Physiotherapist Portal
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">

          {/* Common Authentication Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  maxLength={150}
                  disabled={isSubmitting}
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={
                    role === "patient"
                      ? "Sarah Jenkins"
                      : "Dr. Marcus Vance"
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={isSubmitting}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@domain.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                disabled={isSubmitting}
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </div>
          </div>

          {/* Patient Registration */}
          {role === "patient" ? (
            <div className="space-y-5 border-t border-[#D9E3ED] pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#087F73]">
                Patient Clinical Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    required
                    disabled={isSubmitting}
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    name="gender"
                    required
                    disabled={isSubmitting}
                    value={formData.gender}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Treatment Start Date
                  </label>
                  <input
                    type="date"
                    name="treatment_start_date"
                    required
                    disabled={isSubmitting}
                    value={formData.treatment_start_date}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Injury / Condition
                  </label>
                  <input
                    type="text"
                    name="injury"
                    required
                    disabled={isSubmitting}
                    value={formData.injury}
                    onChange={handleChange}
                    placeholder="e.g. Post-Op ACL Reconstruction"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Affected Area</label>
                  <input
                    type="text"
                    name="affected_area"
                    required
                    disabled={isSubmitting}
                    value={formData.affected_area}
                    onChange={handleChange}
                    placeholder="e.g. Left Knee Joint"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    required
                    disabled={isSubmitting}
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="David Jenkins"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Relationship</label>
                  <input
                    type="text"
                    name="emergency_contact_relationship"
                    required
                    disabled={isSubmitting}
                    value={formData.emergency_contact_relationship}
                    onChange={handleChange}
                    placeholder="Parent"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Emergency Phone</label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    required
                    disabled={isSubmitting}
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Physiotherapist Registration */
            <div className="space-y-5 border-t border-[#D9E3ED] pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#087F73]">
                Physiotherapist Professional Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    required
                    disabled={isSubmitting}
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="Bachelor of Physiotherapy (BPT)"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Professional Registration Number
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    required
                    disabled={isSubmitting}
                    value={formData.registration_number}
                    onChange={handleChange}
                    placeholder="Enter your registration number"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    disabled={isSubmitting}
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Orthopedic Rehabilitation"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="years_experience"
                    min="0"
                    step="1"
                    required
                    disabled={isSubmitting}
                    value={formData.years_experience}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Clinic Name</label>
                  <input
                    type="text"
                    name="clinic_name"
                    disabled={isSubmitting}
                    value={formData.clinic_name}
                    onChange={handleChange}
                    placeholder="Apex Orthopaedics Clinic"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Clinic Address</label>
                  <input
                    type="text"
                    name="clinic_address"
                    disabled={isSubmitting}
                    value={formData.clinic_address}
                    onChange={handleChange}
                    placeholder="Clinic address"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Professional Bio</label>
                <textarea
                  name="professional_bio"
                  rows="2"
                  disabled={isSubmitting}
                  value={formData.professional_bio}
                  onChange={handleChange}
                  placeholder="Specialized in post-operative recovery..."
                  className={inputClass}
                />
              </div>

              <p className="text-xs text-gray-500 bg-[#F4F7FB] p-3 rounded-xl border border-[#D9E3ED]">
                ℹ️ Your account will remain pending until your
                professional credentials are verified. Your
                registration number must be valid.
              </p>
            </div>
          )}

          {/* API Error */}
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#087F73] hover:bg-[#06655c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-sm cursor-pointer mt-6 text-sm"
          >
            {isSubmitting
              ? "Creating Account..."
              : `Register as ${
                  role === "patient" ? "Patient" : "Physiotherapist"
                }`}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            disabled={isSubmitting}
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
