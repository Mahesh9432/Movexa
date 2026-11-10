import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import PoseOverlay from "../components/PoseOverlay";
import { usePoseTracking } from "../hooks/usePoseTracking";

const ASSESSED_CONFIDENCE = 0.5;
const TRUNK_LEAN_THRESHOLD = 12;
const SESSION_STORAGE_PREFIX = "movexa:active-session";

function getSessionStorageKey(patientId, prescriptionId) {
  return `${SESSION_STORAGE_PREFIX}:${patientId}:${prescriptionId}`;
}

function readStoredSessionId(storageKey) {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function storeSessionId(storageKey, clientSessionId) {
  try {
    window.localStorage.setItem(storageKey, clientSessionId);
  } catch {
    return;
  }
}

function clearStoredSessionId(storageKey) {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    return;
  }
}

function round(value, digits = 1) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatValue(value, digits = 1, suffix = "") {
  if (!Number.isFinite(value)) return "--";
  return `${value.toFixed(digits)}${suffix}`;
}

export default function Session() {
  const [params] = useSearchParams();
  const patientId = params.get("patientId");
  const prescriptionId = params.get("prescriptionId");
  const exerciseId = params.get("exerciseId");
  const exerciseName = params.get("exerciseName") || "Exercise";
  const targetJoint = params.get("targetJoint") || "Knee";
  const targetRepsValue = Number(params.get("targetReps"));
  const targetReps =
    Number.isFinite(targetRepsValue) && targetRepsValue > 0
      ? targetRepsValue
      : null;
  const targetSetsValue = Number(params.get("targetSets"));
  const targetSets =
    Number.isFinite(targetSetsValue) && targetSetsValue > 0
      ? targetSetsValue
      : null;
  const missingSessionParams = !patientId || !prescriptionId;
  const storageKey = getSessionStorageKey(patientId, prescriptionId);

  const [session, setSession] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [reps, setReps] = useState([]);
  const [rom, setRom] = useState("");
  const [confidence, setConfidence] = useState("0.8");
  const [comp, setComp] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [trackedSide, setTrackedSide] = useState("auto");
  const [currentSet, setCurrentSet] = useState(1);
  const [setRepCount, setSetRepCount] = useState(0);
  const currentSetRef = useRef(1);
  const setRepCountRef = useRef(0);
  const videoRef = useRef(null);
  const repQueueRef = useRef(Promise.resolve());
  const clientSessionIdRef = useRef(
    readStoredSessionId(storageKey) || crypto.randomUUID()
  );
  const startedAtRef = useRef(new Date().toISOString());
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    if (!patientId || !prescriptionId) return undefined;

    (async () => {
      try {
        const createSession = (clientSessionId) =>
          api.post("/sessions", {
            patient_id: patientId,
            prescription_id: prescriptionId,
            started_at: startedAtRef.current,
            client_session_id: clientSessionId,
          });

        let clientSessionId = clientSessionIdRef.current;
        let response = await createSession(clientSessionId);

        if (response.data.status !== "IN_PROGRESS") {
          clientSessionId = crypto.randomUUID();
          clientSessionIdRef.current = clientSessionId;
          response = await createSession(clientSessionId);
        }

        if (!active) return;

        storeSessionId(storageKey, clientSessionId);
        setSession(response.data);

        try {
          const { data: savedReps } = await api.get(
            `/rep-metrics?session_id=${response.data.id}`
          );
          if (active) {
            setReps(savedReps);
            const maxSet = savedReps.reduce(
              (max, rep) => Math.max(max, rep.set_number ?? 1),
              1
            );
            const countInMaxSet = savedReps.filter(
              (rep) => (rep.set_number ?? 1) === maxSet
            ).length;
            if (
              targetReps &&
              countInMaxSet >= targetReps &&
              (!targetSets || maxSet < targetSets)
            ) {
              currentSetRef.current = maxSet + 1;
              setRepCountRef.current = 0;
            } else {
              currentSetRef.current = maxSet;
              setRepCountRef.current = savedReps.length ? countInMaxSet : 0;
            }
            setCurrentSet(currentSetRef.current);
            setSetRepCount(setRepCountRef.current);
          }
        } catch {
          if (active) setApiError("Unable to load saved reps.");
        }
      } catch (error) {
        if (active) {
          setApiError(
            error?.response?.data?.detail || "Unable to start session."
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [patientId, prescriptionId, storageKey, targetReps, targetSets]);

  useEffect(() => {
    if (!exerciseId) return undefined;
    let active = true;

    api
      .get(`/exercises/${exerciseId}`)
      .then(({ data }) => {
        if (active) setExercise(data);
      })
      .catch(() => {
        if (active) setExercise(null);
      });

    return () => {
      active = false;
    };
  }, [exerciseId]);

  const advanceSetAfterRep = useCallback(() => {
    setRepCountRef.current += 1;
    if (targetReps && setRepCountRef.current >= targetReps) {
      if (targetSets && currentSetRef.current >= targetSets) {
        setRepCountRef.current = targetReps;
      } else {
        currentSetRef.current += 1;
        setRepCountRef.current = 0;
      }
    }
    setCurrentSet(currentSetRef.current);
    setSetRepCount(setRepCountRef.current);
  }, [targetReps, targetSets, setCurrentSet, setSetRepCount]);

  const saveRep = useCallback((payload) => {
    repQueueRef.current = repQueueRef.current.then(async () => {
      try {
        const { data } = await api.post("/rep-metrics", {
          ...payload,
          set_number: currentSetRef.current,
        });
        setReps((current) => [...current, data]);
        advanceSetAfterRep();
      } catch (error) {
        setApiError(
          error?.response?.data?.detail || "Unable to save rep metric."
        );
      }
    });
    return repQueueRef.current;
  }, [advanceSetAfterRep, setApiError, setReps]);

  const handleAutoRep = useCallback(
    async (rep) => {
      if (!session) return;

      const confidenceValue = Number.isFinite(rep.confidence)
        ? rep.confidence
        : 0;
      const range = rep.rep?.range ?? rep.range;
      const assessed =
        confidenceValue >= ASSESSED_CONFIDENCE && Number.isFinite(range);
      const trunkLean = Number.isFinite(rep.trunkLean) ? rep.trunkLean : null;
      const trunkLeanFlag =
        trunkLean !== null && trunkLean > TRUNK_LEAN_THRESHOLD;
      const kneeValgus = Boolean(rep.kneeValgus);
      const issues = [];

      if (trunkLeanFlag) issues.push("compensatory trunk lean");
      if (kneeValgus) issues.push("knee valgus");

      await saveRep({
        session_id: session.id,
        assessment_status: assessed ? "ASSESSED" : "UNABLE_TO_ASSESS",
        range_of_motion: assessed ? round(range, 1) : null,
        confidence: round(confidenceValue, 2),
        movement_data: {
          source: "mediapipe_pose_landmarker",
          joint: rep.joint,
          side: rep.side,
          angle: round(rep.angle, 1),
          min_angle: round(rep.minAngle, 1),
          max_angle: round(rep.maxAngle, 1),
          trunk_lean_degrees: round(trunkLean, 1),
        },
        compensation_flags: {
          trunk_lean: trunkLeanFlag,
          trunk_lean_degrees: round(trunkLean, 1),
          knee_valgus: kneeValgus,
        },
        detected_issues: issues,
        feedback: assessed
          ? issues.length
            ? "Keep the trunk upright and knees aligned."
            : "Good rep."
          : "Low-confidence pose; rep not assessed.",
      });
    },
    [saveRep, session]
  );

  const trackingJoint =
    trackedSide === "auto" ? targetJoint : `${trackedSide} ${targetJoint}`;

  const pose = usePoseTracking({
    videoRef,
    enabled: Boolean(session) && !finishing,
    targetJoint: trackingJoint,
    onRep: handleAutoRep,
  });

  const addManualRep = () => {
    if (!session) return;

    const confidenceValue = Number(confidence);
    const romValue = rom === "" ? null : Number(rom);
    const confident =
      Number.isFinite(confidenceValue) &&
      confidenceValue >= ASSESSED_CONFIDENCE;
    const assessed = confident && Number.isFinite(romValue);

    saveRep({
      session_id: session.id,
      assessment_status: assessed ? "ASSESSED" : "UNABLE_TO_ASSESS",
      range_of_motion: assessed ? round(romValue, 1) : null,
      confidence: Number.isFinite(confidenceValue)
        ? round(confidenceValue, 2)
        : null,
      movement_data: { source: "manual" },
      compensation_flags: { trunk_lean: comp },
      detected_issues: comp && assessed ? ["compensatory trunk lean"] : [],
      feedback: assessed
        ? comp
          ? "Avoid trunk lean"
          : "Good form"
        : confident
          ? "ROM required for assessment."
          : "Low-confidence rep; not assessed.",
    });

    setRom("");
    setComp(false);
  };

  const finish = async (status = "COMPLETED") => {
    if (!session || finishing) return;

    setFinishing(true);
    setApiError("");

    try {
      await repQueueRef.current;
      await api.post(`/sessions/${session.id}/complete?status=${status}`);
      clearStoredSessionId(storageKey);
      navigate(`/progress?sessionId=${session.id}`);
    } catch (error) {
      setApiError(
        error?.response?.data?.detail || "Unable to complete session."
      );
      setFinishing(false);
    }
  };

  const statusLabel = pose.isTracking
    ? "Tracking"
    : pose.isLoading
      ? "Starting"
      : pose.error
        ? "Tracking error"
        : "Idle";

  const statusClass = pose.isTracking
    ? "bg-green-500/15 text-green-300"
    : pose.error
      ? "bg-red-500/15 text-red-300"
      : "bg-amber-500/15 text-amber-300";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">
                {exerciseName}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Target joint: {targetJoint}
                {targetReps ? ` | Target reps: ${targetReps}` : ""}
                {targetSets ? ` | Target sets: ${targetSets}` : ""}
              </p>
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                Tracked side
                <select
                  value={trackedSide}
                  onChange={(event) => setTrackedSide(event.target.value)}
                  className="bg-slate-800 rounded px-2 py-1 text-slate-200"
                >
                  <option value="auto">Auto</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>

          {(exercise?.instructions || exercise?.video_url) && (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm">
              {exercise?.instructions && (
                <p className="text-slate-300">{exercise.instructions}</p>
              )}
              {exercise?.video_url && (
                <a
                  className="mt-1 inline-block text-xs text-cyan-400 underline"
                  href={exercise.video_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open guided video
                </a>
              )}
            </div>
          )}

          <div className="relative mt-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg bg-black"
            />
            <PoseOverlay videoRef={videoRef} landmarks={pose.landmarks} />
            {!pose.isTracking && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/60 px-6 text-center">
                <p className="text-sm text-slate-200">
                  {pose.isLoading
                    ? "Loading pose model and camera..."
                    : pose.error
                      ? "Pose tracking is unavailable. Manual entry is still enabled."
                      : !session
                        ? "Starting session..."
                        : "Waiting for camera..."}
                </p>
              </div>
            )}
          </div>

          {pose.error && (
            <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
              <p>{pose.error}</p>
              <p className="text-xs mt-1">
                Run `npm run setup:mediapipe` from the frontend directory if
                pose assets are missing.
              </p>
            </div>
          )}

          {missingSessionParams && (
            <p className="mt-3 text-sm text-red-400">
              Missing patient or prescription details.
            </p>
          )}

          {apiError && (
            <p className="mt-3 text-sm text-red-400">{apiError}</p>
          )}

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs">Live angle</p>
              <p className="font-semibold">
                {formatValue(pose.metrics?.angle, 1, " deg")}
              </p>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs">Current ROM</p>
              <p className="font-semibold">
                {formatValue(pose.metrics?.range, 1, " deg")}
              </p>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs">Confidence</p>
              <p className="font-semibold">
                {formatValue(pose.metrics?.confidence, 2)}
              </p>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs">Set</p>
              <p className="font-semibold">
                {currentSet}
                {targetSets ? ` / ${targetSets}` : ""}
              </p>
              {targetReps && (
                <p className="text-[10px] text-slate-400">
                  {setRepCount} / {targetReps} reps
                </p>
              )}
            </div>
            <div className="bg-slate-800 rounded p-3">
              <p className="text-slate-400 text-xs">Total reps</p>
              <p className="font-semibold">{reps.length}</p>
            </div>
          </div>

          {(pose.metrics?.kneeValgus ||
            (Number.isFinite(pose.metrics?.trunkLean) &&
              pose.metrics.trunkLean > TRUNK_LEAN_THRESHOLD)) && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {pose.metrics?.kneeValgus && (
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-300">
                  Knee valgus detected
                </span>
              )}
              {Number.isFinite(pose.metrics?.trunkLean) &&
                pose.metrics.trunkLean > TRUNK_LEAN_THRESHOLD && (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-300">
                    Trunk lean {pose.metrics.trunkLean.toFixed(1)} deg
                  </span>
                )}
            </div>
          )}

          <div className="mt-5 bg-slate-800 rounded-lg p-4">
            <h2 className="font-semibold">Manual fallback</h2>
            <p className="text-xs text-slate-400 mt-1">
              Automatic reps save when one full range-of-motion cycle is
              detected.
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <input
                className="p-2 rounded bg-slate-700 w-24"
                placeholder="ROM deg"
                value={rom}
                onChange={(event) => setRom(event.target.value)}
              />
              <input
                className="p-2 rounded bg-slate-700 w-28"
                placeholder="Confidence"
                value={confidence}
                onChange={(event) => setConfidence(event.target.value)}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={comp}
                  onChange={(event) => setComp(event.target.checked)}
                />
                Compensation
              </label>
              <button
                onClick={addManualRep}
                className="bg-cyan-500 text-black px-4 py-2 rounded font-semibold"
              >
                Add Rep
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => finish("COMPLETED")}
              disabled={finishing}
              className="bg-green-500 text-black px-4 py-2 rounded font-semibold disabled:opacity-50"
            >
              {finishing ? "Finishing..." : "Finish"}
            </button>
            <button
              onClick={() => finish("INCOMPLETE")}
              disabled={finishing}
              className="bg-yellow-500 text-black px-4 py-2 rounded font-semibold disabled:opacity-50"
            >
              Mark Incomplete
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Reps ({reps.length})</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {reps.length === 0 && (
              <p className="text-slate-400 text-sm">
                No reps recorded yet. Complete a detected movement cycle or add
                one manually.
              </p>
            )}
            {reps.map((rep) => (
              <div key={rep.id} className="bg-slate-800 rounded p-3 text-sm">
                <span className="font-semibold">
                  Set {rep.set_number ?? 1} | Rep {rep.rep_number}
                </span>{" "}
                --{" "}
                {rep.assessment_status}
                {rep.range_of_motion !== null && (
                  <span> | ROM {rep.range_of_motion} deg</span>
                )}
                {rep.confidence !== null && (
                  <span> | conf {rep.confidence}</span>
                )}
                {rep.feedback && <span> | {rep.feedback}</span>}
                {Array.isArray(rep.detected_issues) &&
                  rep.detected_issues.length > 0 && (
                    <p className="text-amber-300 text-xs mt-1">
                      {rep.detected_issues.join(", ")}
                    </p>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
