import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "../../../shared/components/Button";
import ReCAPTCHA from "react-google-recaptcha";
import SocialLoginButtons from "./SocialLoginButtons";
import PasswordInput from "../../../shared/components/PasswordInput";

export default function LoginForm({ onForgotPassword }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const { login, register, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef(null);
  
  // Tracking fehlgeschlagener Login-Versuche
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptchaOnLogin, setShowCaptchaOnLogin] = useState(false);


  // Prüfe beim Laden, ob bereits fehlgeschlagene Versuche gespeichert sind
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('login_attempts') || '0');
    setFailedAttempts(attempts);
    setShowCaptchaOnLogin(attempts >= 3);
  }, []);

  const handleGuest = () => {
    setUser({ username: "Gast", highscore: 0, guest: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Für Registrierung: immer reCAPTCHA
    // Für Login: nur nach 3 fehlgeschlagenen Versuchen
    const needsCaptcha = !isLogin || showCaptchaOnLogin;
    
    if (needsCaptcha) {
      if (!recaptchaRef.current) {
        setError("❌ reCAPTCHA could not be loaded.");
        return;
      }
      
      const recaptchaToken = recaptchaRef.current.getValue();
      
      if (!recaptchaToken) {
        setError("❌ Please confirm you're not a robot.");
        return;
      }
    }

    setLoading(true);

    try {
      const recaptchaToken = needsCaptcha ? recaptchaRef.current.getValue() : null;

      if (isLogin) {
        await login(username, password, recaptchaToken);
        
        // Erfolgreicher Login -> Reset der fehlgeschlagenen Versuche
        localStorage.removeItem('login_attempts');
        setFailedAttempts(0);
        setShowCaptchaOnLogin(false);
        
      } else {
        await register(username, email, password, recaptchaToken);
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
      }
    } catch (err) {
      console.error(err);
      
      // Reset reCAPTCHA bei Fehler
      if (needsCaptcha && recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      
      if (err.response?.status === 401) {
        // Fehlgeschlagener Login-Versuch
        if (isLogin) {
          const newAttempts = failedAttempts + 1;
          setFailedAttempts(newAttempts);
          localStorage.setItem('login_attempts', newAttempts.toString());
          
          if (newAttempts >= 3) {
            setShowCaptchaOnLogin(true);
            setError("❌ Too many failed attempts. Please confirm you're not a robot.");
          } else {
            setError(`❌ Benutzername oder Passwort ist falsch. (Attempt ${newAttempts}/3)`);
          }
        } else {
          setError("❌ Username or password is incorrect.");
        }
      } else if (err.response?.data?.message) {
        setError(`❌ ${err.response.data.message}`);
      } else {
        setError("❌ An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setError("");
    // Reset reCAPTCHA beim Umschalten
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  // Show warning wenn nah an Captcha-Schwelle
  const showWarning = isLogin && failedAttempts > 0 && failedAttempts < 3;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-sm mx-auto bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-xl shadow-2xl text-white"
    >
      <h2 className="text-xl font-bold mb-2 text-amber-200">{isLogin ? "Login" : "Registrieren"}</h2>

      {error && (
        <div className="bg-red-500/20 text-red-300 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}

      {showWarning && (
        <div className="bg-yellow-500/20 text-yellow-200 p-2 rounded mb-2 text-sm">
          ⚠️ Still ${3 - failedAttempts} attempt(s) until captcha verification
        </div>
      )}

      {isLogin && (
        <input
          placeholder="Username or Email"
          className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      )}

      {!isLogin && (
        <>
          <input
            placeholder="Email"
            type="email"
            className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            placeholder="Username"
            type="text"
            className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </>
      )}

      <PasswordInput
        placeholder="Password"
        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-amber-400/60"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {/* reCAPTCHA: Immer bei Registrierung, bei Login nur nach 3 Fehlversuchen */}
      {(!isLogin || showCaptchaOnLogin) && (
        <div className="flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
            theme="light"
          />
        </div>
      )}

      {isLogin && onForgotPassword && (
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            Forgot password?
          </button>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        className="w-full"
      >
        {isLogin ? "Login" : "Register"}
      </Button>

      <p
        className="text-sm text-amber-400 hover:text-amber-300 cursor-pointer text-center"
        onClick={handleModeSwitch}
      >
        {isLogin ? "No account yet? Register" : "Already registered? Login"}
      </p>

      <button
        type="button"
        onClick={handleGuest}
        className="text-sm text-amber-400 hover:text-amber-300 cursor-pointer w-full"
      >
        Play as Guest
      </button>

      {process.env.REACT_APP_GOOGLE_CLIENT_ID && (
        <>
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-white/20" />
            <span className="text-xs text-white/40 shrink-0">or continue with</span>
            <div className="flex-1 border-t border-white/20" />
          </div>
          <SocialLoginButtons onError={(msg) => setError(`❌ ${msg}`)} />
        </>
      )}
    </form>
  );
}