import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";

export default function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "PATIENT" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", form);
      const { data } = await api.post("/auth/login", { email: form.email, password: form.password });
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form onSubmit={submit} className="bg-slate-800 p-8 rounded-xl w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-cyan-400">Register</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input className="w-full p-2 rounded bg-slate-700" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className="w-full p-2 rounded bg-slate-700" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full p-2 rounded bg-slate-700" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="w-full p-2 rounded bg-slate-700" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="PATIENT">Patient</option>
          <option value="PHYSIOTHERAPIST">Physiotherapist</option>
        </select>
        <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold p-2 rounded">Create account</button>
        <p className="text-sm text-slate-300">Have account? <Link to="/login" className="text-cyan-400">Login</Link></p>
      </form>
    </div>
  );
}