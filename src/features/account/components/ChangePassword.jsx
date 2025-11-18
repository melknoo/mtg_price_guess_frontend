import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ChangePassword({ onBack, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validierung
    if (newPassword.length < 6) {
      setError("⚠️ Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("⚠️ Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("⚠️ Das neue Passwort muss sich vom alten unterscheiden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Fehler beim Ändern des Passworts");
      }

      setSuccess("✅ Passwort erfolgreich geändert!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      console.error("Change password error:", err);
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl"
    >
      <h2 className="text-2xl font-bold mb-6">Passwort ändern</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Aktuelles Passwort
          </label>
          <input
            type="password"
            placeholder="Aktuelles Passwort"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Neues Passwort
          </label>
          <input
            type="password"
            placeholder="Neues Passwort (min. 6 Zeichen)"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Neues Passwort bestätigen
          </label>
          <input
            type="password"
            placeholder="Neues Passwort wiederholen"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3 text-sm">
          <p className="text-blue-200">
            💡 <strong>Tipp:</strong> Verwende ein sicheres Passwort mit mindestens
            8 Zeichen, Groß- und Kleinbuchstaben sowie Zahlen.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg transition font-medium"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition font-medium ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Wird geändert..." : "Passwort ändern"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}