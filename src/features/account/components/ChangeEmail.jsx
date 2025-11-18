import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/context/AuthContext";

export default function ChangeEmail({ onBack, onSuccess }) {
  const { user, refreshUser } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validierung
    if (!validateEmail(newEmail)) {
      setError("⚠️ Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }

    if (newEmail === user.email) {
      setError("⚠️ Die neue E-Mail-Adresse muss sich von der alten unterscheiden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/user/change-email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          newEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Fehler beim Ändern der E-Mail");
      }

      setSuccess("✅ E-Mail erfolgreich geändert!");
      setNewEmail("");
      setPassword("");

      // Aktualisiere User-Daten
      await refreshUser();

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      console.error("Change email error:", err);
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
      <h2 className="text-2xl font-bold mb-6">E-Mail-Adresse ändern</h2>

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

      <div className="bg-white/5 p-3 rounded-lg mb-4 text-sm">
        <p className="text-gray-300">
          Aktuelle E-Mail: <span className="font-medium text-white">{user.email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Neue E-Mail-Adresse
          </label>
          <input
            type="email"
            placeholder="neue@email.de"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Passwort zur Bestätigung
          </label>
          <input
            type="password"
            placeholder="Dein aktuelles Passwort"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-sm">
          <p className="text-yellow-200">
            ⚠️ <strong>Hinweis:</strong> Nach der Änderung musst du dich möglicherweise
            mit der neuen E-Mail-Adresse anmelden.
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
            {loading ? "Wird geändert..." : "E-Mail ändern"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}