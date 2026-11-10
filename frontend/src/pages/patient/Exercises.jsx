import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Dumbbell,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  UserRound,
  X,
  AlertCircle,
  Play,
} from "lucide-react";

import { getExercises } from "../../api/exercises";
import { getPrescriptions } from "../../api/prescriptions";

const navItems = [
  { name: "Dashboard", view: "dashboard", icon: Activity },
  { name: "My Exercises", view: "exercises", icon: ClipboardList },
  { name: "Sessions", view: "session", icon: Clock3 },
  { name: "Exercise Library", view: "library", icon: BookOpen },
  { name: "Progress", view: "progress", icon: Activity },
  { name: "Appointments", view: "appointments", icon: CalendarDays },
  { name: "Profile", view: "profile", icon: UserRound },
];

function getList(response, key) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.[key])) return response[key];
  return [];
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-4 w-80 max-w-full rounded bg-gray-200" />
      </div>

      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-36 animate-pulse rounded-2xl border border-[#D9E3ED] bg-white"
        />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-white p-6 text-center">
      <AlertCircle className="mx-auto text-red-500" size={24} />

      <h2 className="mt-3 font-bold text-[#193B62]">
        Unable to load your exercises
      </h2>

      <p className="mt-2 text-sm text-gray-500">{message}</p>

      <button
        onClick={onRetry}
        className="mt-4 rounded-lg bg-[#087F73] px-5 py-2 text-sm font-semibold text-white hover:bg-[#06655c]"
      >
        Try Again
      </button>
    </div>
  );
}

