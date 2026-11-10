import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Dumbbell,
  LogOut,
  RefreshCw,
  UserRound,
  XCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { getPrescriptions } from "../../api/prescriptions";
import { getExercises } from "../../api/exercises";
import {
  createSession,
  getSession,
  completeSession,
  syncSession,
} from "../../api/sessions";
import { getSessionMetrics } from "../../api/metrics";
import { useAuth } from "../../context/AuthContext";

const LEGACY_ACTIVE_SESSION_KEY = "movexa_patient_active_session";

function getSessionStorageKey(userId) {
  return userId ? `${LEGACY_ACTIVE_SESSION_KEY}:${userId}` : null;
}

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

function getMetricList(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.repetitions_data)) {
    return response.repetitions_data;
  }

  if (Array.isArray(response?.metrics)) {
    return response.metrics;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
}

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function formatConfidence(value) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return "Not available";

  return `${(numericValue * 100).toFixed(1)}%`;
}

function makeClientSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `movexa-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStoredSession(storageKey) {
  if (!storageKey) return null;

  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveStoredSession(storageKey, session) {
  if (!storageKey) return;

  try {
    if (session) {
      localStorage.setItem(storageKey, JSON.stringify(session));
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch {
    // The server remains the source of truth if browser storage is unavailable.
  }
}

function ErrorNotice({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />

        <div className="flex-1">
          <p className="font-semibold">Something needs attention</p>
          <p className="mt-1 text-xs">{message}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-xs font-bold underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricDetail({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[#193B62]">
        {value}
      </p>
    </div>
  );
}

function MetricJsonDetail({ label, value }) {
  if (
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0)
  ) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs leading-5 text-gray-700">
        {formatValue(value)}
      </pre>
    </div>
  );
}

function RepetitionMetricCard({ metric }) {
  const [expanded, setExpanded] = useState(false);

  const status = String(
    metric.assessment_status || "UNKNOWN"
  ).toUpperCase();

  const isAssessed = status === "ASSESSED";

  return (
    <article className="rounded-xl border border-[#D9E3ED] bg-[#F8FAFC] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Repetition
          </p>

          <h3 className="mt-1 text-lg font-bold text-[#193B62]">
            #{metric.rep_number ?? "—"}
          </h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold ${
            isAssessed
              ? "bg-emerald-50 text-emerald-700"
              : status === "UNABLE_TO_ASSESS"
                ? "bg-amber-50 text-amber-800"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricDetail
          label="Range of motion"
          value={
            metric.range_of_motion === null ||
            metric.range_of_motion === undefined
              ? "Not available"
              : `${metric.range_of_motion}°`
          }
        />

        <MetricDetail
          label="Confidence"
          value={formatConfidence(metric.confidence)}
        />

        <MetricDetail
          label="Repetition"
          value={metric.rep_number ?? "—"}
        />
      </div>

      <button
        onClick={() => setExpanded((current) => !current)}
        className="mt-4 flex w-full items-center justify-between border-t border-[#D9E3ED] pt-3 text-xs font-bold text-[#087F73]"
      >
        {expanded ? "Hide assessment details" : "View assessment details"}

        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <MetricJsonDetail
            label="Movement data"
            value={metric.movement_data}
          />

          <MetricJsonDetail
            label="Compensation flags"
            value={metric.compensation_flags}
          />

          <MetricJsonDetail
            label="Detected issues"
            value={metric.detected_issues}
          />

          {metric.feedback && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Feedback
              </p>

              <p className="mt-1 rounded-lg bg-white p-3 text-sm leading-6 text-gray-700">
                {metric.feedback}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function PatientSession({
  onLogout,
  onNavigate,
  initialPrescriptionId = "",
}) {
  const { user } = useAuth();
  const sessionStorageKey = getSessionStorageKey(user?.id);

  useEffect(() => {
    try {
      // Remove the old shared key; it cannot be safely attributed to an account.
      localStorage.removeItem(LEGACY_ACTIVE_SESSION_KEY);
    } catch {
      // Browser storage may be unavailable.
    }
  }, []);

  const [prescriptions, setPrescriptions] = useState([]);
  const [exercises, setExercises] = useState([]);

  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(
    initialPrescriptionId ? String(initialPrescriptionId) : ""
  );

  const [activeSession, setActiveSession] = useState(() =>
    readStoredSession(sessionStorageKey)
  );

  const [metrics, setMetrics] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");

  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [prescriptionResponse, exerciseResponse] = await Promise.all([
        getPrescriptions(),
        getExercises(),
      ]);

      const prescriptionList = getList(
        prescriptionResponse,
        "prescriptions"
      ).filter((item) => item.is_active === true);

      const exerciseList = getList(exerciseResponse, "exercises");

      setPrescriptions(prescriptionList);
      setExercises(exerciseList);

      setSelectedPrescriptionId((current) => {
        const preferredId = initialPrescriptionId
          ? String(initialPrescriptionId)
          : current;

        if (
          preferredId &&
          prescriptionList.some(
            (item) => String(item.id) === preferredId
          )
        ) {
          return preferredId;
        }

        return prescriptionList[0]?.id
          ? String(prescriptionList[0].id)
          : "";
      });
    } catch (err) {
      setError(
        err?.message || "Unable to load your active prescriptions."
      );
    } finally {
      setLoading(false);
    }
  }, [initialPrescriptionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Restore the saved session from the backend after a page refresh.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!activeSession?.id) return;

      setRestoring(true);

      try {
        const response = await getSession(activeSession.id);

        if (cancelled) return;

        const restored = {
          ...activeSession,
          ...response,
          exercise_name:
            activeSession.exercise_name ||
            response.exercise_name ||
            "Prescribed exercise",
        };

        setActiveSession(restored);

        // Keep the most recent session locally, including terminal sessions.
        // This allows its saved metrics to remain accessible after a refresh.
        saveStoredSession(sessionStorageKey, restored);
      } catch (err) {
        if (!cancelled) {
          setActionError(
            `The saved session could not be refreshed from the server: ${
              err?.message || "Unknown error"
            }. The locally saved session details are still shown.`
          );
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, [sessionStorageKey]);

  // Retrieve actual saved repetition metrics for the current session.
  const loadMetrics = useCallback(async () => {
    if (!activeSession?.id) {
      setMetrics([]);
      setMetricsError("");
      return;
    }

    setMetricsLoading(true);
    setMetricsError("");

    try {
      const response = await getSessionMetrics(activeSession.id);
      setMetrics(getMetricList(response));
    } catch (err) {
      setMetrics([]);
      setMetricsError(
        err?.message || "Unable to retrieve repetition metrics."
      );
    } finally {
      setMetricsLoading(false);
    }
  }, [activeSession?.id]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const exerciseMap = useMemo(
    () =>
      new Map(
        exercises.map((exercise) => [String(exercise.id), exercise])
      ),
    [exercises]
  );

  const selectedPrescription = prescriptions.find(
    (item) => String(item.id) === String(selectedPrescriptionId)
  );

  const selectedExercise = selectedPrescription
    ? exerciseMap.get(String(selectedPrescription.exercise_id))
    : null;

  const sessionStatus = String(activeSession?.status || "").toUpperCase();

  const sessionIsOpen =
    activeSession && ["IN_PROGRESS", "PENDING_SYNC"].includes(sessionStatus);

  const sessionIsTerminal =
    activeSession &&
    ["COMPLETED", "INCOMPLETE", "UNABLE_TO_ASSESS"].includes(sessionStatus);

  const assessedCount = metrics.filter(
    (item) => item.assessment_status === "ASSESSED"
  ).length;

  const unableToAssessCount = metrics.filter(
    (item) => item.assessment_status === "UNABLE_TO_ASSESS"
  ).length;

  const handleStartSession = async () => {
    setActionError("");
    setSuccessMessage("");

    if (!selectedPrescription) {
      setActionError(
        "Choose an active prescription before starting a session."
      );
      return;
    }

    if (sessionIsOpen) {
      setActionError(
        "Finish or mark the current session incomplete before starting another."
      );
      return;
    }

    setSubmitting(true);

    const clientSessionId = makeClientSessionId();
    const startedAt = new Date().toISOString();

    try {
      const response = await createSession({
        prescription_id: selectedPrescription.id,
        client_session_id: clientSessionId,
        started_at: startedAt,
      });

      const session = {
        ...response,
        client_session_id:
          response?.client_session_id || clientSessionId,
        started_at: response?.started_at || startedAt,
        exercise_name:
          selectedPrescription.exercise_name ||
          selectedExercise?.name ||
          "Prescribed exercise",
        target_sets: selectedPrescription.target_sets,
        target_reps: selectedPrescription.target_reps,
      };

      setActiveSession(session);
      setMetrics([]);
      saveStoredSession(sessionStorageKey, session);

      setSuccessMessage(
        "Your session has been started and recorded."
      );
    } catch (err) {
      setActionError(
        err?.message || "Unable to start your session. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishSession = async (status) => {
    if (!activeSession?.id) {
      setActionError("No active session is available to update.");
      return;
    }

    setSubmitting(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await completeSession(
        activeSession.id,
        status
      );

      const updatedSession = {
        ...activeSession,
        ...response,
        status: response?.status || status,
        completed_at:
          response?.completed_at || new Date().toISOString(),
      };

      setActiveSession(updatedSession);
      // Preserve the last session so its metrics remain available after refresh.
      saveStoredSession(sessionStorageKey, updatedSession);

      setSuccessMessage(
        status === "COMPLETED"
          ? "Session marked as completed (patient-reported)."
          : status === "UNABLE_TO_ASSESS"
            ? "Session marked as unable to assess (patient-reported). No AI assessment was generated."
            : "Session marked as incomplete."
      );
    } catch (err) {
      setActionError(
        err?.message || "Unable to update the session. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncSession = async () => {
    if (!activeSession?.id) {
      setActionError("No session is available to synchronize.");
      return;
    }

    if (!sessionIsTerminal) {
      setActionError("Only a completed or terminal session can be synchronized.");
      return;
    }

    setSyncing(true);
    setActionError("");
    setSuccessMessage("");

    try {
      // This call confirms synchronization of the server-created session record.
      // No local AI metrics are uploaded because this page does not generate or
      // queue movement-analysis results yet.
      const syncResponse = await syncSession(activeSession.id);

      const updatedSession = {
        ...activeSession,
        ...syncResponse,
      };

      setActiveSession(updatedSession);
      saveStoredSession(sessionStorageKey, updatedSession);
      await loadMetrics();

      setSuccessMessage(
        "Session record synchronization confirmed. No locally generated AI metrics were uploaded."
      );
    } catch (err) {
      setActionError(
        err?.message || "Unable to synchronize this session. Please try again."
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleNavigation = (view) => {
    onNavigate?.(view);
  };

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

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.view}
                  onClick={() => handleNavigation(item.view)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${
                    item.view === "session"
                      ? "bg-[#EAF1F8] text-[#087F73]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </button>
              );
            })}
          </nav>
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
          <div className="text-xs font-medium text-gray-500">
            Movexa <span className="mx-2">/</span>
            <span className="font-bold text-[#193B62]">
              Exercise Session
            </span>
          </div>

          <button
            onClick={() => handleNavigation("profile")}
            className="flex items-center gap-2 text-xs font-semibold text-[#087F73]"
          >
            <UserRound size={16} />
            My Profile
          </button>
        </header>

        <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
          <section>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
              Guided Rehabilitation
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#20252B] md:text-3xl">
              Exercise Session
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Start and review a session against one of your prescriptions.
            </p>
          </section>

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              {successMessage}
            </div>
          )}

          {actionError && <ErrorNotice message={actionError} />}

          {error && <ErrorNotice message={error} onRetry={loadData} />}

          {loading ? (
            <div className="rounded-xl border border-[#D9E3ED] bg-white p-10 text-center">
              <RefreshCw
                className="mx-auto animate-spin text-[#087F73]"
                size={24}
              />

              <p className="mt-3 text-sm text-gray-500">
                Loading your active prescriptions...
              </p>
            </div>
          ) : (
            <section className="rounded-2xl border border-[#D9E3ED] bg-white p-5 shadow-sm md:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#EAF1F8] p-2.5 text-[#087F73]">
                  <Dumbbell size={21} />
                </div>

                <div>
                  <h2 className="text-base font-bold">
                    Choose your prescribed exercise
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Only active prescriptions can start a new session.
                  </p>
                </div>
              </div>

              {prescriptions.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[#D9E3ED] bg-[#F8FAFC] p-8 text-center">
                  <ClipboardList
                    className="mx-auto text-gray-300"
                    size={28}
                  />

                  <p className="mt-3 text-sm font-semibold text-[#193B62]">
                    No active prescriptions available
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Ask your physiotherapist to assign an exercise before
                    starting a session.
                  </p>
                </div>
              ) : (
                <>
                  <label className="mt-6 block text-xs font-bold text-[#193B62]">
                    Active prescription
                  </label>

                  <select
                    value={selectedPrescriptionId}
                    onChange={(event) =>
                      setSelectedPrescriptionId(event.target.value)
                    }
                    disabled={Boolean(sessionIsOpen)}
                    className="mt-2 w-full rounded-xl border border-[#D9E3ED] bg-[#F4F7FB] p-3 text-sm text-[#193B62] outline-none focus:border-[#087F73] disabled:opacity-60"
                  >
                    {prescriptions.map((prescription) => {
                      const exercise = exerciseMap.get(
                        String(prescription.exercise_id)
                      );

                      return (
                        <option
                          key={prescription.id}
                          value={prescription.id}
                        >
                          {prescription.exercise_name ||
                            exercise?.name ||
                            "Prescribed exercise"}{" "}
                          — {prescription.target_sets} sets ×{" "}
                          {prescription.target_reps} reps
                        </option>
                      );
                    })}
                  </select>

                  {selectedPrescription && (
                    <div className="mt-4 rounded-xl bg-[#F4F7FB] p-4">
                      <h3 className="text-sm font-bold text-[#193B62]">
                        {selectedPrescription.exercise_name ||
                          selectedExercise?.name ||
                          "Prescribed exercise"}
                      </h3>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-[10px] font-bold uppercase text-gray-500">
                            Target sets
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {selectedPrescription.target_sets}
                          </p>
                        </div>

                        <div className="rounded-lg bg-white p-3">
                          <p className="text-[10px] font-bold uppercase text-gray-500">
                            Repetitions per set
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {selectedPrescription.target_reps}
                          </p>
                        </div>
                      </div>

                      {selectedExercise?.instructions && (
                        <p className="mt-3 whitespace-pre-line text-xs leading-5 text-gray-600">
                          {selectedExercise.instructions}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleStartSession}
                    disabled={
                      submitting ||
                      !selectedPrescription ||
                      Boolean(sessionIsOpen)
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#087F73] px-5 py-3 text-sm font-bold text-white hover:bg-[#06655c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting && (
                      <RefreshCw size={15} className="animate-spin" />
                    )}

                    {submitting ? "Starting session..." : "Start Session"}
                  </button>
                </>
              )}
            </section>
          )}

          {activeSession && (
            <section className="rounded-2xl border border-[#D9E3ED] bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
                    Session record
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[#193B62]">
                    {activeSession.exercise_name ||
                      "Rehabilitation session"}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Session ID: {activeSession.id}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                    sessionIsOpen
                      ? "bg-blue-50 text-blue-700"
                      : activeSession.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {String(activeSession.status || "UNKNOWN").replaceAll(
                    "_",
                    " "
                  )}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F4F7FB] p-3">
                  <p className="text-[10px] font-bold uppercase text-gray-500">
                    Started at
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatDateTime(activeSession.started_at)}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F4F7FB] p-3">
                  <p className="text-[10px] font-bold uppercase text-gray-500">
                    Target
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {activeSession.target_sets ?? "—"} sets ×{" "}
                    {activeSession.target_reps ?? "—"} reps
                  </p>
                </div>
              </div>

              {restoring && (
                <p className="mt-3 text-xs text-gray-500">
                  Refreshing saved session from the server...
                </p>
              )}

              {sessionIsOpen ? (
                <>
                  {String(activeSession.status || "").toUpperCase() === "PENDING_SYNC" ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                      This session is marked as pending synchronization. The
                      complete offline recording and metric-upload workflow is
                      not implemented yet. Do not assume locally recorded
                      analysis has reached the server.
                    </div>
                  ) : null}
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                    This session is recorded by the server. Camera-based movement
                    analysis, automatic repetition counting and metric submission
                    are not connected yet. Completing this session is currently
                    a patient-reported action, not an AI-verified assessment.
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => handleFinishSession("COMPLETED")}
                      disabled={submitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#087F73] px-4 py-3 text-sm font-bold text-white hover:bg-[#06655c] disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      Mark Completed
                    </button>

                    <button
                      onClick={() => handleFinishSession("INCOMPLETE")}
                      disabled={submitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Mark Incomplete
                    </button>

                    <button
                      onClick={() => handleFinishSession("UNABLE_TO_ASSESS")}
                      disabled={submitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <AlertCircle size={16} />
                      Unable to Assess
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-[#D9E3ED] bg-[#F8FAFC] p-3 text-xs leading-5 text-gray-600">
                    This session is no longer active. Its saved assessment results
                    remain available below. You can start another session using
                    an active prescription.
                  </div>

                  {sessionIsTerminal && !activeSession.synced_at && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs leading-5 text-amber-900">
                        The backend has a session-sync endpoint. This action
                        synchronizes the session record only; this page does not
                        currently store offline AI metrics for upload.
                      </p>

                      <button
                        onClick={handleSyncSession}
                        disabled={syncing || restoring}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#087F73] px-4 py-3 text-sm font-bold text-white hover:bg-[#06655c] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {syncing && (
                          <RefreshCw size={15} className="animate-spin" />
                        )}
                        {syncing ? "Synchronizing..." : "Sync Session Record"}
                      </button>
                    </div>
                  )}

                  {activeSession.synced_at && (
                    <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
                      Session record synchronized at {formatDateTime(activeSession.synced_at)}.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Saved repetition metrics */}
          {activeSession?.id && (
            <section className="rounded-2xl border border-[#D9E3ED] bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#EAF1F8] p-2.5 text-[#087F73]">
                    <BarChart3 size={21} />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-[#193B62]">
                      Repetition Assessment
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Saved assessment results for this session.
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadMetrics}
                  disabled={metricsLoading}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E3ED] px-3 py-2 text-xs font-bold text-[#087F73] hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={13}
                    className={metricsLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {metricsLoading ? (
                <div className="py-10 text-center">
                  <RefreshCw
                    className="mx-auto animate-spin text-[#087F73]"
                    size={22}
                  />

                  <p className="mt-3 text-xs text-gray-500">
                    Loading saved repetition metrics...
                  </p>
                </div>
              ) : metricsError ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">
                    Unable to load repetition metrics
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    {metricsError}
                  </p>
                </div>
              ) : metrics.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-[#D9E3ED] bg-[#F8FAFC] p-8 text-center">
                  <BarChart3
                    className="mx-auto text-gray-300"
                    size={28}
                  />

                  <p className="mt-3 text-sm font-semibold text-[#193B62]">
                    No repetition metrics saved
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Assessment results will appear here after repetition
                    metrics have been submitted by the movement-analysis
                    workflow.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#F4F7FB] p-3">
                      <p className="text-[10px] font-bold uppercase text-gray-500">
                        Assessed repetitions
                      </p>

                      <p className="mt-1 text-2xl font-bold text-emerald-700">
                        {assessedCount}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F4F7FB] p-3">
                      <p className="text-[10px] font-bold uppercase text-gray-500">
                        Unable to assess
                      </p>

                      <p className="mt-1 text-2xl font-bold text-amber-700">
                        {unableToAssessCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {metrics.map((metric, index) => (
                      <RepetitionMetricCard
                        key={metric.id || metric.rep_number || index}
                        metric={metric}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-[#D9E3ED] bg-white p-5">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 text-[#087F73]" size={19} />

              <div>
                <h3 className="text-sm font-bold text-[#193B62]">
                  Assessment data integrity
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  This page displays metrics retrieved from the backend. It
                  does not calculate movement scores or generate assessment
                  results. An empty metrics list means no metrics have been
                  saved for this session yet. Camera analysis and AI model
                  integration remain separate development tasks.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}