
import { useState } from "react";
import { useAuth } from "../../context/useAuth";

export default function Login({ onSwitchToRegister, onLoginSuccess }) {
  const { login, logout } = useAuth();

  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const authenticatedUser = await login({
        email: email.trim(),
        password,
      });

      const expectedRole =
        role === "patient" ? "PATIENT" : "PHYSIOTHERAPIST";

      if (authenticatedUser.role !== expectedRole) {
        logout();

        throw new Error(
          `This account is registered as a ${
            authenticatedUser.role === "PATIENT"
              ? "Patient"
              : "Physiotherapist"
          }. Please select the correct account type.`
        );
      }

      if (onLoginSuccess) {
        onLoginSuccess(authenticatedUser);
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F7FB]">
      <div className="max-w-md w-full bg-white border border-[#D9E3ED] rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-wider text-[#087F73] font-bold">
            Movexa
          </span>

          <h1 className="text-2xl font-bold text-[#193B62] mt-1">
            Welcome Back
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Sign in to your account to continue
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-[#F4F7FB] p-1 rounded-xl border border-[#D9E3ED] mb-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setRole("patient");
              setError("");
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === "patient"
                ? "bg-white text-[#193B62] shadow-sm"
                : "text-gray-500 hover:text-[#193B62]"
            }`}
          >
            🧑‍⚕️ Patient
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setRole("physio");
              setError("");
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === "physio"
                ? "bg-white text-[#193B62] shadow-sm"
                : "text-gray-500 hover:text-[#193B62]"
            }`}
          >
            🩺 Physiotherapist
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#193B62] mb-1">
              Email Address
            </label>

            <input
              type="email"
              required
              value={email}
              disabled={isSubmitting}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                role === "patient"
                  ? "patient@example.com"
                  : "dr.vance@apexortho.com"
              }
              className="w-full bg-white border border-[#D9E3ED] text-[#193B62] px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087F73]/30 focus:border-[#087F73] text-sm disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#193B62] mb-1">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              disabled={isSubmitting}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-[#D9E3ED] text-[#193B62] px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087F73]/30 focus:border-[#087F73] text-sm disabled:opacity-60"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#087F73] hover:bg-[#06655c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all shadow-sm cursor-pointer mt-2"
          >
            {isSubmitting
              ? "Signing In..."
              : `Sign In as ${
                  role === "patient" ? "Patient" : "Physiotherapist"
                }`}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-gray-500">
          Don't have an account?{" "}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSwitchToRegister}
            className="text-[#087F73] font-semibold hover:underline cursor-pointer"
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}
