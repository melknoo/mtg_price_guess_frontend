import React from 'react';
import GameIcon from '../../../shared/components/GameIcon';

// Hauptmenü-Badge: Account-Level + Pixel-XP-Bar (+ optionaler Daily-Streak-Chip ab Phase 3).
// Sichtbar auch für Gäste — Progression ist lokal.
export default function AccountLevelBadge({ accountProgression }) {
  if (!accountProgression) return null;
  const { level, xpIntoLevel, xpForLevel, dailyLogin } = accountProgression;
  const barPct = Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100));
  const today = new Date().toLocaleDateString('en-CA');
  const showStreak = dailyLogin?.streak > 0 && dailyLogin?.lastClaimDate === today;

  return (
    <div className="inline-flex items-center gap-3 bg-[#111827] border-2 border-[#2d3a5c] rounded-sm px-4 py-1.5 mb-2 shadow-pixel-sm">
      <div className="inline-flex items-center gap-1.5">
        <GameIcon name="star" size={16} color="purple" />
        <span className="text-purple-300 text-sm font-medium tracking-wide">Level {level}</span>
      </div>
      <div className="w-20 h-2 bg-[#0a0e1a] border border-[#2d3a5c] rounded-sm overflow-hidden" title={`${xpIntoLevel} / ${xpForLevel} XP`}>
        <div className="h-full bg-purple-500" style={{ width: `${barPct}%` }} />
      </div>
      {showStreak && (
        <div className="inline-flex items-center gap-1" title={`Daily login streak: day ${dailyLogin.streak}`}>
          <GameIcon name="crystal" size={14} color="purple" />
          <span className="text-purple-200 text-xs font-semibold">Day {dailyLogin.streak}</span>
        </div>
      )}
    </div>
  );
}
