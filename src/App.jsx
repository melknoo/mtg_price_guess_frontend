import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import LoginForm from "./LoginForm";
import Leaderboard from "./Leaderboard";
import RegisterWithScore from "./RegisterWithScore";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Game from "./Game";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function App() {
  const { user, logout, refreshUser, setUser } = useAuth();
  const [screen, setScreen] = useState("menu");
  const [showRegister, setShowRegister] = useState(false);
  const [score, setScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [resetToken, setResetToken] = useState(null);
  const [resetSuccess, setResetSuccess] = useState("");

  // Check for reset token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    console.log("Checking for reset token:", token);
    console.log("Current URL:", window.location.search);
    console.log("Current user:", user);
    
    if (token) {
      // Token kommt bereits URL-safe vom Backend (mit - und _ statt + und /)
      // Keine weitere Dekodierung nötig!
      console.log("Reset token found (URL-safe):", token);
      console.log("Setting screen to reset-password");
      setResetToken(token);
      setScreen("reset-password");
      // Wenn ein User eingeloggt ist, logge ihn aus
      if (user) {
        console.log("Logging out current user for password reset");
        logout();
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setShowRegister(false);
    setScore(0);
    setGameKey((k) => k + 1);
  };

  const handleResetSuccess = (message) => {
    setResetSuccess(message);
    setResetToken(null);
    setScreen("login");
    // Clear URL parameter
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  if (!user && screen === "forgot-password") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex items-center justify-center p-4">
        <ForgotPassword onBack={() => setScreen("login")} />
      </div>
    );
  }

  if (!user && screen === "reset-password" && resetToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex items-center justify-center p-4">
        <ResetPassword
          token={resetToken}
          onSuccess={handleResetSuccess}
          onBack={() => {
            setResetToken(null);
            setScreen("login");
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex items-center justify-center p-4">
        <div className="space-y-4">
          {resetSuccess && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center max-w-sm mx-auto">
              ✅ {resetSuccess}
            </div>
          )}
          <LoginForm onForgotPassword={() => setScreen("forgot-password")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex gap-2">
        {screen === "game" && (
          <button
            onClick={() => setScreen("menu")}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Zurück zum Menü
          </button>
        )}
      </div>

      {screen === "menu" && (
        <div>
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold mb-4">🧙‍♂️ Magic Preis-Duell</h1>
            <h2 className="text-2xl font-bold mb-4">Hallo {user.username}</h2>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setShowRegister(false);
                  setScore(0);
                  setGameKey((k) => k + 1);
                  setScreen("game");
                }}
                className="bg-green-600 px-6 py-3 rounded text-white text-lg hover:bg-green-700 transition"
              >
                Neues Spiel
              </button>
              <button
                onClick={() => {
                  setShowRegister(false);
                  setScreen("leaderboard");
                }}
                className="bg-purple-600 px-6 py-3 rounded text-white text-lg hover:bg-purple-700 transition"
              >
                Rangliste
              </button>
            </div>
            {user?.guest && !showRegister && (
              <button
                onClick={() => setShowRegister(true)}
                className="mt-4 bg-blue-400 px-6 py-3 rounded text-white text-lg hover:bg-blue-600 transition"
              >
                Registrieren & Score speichern
              </button>
            )}

            {user?.guest && showRegister && (
              <RegisterWithScore
                score={user?.highscore ?? score}
                className="mt-4"
                onSuccess={(newUser) => {
                  setUser(newUser);
                  refreshUser();
                  setShowRegister(false);
                }}
              />
            )}
          </div>
        </div>
      )}

      {screen === "leaderboard" && <Leaderboard onBack={() => setScreen("menu")} />}

      {screen === "game" && (
        <Game
          key={gameKey}
          score={score}
          setScore={setScore}
          onBack={() => setScreen("menu")}
          showRegister={showRegister}
          setShowRegister={setShowRegister}
        />
      )}
    </div>
  );
}