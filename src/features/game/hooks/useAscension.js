import { useState, useCallback } from 'react';

const ASCENSION_KEY = 'mtg_ascension_level';
const MAX_ASCENSION = 10;

// Ascension-Stufen: jede Stufe ist schwieriger aber belohnender.
// Unlock: Boss-Sieg bei der aktuellen Stufe → nächste Stufe freigeschaltet.
export const ASCENSION_LEVELS = [
  // level 0 = kein Ascension (Standard)
  { level: 1,  name: 'Hardened',     crystalBonus: 0.25, modifiers: { timerReduction: 1 } },
  { level: 2,  name: 'Relentless',   crystalBonus: 0.5,  modifiers: { timerReduction: 1, perkChoices: 2 } },
  { level: 3,  name: 'Cursed',       crystalBonus: 0.75, modifiers: { timerReduction: 2, startingLivesOffset: -1 } },
  { level: 4,  name: 'Blind',        crystalBonus: 1.0,  modifiers: { timerReduction: 2, goldReduction: 0.1 } },
  { level: 5,  name: 'Starved',      crystalBonus: 1.5,  modifiers: { timerReduction: 2, noRestNodes: true } },
  { level: 6,  name: 'Deprived',     crystalBonus: 2.0,  modifiers: { timerReduction: 3, perkChoices: 2, goldReduction: 0.2 } },
  { level: 7,  name: 'Forsaken',     crystalBonus: 2.5,  modifiers: { timerReduction: 3, bossHarder: true } },
  { level: 8,  name: 'Wretched',     crystalBonus: 3.0,  modifiers: { timerReduction: 3, perkChoices: 2, startingLivesOffset: -2 } },
  { level: 9,  name: 'Damned',       crystalBonus: 4.0,  modifiers: { timerReduction: 4, noRestNodes: true, goldReduction: 0.3 } },
  { level: 10, name: 'Transcendent', crystalBonus: 5.0,  modifiers: { timerReduction: 4, perkChoices: 2, startingLivesOffset: -2, goldReduction: 0.3 } },
];

// Modifier-Beschreibungen für die UI
export const MODIFIER_LABELS = {
  timerReduction: (v) => `Timer −${v}s`,
  perkChoices: (v) => `${v} perk choices (not 3)`,
  startingLivesOffset: (v) => `${v} starting ${v === -1 ? 'life' : 'lives'}`,
  goldReduction: (v) => `Gold −${Math.round(v * 100)}%`,
  noRestNodes: () => 'No Rest nodes',
  bossHarder: () => 'Tougher boss',
};

export const useAscension = () => {
  const [ascensionLevel, setAscensionLevel] = useState(() => {
    try {
      return Math.min(parseInt(localStorage.getItem(ASCENSION_KEY) ?? '0', 10) || 0, MAX_ASCENSION);
    } catch {
      return 0;
    }
  });

  // Nächste Stufe freischalten (nach Boss-Sieg)
  const unlockNextLevel = useCallback(() => {
    setAscensionLevel(prev => {
      const next = Math.min(prev + 1, MAX_ASCENSION);
      try { localStorage.setItem(ASCENSION_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Aktive Modifikatoren für die aktuelle Stufe
  const getModifiers = useCallback(() => {
    if (ascensionLevel === 0) return {};
    return ASCENSION_LEVELS.find(a => a.level === ascensionLevel)?.modifiers ?? {};
  }, [ascensionLevel]);

  // Crystal-Bonus für Run-Ende
  const getAscensionCrystalBonus = useCallback((baseCrystals) => {
    if (ascensionLevel === 0) return baseCrystals;
    const bonus = ASCENSION_LEVELS.find(a => a.level === ascensionLevel)?.crystalBonus ?? 0;
    return Math.ceil(baseCrystals * (1 + bonus));
  }, [ascensionLevel]);

  // Name der aktuellen Stufe
  const getAscensionName = useCallback(() => {
    if (ascensionLevel === 0) return 'Standard';
    return ASCENSION_LEVELS.find(a => a.level === ascensionLevel)?.name ?? 'Unknown';
  }, [ascensionLevel]);

  // Maximale freigeschaltete Stufe (= aktuelle Stufe, da man auf der nächsten Stufe beginnt)
  const maxUnlockedLevel = ascensionLevel;

  return {
    ascensionLevel,
    maxUnlockedLevel,
    unlockNextLevel,
    getModifiers,
    getAscensionCrystalBonus,
    getAscensionName,
  };
};
