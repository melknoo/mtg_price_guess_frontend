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
    <div className="space-y-4 max-w-sm mx-auto bg-white p-6 rounded-xl shadow text-black">
      <h2 className="text-xl font-bold mb-2">Forgot Password</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter your email address and we'll send you a reset link.
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-100 text-green-700 p-2 rounded mb-2 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className={`bg-blue-600 text-white p-2 rounded w-full hover:bg-blue-700 transition ${
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
        className="text-sm text-blue-600 hover:underline cursor-pointer w-full text-center"
      >
        Back to Login
      </button>
    </div>
  );
}