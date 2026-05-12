import { useState, useCallback } from 'react';

const META_KEY = 'mtg_meta_progression';

export const UPGRADE_DEFS = [
  { id: 'starting_lives_plus1',  name: '+1 Starting Life',     description: 'Start each run with 1 extra life.',          cost: 10, max: 1, category: 'Survivalist' },
  { id: 'max_lives_plus1',       name: '+1 Max Lives',          description: 'Increase the maximum life cap by 1.',         cost: 20, max: 1, category: 'Survivalist' },
  { id: 'starting_passive_slot', name: 'Extra Passive Slot',    description: 'Start each run with an extra passive perk slot.', cost: 10, max: 1, category: 'Scholar' },
  { id: 'starting_utility_slot', name: 'Extra Utility Slot',    description: 'Start each run with an extra utility perk slot.', cost: 20, max: 1, category: 'Scholar' },
  { id: 'starting_relic_slot',   name: 'Extra Relic Slot',      description: 'Start each run with an extra relic slot.',    cost: 10, max: 1, category: 'Collector' },
  { id: 'starting_gold_15',      name: '+15 Starting Gold',     description: 'Start each run with 15 extra gold.',          cost: 8,  max: 3, category: 'Merchant' },
  { id: 'shop_discount_5pct',    name: '5% Shop Discount',      description: 'All shop prices are reduced by 5%.',          cost: 25, max: 1, category: 'Merchant' },
];

// Starting Kits — buy once to unlock, then select to activate.
// Only one kit active at a time.
export const KIT_DEFS = [
  {
    id: 'kit_speedrunner',
    name: 'Speedrunner',
    cost: 30,
    startingPerkId: 'slow_time',
    startingPerkName: 'Slow Motion',
    bonus: 'Timer +2s',
    penalty: 'Wrong answer: −5G',
    description: 'Starts with Slow Motion. Timer is 2s longer, but wrong answers cost 5 gold.',
    goldMult: 1.0,
    goldPenalty: 0,     // applied per correct answer
    wrongGoldPenalty: 5, // gold lost on wrong answer
    timerBonus: 2,
    xpMult: 1.0,
    maxLives: null,
  },
  {
    id: 'kit_arcanist',
    name: 'Arcanist',
    cost: 30,
    startingPerkId: 'point_boost_extended',
    startingPerkName: 'Point Boost+',
    bonus: 'XP +20%',
    penalty: '−1G per answer',
    description: 'Starts with Point Boost+. Gain 20% more XP, but each correct answer costs 1 gold.',
    goldMult: 1.0,
    goldPenalty: 1,     // flat gold subtracted per correct answer (in applyGoldEffects Phase A)
    wrongGoldPenalty: 0,
    timerBonus: 0,
    xpMult: 1.2,
    maxLives: null,
  },
  {
    id: 'kit_berserker',
    name: 'Berserker',
    cost: 35,
    startingPerkId: 'dead_mans_hand',
    startingPerkName: "Dead Man's Hand",
    bonus: 'Gold +25%',
    penalty: 'Max 3 lives',
    description: "Starts with Dead Man's Hand. Earn 25% more gold, but maximum lives capped at 3.",
    goldMult: 1.25,
    goldPenalty: 0,
    wrongGoldPenalty: 0,
    timerBonus: 0,
    xpMult: 1.0,
    maxLives: 3,
  },
];

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : { crystals: 0, upgrades: {}, ownedKits: {}, selectedKit: null };
  } catch {
    return { crystals: 0, upgrades: {}, ownedKits: {}, selectedKit: null };
  }
}

function saveMeta(data) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

export function useMetaProgression() {
  const [metaState, setMetaState] = useState(() => loadMeta());

  const crystals = metaState.crystals ?? 0;
  const upgrades = metaState.upgrades ?? {};
  const ownedKits = metaState.ownedKits ?? {};
  const selectedKit = metaState.selectedKit ?? null;

  const addCrystals = useCallback((n) => {
    setMetaState(prev => {
      const next = { ...prev, crystals: (prev.crystals ?? 0) + n };
      saveMeta(next);
      return next;
    });
  }, []);

  const buyUpgrade = useCallback((id) => {
    const def = UPGRADE_DEFS.find(d => d.id === id);
    if (!def) return false;
    setMetaState(prev => {
      const owned = prev.upgrades?.[id] ?? 0;
      if (owned >= def.max) return prev;
      if ((prev.crystals ?? 0) < def.cost) return prev;
      const next = {
        ...prev,
        crystals: prev.crystals - def.cost,
        upgrades: { ...prev.upgrades, [id]: owned + 1 },
      };
      saveMeta(next);
      return next;
    });
    return true;
  }, []);

  const buyKit = useCallback((kitId) => {
    const def = KIT_DEFS.find(k => k.id === kitId);
    if (!def) return false;
    setMetaState(prev => {
      if (prev.ownedKits?.[kitId]) return prev; // already owned
      if ((prev.crystals ?? 0) < def.cost) return prev;
      const next = {
        ...prev,
        crystals: prev.crystals - def.cost,
        ownedKits: { ...prev.ownedKits, [kitId]: true },
      };
      saveMeta(next);
      return next;
    });
    return true;
  }, []);

  const selectKit = useCallback((kitId) => {
    setMetaState(prev => {
      if (kitId !== null && !prev.ownedKits?.[kitId]) return prev;
      const next = { ...prev, selectedKit: kitId };
      saveMeta(next);
      return next;
    });
  }, []);

  const getStartingBonuses = useCallback(() => {
    const u = metaState.upgrades ?? {};
    return {
      extraLives:       u.starting_lives_plus1 ?? 0,
      extraMaxLives:    u.max_lives_plus1 ?? 0,
      extraPassiveSlot: u.starting_passive_slot ?? 0,
      extraUtilitySlot: u.starting_utility_slot ?? 0,
      extraRelicSlot:   u.starting_relic_slot ?? 0,
      extraGold:        (u.starting_gold_15 ?? 0) * 15,
      shopDiscount:     (u.shop_discount_5pct ?? 0) * 0.05,
      activeKit:        metaState.selectedKit ?? null,
    };
  }, [metaState]);

  return {
    crystals,
    upgrades,
    ownedKits,
    selectedKit,
    upgradeDefs: UPGRADE_DEFS,
    kitDefs: KIT_DEFS,
    addCrystals,
    buyUpgrade,
    buyKit,
    selectKit,
    getStartingBonuses,
  };
}
