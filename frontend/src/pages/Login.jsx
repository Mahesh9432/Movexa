import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form onSubmit={submit} className="bg-slate-800 p-8 rounded-xl w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-cyan-400">Movexa Login</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input className="w-full p-2 rounded bg-slate-700" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full p-2 rounded bg-slate-700" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold p-2 rounded">Sign in</button>
        <p className="text-sm text-slate-300">No account? <Link to="/register" className="text-cyan-400">Register</Link></p>
      </form>
    </div>
  );
}