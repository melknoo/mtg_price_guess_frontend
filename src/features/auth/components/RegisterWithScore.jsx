import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function RegisterWithScore({ score, onSuccess }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { registerWithScore } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const newUser = await registerWithScore(username, email, password, score);
      if (onSuccess) onSuccess(newUser);
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
        type="email"
        placeholder="Email"
        className="w-full p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
        className={`bg-blue-600 text-white p-2 rounded w-full hover:bg-blue-700 transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Registrieren..." : "Registrieren & Score speichern"}
      </button>
    </form>
  );
}