function PrescriptionCard({ prescription, exercise, onStartSession }) {
  const exerciseName =
    prescription.exercise_name ||
    exercise?.name ||
    "Exercise details unavailable";

  const isActive = prescription.is_active === true;

  return (
    <article className="rounded-2xl border border-[#D9E3ED] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1F8] text-[#087F73]">
            <Dumbbell size={21} />
          </div>

          <div className="min-w-0">
            <h2 className="break-words text-base font-bold text-[#193B62]">
              {exerciseName}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {exercise?.target_joint
                ? `Target joint: ${exercise.target_joint}`
                : "Prescribed rehabilitation exercise"}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold ${
            isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[#F4F7FB] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Target sets
          </p>

          <p className="mt-1 text-xl font-bold text-[#193B62]">
            {prescription.target_sets ?? "—"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F4F7FB] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Reps per set
          </p>

          <p className="mt-1 text-xl font-bold text-[#193B62]">
            {prescription.target_reps ?? "—"}
          </p>
        </div>

        <div className="col-span-2 rounded-xl bg-[#F4F7FB] p-3 sm:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Assigned on
          </p>

          <p className="mt-2 text-sm font-semibold text-[#193B62]">
            {formatDate(prescription.created_at)}
          </p>
        </div>
      </div>

      {exercise?.instructions && (
        <div className="mt-4 border-t border-[#E8EEF4] pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Instructions
          </p>

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
            {exercise.instructions}
          </p>
        </div>
      )}

      {exercise?.target_joint && (
        <p className="mt-3 text-xs text-gray-500">
          Target area:{" "}
          <span className="font-semibold text-[#193B62]">
            {exercise.target_joint}
          </span>
        </p>
      )}

      {isActive && (
        <div className="mt-5 border-t border-[#E8EEF4] pt-4">
          <button
            onClick={() => onStartSession(prescription.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087F73] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#06655c]"
          >
            <Play size={16} />
            Start Session
          </button>
        </div>
      )}
    </article>
  );
}

export default function PatientExercises({ onLogout, onNavigate }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [prescriptionResponse, exerciseResponse] = await Promise.all([
        getPrescriptions(),
        getExercises(),
      ]);

      setPrescriptions(getList(prescriptionResponse, "prescriptions"));
      setExercises(getList(exerciseResponse, "exercises"));
    } catch (err) {
      setError(
        err?.message ||
          "Something went wrong while loading your exercises."
      );

      setPrescriptions([]);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exerciseMap = useMemo(
    () => new Map(exercises.map((exercise) => [String(exercise.id), exercise])),
    [exercises]
  );

  const prescriptionRows = useMemo(
    () =>
      prescriptions.map((prescription) => ({
        ...prescription,
        exercise: exerciseMap.get(String(prescription.exercise_id)),
      })),
    [prescriptions, exerciseMap]
  );

  const activeCount = prescriptionRows.filter(
    (prescription) => prescription.is_active === true
  ).length;

  const visiblePrescriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return prescriptionRows.filter((prescription) => {
      if (!showInactive && prescription.is_active !== true) return false;

      const name =
        prescription.exercise_name ||
        prescription.exercise?.name ||
        "Exercise details unavailable";

      return (
        !query ||
        name.toLowerCase().includes(query) ||
        String(prescription.id ?? "").toLowerCase().includes(query)
      );
    });
  }, [prescriptionRows, searchQuery, showInactive]);

  const handleNavigate = (view) => {
    setMobileMenuOpen(false);
    onNavigate?.(view);
  };

  const handleStartSession = (prescriptionId) => {
    setMobileMenuOpen(false);
    onNavigate?.("session", prescriptionId);
  };

  const renderNavigation = () => (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.view === "exercises";

        return (
          <button
            key={item.view}
            onClick={() => handleNavigate(item.view)}
            className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${
              active
                ? "bg-[#EAF1F8] text-[#087F73]"
                : "text-gray-600 hover:bg-gray-50 hover:text-[#193B62]"
            }`}
          >
            <Icon size={16} />
            {item.name}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] text-[#193B62]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-[#D9E3ED] bg-white p-6 md:flex">
        <div>
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded bg-[#087F73] px-2.5 py-1 text-xs font-bold text-white">
              MOVEXA
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Patient Portal
            </span>
          </div>

          {renderNavigation()}
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#D9E3ED] bg-white px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-1 text-gray-600 hover:bg-gray-100 md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div className="text-xs font-medium text-gray-500">
              Movexa <span className="mx-2">/</span>
              <span className="font-bold text-[#193B62]">My Exercises</span>
            </div>
          </div>

          <button
            onClick={() => handleNavigate("profile")}
            className="flex items-center gap-2 text-xs font-semibold text-[#087F73]"
          >
            <UserRound size={16} />
            My Profile
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <button
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation overlay"
            />

            <div className="relative flex h-full w-72 max-w-[85vw] flex-col justify-between bg-white p-6 shadow-xl">
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <span className="rounded bg-[#087F73] px-2.5 py-1 text-xs font-bold text-white">
                    MOVEXA
                  </span>

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation"
                    className="rounded-lg p-1 text-gray-600 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                {renderNavigation()}
              </div>

              <button
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-600"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
                Rehabilitation Plan
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#20252B] md:text-3xl">
                My Exercises
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Review the exercises and targets assigned by your physiotherapist.
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-[#D9E3ED] bg-white px-4 py-2.5 text-xs font-bold text-[#087F73] hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </section>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={loadData} />
          ) : (
            <>
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#D9E3ED] bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-500">
                    Assigned prescriptions
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#193B62]">
                    {prescriptionRows.length}
                  </p>
                </div>

                <div className="rounded-xl border border-[#D9E3ED] bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-500">Active exercises</p>

                  <p className="mt-2 text-2xl font-bold text-[#087F73]">
                    {activeCount}
                  </p>
                </div>

                <div className="rounded-xl border border-[#D9E3ED] bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-500">
                    Exercise library entries
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#193B62]">
                    {exercises.length}
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#193B62]">
                      Your prescribed routine
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Prescription targets supplied by your physiotherapist.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(event) =>
                        setShowInactive(event.target.checked)
                      }
                      className="accent-[#087F73]"
                    />
                    Show inactive
                  </label>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-[#D9E3ED] bg-white px-3 py-2">
                  <Search size={16} className="text-gray-400" />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search your exercises..."
                    className="w-full bg-transparent py-1 text-sm outline-none"
                  />
                </div>

                {visiblePrescriptions.length === 0 ? (
                  <div className="rounded-2xl border border-[#D9E3ED] bg-white px-6 py-12 text-center">
                    <ClipboardList
                      className="mx-auto text-gray-300"
                      size={30}
                    />

                    <h3 className="mt-3 font-bold text-[#193B62]">
                      {prescriptionRows.length === 0
                        ? "No prescriptions assigned yet"
                        : "No matching exercises"}
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                      {prescriptionRows.length === 0
                        ? "Your physiotherapist's exercise prescriptions will appear here when assigned."
                        : "Try another search or enable inactive prescriptions."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visiblePrescriptions.map((prescription) => (
                      <PrescriptionCard
                        key={prescription.id}
                        prescription={prescription}
                        exercise={prescription.exercise}
                        onStartSession={handleStartSession}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[#D9E3ED] bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#EAF1F8] p-2 text-[#087F73]">
                    <CheckCircle2 size={19} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#193B62]">
                      Session tracking
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Start a session directly from an active prescription.
                      Session creation and status recording are connected.
                      Camera-based movement analysis and repetition metrics
                      are not connected yet.
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