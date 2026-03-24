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
import InstallBanner from "./shared/components/InstallBanner";

function AppContent() {
  const { user, logout, refreshUser, setUser } = useAuth();
  const achievements = useAchievementContext();
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
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#140c2b] via-[#1c1248] to-[#0e1a38] flex flex-col pt-safe">
        <PrivacyPolicy onBack={() => { setScreen(user ? "menu" : "login"); window.location.hash = ""; }} />
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    );
  }

  if (screen === "impressum") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#140c2b] via-[#1c1248] to-[#0e1a38] flex flex-col pt-safe">
        <Impressum onBack={() => { setScreen(user ? "menu" : "login"); window.location.hash = ""; }} />
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    );
  }

  if (screen === "terms") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#140c2b] via-[#1c1248] to-[#0e1a38] flex flex-col pt-safe">
        <Terms onBack={() => { setScreen(user ? "menu" : "login"); window.location.hash = ""; }} />
        <Footer onNavigate={handleFooterNavigation} />
      </div>
    );
  }

  if (!user && screen === "forgot-password") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#140c2b] via-[#1c1248] to-[#0e1a38] text-white flex flex-col pt-safe">
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
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#140c2b] via-[#1c1248] to-[#0e1a38] text-white flex flex-col pt-safe">
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
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#140c2b] via-[#1c1248] to-[#0e1a38] text-white flex flex-col pt-safe">
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#140c2b] via-[#1c1248] to-[#0e1a38] text-white flex flex-col pt-safe">
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
            <div className="inline-flex items-center gap-2 bg-amber-950/50 border border-amber-600/25 rounded-full px-4 py-1.5 mb-5 shadow-inner">
              <span className="text-amber-400 text-sm font-medium tracking-wide">
                🏆 {achievements.totalUnlocked} / {achievements.totalAchievements} Achievements
              </span>
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => { setShowRegister(false); setScore(0); setGameKey((k) => k + 1); setScreen("game"); }}
                className="bg-gradient-to-b from-emerald-700 to-emerald-950 border border-emerald-600/30 rounded-xl py-4 text-white font-semibold text-lg hover:from-emerald-600 hover:to-emerald-900 transition-all shadow-lg active:scale-95"
              >
                New Game
              </button>
              <button
                onClick={() => { setShowRegister(false); setScreen("leaderboard"); }}
                className="bg-gradient-to-b from-violet-700 to-violet-950 border border-violet-500/30 rounded-xl py-4 text-white font-semibold text-lg hover:from-violet-600 hover:to-violet-900 transition-all shadow-lg active:scale-95"
              >
                Leaderboard
              </button>
            </div>

            {/* Daily Challenge — featured */}
            {!user?.guest && (
              <button
                onClick={() => setScreen("daily-challenge")}
                className="w-full mb-3 bg-gradient-to-b from-amber-700 to-amber-950 border border-amber-500/30 rounded-xl py-4 text-white font-semibold text-lg hover:from-amber-600 hover:to-amber-900 transition-all shadow-lg active:scale-95 tracking-wide"
              >
                📅 Daily Challenge
              </button>
            )}

            {/* Secondary Actions */}
            {!user?.guest && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => setScreen("stats")}
                  className="bg-slate-800/80 border border-slate-600/30 rounded-xl py-3 text-slate-200 text-sm font-medium hover:bg-slate-700/80 transition-all active:scale-95"
                >
                  📊 Stats
                </button>
                <button
                  onClick={() => setScreen("achievements")}
                  className="bg-stone-800/80 border border-amber-700/25 rounded-xl py-3 text-amber-200 text-sm font-medium hover:bg-stone-700/80 transition-all active:scale-95"
                >
                  🏆 Trophies
                </button>
                <button
                  onClick={() => setShowSuggestionModal(true)}
                  className="bg-rose-950/80 border border-rose-700/25 rounded-xl py-3 text-rose-200 text-sm font-medium hover:bg-rose-900/80 transition-all active:scale-95"
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
                  className="bg-gradient-to-b from-amber-800 to-stone-950 border border-amber-600/25 rounded-xl px-8 py-3 text-amber-200 font-medium hover:from-amber-700 transition-all active:scale-95"
                >
                  🏆 Achievements
                </button>
              </div>
            )}

            {/* Guest registration */}
            {user?.guest && !showRegister && (
              <button
                onClick={() => setShowRegister(true)}
                className="w-full bg-gradient-to-b from-indigo-700 to-indigo-950 border border-indigo-500/30 rounded-xl py-3 text-white font-medium hover:from-indigo-600 transition-all active:scale-95"
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

      {screen !== "game" && screen !== "daily-challenge" && screen !== "stats" && <Footer onNavigate={handleFooterNavigation} />}
      <CookieConsent />
      <InstallBanner />
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