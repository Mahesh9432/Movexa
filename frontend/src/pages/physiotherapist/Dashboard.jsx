
import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LogOut,
  RefreshCw,
  Users,
  UserRound,
} from "lucide-react";
import {
  getPhysiotherapistDashboard,
  getPhysiotherapistPatients,
} from "../../api/dashboard";

const formatDate = (value) => {
  if (!value) return "No sessions yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusStyle = (status) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-50 text-green-700";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700";
    case "UNABLE_TO_ASSESS":
      return "bg-amber-50 text-amber-700";
    case "INCOMPLETE":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

function StatCard({ label, value, icon: Icon, description }) {
  return (
    <div className="bg-white border border-[#D9E3ED] rounded-xl p-4 md:p-5">
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <Icon size={19} className="text-[#087F73]" />
      </div>

      <p className="text-2xl font-bold text-[#193B62] mt-3">
        {value ?? 0}
      </p>

      <p className="text-[11px] text-gray-400 mt-1">{description}</p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="px-5 py-10 text-center">
      <Users size={26} className="mx-auto text-gray-300 mb-2" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export default function PhysioDashboard({ onLogout, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboardData, patientData] = await Promise.all([
        getPhysiotherapistDashboard(),
        getPhysiotherapistPatients(),
      ]);

      setDashboard(dashboardData);
      setPatients(Array.isArray(patientData) ? patientData : []);
    } catch (err) {
      setError(err.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = dashboard?.summary ?? {};
  const physiotherapist = dashboard?.physiotherapist ?? {};
  const recentSessions = dashboard?.recent_sessions ?? [];

  const firstName = physiotherapist.full_name
    ? physiotherapist.full_name.trim().split(/\s+/)[0]
    : "there";

  const initials = physiotherapist.full_name
    ? physiotherapist.full_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "PT";

  const assessmentTotal =
    (summary.assessed_repetitions ?? 0) +
    (summary.unable_to_assess_repetitions ?? 0);

  const assessmentRate =
    assessmentTotal > 0
      ? Math.round(
          ((summary.assessed_repetitions ?? 0) / assessmentTotal) * 100
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">
      {/* Sidebar */}
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

          <nav className="space-y-1.5">
            <button
              onClick={() => onNavigate?.("physio-dashboard")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#EAF1F8] text-[#087F73]"
            >
              <Activity size={16} />
              Dashboard
            </button>

            <button
              onClick={() => onNavigate?.("physio-patients")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              <Users size={16} />
              Patients
            </button>

            <button
              onClick={() => onNavigate?.("physio-profile")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              <UserRound size={16} />
              Profile & Credentials
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-[#D9E3ED]">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-[#D9E3ED] px-4 md:px-8 py-3.5 flex justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">
            Movexa
            <span className="mx-2">/</span>
            <span className="text-[#193B62] font-bold">
              Physiotherapist Dashboard
            </span>
          </div>

          <button
            onClick={() => onNavigate?.("physio-profile")}
            className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4"
          >
            <span className="w-8 h-8 rounded-full bg-[#087F73] text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </span>
            <span className="text-xs font-bold hidden sm:block">
              {physiotherapist.full_name || "Physiotherapist"}
            </span>
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-7">
          {/* Welcome */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#193B62]">
                Welcome back, {firstName}!
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Here's an overview of your patients and rehabilitation
                activities.
              </p>

              {physiotherapist.verification_status && (
                <span className="inline-flex mt-3 text-[11px] font-semibold bg-[#EAF1F8] text-[#087F73] px-3 py-1 rounded-full">
                  Verification:{" "}
                  {formatStatus(physiotherapist.verification_status)}
                </span>
              )}
            </div>

            <button
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#087F73] border border-[#087F73] rounded-lg px-3 py-2 hover:bg-[#EAF1F8] disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white border border-[#D9E3ED] rounded-xl p-10 text-center">
              <RefreshCw
                size={24}
                className="animate-spin text-[#087F73] mx-auto mb-3"
              />
              <p className="text-sm text-gray-500">
                Loading dashboard data...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-red-700">
                    Dashboard could not be loaded
                  </h2>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                  <button
                    onClick={loadDashboard}
                    className="mt-3 text-xs font-semibold text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard data */}
          {!loading && !error && dashboard && (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                  label="Active Patients"
                  value={summary.active_patients}
                  icon={Users}
                  description="Currently assigned"
                />
                <StatCard
                  label="Active Prescriptions"
                  value={summary.active_prescriptions}
                  icon={ClipboardList}
                  description="Across your patients"
                />
                <StatCard
                  label="Total Sessions"
                  value={summary.total_sessions}
                  icon={CalendarDays}
                  description="Recorded sessions"
                />
                <StatCard
                  label="Completed Sessions"
                  value={summary.completed_sessions}
                  icon={CheckCircle2}
                  description="Successfully completed"
                />
              </div>

              {/* Repetition assessment */}
              <section className="bg-white border border-[#D9E3ED] rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <h2 className="font-bold text-sm text-[#193B62]">
                      Repetition Assessment
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Assessment results across recorded repetitions
                    </p>
                  </div>
                  <span className="text-xl font-bold text-[#087F73]">
                    {assessmentRate}%
                  </span>
                </div>

                <div className="h-2 bg-[#EAF1F8] rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-[#087F73] rounded-full transition-all"
                    style={{ width: `${assessmentRate}%` }}
                  />
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-[11px] text-gray-500">
                  <span>
                    Assessed:{" "}
                    <strong className="text-[#193B62]">
                      {summary.assessed_repetitions ?? 0}
                    </strong>
                  </span>
                  <span>
                    Unable to assess:{" "}
                    <strong className="text-[#193B62]">
                      {summary.unable_to_assess_repetitions ?? 0}
                    </strong>
                  </span>
                  <span>
                    Total repetitions:{" "}
                    <strong className="text-[#193B62]">
                      {assessmentTotal}
                    </strong>
                  </span>
                </div>
              </section>

              {/* Assigned Patients */}
              <section className="bg-white border border-[#D9E3ED] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-[#D9E3ED] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <h2 className="font-bold text-sm text-[#193B62]">
                      Assigned Patients
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Patients currently assigned to you
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#087F73] font-semibold">
                      {patients.length} Patients
                    </span>

                    <button
                      onClick={() => onNavigate?.("physio-patients")}
                      className="text-xs font-bold text-[#087F73] hover:underline whitespace-nowrap"
                    >
                      View All →
                    </button>
                  </div>
                </div>

                {patients.length === 0 ? (
                  <EmptyState message="No patients are currently assigned to you." />
                ) : (
                  <div className="divide-y divide-[#D9E3ED]">
                    {patients.map((patient) => (
                      <div
                        key={patient.patient_id}
                        className="p-4 md:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[#193B62]">
                            {patient.full_name || "Unnamed patient"}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {patient.affected_area ||
                              "Affected area not specified"}
                            {patient.injury ? ` • ${patient.injury}` : ""}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {patient.email || "No email available"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span>
                            <strong className="text-[#193B62]">
                              {patient.active_prescriptions ?? 0}
                            </strong>{" "}
                            active prescriptions
                          </span>
                          <span>
                            <strong className="text-[#193B62]">
                              {patient.total_sessions ?? 0}
                            </strong>{" "}
                            sessions
                          </span>
                          <span className="text-[11px]">
                            Last session: {formatDate(patient.last_session_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent Sessions */}
              <section className="bg-white border border-[#D9E3ED] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-[#D9E3ED]">
                  <h2 className="font-bold text-sm text-[#193B62]">
                    Recent Sessions
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Latest rehabilitation activity
                  </p>
                </div>

                {recentSessions.length === 0 ? (
                  <EmptyState message="No rehabilitation sessions have been recorded yet." />
                ) : (
                  <div className="divide-y divide-[#D9E3ED]">
                    {recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 md:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-[#193B62]">
                            {session.exercise_name || "Rehabilitation session"}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(session.started_at)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                            <Activity size={13} />
                            {session.total_repetitions ?? 0} repetitions
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(session.status)}`}
                          >
                            {formatStatus(session.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
