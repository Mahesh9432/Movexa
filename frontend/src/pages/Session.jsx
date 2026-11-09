import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";

export default function Session() {
  const [params] = useSearchParams();
  const patientId = params.get("patientId");
  const prescriptionId = params.get("prescriptionId");
  const exerciseName = params.get("exerciseName") || "Exercise";

  const [session, setSession] = useState(null);
  const [reps, setReps] = useState([]);
  const [rom, setRom] = useState("");
  const [confidence, setConfidence] = useState("0.8");
  const [comp, setComp] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.warn("Camera unavailable", e);
      }
      const { data } = await api.post("/sessions", {
        patient_id: patientId,
        prescription_id: prescriptionId,
        started_at: new Date().toISOString(),
      });
      setSession(data);
    })();
  }, [patientId, prescriptionId]);

  const addRep = async () => {
    if (!session) return;
    const payload = {
      session_id: session.id,
      rep_number: reps.length + 1,
      assessment_status: "ASSESSED",
      range_of_motion: rom ? Number(rom) : null,
      confidence: Number(confidence),
      compensation_flags: comp ? { trunk_lean: true } : {},
      detected_issues: comp ? ["compensatory trunk lean"] : [],
      feedback: comp ? "Avoid trunk lean" : "Good form",
    };
    const { data } = await api.post("/rep-metrics", payload);
    setReps((r) => [...r, data]);
    setRom("");
    setComp(false);
  };

  const finish = async (status = "COMPLETED") => {
    if (!session) return;
    await api.post(`/sessions/${session.id}/complete?status=${status}`);
    navigate(`/progress?sessionId=${session.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">{exerciseName}</h1>
          <p className="text-slate-400 text-sm mb-3">Record reps manually (AI auto-assessment applies low-confidence rule).</p>
          <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black aspect-video" />
          <div className="mt-4 flex gap-2 flex-wrap">
            <input className="p-2 rounded bg-slate-700 w-24" placeholder="ROM deg" value={rom} onChange={(e) => setRom(e.target.value)} />
            <input className="p-2 rounded bg-slate-700 w-28" placeholder="Confidence" value={confidence} onChange={(e) => setConfidence(e.target.value)} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={comp} onChange={(e) => setComp(e.target.checked)} /> Compensation
            </label>
            <button onClick={addRep} className="bg-cyan-500 text-black px-4 py-2 rounded font-semibold">Add Rep</button>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => finish("COMPLETED")} className="bg-green-500 text-black px-4 py-2 rounded font-semibold">Finish</button>
            <button onClick={() => finish("INCOMPLETE")} className="bg-yellow-500 text-black px-4 py-2 rounded font-semibold">Mark Incomplete</button>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Reps ({reps.length})</h2>
          <div className="space-y-2">
            {reps.map((r) => (
              <div key={r.id} className="bg-slate-800 rounded p-3 text-sm">
                <span className="font-semibold">Rep {r.rep_number}</span> — {r.assessment_status}
                {r.range_of_motion !== null && <span> | ROM {r.range_of_motion}°</span>}
                {r.confidence !== null && <span> | conf {r.confidence}</span>}
                {r.feedback && <span> | {r.feedback}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}