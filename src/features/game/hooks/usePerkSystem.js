import { useState, useCallback } from 'react';
import { PERKS, RARITY_WEIGHTS, PERK_CONFIG } from '../constants/perkDefinitions';

export const usePerkSystem = () => {
  const [activePerks, setActivePerks] = useState([]);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [showPerkSelection, setShowPerkSelection] = useState(false);
  const [availablePerks, setAvailablePerks] = useState([]);
  const [selectedPermanentPerks, setSelectedPermanentPerks] = useState([]);

  // NEU: Tracking für Heart Regeneration
  const [correctAnswersForRegen, setCorrectAnswersForRegen] = useState(0);

  const generateRandomPerks = useCallback(() => {
    const allPerks = Object.values(PERKS);
    const selectedPerks = [];
    const usedIds = new Set();

    const excludedIds = new Set(
      selectedPermanentPerks.filter(id => {
        const perk = allPerks.find(p => p.id === id);
        return perk && perk.duration === -1 && !perk.consumable;
      })
    );

    const activeConsumableIds = new Set(
      activePerks
        .filter(p => p.consumable && p.duration === -1)
        .map(p => p.id)
    );

    while (selectedPerks.length < PERK_CONFIG.PERKS_TO_CHOOSE && selectedPerks.length < allPerks.length) {
      const perk = getWeightedRandomPerk(allPerks, usedIds, excludedIds, activeConsumableIds);
      if (perk) {
        selectedPerks.push(perk);
        usedIds.add(perk.id);
      } else {
        break;
      }
    }

    return selectedPerks;
  }, [selectedPermanentPerks, activePerks]);

  const getWeightedRandomPerk = (perks, excludeIds, permanentExcludeIds, activeConsumableIds) => {
    const availablePerks = perks.filter(p =>
      !excludeIds.has(p.id) &&
      !permanentExcludeIds.has(p.id) &&
      !activeConsumableIds.has(p.id)
    );

    if (availablePerks.length === 0) return null;

    const totalWeight = availablePerks.reduce(
      (sum, perk) => sum + RARITY_WEIGHTS[perk.rarity],
      0
    );

    let random = Math.random() * totalWeight;

    for (const perk of availablePerks) {
      random -= RARITY_WEIGHTS[perk.rarity];
      if (random <= 0) {
        return perk;
      }
    }

    return availablePerks[0];
  };

  const triggerPerkSelection = useCallback(() => {
    const perks = generateRandomPerks();
    setAvailablePerks(perks);
    setShowPerkSelection(true);
  }, [generateRandomPerks]);

  const selectPerk = useCallback((perk) => {
    setActivePerks(prev => {
      const existingIndex = prev.findIndex(p => p.id === perk.id);

      if (existingIndex >= 0) {
        const updated = [...prev];
        if (perk.duration > 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            remainingDuration: updated[existingIndex].remainingDuration + perk.duration
          };
        }
        return updated;
      } else {
        return [...prev, {
          ...perk,
          remainingDuration: perk.duration,
          activatedAt: roundsPlayed
        }];
      }
    });

    if (perk.duration === -1 && !perk.consumable) {
      setSelectedPermanentPerks(prev => {
        if (!prev.includes(perk.id)) {
          return [...prev, perk.id];
        }
        return prev;
      });
    }

    setShowPerkSelection(false);
    setAvailablePerks([]);
  }, [roundsPlayed]);

  const decrementPerkDurations = useCallback(() => {
    setActivePerks(prev => {
      return prev
        .map(perk => {
          if (perk.duration === -1) return perk;

          return {
            ...perk,
            remainingDuration: perk.remainingDuration - 1
          };
        })
        .filter(perk => perk.remainingDuration > 0 || perk.duration === -1);
    });
  }, []);

  const consumePerk = useCallback((perkId) => {
    setActivePerks(prev => prev.filter(p => p.id !== perkId));

    const consumedPerk = PERKS[Object.keys(PERKS).find(key => PERKS[key].id === perkId)];
    if (consumedPerk && consumedPerk.duration === -1 && consumedPerk.consumable) {
      setSelectedPermanentPerks(prev => prev.filter(id => id !== perkId));
    }
  }, []);

  const hasPerk = useCallback((perkId) => {
    return activePerks.some(p => p.id === perkId);
  }, [activePerks]);

  const getPerkValue = useCallback((effect) => {
    const perk = activePerks.find(p => p.effect === effect);
    return perk ? perk.value : null;
  }, [activePerks]);

  const getPerksByEffect = useCallback((effect) => {
    return activePerks.filter(p => p.effect === effect);
  }, [activePerks]);

  // NEU: Tracking für richtige Antworten (Heart Regen)
  const trackCorrectAnswer = useCallback(() => {
    if (!activePerks.some(p => p.id === 'heart_regeneration')) {
      return { shouldRegenerate: false, newCount: 0 };
    }

    const perk = activePerks.find(p => p.effect === 'heart_regen');
    const threshold = perk ? perk.value : 5;
    const newCount = correctAnswersForRegen + 1;

    if (newCount >= threshold) {
      setCorrectAnswersForRegen(0);
      return { shouldRegenerate: true, newCount: 0 };
    }

    setCorrectAnswersForRegen(newCount);
    return { shouldRegenerate: false, newCount };
  }, [correctAnswersForRegen, activePerks]);

  // NEU: Getter für aktuellen Fortschritt
  const getHeartRegenProgress = useCallback(() => {
    if (!activePerks.some(p => p.id === 'heart_regeneration')) return null;

    const perk = activePerks.find(p => p.effect === 'heart_regen');
    const threshold = perk ? perk.value : 5;
    return {
      current: correctAnswersForRegen,
      threshold,
      progress: (correctAnswersForRegen / threshold) * 100
    };
  }, [correctAnswersForRegen, activePerks]);

  const reset = useCallback(() => {
    setActivePerks([]);
    setRoundsPlayed(0);
    setShowPerkSelection(false);
    setAvailablePerks([]);
    setSelectedPermanentPerks([]);
    setCorrectAnswersForRegen(0); // NEU: Reset
  }, []);

  return {
    // State
    activePerks,
    roundsPlayed,
    showPerkSelection,
    availablePerks,

    // Actions
    triggerPerkSelection,
    selectPerk,
    decrementPerkDurations,
    consumePerk,

    // Queries
    hasPerk,
    getPerkValue,
    getPerksByEffect,

    // NEU: Heart Regen
    trackCorrectAnswer,
    getHeartRegenProgress,
    correctAnswersForRegen,

    // Reset
    reset,
  };
};