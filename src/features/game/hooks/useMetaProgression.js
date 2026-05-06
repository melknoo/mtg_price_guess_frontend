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

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : { crystals: 0, upgrades: {} };
  } catch {
    return { crystals: 0, upgrades: {} };
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
    };
  }, [metaState]);

  return { crystals, upgrades, upgradeDefs: UPGRADE_DEFS, addCrystals, buyUpgrade, getStartingBonuses };
}
