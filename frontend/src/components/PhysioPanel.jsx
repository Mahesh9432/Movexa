import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

const EMPTY_EXERCISE = {
  name: "",
  target_joint: "Knee",
  min_angle_threshold: "",
  max_angle_threshold: "",
  instructions: "",
  video_url: "",
};

const fetchPanelData = () =>
  Promise.all([
    api.get("/physiotherapists/me"),
    api.get("/patients"),
    api.get("/exercises?include_inactive=true"),
    api.get("/assignments"),
    api.get("/prescriptions"),
  ]);

export default function PhysioPanel() {
  const [physio, setPhysio] = useState(null);
  const [patients, setPatients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [targetReps, setTargetReps] = useState(10);
  const [targetSets, setTargetSets] = useState(3);
  const [exerciseForm, setExerciseForm] = useState(EMPTY_EXERCISE);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const applyPanelData = useCallback(
    ([profileRes, patientsRes, exercisesRes, assignmentsRes, prescriptionsRes]) => {
      const ps = patientsRes.data;
      const exs = exercisesRes.data;
      setPhysio(profileRes.data);
      setPatients(ps);
      setExercises(exs);
      setAssignments(assignmentsRes.data);
      setPrescriptions(prescriptionsRes.data);
      setSelectedPatient((current) => current || ps[0]?.id || "");
      setSelectedExercise((current) => current || exs[0]?.id || "");
      setError("");
    },
    []
  );

  const load = useCallback(async () => {
    try {
      applyPanelData(await fetchPanelData());
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load physiotherapist data");
    }
  }, [applyPanelData]);

  useEffect(() => {
    let cancelled = false;
    fetchPanelData()
      .then((results) => {
        if (!cancelled) applyPanelData(results);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.detail || "Failed to load physiotherapist data"
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyPanelData]);

  const isAssigned = (patientId) =>
    assignments.some(
      (a) =>
        a.patient_id === patientId &&
        a.status === "ACTIVE" &&
        a.physiotherapist_id === physio?.id
    );

  const activeAssignmentFor = (patientId) =>
    assignments.find(
      (a) =>
        a.patient_id === patientId &&
        a.status === "ACTIVE" &&
        a.physiotherapist_id === physio?.id
    );

  const patientName = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient?.full_name || `Patient ${patientId.slice(0, 8)}`;
  };

  const exerciseName = (exerciseId) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    return exercise?.name || "Exercise";
  };

  const runAction = async (action, successMessage) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(successMessage);
      await load();
      return true;
    } catch (err) {
      setError(err?.response?.data?.detail || "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const endAssignment = (patientId) => {
    const assignment = activeAssignmentFor(patientId);
    if (!assignment) return;
    runAction(
      () => api.patch(`/assignments/${assignment.id}`, { status: "ENDED" }),
      "Assignment ended."
    );
  };

  const togglePrescription = (prescription) =>
    runAction(
      () =>
        api.patch(`/prescriptions/${prescription.id}`, {
          is_active: !prescription.is_active,
        }),
      prescription.is_active
        ? "Prescription deactivated."
        : "Prescription reactivated."
    );

  const createExercise = async (event) => {
    event.preventDefault();
    if (!exerciseForm.name.trim() || !exerciseForm.target_joint.trim()) {
      setError("Exercise name and target joint are required.");
      return;
    }
    const toNumber = (value) => (value === "" ? null : Number(value));
    const created = await runAction(
      () =>
        api.post("/exercises", {
          name: exerciseForm.name.trim(),
          target_joint: exerciseForm.target_joint.trim(),
          min_angle_threshold: toNumber(exerciseForm.min_angle_threshold),
          max_angle_threshold: toNumber(exerciseForm.max_angle_threshold),
          instructions: exerciseForm.instructions.trim() || null,
          video_url: exerciseForm.video_url.trim() || null,
          is_active: true,
        }),
      "Exercise created."
    );
    if (created) setExerciseForm(EMPTY_EXERCISE);
  };

  const toggleExercise = (exercise) =>
    runAction(
      () =>
        api.patch(`/exercises/${exercise.id}`, {
          is_active: !exercise.is_active,
        }),
      exercise.is_active ? "Exercise deactivated." : "Exercise reactivated."
    );

  const assignPatient = async (patientId) => {
    if (!physio) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.post("/assignments", {
        patient_id: patientId,
        physiotherapist_id: physio.id,
      });
      setMessage("Patient assigned to you.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || "Assignment failed");
    } finally {
      setBusy(false);
    }
  };

  const createPrescription = async (e) => {
    e.preventDefault();
    if (!physio) return;
    if (!selectedPatient || !selectedExercise) {
      setError("Select a patient and an exercise.");
      return;
    }
    if (!isAssigned(selectedPatient)) {
      setError("Assign this patient to yourself before prescribing.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.post("/prescriptions", {
        patient_id: selectedPatient,
        physiotherapist_id: physio.id,
        exercise_id: selectedExercise,
        target_reps: Number(targetReps),
        target_sets: Number(targetSets),
        is_active: true,
      });
      setMessage("Prescription created. The patient can now start a session.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Prescription failed");
    } finally {
      setBusy(false);
    }
  };

  if (!physio) {
    return (
      <p className={`mt-6 ${error ? "text-red-400" : "text-slate-400"}`}>
        {error || "Loading physiotherapist profile..."}
      </p>
    );
  }

  return (
    <div className="mt-6 grid md:grid-cols-2 gap-6">
      <section className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold">Patient Assignments</h2>
        <p className="text-sm text-slate-400 mt-1">
          Assign a patient to yourself before creating a prescription.
        </p>
        <div className="mt-4 space-y-2">
          {patients.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-slate-900/60 rounded p-3"
            >
              <div>
                <p className="font-medium">
                  {p.full_name || `Patient ${p.id.slice(0, 8)}`}
                </p>
                <p className="text-xs text-slate-400">
                  {p.injury || "No injury noted"}
                  {p.affected_area ? ` | ${p.affected_area}` : ""}
                </p>
              </div>
              {isAssigned(p.id) ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400">Assigned</span>
                  <button
                    onClick={() => navigate(`/progress?patientId=${p.id}`)}
                    className="text-xs bg-slate-700 px-3 py-1 rounded font-semibold"
                  >
                    Progress
                  </button>
                  <button
                    onClick={() => endAssignment(p.id)}
                    disabled={busy}
                    className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded font-semibold disabled:opacity-50"
                  >
                    End
                  </button>
                </div>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => assignPatient(p.id)}
                  className="text-xs bg-cyan-500 text-black px-3 py-1 rounded font-semibold disabled:opacity-50"
                >
                  Assign to me
                </button>
              )}
            </div>
          ))}
          {patients.length === 0 && (
            <p className="text-slate-400 text-sm">No patients found.</p>
          )}
        </div>
      </section>

      <section className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold">Create Prescription</h2>
        <form onSubmit={createPrescription} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-slate-300">Patient</span>
            <select
              className="w-full mt-1 p-2 rounded bg-slate-700"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || `Patient ${p.id.slice(0, 8)}`} |{" "}
                  {p.affected_area || "General"}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-slate-300">Exercise</span>
            <select
              className="w-full mt-1 p-2 rounded bg-slate-700"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              <option value="">Select exercise</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.target_joint})
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-slate-300">Target reps</span>
              <input
                type="number"
                min="1"
                className="w-full mt-1 p-2 rounded bg-slate-700"
                value={targetReps}
                onChange={(e) => setTargetReps(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-300">Target sets</span>
              <input
                type="number"
                min="1"
                className="w-full mt-1 p-2 rounded bg-slate-700"
                value={targetSets}
                onChange={(e) => setTargetSets(e.target.value)}
              />
            </label>
          </div>

          <button
            disabled={busy}
            className="bg-cyan-500 text-black px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            Create prescription
          </button>
        </form>

        {message && <p className="text-green-400 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <p className="text-xs text-slate-500 mt-4">
          {physio.qualification} | {physio.verification_status} | Reg:{" "}
          {physio.registration_number}
        </p>
      </section>

      <section className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold">My Prescriptions</h2>
        <p className="text-sm text-slate-400 mt-1">
          Deactivate a prescription to remove it from the patient dashboard.
        </p>
        <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {prescriptions.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-slate-900/60 rounded p-3"
            >
              <div>
                <p className="font-medium">{exerciseName(p.exercise_id)}</p>
                <p className="text-xs text-slate-400">
                  {patientName(p.patient_id)} | {p.target_reps} reps x{" "}
                  {p.target_sets} sets
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${
                    p.is_active ? "text-green-400" : "text-slate-500"
                  }`}
                >
                  {p.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => togglePrescription(p)}
                  disabled={busy}
                  className="text-xs bg-slate-700 px-3 py-1 rounded font-semibold disabled:opacity-50"
                >
                  {p.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
          {prescriptions.length === 0 && (
            <p className="text-slate-400 text-sm">No prescriptions yet.</p>
          )}
        </div>
      </section>

      <section className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold">Add Exercise</h2>
        <form onSubmit={createExercise} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-slate-300">Name</span>
            <input
              className="w-full mt-1 p-2 rounded bg-slate-700"
              value={exerciseForm.name}
              onChange={(event) =>
                setExerciseForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block text-sm">
              <span className="text-slate-300">Joint</span>
              <input
                className="w-full mt-1 p-2 rounded bg-slate-700"
                value={exerciseForm.target_joint}
                onChange={(event) =>
                  setExerciseForm((current) => ({
                    ...current,
                    target_joint: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-300">Min angle</span>
              <input
                type="number"
                min="0"
                className="w-full mt-1 p-2 rounded bg-slate-700"
                value={exerciseForm.min_angle_threshold}
                onChange={(event) =>
                  setExerciseForm((current) => ({
                    ...current,
                    min_angle_threshold: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-300">Max angle</span>
              <input
                type="number"
                min="0"
                className="w-full mt-1 p-2 rounded bg-slate-700"
                value={exerciseForm.max_angle_threshold}
                onChange={(event) =>
                  setExerciseForm((current) => ({
                    ...current,
                    max_angle_threshold: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-slate-300">Instructions</span>
            <textarea
              className="w-full mt-1 p-2 rounded bg-slate-700"
              rows={2}
              value={exerciseForm.instructions}
              onChange={(event) =>
                setExerciseForm((current) => ({
                  ...current,
                  instructions: event.target.value,
                }))
              }
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-300">Guided video URL</span>
            <input
              className="w-full mt-1 p-2 rounded bg-slate-700"
              value={exerciseForm.video_url}
              onChange={(event) =>
                setExerciseForm((current) => ({
                  ...current,
                  video_url: event.target.value,
                }))
              }
            />
          </label>

          <button
            disabled={busy}
            className="bg-cyan-500 text-black px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            Add exercise
          </button>
        </form>

        <div className="mt-4 border-t border-slate-700 pt-3">
          <h3 className="text-sm font-semibold">All Exercises</h3>
          <div className="mt-2 space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between bg-slate-900/60 rounded p-3"
              >
                <div>
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-xs text-slate-400">
                    {exercise.target_joint} |{" "}
                    {exercise.min_angle_threshold ?? "-"}-
                    {exercise.max_angle_threshold ?? "-"} deg
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${
                      exercise.is_active ? "text-green-400" : "text-slate-500"
                    }`}
                  >
                    {exercise.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => toggleExercise(exercise)}
                    disabled={busy}
                    className="text-xs bg-slate-700 px-3 py-1 rounded font-semibold disabled:opacity-50"
                  >
                    {exercise.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
