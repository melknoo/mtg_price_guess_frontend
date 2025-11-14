import { useState } from "react";
import { resetPassword } from "../api/authApi";

export default function ResetPassword({ token, onSuccess, onBack }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("❌ Die Passwörter stimmen nicht überein.");
      return;
    }

    if (password.length < 6) {
      setError("❌ Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, password);

      if (onSuccess) {
        onSuccess(res.message || "Passwort erfolgreich zurückgesetzt!");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(`❌ ${err.response.data.message}`);
      } else {
        setError("❌ Ein Fehler ist aufgetreten. Der Link könnte abgelaufen sein.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto bg-white p-6 rounded-xl shadow text-black">
      <h2 className="text-xl font-bold mb-2">Neues Passwort setzen</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Neues Passwort"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Passwort bestätigen"
          className="w-full p-2 border rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className={`bg-blue-600 text-white p-2 rounded w-full hover:bg-blue-700 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Wird gespeichert..." : "Passwort zurücksetzen"}
        </button>
      </form>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline cursor-pointer w-full text-center"
        >
          ← Zurück zum Login
        </button>
      )}
    </div>
  );
}