import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function GuestRegister({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login, refreshUser } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setMessage("Bitte Benutzername und Passwort eingeben.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // 1. Registrieren
      await axios.post(`${API_URL}/auth/register`, {
        username,
        password,
      }, { withCredentials: true });

      // 2. Einloggen
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        username,
        password,
      }, { withCredentials: true });

      const newUser = loginResponse.data;
      login(newUser);

      // 3. Highscore übernehmen
      if (user?.highscore > 0) {
        await axios.post(`${API_URL}/api/score`, {
          score: user.highscore,
        }, { withCredentials: true });
      }

      // 4. Benutzer aktualisieren
      await refreshUser();

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setMessage("Registrierung fehlgeschlagen. Nutzername vielleicht schon vergeben?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      className="bg-white text-black p-6 rounded shadow-md w-full max-w-md"
    >
      <h2 className="text-xl font-bold mb-4">🎉 Highscore übernehmen & registrieren</h2>
      <p className="mb-4 text-sm text-gray-600">Dein Score: {user?.highscore}</p>

      <input
        type="text"
        placeholder="Benutzername"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded"
        required
      />

      {message && <p className="text-red-500 text-sm mb-3">{message}</p>}

      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        disabled={loading}
      >
        {loading ? "Wird registriert..." : "Registrieren & Score übernehmen"}
      </button>
    </form>
  );
}
