import React, { useState, useEffect } from "react";
import { useAuth } from "./features/auth/context/AuthContext";
import { AchievementProvider, useAchievementContext } from "./features/game/context/AchievementContext";
import LoginForm from "./features/auth/components/LoginForm";
import Leaderboard from "./features/leaderboard/components/Leaderboard";
import RegisterWithScore from "./features/auth/components/RegisterWithScore";
import ForgotPassword from "./features/auth/components/ForgotPassword";
import ResetPassword from "./features/auth/components/ResetPassword";
import Game from "./features/game/components/Game";
import DailyChallengeGame from "./features/game/components/DailyChallengeGame";
import Footer from "./shared/components/Footer";
import CookieConsent from "./features/legal/components/CookieConsent";
import PrivacyPolicy from "./features/legal/components/PrivacyPolicy";
import Impressum from "./features/legal/components/Impressum";
import Terms from "./features/legal/components/Terms";
import AccountSettings from "./features/account/components/AccountSettings";
import SuggestionModal from "./features/suggestions/components/SuggestionModal";
import { submitSuggestion } from "./features/suggestions/api/suggestionApi";
import AchievementsDisplay from "./features/game/components/AchievementsDisplay";
import StatsDisplay from "./features/game/components/StatsDisplay";
import CodexPage from "./features/game/components/CodexPage";

