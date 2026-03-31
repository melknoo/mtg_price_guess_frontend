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
import HowToPlayModal from "./features/game/components/HowToPlayModal";
import GameIcon from "./shared/components/GameIcon";

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
  const [showHowToPlay, setShowHowToPlay] = useState(false);

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

  // Legacy legal hash routes: redirect into settings inside app instead of separate pages
  if (screen === "privacy" || screen === "impressum" || screen === "terms") {
    setScreen(user ? "settings" : "login");
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

  // Public full leaderboard (accessible from login/register screen)
  if (!user && screen === "leaderboard") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] text-white flex flex-col pt-safe overflow-y-auto">
        <div className="flex-1 flex items-start justify-center p-4 py-8">
          <Leaderboard onBack={() => setScreen("login")} />
        </div>
        <Footer onNavigate={handleFooterNavigation} />
        <CookieConsent />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] text-white flex flex-col pt-safe overflow-y-auto">
        <div className="flex-1 flex items-start lg:items-center justify-center p-4 py-8">
          <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-center">

            {/* Left: title + form */}
            <div className="w-full max-w-sm mx-auto lg:mx-0 space-y-4">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-amber-200">
                  Magic Price Duel
                </h1>
                <p className="text-purple-300 text-sm mt-1">Guess which Magic card costs more.</p>
                <button
                  onClick={() => setShowHowToPlay(true)}
                  className="mt-2 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2 transition"
                >
                  How to Play
                </button>
              </div>
              {resetSuccess && (
                <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center text-sm">
                  <span className="inline-flex items-center justify-center gap-1">
                    <GameIcon name="star" size={16} color="green" />
                    <span>{resetSuccess}</span>
                  </span>
                </div>
              )}
              <LoginForm onForgotPassword={() => setScreen("forgot-password")} />
            </div>

            {/* Right: leaderboard */}
            <div className="w-full max-w-sm mx-auto lg:mx-0">
              <Leaderboard compact onShowFull={() => setScreen("leaderboard")} />
            </div>

          </div>
        </div>
        <Footer onNavigate={handleFooterNavigation} />
        <CookieConsent />
        {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#0d1b3e] via-[#1a3668] to-[#0c2454] text-white flex flex-col pt-safe overflow-y-auto">
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
              <span className="inline-flex items-center gap-1">
                <GameIcon name="gear" size={16} color="white" />
                <span>Settings</span>
              </span>
            </button>
            <button onClick={handleLogout} className="bg-red-900/60 hover:bg-red-800/80 border border-red-700/30 px-3 py-1.5 rounded-lg text-sm text-red-200 transition">
              Logout
            </button>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center sm:p-4 px-4 pb-safe" style={{paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)'}}>

        {screen === "menu" && (
          <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 items-start justify-center py-2">

            {/* Left: menu */}
            <div className="w-full max-w-sm mx-auto lg:mx-0 text-center">

              {/* Title */}
              <div className="mb-6">
                <h1 className="text-4xl font-bold tracking-wide text-amber-200 drop-shadow-lg">
                  Magic Price Duel
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
                <GameIcon name="trophy" size={18} color="amber" />
                <span className="text-amber-400 text-sm font-medium tracking-wide">
                  {achievements.totalUnlocked} / {achievements.totalAchievements} Achievements
                </span>
              </div>

              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={() => { setShowRegister(false); setScore(0); setGameKey((k) => k + 1); setScreen("game"); }}
                  className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/40 rounded-lg py-4 text-white font-semibold text-lg transition-all shadow-md active:scale-95"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <GameIcon name="play" size={20} color="white" />
                    <span>New Game</span>
                  </span>
                </button>
                <button
                  onClick={() => setShowHowToPlay(true)}
                  className="bg-violet-700/80 hover:bg-violet-600/80 border border-violet-500/40 rounded-lg py-4 text-white font-semibold text-lg transition-all shadow-md active:scale-95"
                >
                  <span className="inline-flex items-center justify-center">
                    How to Play
                  </span>
                </button>
              </div>

              {/* Secondary Actions */}
              {!user?.guest && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => setScreen("stats")}
                    className="bg-slate-600/70 hover:bg-slate-500/70 border border-slate-400/30 rounded-lg py-3 text-white text-sm font-medium transition-all active:scale-95"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <GameIcon name="stat" size={18} color="white" />
                      <span>Stats</span>
                    </span>
                  </button>
                  <button
                    onClick={() => setScreen("achievements")}
                    className="bg-amber-700/70 hover:bg-amber-600/70 border border-amber-500/30 rounded-lg py-3 text-white text-sm font-medium transition-all active:scale-95"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <GameIcon name="trophy" size={18} color="amber" />
                      <span>Achievements</span>
                    </span>
                  </button>
                </div>
              )}
              {!user?.guest && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => setScreen("codex")}
                    className="bg-indigo-700/70 hover:bg-indigo-600/70 border border-indigo-500/30 rounded-lg py-3 text-white text-sm font-medium transition-all active:scale-95"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <GameIcon name="scroll" size={18} color="white" />
                      <span>Codex</span>
                    </span>
                  </button>
                  <button
                    onClick={() => setShowSuggestionModal(true)}
                    className="bg-rose-700/70 hover:bg-rose-600/70 border border-rose-500/30 rounded-lg py-3 text-white text-sm font-medium transition-all active:scale-95"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <GameIcon name="light_bulb" size={18} color="amber" />
                      <span>Ideas</span>
                    </span>
                  </button>
                </div>
              )}

              {/* Guest-only achievements */}
              {user?.guest && (
                <div className="mb-4">
                  <button
                    onClick={() => setScreen("achievements")}
                    className="bg-amber-700 hover:bg-amber-600 border border-amber-500/40 rounded-lg px-8 py-3 text-white font-medium transition-all active:scale-95"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <GameIcon name="trophy_2" size={18} color="amber" />
                      <span>Achievements</span>
                    </span>
                  </button>
                </div>
              )}

              {/* Guest registration */}
              {user?.guest && !showRegister && (
                <button
                  onClick={() => setShowRegister(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 rounded-lg py-3 text-white font-medium transition-all active:scale-95"
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

            {/* Right: leaderboard */}
            <div className="w-full max-w-sm mx-auto lg:mx-0">
              <Leaderboard compact onShowFull={() => setScreen("leaderboard")} />
            </div>

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
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
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