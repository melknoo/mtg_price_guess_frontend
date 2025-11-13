import { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

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
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage("✅ " + (res.data.message || "Eine E-Mail mit einem Reset-Link wurde gesendet."));
      setEmail("");
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(`❌ ${err.response.data.message}`);
      } else {
        setError("❌ Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto bg-white p-6 rounded-xl shadow text-black">
      <h2 className="text-xl font-bold mb-2">Passwort vergessen</h2>
      <p className="text-sm text-gray-600 mb-4">
        Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
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
          {loading ? "Wird gesendet..." : "Reset-Link senden"}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-blue-600 hover:underline cursor-pointer w-full text-center"
      >
        ← Zurück zum Login
      </button>
    </div>
  );
}