import React from 'react';
import GameIcon from '../../../shared/components/GameIcon';
import { ITEM_ICONS } from '../../../shared/constants/itemIconMap';

export default function GameOverScreen({
  message,
  score = 0,
  bestStreak,
  onRestart,
  onBack,
  showRegister,
  onShowRegister,
  isGuest,
  children,
  level = 1,
  relics = [],
  synergies = [],
  bestComboMultiplier = 1,
}) {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
      <div className="bg-[#0d1b3e]/95 border border-white/20 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center max-w-sm w-full overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl mb-2 font-bold text-amber-200">❌ Wrong Guess!</h2>
        <p className="mb-3 text-white/80">{message}</p>

        <div className="text-4xl font-bold text-white mb-1">{score.toLocaleString()}</div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Points</div>

        {bestStreak > 0 && (
          <p className="mb-3 text-xl text-orange-400 font-bold">
            🔥 Best Streak: {bestStreak}
          </p>
        )}

        {/* Roguelike Run-Summary */}
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-left">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Run Summary</div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-300 font-bold">⭐ Level {level}</span>
            {bestComboMultiplier > 1 && (
              <span className="text-yellow-400 text-xs font-semibold ml-auto">
                🔗 Best Combo: x{bestComboMultiplier.toFixed(2)}
              </span>
            )}
          </div>

          {relics.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-amber-400 font-semibold mb-1">⭐ Relics ({relics.length})</div>
              <div className="flex flex-wrap gap-1">
                {relics.map(r => (
                  <span key={r.id} title={r.description} className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 rounded px-1.5 py-0.5 text-xs text-amber-200">
                    {ITEM_ICONS[r.id]
                      ? <GameIcon name={ITEM_ICONS[r.id].icon} color={ITEM_ICONS[r.id].color} size={12} />
                      : r.icon} {r.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {synergies.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-teal-400 font-semibold mb-1">🔗 Synergies ({synergies.length})</div>
              <div className="flex flex-wrap gap-1">
                {synergies.map(s => (
                  <span key={s.id} title={s.description} className="inline-flex items-center gap-1 bg-teal-500/20 border border-teal-400/40 rounded px-1.5 py-0.5 text-xs text-teal-200">
                    {ITEM_ICONS[s.id]
                      ? <GameIcon name={ITEM_ICONS[s.id].icon} color={ITEM_ICONS[s.id].color} size={12} />
                      : s.icon} {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onRestart}
          className="btn-primary btn-full"
        >
          Restart
        </button>

        <button
          onClick={onBack}
          className="mt-3 btn-secondary btn-full"
        >
          Back to Menu
        </button>

        {isGuest && !showRegister && (
          <button
            onClick={onShowRegister}
            className="mt-3 btn-primary btn-full"
          >
            Register & Save Score
          </button>
        )}

        {children}
      </div>
    </div>
  );
}
