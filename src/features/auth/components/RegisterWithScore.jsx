import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";
import PasswordInput from "../../../shared/components/PasswordInput";

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
      className="space-y-4 max-w-sm mx-auto bg-[#111827] border-2 border-[#2d3a5c] p-6 rounded-sm shadow-pixel text-white mt-6"
    >
      <h2 className="text-xl font-bold mb-2 text-amber-200">Register & Save Score</h2>

      <div className="bg-green-900/30 text-green-300 border-2 border-green-700 p-3 rounded-sm text-center font-semibold">
        🎯 Your Score: {score} Points
      </div>

      {error && (
        <div className="bg-red-900/30 text-red-300 border-2 border-red-700 p-2 rounded-sm mb-2 text-sm">
          {error}
        </div>
      )}

      <input
        placeholder="Username"
        className="w-full p-2 bg-[#0a0e1a] border-2 border-[#2d3a5c] rounded-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      
      <input
        type="email"
        placeholder="Email"
        className="w-full p-2 bg-[#0a0e1a] border-2 border-[#2d3a5c] rounded-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <PasswordInput
        placeholder="Password (min. 6 characters)"
        className="w-full p-2 bg-[#0a0e1a] border-2 border-[#2d3a5c] rounded-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
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
        className={`bg-amber-600 text-white p-2 rounded-sm w-full hover:bg-amber-500 border-2 border-amber-800 transition shadow-pixel-sm ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Registering..." : "Register & Save Score"}
      </button>
    </form>
  );
}