function AppContent() {
  const { user, logout, refreshUser, setUser } = useAuth();
  const achievements = useAchievementContext();

  // Request fullscreen on first tap — mobile only (Android Chrome supports this; iOS Safari does not)
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;
    const requestFullscreen = () => {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    };
    document.addEventListener("click", requestFullscreen, { once: true });
    return () => document.removeEventListener("click", requestFullscreen);
  }, []);
  const [screen, setScreen] = useState("menu");
  const [showRegister, setShowRegister] = useState(false);
  const [score, setScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [resetToken, setResetToken] = useState(null);
  const [resetSuccess, setResetSuccess] = useState("");
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

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

  const handleSubmitSuggestion = async (text) => {
    await submitSuggestion(text);
  };

  // Legal Pages
  if (screen === "privacy") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] flex flex-col pt-safe">
        <PrivacyPolicy onBack={() => { setScreen(user ? "menu" : "login"); window.location.hash = ""; }} />
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    );
  }

  if (screen === "impressum") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] flex flex-col pt-safe">
        <Impressum onBack={() => { setScreen(user ? "menu" : "login"); window.location.hash = ""; }} />
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    );
  }

  if (screen === "terms") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] flex flex-col pt-safe">
        <Terms onBack={() => { setScreen(user ? "menu" : "login"); window.location.hash = ""; }} />
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    );
  }

  if (!user && screen === "forgot-password") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] text-white flex flex-col pt-safe">
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
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] text-white flex flex-col pt-safe">
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
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] text-white flex flex-col pt-safe">
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] text-white flex flex-col pt-safe">
      {/* Header row — never overlaps content */}
      <div className="flex justify-end items-center gap-2 px-4 py-3 min-h-[56px] shrink-0">
        {(screen === "game" || screen === "daily-challenge") && (
          <button onClick={() => setScreen("menu")} className="bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-1.5 rounded-lg text-sm text-white/90 transition">
            Back to Menu
          </button>
        )}
        {screen === "menu" && (
          <>
            <button onClick={() => setScreen("settings")} className="bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-lg text-sm text-white/80 transition">
              ⚙️ Settings
            </button>
            <button onClick={handleLogout} className="bg-red-900/60 hover:bg-red-800/80 border border-red-700/30 px-3 py-1.5 rounded-lg text-sm text-red-200 transition">
              Logout
            </button>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center sm:p-4 px-4 pb-safe" style={{paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)'}}>

        {screen === "menu" && (
          <div className="w-full max-w-sm mx-auto text-center py-2">

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold tracking-wide text-amber-200 drop-shadow-lg">
                🧙‍♂️ Magic Price Duel
              </h1>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-500/40" />
                <span className="text-amber-500/70 text-xs tracking-widest uppercase font-medium">Card Duelist</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-500/40" />
              </div>
              <p className="text-purple-200 text-lg">
                Welcome, <span className="text-amber-300 font-semibold">{user.username}</span>
              </p>
            </div>

            {/* Achievement Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5 shadow-inner">
              <span className="text-amber-400 text-sm font-medium tracking-wide">
                🏆 {achievements.totalUnlocked} / {achievements.totalAchievements} Achievements
              </span>
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => { setShowRegister(false); setScore(0); setGameKey((k) => k + 1); setScreen("game"); }}
                className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/40 rounded-xl py-4 text-white font-semibold text-lg transition-all shadow-md active:scale-95"
              >
                New Game
              </button>
              <button
                onClick={() => { setShowRegister(false); setScreen("leaderboard"); }}
                className="bg-violet-600 hover:bg-violet-500 border border-violet-400/40 rounded-xl py-4 text-white font-semibold text-lg transition-all shadow-md active:scale-95"
              >
                Leaderboard
              </button>
            </div>

            {/* Daily Challenge — featured */}
            {!user?.guest && (
              <button
                onClick={() => setScreen("daily-challenge")}
                className="w-full mb-3 bg-amber-600 hover:bg-amber-500 border border-amber-400/40 rounded-xl py-4 text-white font-semibold text-lg transition-all shadow-md active:scale-95 tracking-wide"
              >
                📅 Daily Challenge
              </button>
            )}

            {/* Secondary Actions */}
            {!user?.guest && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => setScreen("stats")}
                  className="bg-slate-600/70 hover:bg-slate-500/70 border border-slate-400/30 rounded-xl py-3 text-white text-sm font-medium transition-all active:scale-95"
                >
                  📊 Stats
                </button>
                <button
                  onClick={() => setScreen("achievements")}
                  className="bg-amber-700/70 hover:bg-amber-600/70 border border-amber-500/30 rounded-xl py-3 text-white text-sm font-medium transition-all active:scale-95"
                >
                  🏆 Trophies
                </button>
              </div>
            )}
            {!user?.guest && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setScreen("codex")}
                  className="bg-indigo-700/70 hover:bg-indigo-600/70 border border-indigo-500/30 rounded-xl py-3 text-white text-sm font-medium transition-all active:scale-95"
                >
                  📖 Codex
                </button>
                <button
                  onClick={() => setShowSuggestionModal(true)}
                  className="bg-rose-700/70 hover:bg-rose-600/70 border border-rose-500/30 rounded-xl py-3 text-white text-sm font-medium transition-all active:scale-95"
                >
                  💡 Ideas
                </button>
              </div>
            )}

            {/* Guest-only achievements */}
            {user?.guest && (
              <div className="mb-4">
                <button
                  onClick={() => setScreen("achievements")}
                  className="bg-amber-700 hover:bg-amber-600 border border-amber-500/40 rounded-xl px-8 py-3 text-white font-medium transition-all active:scale-95"
                >
                  🏆 Achievements
                </button>
              </div>
            )}

            {/* Guest registration */}
            {user?.guest && !showRegister && (
              <button
                onClick={() => setShowRegister(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 rounded-xl py-3 text-white font-medium transition-all active:scale-95"
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

        {screen === "stats" && (
          <StatsDisplay onBack={() => setScreen("menu")} />
        )}

        {screen === "codex" && (
          <div className="w-full flex-1 min-h-0 flex flex-col pt-2 pb-4" style={{ maxHeight: 'calc(100dvh - 72px)' }}>
            <CodexPage onBack={() => setScreen("menu")} />
          </div>
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

        {screen === "daily-challenge" && (
          <DailyChallengeGame onBack={() => setScreen("menu")} />
        )}
      </div>

      {screen !== "game" && screen !== "daily-challenge" && screen !== "stats" && screen !== "codex" && <Footer onNavigate={handleFooterNavigation} />}
      <CookieConsent />
      <SuggestionModal
        isOpen={showSuggestionModal}
        onClose={() => setShowSuggestionModal(false)}
        onSubmit={handleSubmitSuggestion}
      />
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