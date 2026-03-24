import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";

export default function RegisterWithScore({ score, onSuccess }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { registerWithScore } = useAuth();
  const recaptchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // reCAPTCHA Token holen
    if (!recaptchaRef.current) {
      setError("❌ reCAPTCHA could not be loaded.");
      return;
    }
    
    const recaptchaToken = recaptchaRef.current.getValue();
    
    if (!recaptchaToken) {
      setError("❌ Please confirm you're not a robot.");
      return;
    }

    setLoading(true);

    try {
      const newUser = await registerWithScore(username, email, password, score, recaptchaToken);
      if (onSuccess) onSuccess(newUser);
    } catch (err) {
      console.error(err);
      
      // Reset reCAPTCHA bei Fehler
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      
      if (err.response?.data?.message) {
        setError(`❌ ${err.response.data.message}`);
      } else {
        setError("❌ An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-sm mx-auto bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl shadow-2xl text-white mt-6"
    >
      <h2 className="text-xl font-bold mb-2 text-amber-200">Register & Save Score</h2>

      <div className="bg-green-500/20 text-green-300 p-3 rounded text-center font-semibold">
        🎯 Your Score: {score} Points
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-300 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}

      <input
        placeholder="Username"
        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      
      <input
        type="email"
        placeholder="Email"
        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <input
        type="password"
        placeholder="Password (min. 6 characters)"
        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />

      {/* reCAPTCHA */}
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          theme="light"
        />
      </div>

      <button
        type="submit"
        className={`bg-amber-600 text-white p-2 rounded w-full hover:bg-amber-500 transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Registering..." : "Register & Save Score"}
      </button>
    </form>
  );
}