
import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Menu,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { getPatientDashboard } from "../../api/dashboard";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { name: "My Exercises", icon: ClipboardList, view: "exercises" },
  { name: "Exercise Library", icon: BookOpen, view: "library" },
  { name: "Progress", icon: TrendingUp, view: "progress" },
  { name: "Appointments", icon: CalendarDays, view: "appointments" },
  { name: "Profile", icon: UserRound, view: "profile" },
];

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "P";
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function LoadingState() {
  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-80 bg-gray-200 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 bg-white border border-[#D9E3ED] rounded-xl animate-pulse"
          />
        ))}
      </div>

      <div className="h-56 bg-white border border-[#D9E3ED] rounded-xl animate-pulse" />
    </main>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-white border border-red-200 rounded-xl p-6 text-center">
      <h2 className="font-bold text-[#193B62]">Unable to load dashboard</h2>
      <p className="text-sm text-gray-500 mt-2">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 bg-[#087F73] hover:bg-[#06655c] text-white px-5 py-2 rounded-lg text-sm font-semibold"
      >
        Try Again
      </button>
    </div>
  );
}

export default function PatientDashboard({ onLogout, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {

    try {
      const response = await getPatientDashboard();
      setDashboard(response);
    } catch (err) {
      setDashboard(null);
      setError(err.message || "Something went wrong while loading your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) return loadDashboard();
      return undefined;
    });

    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  const handleNavClick = (view) => {
    setMobileMenuOpen(false);
    onNavigate?.(view);
  };

  const patientName = dashboard?.patient?.full_name || "Patient";
  const initials = getInitials(patientName);
  const summary = dashboard?.summary || {};
  const prescriptions = dashboard?.active_prescriptions || [];
  const sessions = dashboard?.recent_sessions || [];

  const totalRepetitions = summary.total_repetitions || 0;
  const assessedRepetitions = summary.assessed_repetitions || 0;

  const assessmentRate =
    totalRepetitions > 0
      ? Math.round((assessedRepetitions / totalRepetitions) * 100)
      : null;

  const renderNavigation = () => (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
        <button
          key={item.view}
          onClick={() => handleNavClick(item.view)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            item.view === "dashboard"
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

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex text-[#193B62]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#D9E3ED] p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#087F73] text-white font-bold text-xs px-2.5 py-1 rounded">
              MOVEXA
            </div>
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">
              Patient Portal
            </span>
          </div>

          {renderNavigation()}
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg"
        >
          Sign Out
        </button>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
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
            onClick={() => handleNavClick("profile")}
            className="w-8 h-8 rounded-full bg-[#193B62] text-white text-xs font-bold"
          >
            {initials}
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-xl p-6 flex flex-col justify-between">
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
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b border-[#D9E3ED] px-8 py-3.5 justify-between items-center sticky top-0 z-20">
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider">
              Dashboard Overview
            </h1>
            <p className="text-[10px] text-gray-500">
              Your rehabilitation journey
            </p>
          </div>

          <button
            onClick={() => handleNavClick("profile")}
            className="flex items-center gap-2.5 border-l border-[#D9E3ED] pl-4"
          >
            <span className="w-8 h-8 rounded-full bg-[#193B62] text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </span>
            <span className="text-xs font-bold">{patientName}</span>
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={loadDashboard} />
          ) : (
            <>
              {/* Welcome */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  Welcome back, {patientName}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Your rehabilitation activity and progress overview.
                </p>

                {(dashboard?.patient?.affected_area ||
                  dashboard?.patient?.injury) && (
                  <p className="text-xs text-gray-500 mt-2">
                    {[dashboard.patient.affected_area, dashboard.patient.injury]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
              </div>

              {/* Statistics */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Active Prescriptions"
                  value={summary.active_prescriptions ?? 0}
                  description="Currently assigned exercises"
                />
                <StatCard
                  label="Completed Sessions"
                  value={summary.completed_sessions ?? 0}
                  description={`${summary.total_sessions ?? 0} total sessions`}
                />
                <StatCard
                  label="Repetition Assessment Rate"
                  value={assessmentRate === null ? "—" : `${assessmentRate}%`}
                  description={
                    totalRepetitions > 0
                      ? `${assessedRepetitions} of ${totalRepetitions} repetitions assessed`
                      : "No repetition data recorded yet"
                  }
                />
              </section>

              {/* Prescribed Exercises */}
              <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-sm">
                      Today's Prescribed Routine
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Your active rehabilitation prescriptions
                    </p>
                  </div>

                  <button
                    onClick={() => handleNavClick("exercises")}
                    className="text-xs text-[#087F73] font-semibold"
                  >
                    View All →
                  </button>
                </div>

                {prescriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm font-semibold text-gray-600">
                      No active prescriptions
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Your physiotherapist's prescribed exercises will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="flex flex-wrap justify-between items-center gap-3 border border-[#D9E3ED] rounded-lg p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {prescription.exercise_name || "Exercise"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {prescription.target_sets} sets ×{" "}
                            {prescription.target_reps} reps
                          </p>
                        </div>

                        <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent Sessions */}
              <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-sm">Recent Sessions</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Your latest recorded rehabilitation sessions
                    </p>
                  </div>

                  <button
                    onClick={() => handleNavClick("progress")}
                    className="text-xs text-[#087F73] font-semibold"
                  >
                    View Progress →
                  </button>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm font-semibold text-gray-600">
                      No sessions recorded yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Your completed rehabilitation sessions will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#D9E3ED]">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="py-4 flex flex-wrap justify-between items-center gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {session.exercise_name || "Rehabilitation Session"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(session.started_at)}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {session.assessed_repetitions ?? 0} assessed /{" "}
                            {session.total_repetitions ?? 0} repetitions
                          </p>
                        </div>

                        <StatusBadge status={session.status} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Assessment Overview */}
              <section className="bg-white border border-[#D9E3ED] rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-sm mb-4">
                  Movement Assessment Overview
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      Assessed Repetitions
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {summary.assessed_repetitions ?? 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Unable to Assess
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {summary.unable_to_assess_repetitions ?? 0}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
