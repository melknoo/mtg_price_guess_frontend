import React from 'react';

export default function GameOverScreen({
  message,
  bestStreak,
  onRestart,
  onBack,
  showRegister,
  onShowRegister,
  isGuest,
  children
}) {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
      <div className="bg-[#0d1b3e]/95 border border-white/20 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center max-w-sm w-full">
        <h2 className="text-2xl mb-3 font-bold text-amber-200">❌ Wrong Guess!</h2>
        <p className="mb-3 text-white/80">{message}</p>

        {bestStreak > 0 && (
          <p className="mb-5 text-xl text-orange-400 font-bold">
            🔥 Best Streak: {bestStreak}
          </p>
        )}

        <button
          onClick={onRestart}
          className="w-full bg-emerald-700 hover:bg-emerald-600 px-6 py-3 rounded-xl text-white text-lg font-semibold transition active:scale-95"
        >
          Restart
        </button>

        <button
          onClick={onBack}
          className="mt-3 w-full bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl text-white/80 text-lg transition active:scale-95"
        >
          Back to Menu
        </button>

        {isGuest && !showRegister && (
          <button
            onClick={onShowRegister}
            className="mt-3 w-full bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-xl text-white text-lg font-semibold transition active:scale-95"
          >
            Register & Save Score
          </button>
        )}

        {children}
      </div>
    </div>
  );
}