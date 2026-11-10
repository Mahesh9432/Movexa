import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Users,
  UserRound,
  Activity,
  LogOut,
  RefreshCw,
  AlertCircle,
  Plus,
  X,
  Search,
  CalendarDays,
  Dumbbell,
} from "lucide-react";

import { getPhysiotherapistPatients } from "../../api/dashboard";
import PageHeader from "../../components/common/PageHeader";
import { getPhysiotherapistProfile } from "../../api/profile";
import { getExercises } from "../../api/exercises";
import {
  getPrescriptions,
  createPrescription,
} from "../../api/prescriptions";

const navItems = [
  { name: "Dashboard", view: "physio-dashboard", icon: Activity },
  { name: "Patients", view: "physio-patients", icon: Users },
  { name: "Prescriptions", view: "physio-prescriptions", icon: ClipboardList },
  { name: "Profile", view: "physio-profile", icon: UserRound },
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

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-[#193B62]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-[#F4F7FB] border border-[#D9E3ED] p-3 rounded-xl text-sm font-medium text-[#193B62] outline-none focus:border-[#087F73]";

export default function Prescriptions({ onLogout, onNavigate }) {
  const [patients, setPatients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [physiotherapistId, setPhysiotherapistId] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("UNKNOWN");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isAdding, setIsAdding] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [patientId, setPatientId] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");

  const loadData = useCallback(async () => {
    try {
      const [
        patientResponse,
        exerciseResponse,
        prescriptionResponse,
        profileResponse,
      ] = await Promise.all([
        getPhysiotherapistPatients(),
        getExercises(),
        getPrescriptions(),
        getPhysiotherapistProfile(),
      ]);

      const patientList = getList(patientResponse, "patients");
      const exerciseList = getList(exerciseResponse, "exercises");
      const prescriptionList = getList(
        prescriptionResponse,
        "prescriptions"
      );

      setPatients(patientList);
      setExercises(exerciseList);
      setPrescriptions(prescriptionList);

      const profileId = profileResponse?.profile?.id;

      if (!profileId) {
        throw new Error(
          "Your physiotherapist profile ID could not be loaded. Please refresh your profile."
        );
      }

      setPhysiotherapistId(profileId);
      setVerificationStatus(
        String(profileResponse?.profile?.verification_status || "UNKNOWN").toUpperCase()
      );

      setPatientId((current) => {
        if (current && patientList.some((p) => p.patient_id === current)) {
          return current;
        }
        return patientList[0]?.patient_id || "";
      });

      setExerciseId((current) => {
        if (current && exerciseList.some((e) => e.id === current)) {
          return current;
        }
        return exerciseList[0]?.id || "";
      });
    } catch (err) {
      setError(err?.message || "Unable to load prescription data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Defer the async loader until after the effect has completed.
    // This avoids synchronous state updates during effect execution.
    Promise.resolve().then(() => {
      if (active) {
        loadData();
      }
    });

    return () => {
      active = false;
    };
  }, [loadData]);

  const patientMap = useMemo(
    () =>
      new Map(
        patients.map((patient) => [
          String(patient.patient_id),
          patient,
        ])
      ),
    [patients]
  );

  const exerciseMap = useMemo(
    () =>
      new Map(
        exercises.map((exercise) => [String(exercise.id), exercise]),
      ),
    [exercises]
  );

  const prescriptionRows = useMemo(() => {
    return prescriptions.map((prescription) => {
      const patient = patientMap.get(String(prescription.patient_id));
      const exercise = exerciseMap.get(String(prescription.exercise_id));

      return {
        ...prescription,
        patientName: patient?.full_name || "Patient record unavailable",
        exerciseName: exercise?.name || "Exercise record unavailable",
      };
    });
  }, [prescriptions, patientMap, exerciseMap]);

  const filteredPrescriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return prescriptionRows;

    return prescriptionRows.filter((prescription) =>
      [
        prescription.patientName,
        prescription.exerciseName,
        prescription.id,
      ].some((value) => String(value ?? "").toLowerCase().includes(query))
    );
  }, [prescriptionRows, searchQuery]);

  const displayedPrescriptions = showAllHistory
    ? filteredPrescriptions
    : filteredPrescriptions.slice(0, 3);

  const selectedExercise = exercises.find(
    (exercise) => String(exercise.id) === String(exerciseId)
  );

  const canCreatePrescription = verificationStatus === "VERIFIED";

  const handleCreatePrescription = async (event) => {
    event.preventDefault();

    setSubmitError("");
    setSuccessMessage("");

    if (!canCreatePrescription) {
      setSubmitError(
        "Your physiotherapist account must be verified before you can create prescriptions."
      );
      return;
    }

    if (!patientId || !exerciseId || !physiotherapistId) {
      setSubmitError(
        "Select a patient and exercise before creating a prescription."
      );
      return;
    }

    const targetSets = Number(sets);
    const targetReps = Number(reps);

    if (
      !Number.isInteger(targetSets) ||
      !Number.isInteger(targetReps) ||
      targetSets < 1 ||
      targetReps < 1
    ) {
      setSubmitError("Sets and repetitions must be positive whole numbers.");
      return;
    }

    setSubmitting(true);

    try {
      await createPrescription({
        patient_id: patientId,
        physiotherapist_id: physiotherapistId,
        exercise_id: exerciseId,
        target_reps: targetReps,
        target_sets: targetSets,
        is_active: true,
      });

      setIsAdding(false);
      setSets("3");
      setReps("12");

      await loadData();
      setSuccessMessage("Prescription created successfully.");
    } catch (err) {
      setSubmitError(
        err?.message || "Unable to create prescription. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavClick = (view) => {
    onNavigate?.(view);
  };

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
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.view === "physio-prescriptions";

              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${active
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
          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold py-2.5 rounded-lg"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#D9E3ED] px-4 md:px-8 py-3.5 flex justify-between items-center sticky top-0 z-20">
          <div className="text-xs text-gray-500 font-medium">
            Movexa
            <span className="mx-2">/</span>
            <span className="font-bold text-[#193B62]">
              Prescription Management
            </span>
          </div>

          <button
            onClick={() => onNavigate?.("physio-profile")}
            className="flex items-center gap-2 text-xs font-semibold text-[#087F73]"
          >
            <UserRound size={16} />
            My Profile
          </button>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          {/* Feedback */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    Prescription data could not be loaded
                  </p>
                  <p className="text-xs mt-1">{error}</p>
                  <button
                    onClick={loadData}
                    className="text-xs font-bold underline mt-3"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page header */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <PageHeader
              category="Clinical Care Plans"
              title="Prescriptions Hub"
              subtitle="Create and manage exercise prescriptions for your assigned patients."
            />
            {!canCreatePrescription && (
              <p className="mt-3 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Prescription creation is disabled because your physiotherapist account is not verified. Current status: {verificationStatus}.
              </p>
            )}
          </div>

          {!isAdding && (
            <button
              onClick={() => {
                setSubmitError("");
                setIsAdding(true);
              }}
              disabled={
                loading ||
                !canCreatePrescription ||
                patients.length === 0 ||
                exercises.length === 0
              }
              className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-5 py-3 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={15} />
              Add New Prescription
            </button>
          )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-[#D9E3ED] rounded-xl p-10 text-center">
          <RefreshCw
            size={24}
            className="animate-spin text-[#087F73] mx-auto mb-3"
          />
          <p className="text-sm text-gray-500">
            Loading patients, exercises and prescriptions...
          </p>
        </div>
      )}

      {/* Form */}
      {!loading && !error && isAdding && (
        <section className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-[#D9E3ED] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
                Prescription Builder
              </p>
              <h2 className="text-xl font-bold text-[#193B62] mt-1">
                Create New Prescription
              </h2>
            </div>

            <button
              onClick={() => setIsAdding(false)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"
            >
              <X size={15} />
              Close
            </button>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
              {submitError}
            </div>
          )}

          {patients.length === 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              You need an assigned patient before creating a prescription.
            </p>
          )}

          {exercises.length === 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              No active exercises are available in the exercise library.
            </p>
          )}

          <form onSubmit={handleCreatePrescription} className="space-y-5">
            <Field label="Select Patient">
              <select
                required
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                className={inputClass}
              >
                {patients.length === 0 && (
                  <option value="">No assigned patients</option>
                )}
                {patients.map((patient) => (
                  <option
                    key={patient.patient_id}
                    value={patient.patient_id}
                  >
                    {patient.full_name || "Unnamed patient"}
                    {patient.affected_area
                      ? ` - ${patient.affected_area}`
                      : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Select Exercise from MOVEXA Library">
              <select
                required
                value={exerciseId}
                onChange={(event) => setExerciseId(event.target.value)}
                className={inputClass}
              >
                {exercises.length === 0 && (
                  <option value="">No exercises available</option>
                )}
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                    {exercise.target_joint
                      ? ` (${exercise.target_joint})`
                      : ""}
                  </option>
                ))}
              </select>
            </Field>

            {selectedExercise && (
              <div className="border border-[#D9E3ED] bg-[#F4F7FB] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Dumbbell size={17} className="text-[#087F73]" />
                  <h3 className="font-bold text-sm text-[#193B62]">
                    {selectedExercise.name}
                  </h3>
                </div>

                <p className="text-xs text-gray-600">
                  Target joint:{" "}
                  {selectedExercise.target_joint || "Not specified"}
                </p>

                {selectedExercise.instructions && (
                  <p className="text-xs text-gray-500">
                    {selectedExercise.instructions}
                  </p>
                )}

                {(selectedExercise.min_angle_threshold != null ||
                  selectedExercise.max_angle_threshold != null) && (
                    <p className="text-xs text-gray-500">
                      Angle thresholds:{" "}
                      {selectedExercise.min_angle_threshold ?? "not set"} degrees to{" "}
                      {selectedExercise.max_angle_threshold ?? "-"} degrees
                    </p>
                  )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Target Sets">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={sets}
                  onChange={(event) => setSets(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Target Repetitions per Set">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={reps}
                  onChange={(event) => setReps(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="bg-[#F4F7FB] rounded-xl p-4 text-xs text-gray-600">
              This prescription will save the selected patient, exercise,
              target sets, target repetitions and active status. Additional
              plan fields are not currently supported by the backend.
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-[#D9E3ED]">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 border border-[#D9E3ED] rounded-xl font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !patientId ||
                  !exerciseId ||
                  !physiotherapistId ||
                  !canCreatePrescription
                }
                className="px-6 py-2.5 bg-[#087F73] text-white rounded-xl font-bold hover:bg-[#06655c] disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                {submitting ? "Saving..." : "Assign Prescription"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Prescription history */}
      {!loading && !error && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-1">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Previously Assigned Prescriptions
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {prescriptions.length} prescriptions recorded
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="text-xs font-bold text-[#087F73] hover:underline flex items-center gap-1"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>

          <div className="bg-white border border-[#D9E3ED] rounded-xl px-3 py-2 flex items-center gap-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by patient, exercise or prescription ID..."
              className="w-full text-sm outline-none py-1"
            />
          </div>

          {filteredPrescriptions.length === 0 ? (
            <div className="bg-white border border-[#D9E3ED] rounded-2xl p-10 text-center">
              <ClipboardList
                size={28}
                className="mx-auto text-gray-300 mb-3"
              />
              <h3 className="font-bold text-[#193B62]">
                {prescriptions.length === 0
                  ? "No prescriptions yet"
                  : "No matching prescriptions"}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {prescriptions.length === 0
                  ? "Prescriptions you create will appear here."
                  : "Try a different search term."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayedPrescriptions.map((prescription) => (
                  <article
                    key={prescription.id}
                    className="bg-white border border-[#D9E3ED] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-[#EAF1F8] text-[#087F73] text-[10px] font-bold px-2.5 py-1 rounded-md font-mono">
                          {String(prescription.id).slice(0, 12)}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${prescription.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {prescription.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#193B62]">
                        {prescription.exerciseName}
                      </h3>

                      <p className="text-xs text-gray-600">
                        Assigned Patient:{" "}
                        <strong className="text-[#087F73]">
                          {prescription.patientName}
                        </strong>
                      </p>

                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <CalendarDays size={13} />
                        Issued: {formatDate(prescription.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">
                          Target Sets
                        </span>
                        <span className="text-sm font-bold text-[#193B62]">
                          {prescription.target_sets}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">
                          Reps per Set
                        </span>
                        <span className="text-sm font-bold text-[#193B62]">
                          {prescription.target_reps}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {filteredPrescriptions.length > 3 && (
                <button
                  onClick={() => setShowAllHistory((value) => !value)}
                  className="text-xs font-bold text-[#087F73] hover:underline"
                >
                  {showAllHistory
                    ? "Show Less"
                    : `See All (${filteredPrescriptions.length})`}
                </button>
              )}
            </>
          )}
        </section>
      )}
    </main>
      </div >
    </div >
  );
}
