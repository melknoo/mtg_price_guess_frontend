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
  crystalsEarned = 0,
}) {
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 p-4">
      <div className="bg-[#0d1b3e] border-2 border-[#2d3a5c] rounded-sm shadow-pixel p-8 flex flex-col items-center text-center max-w-sm w-full overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl mb-2 font-bold text-amber-200 inline-flex items-center gap-2"><GameIcon name="clear" size={22} color="red" /> Wrong Guess!</h2>
        <p className="mb-3 text-white/80">{message}</p>

        <div className="flex items-center gap-2 mb-1">
          <GameIcon name="coin" color="amber" size={22} />
          <div className="text-4xl font-bold text-amber-300">{score.toLocaleString()}</div>
        </div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Gold Earned</div>

        {crystalsEarned > 0 && (
          <div className="mb-3 inline-flex items-center gap-2 bg-purple-500/15 border-2 border-purple-400/40 rounded-sm px-3 py-1.5">
            <GameIcon name="crystal" size={18} color="purple" />
            <span className="text-purple-200 font-bold">+{crystalsEarned} Crystals</span>
          </div>
        )}

        {bestStreak > 0 && (
          <p className="mb-3 text-xl text-orange-400 font-bold inline-flex items-center gap-1">
            <GameIcon name="signal" size={18} color="orange" /> Best Streak: {bestStreak}
          </p>
        )}

        {/* Roguelike Run-Summary */}
        <div className="w-full bg-[#111827] border-2 border-[#2d3a5c]/60 rounded-sm p-3 mb-4 text-left">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Run Summary</div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-300 font-bold inline-flex items-center gap-1"><GameIcon name="star" size={13} color="amber" /> Level {level}</span>
            {bestComboMultiplier > 1 && (
              <span className="text-yellow-400 text-xs font-semibold ml-auto inline-flex items-center gap-1">
                <GameIcon name="ring" size={11} color="amber" /> Best Combo: x{bestComboMultiplier.toFixed(2)}
              </span>
            )}
          </div>

          {relics.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-amber-400 font-semibold mb-1 inline-flex items-center gap-1"><GameIcon name="star" size={11} color="amber" /> Relics ({relics.length})</div>
              <div className="flex flex-wrap gap-1">
                {relics.map(r => (
                  <span key={r.id} title={r.description} className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 rounded-sm px-1.5 py-0.5 text-xs text-amber-200">
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
              <div className="text-xs text-teal-400 font-semibold mb-1 inline-flex items-center gap-1"><GameIcon name="path_follow" size={11} color="teal" /> Synergies ({synergies.length})</div>
              <div className="flex flex-wrap gap-1">
                {synergies.map(s => (
                  <span key={s.id} title={s.description} className="inline-flex items-center gap-1 bg-teal-500/20 border border-teal-400/40 rounded-sm px-1.5 py-0.5 text-xs text-teal-200">
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
          className="w-full bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 px-6 py-3 rounded-sm text-white text-lg font-semibold transition shadow-pixel active:scale-95"
        >
          Restart
        </button>

        <button
          onClick={onBack}
          className="mt-3 w-full bg-slate-600 hover:bg-slate-500 border-2 border-[#2d3a5c] px-6 py-3 rounded-sm text-white text-lg transition shadow-pixel active:scale-95"
        >
          Back to Menu
        </button>

        {isGuest && !showRegister && (
          <button
            onClick={onShowRegister}
            className="mt-3 w-full bg-amber-500 hover:bg-amber-400 border-2 border-amber-700 px-6 py-3 rounded-sm text-white text-lg font-semibold transition shadow-pixel active:scale-95"
          >
            Register & Save Score
          </button>
        )}

        {children}
      </div>
    </div>
  );
}
