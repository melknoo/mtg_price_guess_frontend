// Slay-the-Spire style Map/Stage System Definitions

export const NODE_TYPES = {
  NORMAL: 'normal',
  ELITE: 'elite',
  SHOP: 'shop',
  REST: 'rest',
  BOSS: 'boss',
  MYSTERY: 'mystery',
  EXCHANGE: 'exchange',
  MINI_BOSS: 'mini_boss',
};

export const NODE_WEIGHTS = {
  normal: 55,
  elite: 25,
  shop: 12,
  rest: 8,
};

// Weights for guaranteed diversity: used when all nodes in a stage are NORMAL
export const NON_NORMAL_WEIGHTS = { elite: 25, shop: 12, rest: 8, mystery: 15, exchange: 10 };

export const NODE_ICONS = {
  normal: 'sword',
  elite: 'skull',
  shop: 'chest',
  rest: 'glow',
  boss: 'trophy',
  mystery: 'interrogation',
  exchange: 'coin',
  mini_boss: 'bullet',
};

export const NODE_LABELS = {
  normal: 'Combat',
  elite: 'Elite',
  shop: 'Shop',
  rest: 'Rest',
  boss: 'Boss',
  mystery: 'Mystery',
  exchange: 'Exchange',
  mini_boss: 'Mini Boss',
};

export const NODE_DESCRIPTIONS = {
  normal: '10 rounds, standard rewards',
  elite: '10 rounds, harder — Timer −2s, +50G reward',
  shop: 'Spend your gold on relics, perks and more',
  rest: 'Heal 2 lives or upgrade a perk',
  boss: '10 rounds, Final Boss — Legendary relic reward',
  mystery: 'Unknown — could be anything',
  exchange: 'Convert Gold into XP at favorable rates',
  mini_boss: '10 rounds, tough fight — Relic drop reward',
};

export const MERCHANT_TYPES = {
  ARMORER: 'armorer',
  HEALER: 'healer',
  PERK_VENDOR: 'perk_vendor',
  WANDERING_MAGE: 'wandering_mage',
};

export const MERCHANT_LABELS = {
  armorer: 'Armorer',
  healer: 'Healer',
  perk_vendor: 'Perk Vendor',
  wandering_mage: 'Wandering Mage',
};

export const MERCHANT_DESCRIPTIONS = {
  armorer: 'Sells powerful relics',
  healer: 'Restore lives and upgrade perks',
  perk_vendor: 'Buy perks directly',
  wandering_mage: 'Rare upgrades and legendary items',
};

export const SHOP_PRICES = {
  relic: { common: 20, rare: 45, epic: 90, legendary: 150 },
  perk:  { common: 15, rare: 30, epic: 60 },
  heal: 30,
  perk_upgrade: 25,
  synergy_slot: 80,
  perk_slot: 90,
  utility_slot: 110,
  relic_upgrade: 60,
};

export const TOTAL_STAGES = 9;
export const ROUNDS_PER_STAGE = 10;
export const MAP_OPTIONS_PER_STAGE = 3;

export const ELITE_REWARDS = {
  gold_bonus: 50,
  relic_drop: true,
};

export const BOSS_REWARDS = {
  legendary_relic_choice: true,
};

export const EXCHANGE_RATES = [
  { gold: 10, xp: 25 },
  { gold: 25, xp: 70 },
  { gold: 50, xp: 150 },
];

export const STAGE_COMPLETE_QUICK_RATE = 2.5;

// Act structure for the 9-stage run
export const ACT_STRUCTURE = {
  1: { forced: 'normal' },
  2: { options: 3 },
  3: { options: 3 },
  4: { forced: 'mini_boss' },
  5: { options: 3 },
  6: { options: 3 },
  7: { options: 3 },
  8: { forced: 'shop_or_exchange' },
  9: { forced: 'boss' },
};
