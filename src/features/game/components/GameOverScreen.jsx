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
    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
      <h2 className="text-2xl mb-4 font-bold">❌ Falsch geraten!</h2>
      <p className="mb-2 text-lg">{message}</p>
      
      {bestStreak > 0 && (
        <p className="mb-6 text-xl text-orange-400 font-bold">
          🔥 Beste Streak: {bestStreak}
        </p>
      )}

      <button
        onClick={onRestart}
        className="bg-green-600 px-6 py-3 rounded text-white text-lg hover:bg-green-700 transition"
      >
        Neustarten
      </button>

      <button
        onClick={onBack}
        className="mt-4 bg-blue-600 px-6 py-3 rounded text-white text-lg hover:bg-blue-700 transition"
      >
        Zurück zum Menü
      </button>

      {isGuest && !showRegister && (
        <button
          onClick={onShowRegister}
          className="mt-4 bg-blue-400 px-6 py-3 rounded text-white text-lg hover:bg-blue-600 transition"
        >
          Registrieren & Score speichern
        </button>
      )}

      {children}
    </div>
  );
}