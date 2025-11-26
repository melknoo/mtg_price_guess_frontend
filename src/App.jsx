import React, { useState, useEffect } from "react";
import { useAuth } from "./features/auth/context/AuthContext";
import { AchievementProvider, useAchievementContext } from "./features/game/context/AchievementContext";
import LoginForm from "./features/auth/components/LoginForm";
import Leaderboard from "./features/leaderboard/components/Leaderboard";
import RegisterWithScore from "./features/auth/components/RegisterWithScore";
import ForgotPassword from "./features/auth/components/ForgotPassword";
import ResetPassword from "./features/auth/components/ResetPassword";
import Game from "./features/game/components/Game";
import Footer from "./shared/components/Footer";
import CookieConsent from "./features/legal/components/CookieConsent";
import PrivacyPolicy from "./features/legal/components/PrivacyPolicy";
import Impressum from "./features/legal/components/Impressum";
import Terms from "./features/legal/components/Terms";
import AccountSettings from "./features/account/components/AccountSettings";
import AchievementsDisplay from "./features/game/components/AchievementsDisplay";

function AppContent() {
  const { user, logout, refreshUser, setUser } = useAuth();
  const achievements = useAchievementContext();
  const [screen, setScreen] = useState("menu");
  const [showRegister, setShowRegister] = useState(false);
  const [score, setScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [resetToken, setResetToken] = useState(null);
  const [resetSuccess, setResetSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setResetToken(token);
      setScreen("reset-password");
      if (user) {
        logout();
        setUser(null);
      }
    }

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "/privacy") setScreen("privacy");
      else if (hash === "/impressum") setScreen("impressum");
      else if (hash === "/terms") setScreen("terms");
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && (screen === "login" || screen === "reset-password" || screen === "forgot-password")) {
      setScreen("menu");
    }
  }, [user, screen]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setShowRegister(false);
    setScore(0);
    setGameKey((k) => k + 1);
    setScreen("menu");
  };

  const handleResetSuccess = (message) => {
    setResetSuccess(message);
    setResetToken(null);
    setScreen("login");
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleFooterNavigation = (route) => {
    setScreen(route);
    window.location.hash = `/${route}`;
  };

  // Legal Pages
  if (screen === "privacy") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex flex-col">
        <PrivacyPolicy onBack={() => { setScreen(user ? "menu" : "login"); window.location.hash = ""; }} />
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    );
  }

  if (screen === "impressum") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex flex-col">
        <Impressum onBack={() => { setScreen(user ? "menu" : "login"); window.location.hash = ""; }} />
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    );
  }

  if (screen === "terms") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex flex-col">
        <Terms onBack={() => { setScreen(user ? "menu" : "login"); window.location.hash = ""; }} />
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    );
  }

  if (!user && screen === "forgot-password") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <ForgotPassword onBack={() => setScreen("login")} />
        </div>
        <Footer onNavigate={handleFooterNavigation} />
        <CookieConsent />
      </div>
    );
  }

  if (!user && screen === "reset-password" && resetToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <ResetPassword
            token={resetToken}
            onSuccess={handleResetSuccess}
            onBack={() => { setResetToken(null); setScreen("login"); window.history.replaceState({}, document.title, window.location.pathname); }}
          />
        </div>
        <Footer onNavigate={handleFooterNavigation} />
        <CookieConsent />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="space-y-4">
            {resetSuccess && (
              <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center max-w-sm mx-auto">
                ✅ {resetSuccess}
              </div>
            )}
            <LoginForm onForgotPassword={() => setScreen("forgot-password")} />
          </div>
        </div>
        <Footer onNavigate={handleFooterNavigation} />
        <CookieConsent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center sm:p-4 pt-12 pb-20 px-4 relative">
        <div className="absolute top-12 sm:top-4 right-4 flex gap-2">
          {screen === "game" && (
            <button onClick={() => setScreen("menu")} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition">
              Back to Menu
            </button>
          )}
          {screen === "menu" && (
            <>
              <button onClick={() => setScreen("settings")} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition">
                ⚙️ Settings
              </button>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                Logout
              </button>
            </>
          )}
        </div>

        {screen === "menu" && (
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold mb-4">🧙‍♂️ Magic Price Duel</h1>
            <h2 className="text-2xl font-bold mb-4">Hello {user.username}</h2>
            
            {/* Achievement Progress Badge */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 inline-block mb-4">
              <span className="text-yellow-300">
                🏆 {achievements.totalUnlocked}/{achievements.totalAchievements} Achievements
              </span>
            </div>

            <div className="space-x-4">
              <button
                onClick={() => { setShowRegister(false); setScore(0); setGameKey((k) => k + 1); setScreen("game"); }}
                className="bg-green-600 px-6 py-3 rounded text-white text-lg hover:bg-green-700 transition"
              >
                New Game
              </button>
              <button
                onClick={() => { setShowRegister(false); setScreen("leaderboard"); }}
                className="bg-purple-600 px-6 py-3 rounded text-white text-lg hover:bg-purple-700 transition"
              >
                Leaderboard
              </button>
            </div>

            {/* Achievements Button */}
            <div className="pt-4">
              <button
                onClick={() => setScreen("achievements")}
                className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded text-white text-lg transition"
              >
                🏆 Achievements
              </button>
            </div>

            {user?.guest && !showRegister && (
              <button
                onClick={() => setShowRegister(true)}
                className="mt-4 bg-blue-400 px-6 py-3 rounded text-white text-lg hover:bg-blue-600 transition"
              >
                Register & Save Score
              </button>
            )}

            {user?.guest && showRegister && (
              <RegisterWithScore
                score={user?.highscore ?? score}
                className="mt-4"
                onSuccess={(newUser) => { setUser(newUser); refreshUser(); setShowRegister(false); }}
              />
            )}
          </div>
        )}

        {screen === "leaderboard" && <Leaderboard onBack={() => setScreen("menu")} />}
        {screen === "settings" && <AccountSettings onBack={() => setScreen("menu")} />}
        
        {screen === "achievements" && (
          <AchievementsDisplay 
            achievements={achievements.getAllWithStatus()} 
            onBack={() => setScreen("menu")} 
          />
        )}

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

      {screen !== "game" && <Footer onNavigate={handleFooterNavigation} />}
      <CookieConsent />
    </div>
  );
}

export default function App() {
  return (
    <AchievementProvider>
      <AppContent />
    </AchievementProvider>
  );
}