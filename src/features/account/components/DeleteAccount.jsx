import React, { useState } from "react";
import { motion } from "framer-motion";

export default function DeleteAccount({ onBack, onDeleteSuccess }) {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleInitiateDelete = () => {
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setError("");

    if (confirmText !== "LÖSCHEN") {
      setError("⚠️ Bitte tippe 'LÖSCHEN' ein, um zu bestätigen.");
      return;
    }

    if (!password) {
      setError("⚠️ Bitte gib dein Passwort ein.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/user/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Fehler beim Löschen");
      }

      // Account erfolgreich gelöscht
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!showConfirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl"
      >
        <h2 className="text-3xl font-bold mb-6 text-red-400">Account löschen</h2>

        <div className="space-y-4 text-gray-200">
          <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4">
            <h3 className="font-bold text-red-300 mb-2">⚠️ Warnung</h3>
            <p className="text-sm">
              Das Löschen deines Accounts ist <strong>unwiderruflich</strong> und hat folgende Konsequenzen:
            </p>
          </div>

          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Alle deine persönlichen Daten werden gelöscht</li>
            <li>Dein Benutzername wird aus der Datenbank entfernt</li>
            <li>Deine E-Mail-Adresse wird gelöscht</li>
            <li>Dein Highscore wird gelöscht</li>
            <li>Diese Aktion kann nicht rückgängig gemacht werden</li>
          </ul>

          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-200">
              💡 <strong>Hinweis:</strong> Gemäß DSGVO hast du das Recht auf Löschung deiner Daten.
              Nach der Löschung werden alle personenbezogenen Daten innerhalb von 30 Tagen vollständig
              aus unseren Systemen entfernt.
            </p>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition font-medium"
            >
              ← Zurück
            </button>
            <button
              onClick={handleInitiateDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition font-medium"
            >
              Account löschen
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border-2 border-red-500"
    >
      <h2 className="text-2xl font-bold mb-6 text-red-400">Löschung bestätigen</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleConfirmDelete} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Gib dein Passwort ein:
          </label>
          <input
            type="password"
            placeholder="Passwort"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-red-500 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Tippe <span className="text-red-400 font-bold">"LÖSCHEN"</span> ein:
          </label>
          <input
            type="text"
            placeholder="LÖSCHEN"
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:border-red-500 focus:outline-none"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            required
          />
        </div>

        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-sm">
          <p className="text-red-300">
            ⚠️ Dies ist deine letzte Chance! Nach dem Klick auf "Endgültig löschen" wird
            dein Account unwiderruflich gelöscht.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => setShowConfirmation(false)}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg transition font-medium"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition font-medium ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Wird gelöscht..." : "Endgültig löschen"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}