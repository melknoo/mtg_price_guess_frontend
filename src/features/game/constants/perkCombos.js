// ==================== NAMED PERK COMBOS ====================
// Wenn zwei oder mehr spezifische Perks gleichzeitig aktiv sind,
// wird ein benannter Bonus aktiviert — über die Einzel-Perks hinaus.
//
// bonusType:
//   'modify_perk_behavior' — Check direkt im Phase-A/B Block von applyGoldEffects
//   'phase_f_bonus'        — Separater Bonus in Phase F (nach allen anderen Effekten)
//   'both'                 — Beides

export const PERK_COMBOS = [

  // ─── GOLD COMBOS ──────────────────────────────────────────────────────────

  {
    id: 'glass_gambler',
    name: 'GLASS GAMBLER',
    requiredPerkIds: ['glass_mind', 'gambler'],
    description: 'Gambler win rate: 75%. Glass Mind wrong-answer penalty stays, but Glass Mind Loss: only 1 life.',
    bonusType: 'modify_perk_behavior',
    tags: ['luck', 'sacrifice'],
  },

  {
    id: 'midas_touch',
    name: 'MIDAS TOUCH',
    requiredPerkIds: ['treasure_map_perk', 'mirror_image'],
    description: 'Mirror Image converts at 60% (instead of 35%). Treasure Map XP penalty removed.',
    bonusType: 'modify_perk_behavior',
    tags: ['gold'],
  },

  {
    id: 'overcautious_overclocker',
    name: 'OVERCAUTIOUS OVERCLOCKER',
    requiredPerkIds: ['overcautious', 'overclock'],
    description: 'Gold cap raised to 120. Overclock timer runs at 1.5× (instead of 2×).',
    bonusType: 'modify_perk_behavior',
    tags: ['gold', 'speed'],
  },

  {
    id: 'dead_mans_roulette',
    name: "DEAD MAN'S ROULETTE",
    requiredPerkIds: ['dead_mans_hand', 'roulette'],
    description: 'At 1 life: Roulette minimum roll is 4× (instead of 1×).',
    bonusType: 'modify_perk_behavior',
    tags: ['sacrifice', 'luck'],
  },

  // ─── XP COMBOS ────────────────────────────────────────────────────────────

  {
    id: 'nuclear_option',
    name: 'NUCLEAR OPTION',
    requiredPerkIds: ['time_bomb', 'compound_interest'],
    description: 'Both payouts fire simultaneously on the same round and their combined total gets ×1.5.',
    bonusType: 'modify_perk_behavior',
    tags: ['xp'],
  },

  {
    id: 'scholar_rush',
    name: 'SCHOLAR RUSH',
    requiredPerkIds: ['adrenaline', 'point_boost'],
    description: 'XP Boost flat bonus is doubled while Adrenaline is active.',
    bonusType: 'modify_perk_behavior',
    tags: ['xp'],
  },

  {
    id: 'mirror_perfectionist',
    name: 'MIRROR PERFECTIONIST',
    requiredPerkIds: ['mirror_image', 'perfectionist'],
    description: 'On a perfect answer: Mirror Image converts at 100% (not 35%).',
    bonusType: 'modify_perk_behavior',
    tags: ['xp', 'gold', 'speed'],
  },

  // ─── STREAK COMBOS ────────────────────────────────────────────────────────

  {
    id: 'lightning_momentum',
    name: 'LIGHTNING MOMENTUM',
    requiredPerkIds: ['chain_lightning', 'momentum_perk'],
    description: 'Momentum flat stack is multiplied by the Chain Lightning counter instead of added linearly.',
    bonusType: 'modify_perk_behavior',
    tags: ['streak', 'gold'],
  },

  {
    id: 'death_spiral',
    name: 'DEATH SPIRAL',
    requiredPerkIds: ['dead_mans_hand', 'glass_mind'],
    description: 'At 1 life: Glass Mind bonus becomes ×7 (instead of ×3). A wrong answer still kills instantly.',
    bonusType: 'modify_perk_behavior',
    tags: ['sacrifice', 'gold'],
  },

  // ─── RISK COMBOS ──────────────────────────────────────────────────────────

  {
    id: 'blood_echo',
    name: 'BLOOD ECHO',
    requiredPerkIds: ['bloodlust', 'echo_chamber'],
    description: "Echo Chamber also replays the Bloodlust cashout from the previous round.",
    bonusType: 'modify_perk_behavior',
    tags: ['streak', 'gold'],
  },

  {
    id: 'wildcard_gambler',
    name: 'WILDCARD GAMBLER',
    requiredPerkIds: ['wildcard', 'gambler'],
    description: 'Gambler Win: Wildcard always rolls its top outcome. Gambler Loss: Wildcard does not roll.',
    bonusType: 'modify_perk_behavior',
    tags: ['luck'],
  },

  // ─── SPEED COMBOS ─────────────────────────────────────────────────────────

  {
    id: 'slow_perfectionist',
    name: 'SLOW PERFECTIONIST',
    requiredPerkIds: ['slow_time', 'perfectionist'],
    description: 'Perfectionist activates when 4+ seconds remain (not just at full timer).',
    bonusType: 'modify_perk_behavior',
    tags: ['speed', 'xp'],
  },

  {
    id: 'overclock_adrenaline',
    name: 'OVERCLOCK ADRENALINE',
    requiredPerkIds: ['overclock', 'adrenaline'],
    description: 'While Overclock is active: each Adrenaline tick gives +15% XP (instead of +10%).',
    bonusType: 'modify_perk_behavior',
    tags: ['speed', 'xp'],
  },

];

// Hilfsfunktion: Gibt aktive Combo-IDs zurück basierend auf activePerks
export const getActiveCombos = (activePerks) => {
  const activePerkIds = new Set(
    activePerks.map(p => p.basePerkId ?? p.id)
  );
  return PERK_COMBOS.filter(combo =>
    combo.requiredPerkIds.every(id => activePerkIds.has(id))
  );
};
