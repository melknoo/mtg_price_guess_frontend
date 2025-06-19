import { useState } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";

export default function RegisterWithScoreForm({ score, onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/register-with-score`, {
        username,
        password,
        score,
      });

      const token = res.data.token;

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);

      setUser(res.data.user); // optional: user-Objekt übernehmen
      if (onSuccess) onSuccess(res.data.user);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(`❌ ${err.response.data.message}`);
      } else {
        setError("❌ Ein unbekannter Fehler ist aufgetreten.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-sm mx-auto bg-white p-6 rounded-xl shadow text-black"
    >
      <h2 className="text-xl font-bold mb-2">Registrieren & Score speichern</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}

      <input
        placeholder="Benutzername"
        className="w-full p-2 border rounded"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Passwort"
        className="w-full p-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        className={`bg-blue-600 text-white p-2 rounded w-full hover:bg-blue-700 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={loading}
      >
        {loading ? "Registrieren..." : "Registrieren & Score speichern"}
      </button>
    </form>
  );
}
