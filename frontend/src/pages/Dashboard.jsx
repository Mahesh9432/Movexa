import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [patient, setPatient] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: user } = await api.get("/users/me");
      setMe(user);
      const { data: exs } = await api.get("/exercises");
      setExercises(exs);

      if (user.role === "PATIENT") {
        const { data: patients } = await api.get("/patients");
        let p = patients.find((x) => x.user_id === user.id);
        if (!p) {
          const { data } = await api.post("/patients", {});
          p = data;
        }
        setPatient(p);
        const { data: pres } = await api.get(`/prescriptions?patient_id=${p.id}`);
        setPrescriptions(pres);
      }
    })();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const startSession = (pres) => {
    const exercise = exercises.find((e) => e.id === pres.exercise_id);
    navigate(`/session?patientId=${patient.id}&prescriptionId=${pres.id}&exerciseName=${encodeURIComponent(exercise?.name || "Exercise")}`);
  };

  if (!me) return <div className="min-h-screen bg-slate-950 text-white p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-cyan-400">Movexa Dashboard</h1>
          <button onClick={logout} className="text-sm bg-slate-700 px-3 py-1 rounded">Logout</button>
        </div>
        <p className="mt-2 text-slate-300">Signed in as {me.full_name} ({me.role})</p>

        {me.role === "PATIENT" && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold">My Prescriptions</h2>
            {prescriptions.length === 0 && <p className="text-slate-400 mt-2">No prescriptions yet. Ask your physiotherapist to assign one, or use demo account physio@movexa.local.</p>}
            <div className="grid gap-4 mt-4">
              {prescriptions.map((p) => {
                const ex = exercises.find((e) => e.id === p.exercise_id);
                return (
                  <div key={p.id} className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{ex?.name || "Exercise"}</p>
                      <p className="text-sm text-slate-400">Target: {p.target_reps} reps x {p.target_sets} sets</p>
                      {ex?.video_url && <a className="text-cyan-400 text-sm" href={ex.video_url} target="_blank" rel="noreferrer">Guided video</a>}
                    </div>
                    <button onClick={() => startSession(p)} className="bg-cyan-500 text-black px-4 py-2 rounded font-semibold">Start Session</button>
                  </div>
                );
              })}
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-semibold">Exercise Library</h2>
              <div className="grid gap-3 mt-3">
                {exercises.map((e) => (
                  <div key={e.id} className="bg-slate-800 rounded p-3">
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-sm text-slate-400">Joint: {e.target_joint} | ROM: {e.min_angle_threshold ?? "-"}-{e.max_angle_threshold ?? "-"} deg</p>
                    {e.instructions && <p className="text-sm mt-1">{e.instructions}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {me.role === "PHYSIOTHERAPIST" && (
          <div className="mt-6">
            <p className="text-slate-300">Physiotherapist view. Use API or seed data for demo. Endpoints available for assignments/prescriptions.</p>
            <a href="http://localhost:8000/docs" className="text-cyan-400 underline" target="_blank" rel="noreferrer">Open API docs</a>
          </div>
        )}
      </div>
    </div>
  );
}