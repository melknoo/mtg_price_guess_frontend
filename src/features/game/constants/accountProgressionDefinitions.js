// Account-Progression: Cross-Run XP, Level-Kurve, Reward-Track und Daily-Loop-Konfiguration.
// Alle Balancing-Konstanten leben hier — die Hook-Logik in useAccountProgression bleibt generisch.

// XP-Kurve: Level 1→2 = 100 XP, danach +25 pro Level
export const xpToNextAccountLevel = (level) => 100 + (level - 1) * 25;

// Leitet Level + Fortschritt aus der monotonen totalXp ab.
// Rückgabe: { level, xpIntoLevel, xpForLevel }
export function accountLevelFromXp(totalXp) {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp ?? 0));
  let threshold = xpToNextAccountLevel(level);
  while (remaining >= threshold) {
    remaining -= threshold;
    level++;
    threshold = xpToNextAccountLevel(level);
  }
  return { level, xpIntoLevel: remaining, xpForLevel: threshold };
}

// Account-XP pro Run (nur am Run-Ende vergeben):
// 10% der In-Run-XP + 10 pro Stage + Boss-Bonus (100 + 15 pro Ascension-Stufe)
export function accountXpForRun({ inRunXp = 0, stagesCleared = 0, bossWin = false, ascensionLevel = 0 }) {
  return Math.round(inRunXp * 0.10)
    + stagesCleared * 10
    + (bossWin ? 100 + ascensionLevel * 15 : 0);
}

// Reward-Track: Crystals + Unlock-Keys pro Account-Level.
// Unlock-Keys referenzieren Einträge in unlockDefinitions.js (Phase 2) — Format '{type}:{id}'.
// Level ohne Eintrag bekommen den Default aus defaultCrystalsForLevel().
export const ACCOUNT_LEVEL_REWARDS = {
  2:  { crystals: 5,  unlocks: ['perk:gambler'] },
  3:  { crystals: 5,  unlocks: ['relic:snowball'] },
  4:  { crystals: 5,  unlocks: ['perk:echo_chamber'] },
  5:  { crystals: 8,  unlocks: ['relic:echo'] },
  6:  { crystals: 5,  unlocks: ['perk:wildcard'] },
  7:  { crystals: 8,  unlocks: ['relic:amplifier'] },
  8:  { crystals: 5,  unlocks: ['perk:adrenaline'] },
  9:  { crystals: 8,  unlocks: ['relic:double_dip'] },
  10: { crystals: 10, unlocks: ['relic:xp_converter'] },
  11: { crystals: 5,  unlocks: ['perk:roulette'] },
  12: { crystals: 8,  unlocks: ['relic:overkill'] },
  13: { crystals: 5,  unlocks: ['perk:first_spark'] },
  14: { crystals: 8,  unlocks: ['relic:synergy_chain'] },
  15: { crystals: 10, unlocks: ['perk:chain_reaction_perk'] },
  16: { crystals: 8,  unlocks: ['relic:upgrade_master'] },
  18: { crystals: 10, unlocks: ['relic:mirror'] },
  20: { crystals: 12, unlocks: ['relic:copycat'] },
  22: { crystals: 12, unlocks: ['relic:blueprint'] },
  25: { crystals: 15, unlocks: ['relic:parasite'] },
};

// Default-Crystals für Level ohne expliziten Reward-Eintrag
export const defaultCrystalsForLevel = (level) => Math.min(15, 3 + Math.floor(level / 2));

export function getRewardForLevel(level) {
  const entry = ACCOUNT_LEVEL_REWARDS[level];
  if (entry) return { crystals: entry.crystals ?? 0, unlocks: entry.unlocks ?? [] };
  return { crystals: defaultCrystalsForLevel(level), unlocks: [] };
}

// Daily-Login: Crystals pro Streak-Tag (Tag 1 = Index 0), ab Tag 7 gedeckelt
export const DAILY_LOGIN_REWARDS = [2, 3, 4, 5, 6, 7, 8];

export function dailyLoginRewardForStreak(streak) {
  const idx = Math.min(Math.max(streak, 1), DAILY_LOGIN_REWARDS.length) - 1;
  return DAILY_LOGIN_REWARDS[idx];
}

// Daily Challenge: Crystals für den (einmal täglichen) Abschluss
export const DAILY_CHALLENGE_CRYSTALS = 5;

// Migration: Seed-Formel für Bestandsspieler ohne Account-Progression-Key
export function legacySeedXp(ascensionLevel, achievementCount) {
  return (ascensionLevel ?? 0) * 200 + (achievementCount ?? 0) * 25;
}
