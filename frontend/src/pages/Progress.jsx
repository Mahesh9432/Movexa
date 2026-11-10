import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../lib/api";

const PAGE_SIZE = 20;

const STATUS_STYLES = {
  COMPLETED: "bg-green-500/15 text-green-300",
  IN_PROGRESS: "bg-cyan-500/15 text-cyan-300",
  INCOMPLETE: "bg-yellow-500/15 text-yellow-300",
  UNABLE_TO_ASSESS: "bg-red-500/15 text-red-300",
};

function formatNumber(value, digits = 1, suffix = "") {
  if (!Number.isFinite(value)) return "--";
  return `${value.toFixed(digits)}${suffix}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return "In progress";
  const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(duration) || duration < 0) return "-";
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function statusLabel(status) {
  return String(status || "").split("_").join(" ");
}

export default function Progress() {
  const [params] = useSearchParams();
  const requestedSessionId = params.get("sessionId");
  const requestedPatientId = params.get("patientId");
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [patients, setPatients] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState(
    requestedSessionId || ""
  );
  const [repState, setRepState] = useState({
    sessionId: null,
    items: [],
    loading: false,
  });
  const [loading, setLoading] = useState(true);
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState("");
  const [summaryOffset, setSummaryOffset] = useState(0);
  const [summaryHasMore, setSummaryHasMore] = useState(false);
  const [repStatus, setRepStatus] = useState("");
  const [repOffset, setRepOffset] = useState(0);
  const [repHasMore, setRepHasMore] = useState(false);
  const [error, setError] = useState("");
  const [repsError, setRepsError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data: user } = await api.get("/users/me");
        const { data: patientData } = await api.get("/patients");
        const assignmentData =
          user.role === "PHYSIOTHERAPIST"
            ? (await api.get("/assignments")).data
            : [];
        const { data: summaryData } = await api.get(
          `/sessions/summary?limit=${PAGE_SIZE}`
        );

        if (!active) return;

        setMe(user);
        setPatients(patientData);
        setAssignments(assignmentData);
        setSummaries(summaryData);
        setSummaryHasMore(summaryData.length === PAGE_SIZE);
        setError("");

        if (user.role === "PHYSIOTHERAPIST") {
          const assignedIds = new Set(
            assignmentData
              .filter((assignment) => assignment.status === "ACTIVE")
              .map((assignment) => assignment.patient_id)
          );
          const requestedSession = requestedSessionId
            ? summaryData.find((session) => session.id === requestedSessionId)
            : null;
          const requestedPatient =
            requestedPatientId && assignedIds.has(requestedPatientId)
              ? requestedPatientId
              : requestedSession && assignedIds.has(requestedSession.patient_id)
                ? requestedSession.patient_id
                : null;
          const latestPatient = summaryData.find((session) =>
            assignedIds.has(session.patient_id)
          )?.patient_id;
          const fallbackPatient = patientData.find((patient) =>
            assignedIds.has(patient.id)
          )?.id;

          setSelectedPatient(
            requestedPatient || latestPatient || fallbackPatient || ""
          );
        } else {
          setSelectedPatient(patientData[0]?.id || "");
        }

        if (requestedSessionId) setSelectedSessionId(requestedSessionId);
      } catch (loadError) {
        if (active) {
          setError(
            loadError?.response?.data?.detail || "Unable to load progress data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [requestedPatientId, requestedSessionId]);

  const loadSummaries = useCallback(
    async ({ patientId, status, offset, append }) => {
      if (!patientId) {
        setSummaries([]);
        setSummaryHasMore(false);
        return;
      }

      const query = new URLSearchParams();
      query.set("patient_id", patientId);
      query.set("limit", String(PAGE_SIZE));
      query.set("offset", String(offset));
      if (status) query.set("status", status);

      setSummariesLoading(true);
      try {
        const { data } = await api.get(`/sessions/summary?${query.toString()}`);
        setSummaries((current) => (append ? [...current, ...data] : data));
        setSummaryOffset(offset);
        setSummaryHasMore(data.length === PAGE_SIZE);
        setError("");
      } catch (loadError) {
        setError(
          loadError?.response?.data?.detail ||
            "Unable to load session history."
        );
        if (!append) setSummaries([]);
      } finally {
        setSummariesLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummaries({
      patientId: selectedPatient,
      status: summaryStatus,
      offset: 0,
      append: false,
    });
  }, [loadSummaries, selectedPatient, summaryStatus]);

  const assignedPatientIds = useMemo(
    () =>
      new Set(
        assignments
          .filter((assignment) => assignment.status === "ACTIVE")
          .map((assignment) => assignment.patient_id)
      ),
    [assignments]
  );

  const availablePatients = useMemo(() => {
    if (me?.role !== "PHYSIOTHERAPIST") return patients;
    return patients.filter((patient) => assignedPatientIds.has(patient.id));
  }, [assignedPatientIds, me?.role, patients]);

  const patientSummaries = useMemo(
    () =>
      summaries.filter((summary) => summary.patient_id === selectedPatient),
    [selectedPatient, summaries]
  );

  const defaultSessionId =
    patientSummaries.find((summary) => summary.status !== "IN_PROGRESS")?.id ||
    patientSummaries[0]?.id ||
    null;

  const resolvedSessionId = patientSummaries.some(
    (summary) => summary.id === selectedSessionId
  )
    ? selectedSessionId
    : defaultSessionId;

  const selectedSummary =
    patientSummaries.find((summary) => summary.id === resolvedSessionId) ||
    null;

  const reps = useMemo(
    () => (repState.sessionId === resolvedSessionId ? repState.items : []),
    [repState, resolvedSessionId]
  );
  const repsLoading =
    repState.sessionId === resolvedSessionId && repState.loading;

  const loadReps = useCallback(
    async ({ sessionId, status, offset, append }) => {
      if (!sessionId) {
        setRepState({ sessionId: null, items: [], loading: false });
        setRepHasMore(false);
        return;
      }

      const query = new URLSearchParams();
      query.set("session_id", sessionId);
      query.set("limit", String(PAGE_SIZE));
      query.set("offset", String(offset));
      if (status) query.set("assessment_status", status);

      setRepsError("");
      setRepState((current) => ({
        sessionId,
        items: append && current.sessionId === sessionId ? current.items : [],
        loading: true,
      }));
      try {
        const { data } = await api.get(`/rep-metrics?${query.toString()}`);
        setRepState((current) => ({
          sessionId,
          items:
            append && current.sessionId === sessionId
              ? [...current.items, ...data]
              : data,
          loading: false,
        }));
        setRepOffset(offset);
        setRepHasMore(data.length === PAGE_SIZE);
      } catch (loadError) {
        setRepsError(
          loadError?.response?.data?.detail || "Unable to load rep metrics."
        );
        setRepState({ sessionId, items: [], loading: false });
      }
    },
    []
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReps({
      sessionId: resolvedSessionId,
      status: repStatus,
      offset: 0,
      append: false,
    });
  }, [loadReps, repStatus, resolvedSessionId]);

  const repChartData = useMemo(
    () =>
      reps
        .filter((rep) => rep.range_of_motion !== null)
        .map((rep) => ({
          rep: rep.rep_number,
          rom: rep.range_of_motion,
          confidence: rep.confidence,
        })),
    [reps]
  );

  const trendData = useMemo(
    () =>
      [...patientSummaries]
        .reverse()
        .filter(
          (summary) => summary.rep_count > 0 && summary.avg_rom !== null
        )
        .map((summary) => ({
          session: formatShortDate(summary.started_at),
          avgRom: summary.avg_rom,
          reps: summary.rep_count,
          assessed: summary.assessed_count,
        })),
    [patientSummaries]
  );

  const issueCounts = useMemo(() => {
    const counts = new Map();
    reps.forEach((rep) => {
      if (!Array.isArray(rep.detected_issues)) return;
      rep.detected_issues.forEach((issue) => {
        counts.set(issue, (counts.get(issue) || 0) + 1);
      });
    });
    return [...counts.entries()].sort((first, second) => second[1] - first[1]);
  }, [reps]);

  const activePatient = availablePatients.find(
    (patient) => patient.id === selectedPatient
  );

  const choosePatient = (patientId) => {
    setSelectedPatient(patientId);
    setSelectedSessionId("");
  };

  const changeSummaryStatus = (value) => {
    setSummaryStatus(value);
    setSelectedSessionId("");
  };

  const loadMoreSummaries = () =>
    loadSummaries({
      patientId: selectedPatient,
      status: summaryStatus,
      offset: summaryOffset + PAGE_SIZE,
      append: true,
    });

  const loadMoreReps = () =>
    loadReps({
      sessionId: resolvedSessionId,
      status: repStatus,
      offset: repOffset + PAGE_SIZE,
      append: true,
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        Loading progress...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">Progress</h1>
            <p className="text-sm text-slate-400 mt-1">
              {activePatient
                ? `${activePatient.full_name || `Patient ${activePatient.id.slice(0, 8)}`} | ${
                    activePatient.injury || "No injury noted"
                  }`
                : "Session history and movement trends"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {me?.role === "PHYSIOTHERAPIST" && availablePatients.length > 0 && (
              <select
                value={selectedPatient}
                onChange={(event) => choosePatient(event.target.value)}
                className="bg-slate-800 rounded px-3 py-2 text-sm"
              >
                {availablePatients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name || `Patient ${patient.id.slice(0, 8)}`} |{" "}
                    {patient.affected_area || patient.injury || "General"}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-slate-700 px-3 py-2 rounded text-sm"
            >
              Dashboard
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {summariesLoading && patientSummaries.length === 0 ? (
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-semibold">Loading sessions...</h2>
          </div>
        ) : patientSummaries.length === 0 ? (
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="font-semibold">
              {summaryStatus
                ? "No sessions match this filter"
                : "No sessions recorded yet"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {summaryStatus
                ? "Try a different status filter."
                : me?.role === "PHYSIOTHERAPIST"
                  ? "This patient has no assigned sessions yet."
                  : "Complete an exercise session from the dashboard to see progress here."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid lg:grid-cols-[320px_1fr] gap-6">
            <aside>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">Session History</h2>
                <select
                  value={summaryStatus}
                  onChange={(event) => changeSummaryStatus(event.target.value)}
                  className="bg-slate-800 rounded px-2 py-1 text-xs"
                >
                  <option value="">All statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="INCOMPLETE">Incomplete</option>
                  <option value="UNABLE_TO_ASSESS">Unable to assess</option>
                  <option value="IN_PROGRESS">In progress</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {patientSummaries.length} session
                {patientSummaries.length === 1 ? "" : "s"} shown
              </p>
              <div className="mt-3 space-y-2 max-h-[75vh] overflow-y-auto pr-1">
                {patientSummaries.map((summary) => {
                  const isActive = summary.id === resolvedSessionId;
                  return (
                    <button
                      key={summary.id}
                      onClick={() => setSelectedSessionId(summary.id)}
                      className={`w-full text-left rounded-lg border p-3 transition ${
                        isActive
                          ? "border-cyan-400 bg-slate-800"
                          : "border-slate-800 bg-slate-900/60 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">
                          {summary.exercise_name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            STATUS_STYLES[summary.status] ||
                            "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {statusLabel(summary.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDateTime(summary.started_at)}
                      </p>
                      <p className="text-xs text-slate-300 mt-2">
                        {summary.rep_count} reps | avg ROM{" "}
                        {formatNumber(summary.avg_rom, 1, " deg")}
                      </p>
                    </button>
                  );
                })}
                {summaryHasMore && (
                  <button
                    onClick={loadMoreSummaries}
                    disabled={summariesLoading}
                    className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  >
                    {summariesLoading ? "Loading..." : "Load more sessions"}
                  </button>
                )}
              </div>
            </aside>

            <section className="min-w-0">
              {selectedSummary && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {selectedSummary.exercise_name}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {formatDateTime(selectedSummary.started_at)} |{" "}
                        {formatDuration(
                          selectedSummary.started_at,
                          selectedSummary.completed_at
                        )}{" "}
                        | Target joint: {selectedSummary.target_joint}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        STATUS_STYLES[selectedSummary.status] ||
                        "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {statusLabel(selectedSummary.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-slate-800 rounded p-3">
                      <p className="text-xs text-slate-400">Reps</p>
                      <p className="font-semibold">
                        {selectedSummary.rep_count} /{" "}
                        {selectedSummary.target_reps}
                      </p>
                    </div>
                    <div className="bg-slate-800 rounded p-3">
                      <p className="text-xs text-slate-400">Assessed</p>
                      <p className="font-semibold text-green-300">
                        {selectedSummary.assessed_count}
                      </p>
                    </div>
                    <div className="bg-slate-800 rounded p-3">
                      <p className="text-xs text-slate-400">Unable to assess</p>
                      <p className="font-semibold text-amber-300">
                        {selectedSummary.unable_count}
                      </p>
                    </div>
                    <div className="bg-slate-800 rounded p-3">
                      <p className="text-xs text-slate-400">Avg ROM</p>
                      <p className="font-semibold">
                        {formatNumber(selectedSummary.avg_rom, 1, " deg")}
                      </p>
                    </div>
                    <div className="bg-slate-800 rounded p-3">
                      <p className="text-xs text-slate-400">Best ROM</p>
                      <p className="font-semibold">
                        {formatNumber(selectedSummary.best_rom, 1, " deg")}
                      </p>
                    </div>
                    <div className="bg-slate-800 rounded p-3">
                      <p className="text-xs text-slate-400">Avg confidence</p>
                      <p className="font-semibold">
                        {formatNumber(selectedSummary.avg_confidence, 2)}
                      </p>
                    </div>
                  </div>

                  {issueCounts.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {issueCounts.map(([issue, count]) => (
                        <span
                          key={issue}
                          className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-300"
                        >
                          {issue} x{count}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 bg-slate-800 rounded-lg p-4">
                    <h3 className="font-semibold">Rep ROM</h3>
                    {repChartData.length > 0 ? (
                      <div className="h-64 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={repChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="rep" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" unit=" deg" />
                            <Tooltip
                              formatter={(value) => [
                                `${Number(value).toFixed(1)} deg`,
                                "ROM",
                              ]}
                              labelFormatter={(value) => `Rep ${value}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="rom"
                              stroke="#22d3ee"
                              strokeWidth={2}
                              name="ROM"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 mt-2">
                        No assessed reps with range-of-motion data.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 bg-slate-800 rounded-lg p-4">
                    <h3 className="font-semibold">Average ROM by Session</h3>
                    {trendData.length > 0 ? (
                      <div className="h-64 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="session" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" unit=" deg" />
                            <Tooltip
                              formatter={(value) => [
                                `${Number(value).toFixed(1)} deg`,
                                "Avg ROM",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="avgRom"
                              stroke="#a78bfa"
                              strokeWidth={2}
                              name="Avg ROM"
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 mt-2">
                        No session trend data yet.
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">Rep Details</h3>
                      <select
                        value={repStatus}
                        onChange={(event) => setRepStatus(event.target.value)}
                        className="bg-slate-800 rounded px-2 py-1 text-xs"
                      >
                        <option value="">All reps</option>
                        <option value="ASSESSED">Assessed</option>
                        <option value="UNABLE_TO_ASSESS">
                          Unable to assess
                        </option>
                      </select>
                    </div>
                    {repsLoading && reps.length === 0 ? (
                      <p className="text-sm text-slate-400 mt-2">
                        Loading reps...
                      </p>
                    ) : reps.length === 0 ? (
                      <p className="text-sm text-slate-400 mt-2">
                        {repStatus
                          ? "No reps match this filter."
                          : "No reps recorded for this session."}
                      </p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {reps.map((rep) => (
                          <div
                            key={rep.id}
                            className="bg-slate-800 rounded p-3 text-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold">
                                Set {rep.set_number ?? 1} | Rep{" "}
                                {rep.rep_number}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  rep.assessment_status === "ASSESSED"
                                    ? "bg-green-500/15 text-green-300"
                                    : "bg-amber-500/15 text-amber-300"
                                }`}
                              >
                                {statusLabel(rep.assessment_status)}
                              </span>
                            </div>
                            <p className="text-slate-400 mt-1">
                              ROM{" "}
                              {rep.range_of_motion !== null
                                ? formatNumber(rep.range_of_motion, 1, " deg")
                                : "--"}{" "}
                              | confidence {formatNumber(rep.confidence, 2)}
                            </p>
                            {rep.feedback && (
                              <p className="text-slate-300 mt-1">
                                {rep.feedback}
                              </p>
                            )}
                            {Array.isArray(rep.detected_issues) &&
                              rep.detected_issues.length > 0 && (
                                <p className="text-xs text-amber-300 mt-1">
                                  {rep.detected_issues.join(", ")}
                                </p>
                              )}
                          </div>
                        ))}
                        {repHasMore && (
                          <button
                            onClick={loadMoreReps}
                            disabled={repsLoading}
                            className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                          >
                            {repsLoading ? "Loading..." : "Load more reps"}
                          </button>
                        )}
                      </div>
                    )}
                    {repsError && (
                      <p className="text-sm text-red-400 mt-2">{repsError}</p>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
