import { useState, useCallback } from 'react';
import { PERKS, RARITY_WEIGHTS, PERK_CONFIG, PERK_TYPES, getBasePerkId, isExtendedPerk } from '../constants/perkDefinitions';

export const usePerkSystem = () => {
  const [activePerks, setActivePerks] = useState([]);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [showPerkSelection, setShowPerkSelection] = useState(false);
  const [availablePerks, setAvailablePerks] = useState([]);
  const [selectedPermanentPerks, setSelectedPermanentPerks] = useState([]);
  const [correctAnswersForRegen, setCorrectAnswersForRegen] = useState(0);

  const generateRandomPerks = useCallback(() => {
    const allPerks = Object.values(PERKS);
    const selectedPerks = [];
    const usedIds = new Set();

    // Exclude permanent non-consumable perks that were already selected
    const excludedIds = new Set(
      selectedPermanentPerks.filter(id => {
        const perk = allPerks.find(p => p.id === id);
        return perk && perk.duration === -1 && !perk.consumable;
      })
    );

    // Exclude base perks when their extended version is already active
    activePerks.forEach(p => {
      if (p.basePerkId) excludedIds.add(p.basePerkId);
    });

    // Exclude active consumable perks
    const activeConsumableIds = new Set(
      activePerks
        .filter(p => p.consumable && p.duration === -1)
        .map(p => p.id)
    );

    // Get active filter types to avoid duplicate filter categories
    const activeFilterTypes = new Set(
      activePerks
        .filter(p => p.type === PERK_TYPES.FILTER)
        .map(p => p.filterType)
    );

    while (selectedPerks.length < PERK_CONFIG.PERKS_TO_CHOOSE && selectedPerks.length < allPerks.length) {
      const perk = getWeightedRandomPerk(
        allPerks, 
        usedIds, 
        excludedIds, 
        activeConsumableIds,
        activeFilterTypes
      );
      if (perk) {
        selectedPerks.push(perk);
        usedIds.add(perk.id);
        // Also exclude the base/extended counterpart
        if (perk.basePerkId) usedIds.add(perk.basePerkId);
        const extended = allPerks.find(p => p.basePerkId === perk.id);
        if (extended) usedIds.add(extended.id);

        // If it's a filter perk, exclude other perks of the same filter type
        if (perk.type === PERK_TYPES.FILTER) {
          allPerks.forEach(p => {
            if (p.filterType === perk.filterType && p.id !== perk.id) {
              usedIds.add(p.id);
            }
          });
        }
      } else {
        break;
      }
    }

    return selectedPerks;
  }, [selectedPermanentPerks, activePerks]);

  const getWeightedRandomPerk = (perks, excludeIds, permanentExcludeIds, activeConsumableIds, activeFilterTypes) => {
    const availablePerks = perks.filter(p => {
      // Basic exclusions
      if (excludeIds.has(p.id)) return false;
      if (permanentExcludeIds.has(p.id)) return false;
      if (activeConsumableIds.has(p.id)) return false;

      // Don't show filter perks if that filter type is already active
      if (p.type === PERK_TYPES.FILTER && activeFilterTypes.has(p.filterType)) {
        return false;
      }

      return true;
    });

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

  const selectPerk = useCallback((perk, { keepOpen = false, hasEternalFlame = false, hasUpgradeMaster = false } = {}) => {
    setActivePerks(prev => {
      // Check if this is an extended perk and base perk is active
      const basePerkId = getBasePerkId(perk.id);
      const isExtended = isExtendedPerk(perk.id);

      // Find if base perk (or same effect perk) is already active
      // Also check: existing perk is an extended version of the incoming base perk
      const existingIndex = prev.findIndex(p =>
        p.id === perk.id ||
        p.id === basePerkId ||
        (isExtended && p.effect === perk.effect) ||
        getBasePerkId(p.id) === perk.id
      );

      if (existingIndex >= 0) {
        // Perk with same effect exists - extend duration
        const updated = [...prev];
        const bonusDuration = perk.bonusDuration || perk.duration;

        if (updated[existingIndex].duration > 0 || perk.duration > 0) {
          // Upgrade Master: +2 upgradeCount instead of +1
          const upgradeIncrement = hasUpgradeMaster ? 2 : 1;
          // Use at least the new perk's full duration (prevents +2 when picking fresh extended perk)
          const newRemaining = Math.max(
            updated[existingIndex].remainingDuration + bonusDuration,
            perk.duration > 0 ? perk.duration : 0
          );
          // For slow_time lower value = better (slower timer); for everything else higher = better
          const newValue = perk.effect === 'slow_time'
            ? Math.min(updated[existingIndex].value ?? 1, perk.value ?? 1)
            : Math.max(updated[existingIndex].value ?? 0, perk.value ?? 0);
          updated[existingIndex] = {
            ...updated[existingIndex],
            value: newValue,
            description: newValue === perk.value ? perk.description : updated[existingIndex].description,
            remainingDuration: newRemaining,
            upgradeCount: (updated[existingIndex].upgradeCount || 1) + upgradeIncrement,
            name: updated[existingIndex].name.includes('+')
              ? updated[existingIndex].name
              : updated[existingIndex].name + '+'
          };
        }
        return updated;
      } else {
        // New perk - add it
        // Eternal Flame: +3 rounds to duration-based perks
        const durationBonus = (hasEternalFlame && perk.duration > 0) ? 3 : 0;

        // For filter perks, replace existing filter of same type
        if (perk.type === PERK_TYPES.FILTER) {
          const filtered = prev.filter(p =>
            !(p.type === PERK_TYPES.FILTER && p.filterType === perk.filterType)
          );
          return [...filtered, {
            ...perk,
            remainingDuration: perk.duration > 0 ? perk.duration + durationBonus : perk.duration,
            activatedAt: roundsPlayed
          }];
        }

        return [...prev, {
          ...perk,
          remainingDuration: perk.duration > 0 ? perk.duration + durationBonus : perk.duration,
          activatedAt: roundsPlayed
        }];
      }
    });

    // Track permanent perks
    if (perk.duration === -1 && !perk.consumable) {
      setSelectedPermanentPerks(prev => {
        const idToAdd = getBasePerkId(perk.id);
        if (!prev.includes(idToAdd)) {
          return [...prev, idToAdd];
        }
        return prev;
      });
    }

    if (!keepOpen) {
      setShowPerkSelection(false);
      setAvailablePerks([]);
    }
  }, [roundsPlayed]);

  const decrementPerkDurations = useCallback((hasRecycler = false) => {
    setActivePerks(prev => {
      return prev.reduce((acc, perk) => {
        if (perk.duration === -1) {
          acc.push(perk);
          return acc;
        }
        const newRemaining = perk.remainingDuration - 1;
        if (newRemaining > 0) {
          acc.push({ ...perk, remainingDuration: newRemaining });
        } else if (hasRecycler && Math.random() < 0.3) {
          // Perk Recycler: 30% chance to renew expired perk
          acc.push({ ...perk, remainingDuration: perk.duration });
        }
        // else: perk expired
        return acc;
      }, []);
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
    // Also check for extended versions
    return activePerks.some(p => 
      p.id === perkId || 
      p.id === perkId + '_extended' ||
      getBasePerkId(p.id) === perkId
    );
  }, [activePerks]);

  const getPerkValue = useCallback((effect) => {
    const perk = activePerks.find(p => p.effect === effect);
    return perk ? perk.value : null;
  }, [activePerks]);

  const getPerksByEffect = useCallback((effect) => {
    return activePerks.filter(p => p.effect === effect);
  }, [activePerks]);

  // NEW: Get active filter perks
  const getActiveFilterPerks = useCallback(() => {
    return activePerks.filter(p => p.type === PERK_TYPES.FILTER);
  }, [activePerks]);

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

  const clearPerks = useCallback(() => {
    setActivePerks([]);
    setSelectedPermanentPerks([]);
  }, []);

  const reset = useCallback(() => {
    setActivePerks([]);
    setRoundsPlayed(0);
    setShowPerkSelection(false);
    setAvailablePerks([]);
    setSelectedPermanentPerks([]);
    setCorrectAnswersForRegen(0);
  }, []);

  return {
    activePerks,
    roundsPlayed,
    showPerkSelection,
    availablePerks,
    triggerPerkSelection,
    selectPerk,
    decrementPerkDurations,
    consumePerk,
    hasPerk,
    getPerkValue,
    getPerksByEffect,
    getActiveFilterPerks, // NEW
    trackCorrectAnswer,
    getHeartRegenProgress,
    correctAnswersForRegen,
    clearPerks,
    reset,
  };
};