// Slay-the-Spire style Map/Stage System Definitions

export const NODE_TYPES = {
  NORMAL: 'normal',
  ELITE: 'elite',
  SHOP: 'shop',
  REST: 'rest',
  BOSS: 'boss',
};

export const NODE_WEIGHTS = {
  normal: 55,
  elite: 25,
  shop: 12,
  rest: 8,
};

export const NODE_ICONS = {
  normal: '⚔️',
  elite: '💀',
  shop: '🛒',
  rest: '🔥',
  boss: '👑',
};

export const NODE_LABELS = {
  normal: 'Combat',
  elite: 'Elite',
  shop: 'Shop',
  rest: 'Rest',
  boss: 'Boss',
};

export const NODE_DESCRIPTIONS = {
  normal: '10 rounds, standard rewards',
  elite: '10 rounds, harder — Timer −2s, +50G reward',
  shop: 'Spend your gold on relics, perks and more',
  rest: 'Heal 2 lives or upgrade a perk',
  boss: '10 rounds, Final Boss — Legendary relic reward',
};

export const MERCHANT_TYPES = {
  ARMORER: 'armorer',
  HEALER: 'healer',
  PERK_VENDOR: 'perk_vendor',
  WANDERING_MAGE: 'wandering_mage',
};

export const MERCHANT_LABELS = {
  armorer: '⚒️ Armorer',
  healer: '💊 Healer',
  perk_vendor: '🪄 Perk Vendor',
  wandering_mage: '🌟 Wandering Mage',
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
  relic_upgrade: 60,
};

export const TOTAL_STAGES = 5;
export const ROUNDS_PER_STAGE = 10;
export const MAP_OPTIONS_PER_STAGE = 2; // stages 1-4; stage 5 = 1 node (boss)

export const ELITE_REWARDS = {
  gold_bonus: 50,
  relic_drop: true,
};

export const BOSS_REWARDS = {
  legendary_relic_choice: true,
};
