import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Progress() {
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId");
  const [reps, setReps] = useState([]);

  useEffect(() => {
    (async () => {
      if (!sessionId) return;
      const { data } = await api.get(`/rep-metrics?session_id=${sessionId}`);
      setReps(data);
    })();
  }, [sessionId]);

  const data = reps
    .filter((r) => r.range_of_motion !== null)
    .map((r) => ({ rep: r.rep_number, rom: r.range_of_motion, confidence: r.confidence }));

  const assessed = reps.filter((r) => r.assessment_status === "ASSESSED").length;
  const unassessed = reps.filter((r) => r.assessment_status === "UNABLE_TO_ASSESS").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-cyan-400 mb-4">Session Progress</h1>
        <p className="text-slate-300 mb-4">Assessed: {assessed} | Unable to assess: {unassessed}</p>
        <div className="bg-slate-800 rounded p-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rep" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rom" stroke="#22d3ee" name="ROM (deg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {reps.map((r) => (
            <div key={r.id} className="bg-slate-800 rounded p-3 text-sm">
              Rep {r.rep_number}: {r.assessment_status}{r.range_of_motion !== null ? ` | ROM ${r.range_of_motion}°` : ""}{r.feedback ? ` | ${r.feedback}` : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}