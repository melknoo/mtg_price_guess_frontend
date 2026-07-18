// Zentrale Unlock-Tabelle für Content-Gating (Balatro-Style).
// Key-Format: '{type}:{id}' mit type = 'perk' | 'relic'.
// Ein Item OHNE Eintrag hier ist immer frei — die Tabelle listet nur gesperrten Content.
//
// Condition-Typen:
//   { type: 'account_level', level: N }        — Account-Level N erreichen (Reward-Track)
//   { type: 'achievement', id: '...' }          — Achievement freischalten
//   { type: 'stat', stat: '...', value: N }     — Account-Stat-Schwelle (runsPlayed, bossWins,
//                                                 totalStagesCleared, highestAscensionWin)
//
// hint: Codex-Text, der dem Spieler zeigt WIE er das Item freischaltet.

export const UNLOCKS = {
  // ── Perks: Level-Track (siehe ACCOUNT_LEVEL_REWARDS) ──────────────
  'perk:gambler':             { condition: { type: 'account_level', level: 2 },  hint: 'Reach Account Level 2' },
  'perk:echo_chamber':        { condition: { type: 'account_level', level: 4 },  hint: 'Reach Account Level 4' },
  'perk:wildcard':            { condition: { type: 'account_level', level: 6 },  hint: 'Reach Account Level 6' },
  'perk:adrenaline':          { condition: { type: 'account_level', level: 8 },  hint: 'Reach Account Level 8' },
  'perk:roulette':            { condition: { type: 'account_level', level: 11 }, hint: 'Reach Account Level 11' },
  'perk:first_spark':         { condition: { type: 'account_level', level: 13 }, hint: 'Reach Account Level 13' },
  'perk:chain_reaction_perk': { condition: { type: 'account_level', level: 15 }, hint: 'Reach Account Level 15' },

  // ── Perks: Achievements / Stats ───────────────────────────────────
  'perk:echo_prime':          { condition: { type: 'achievement', id: 'perks_10' },  hint: 'Earn the "Hoarder" achievement (10 perks in one run)' },
  'perk:ripple_effect':       { condition: { type: 'achievement', id: 'streak_20' }, hint: 'Earn the "Price Master" achievement (20 streak)' },
  'perk:resonance_xp':        { condition: { type: 'achievement', id: 'level_25' },  hint: 'Earn the "Grandmaster" achievement (level 25 in one run)' },
  'perk:time_bomb':           { condition: { type: 'achievement', id: 'quick_five' }, hint: 'Earn the "Quick Thinker" achievement (5 answers under 3s)' },
  'perk:catalyst':            { condition: { type: 'stat', stat: 'totalStagesCleared', value: 30 }, hint: 'Clear 30 stages in total' },

  // ── Relics: Level-Track ───────────────────────────────────────────
  'relic:snowball':       { condition: { type: 'account_level', level: 3 },  hint: 'Reach Account Level 3' },
  'relic:echo':           { condition: { type: 'account_level', level: 5 },  hint: 'Reach Account Level 5' },
  'relic:amplifier':      { condition: { type: 'account_level', level: 7 },  hint: 'Reach Account Level 7' },
  'relic:double_dip':     { condition: { type: 'account_level', level: 9 },  hint: 'Reach Account Level 9' },
  'relic:xp_converter':   { condition: { type: 'account_level', level: 10 }, hint: 'Reach Account Level 10' },
  'relic:overkill':       { condition: { type: 'account_level', level: 12 }, hint: 'Reach Account Level 12' },
  'relic:synergy_chain':  { condition: { type: 'account_level', level: 14 }, hint: 'Reach Account Level 14' },
  'relic:upgrade_master': { condition: { type: 'account_level', level: 16 }, hint: 'Reach Account Level 16' },
  'relic:mirror':         { condition: { type: 'account_level', level: 18 }, hint: 'Reach Account Level 18' },
  'relic:copycat':        { condition: { type: 'account_level', level: 20 }, hint: 'Reach Account Level 20' },
  'relic:blueprint':      { condition: { type: 'account_level', level: 22 }, hint: 'Reach Account Level 22' },
  'relic:parasite':       { condition: { type: 'account_level', level: 25 }, hint: 'Reach Account Level 25' },

  // ── Relics: Achievements ──────────────────────────────────────────
  'relic:phantom_streak': { condition: { type: 'achievement', id: 'streak_10' }, hint: 'Earn the "Unstoppable" achievement (10 streak)' },
  'relic:deaths_mask':    { condition: { type: 'achievement', id: 'relics_5' },  hint: 'Earn the "Relic Hoarder" achievement (5 relics in one run)' },
  'relic:timeless':       { condition: { type: 'achievement', id: 'speed_demon' }, hint: 'Earn the "Speed Demon" achievement (answer within 1s)' },
  'relic:perk_recycler':  { condition: { type: 'achievement', id: 'perks_5' },   hint: 'Earn the "Collector" achievement (5 perks in one run)' },

  // ── Relics: Stats (Boss-/Ascension-Meilensteine) ──────────────────
  'relic:overflow':       { condition: { type: 'stat', stat: 'bossWins', value: 1 }, hint: 'Win 1 run (defeat the boss)' },
  'relic:reverse_timer':  { condition: { type: 'stat', stat: 'bossWins', value: 2 }, hint: 'Win 2 runs' },
  'relic:pain_is_gain':   { condition: { type: 'stat', stat: 'bossWins', value: 3 }, hint: 'Win 3 runs' },
  'relic:hermit':         { condition: { type: 'stat', stat: 'highestAscensionWin', value: 3 }, hint: 'Win a run at Ascension 3' },
  'relic:minimalist':     { condition: { type: 'stat', stat: 'highestAscensionWin', value: 5 }, hint: 'Win a run at Ascension 5' },
  'relic:no_perks':       { condition: { type: 'stat', stat: 'highestAscensionWin', value: 7 }, hint: 'Win a run at Ascension 7' },
};

// Wertet eine einzelne Unlock-Condition gegen den Account-Zustand aus.
// context: { accountLevel, stats, unlockedAchievementIds: Set }
export function isConditionMet(condition, context) {
  if (!condition) return true;
  switch (condition.type) {
    case 'account_level':
      return (context.accountLevel ?? 1) >= condition.level;
    case 'achievement':
      return context.unlockedAchievementIds?.has(condition.id) ?? false;
    case 'stat':
      return (context.stats?.[condition.stat] ?? 0) >= condition.value;
    default:
      return true;
  }
}

// Liefert die Menge aller aktuell noch GESPERRTEN Keys.
export function computeLockedKeys(context) {
  const locked = new Set();
  for (const [key, def] of Object.entries(UNLOCKS)) {
    if (!isConditionMet(def.condition, context)) locked.add(key);
  }
  return locked;
}

export function getUnlockHint(type, id) {
  return UNLOCKS[`${type}:${id}`]?.hint ?? null;
}

export function isGatedContent(type, id) {
  return Boolean(UNLOCKS[`${type}:${id}`]);
}
