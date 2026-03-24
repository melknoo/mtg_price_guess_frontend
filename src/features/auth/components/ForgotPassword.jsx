import { useState } from "react";
import { requestPasswordReset } from "../api/authApi";

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await requestPasswordReset(email);
      setMessage("✅ " + (res.message || "An email with a reset link has been sent."));
      setEmail("");
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(`❌ ${err.response.data.message}`);
      } else {
        setError("❌ An unknown error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl shadow-2xl text-white">
      <h2 className="text-xl font-bold mb-2 text-amber-200">Forgot Password</h2>
      <p className="text-sm text-white/60 mb-4">
        Enter your email address and we'll send you a reset link.
      </p>

      {error && (
        <div className="bg-red-500/20 text-red-300 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-500/20 text-green-300 p-2 rounded mb-2 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className={`bg-amber-600 text-white p-2 rounded w-full hover:bg-amber-500 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-amber-400 hover:text-amber-300 cursor-pointer w-full text-center"
      >
        Back to Login
      </button>
    </div>
  );
}