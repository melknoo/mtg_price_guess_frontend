import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const { login, register, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGuest = () => {
    setUser({ username: "Gast", highscore: 0, guest: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("❌ Benutzername oder Passwort ist falsch.");
      } else if (err.response?.data?.message) {
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
      <h2 className="text-xl font-bold mb-2">{isLogin ? "Login" : "Registrieren"}</h2>

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
      />
      <input
        type="password"
        placeholder="Passwort"
        className="w-full p-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="submit"
        className={`bg-blue-600 text-white p-2 rounded w-full hover:bg-blue-700 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={loading}
      >
        {loading
          ? isLogin
            ? "Einloggen..."
            : "Registrieren..."
          : isLogin
            ? "Einloggen"
            : "Registrieren"}
      </button>

      <p
        className="text-sm text-blue-600 hover:underline cursor-pointer text-center"
        onClick={() => {
          setIsLogin(!isLogin);
          setError("");
        }}
      >
        {isLogin ? "Noch kein Account? Registrieren" : "Schon registriert? Login"}
      </p>

      <button
        type="button"
        onClick={handleGuest}
        className="text-sm text-blue-600 hover:underline cursor-pointer w-full"
      >
        Als Gast spielen
      </button>
    </form>
  );
}
