
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getPhysiotherapistPatients } from "../../api/dashboard";

const navItems = [
  { name: "Dashboard", view: "physio-dashboard" },
  { name: "Patients", view: "physio-patients" },
  { name: "Profile", view: "physio-profile" },
];

function formatDate(value) {
  if (!value) return "No session recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "PT";
}

function PatientCard({ patient }) {
  return (
    <article className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-full bg-[#EAF1F8] text-[#087F73] font-bold flex items-center justify-center shrink-0">
            {getInitials(patient.full_name)}
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-base text-[#193B62] truncate">
              {patient.full_name || "Unnamed patient"}
            </h2>

            <p className="text-xs text-gray-500 mt-1 break-all">
              {patient.email || "No email available"}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              {patient.phone_number || "No phone number available"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
            Active assignment
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#E8EEF4]">
        <div className="bg-[#F7F9FC] rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
            Affected Area
          </p>
          <p className="text-sm font-semibold text-[#193B62] mt-1">
            {patient.affected_area || "Not specified"}
          </p>
        </div>

        <div className="bg-[#F7F9FC] rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
            Active Prescriptions
          </p>
          <p className="text-sm font-semibold text-[#193B62] mt-1">
            {patient.active_prescriptions ?? 0}
          </p>
        </div>

        <div className="bg-[#F7F9FC] rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
            Total Sessions
          </p>
          <p className="text-sm font-semibold text-[#193B62] mt-1">
            {patient.total_sessions ?? 0}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-[#193B62]">Condition:</span>{" "}
          {patient.injury || "Not specified"}
        </p>

        <div className="text-xs text-gray-500">
          Last session:{" "}
          <span className="font-semibold text-[#193B62]">
            {formatDate(patient.last_session_at)}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#E8EEF4] flex flex-wrap justify-between gap-2 text-[11px] text-gray-400">
        <span>Assigned: {formatDate(patient.assigned_at)}</span>
        <span className="font-mono">
          Patient ID: {patient.patient_id || "Unavailable"}
        </span>
      </div>
    </article>
  );
}

export default function PhysioPatients({ onLogout, onNavigate }) {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getPhysiotherapistPatients();

      const patientList = Array.isArray(response)
        ? response
        : Array.isArray(response?.patients)
          ? response.patients
          : [];

      setPatients(patientList);
    } catch (err) {
      setError(
        err?.message || "Unable to load your assigned patients. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return patients;

    return patients.filter((patient) =>
      [
        patient.full_name,
        patient.email,
        patient.phone_number,
        patient.affected_area,
        patient.injury,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [patients, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#D9E3ED] p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1.5 rounded">
              MOVEXA
            </div>
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">
              Physio Portal
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  item.view === "physio-patients"
                    ? "bg-[#EAF1F8] text-[#087F73]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg"
        >
          Sign Out
        </button>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#D9E3ED] px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <div>
            <p className="text-xs text-gray-500 font-medium">
              Physiotherapist Portal
            </p>
            <p className="text-sm font-bold text-[#193B62]">
              Patient Management
            </p>
          </div>

          <button
            onClick={() => onNavigate("physio-profile")}
            className="text-xs font-semibold text-[#087F73] hover:underline"
          >
            My Profile
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
                Clinical Workspace
              </p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1 text-[#193B62]">
                My Patients
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                View patients currently assigned to your care.
              </p>
            </div>

            <div className="bg-white border border-[#D9E3ED] rounded-xl px-4 py-3 min-w-32">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                Assigned Patients
              </p>
              <p className="text-2xl font-bold text-[#087F73] mt-1">
                {loading ? "—" : patients.length}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#D9E3ED] rounded-xl p-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by patient name, email, condition or affected area..."
              className="w-full outline-none text-sm text-[#193B62] placeholder:text-gray-400 px-2 py-2"
            />
          </div>

          {loading && (
            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-12 text-center">
              <div className="w-9 h-9 border-4 border-[#087F73] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500 mt-4">
                Loading assigned patients...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-white border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-semibold text-red-600">{error}</p>
              <button
                onClick={loadPatients}
                className="mt-4 bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-5 py-2.5 rounded-lg"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredPatients.length === 0 && (
            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-10 text-center">
              <h2 className="font-bold text-[#193B62]">
                {patients.length === 0
                  ? "No assigned patients yet"
                  : "No matching patients"}
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                {patients.length === 0
                  ? "Patients assigned to your account will appear here."
                  : "Try searching with a different name or condition."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-xs font-semibold text-[#087F73] hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredPatients.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-bold text-[#193B62]">
                    {filteredPatients.length}
                  </span>{" "}
                  of {patients.length} patients
                </p>

                <button
                  onClick={loadPatients}
                  className="text-xs font-semibold text-[#087F73] hover:underline"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <PatientCard
                    key={patient.patient_id || patient.user_id}
                    patient={patient}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
