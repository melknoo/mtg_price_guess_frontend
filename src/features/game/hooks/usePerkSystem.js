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

    // Exclude permanent perks that were already selected.
    // selectPerk() only adds non-stackable, non-consumable perks to this list,
    // including perks made permanent by Parasite (duration changed at pick-time).
    const excludedIds = new Set(selectedPermanentPerks);

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

    // Only track non-stackable (exclude) filter types — stackable boost perks can always appear
    const activeExcludeFilterTypes = new Set(
      activePerks
        .filter(p => p.type === PERK_TYPES.FILTER && !p.stackable)
        .map(p => p.filterType)
    );

    while (selectedPerks.length < PERK_CONFIG.PERKS_TO_CHOOSE && selectedPerks.length < allPerks.length) {
      const perk = getWeightedRandomPerk(
        allPerks,
        usedIds,
        excludedIds,
        activeConsumableIds,
        activeExcludeFilterTypes
      );
      if (perk) {
        selectedPerks.push(perk);
        usedIds.add(perk.id);
        // Also exclude the base/extended counterpart
        if (perk.basePerkId) usedIds.add(perk.basePerkId);
        const extended = allPerks.find(p => p.basePerkId === perk.id);
        if (extended) usedIds.add(extended.id);

        // If it's a non-stackable filter perk, exclude other perks of the same filter type
        // Stackable boost perks (e.g. BLUE_FOCUS) can coexist with other boosts of the same type
        if (perk.type === PERK_TYPES.FILTER && !perk.stackable) {
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

  const getWeightedRandomPerk = (perks, excludeIds, permanentExcludeIds, activeConsumableIds, activeExcludeFilterTypes) => {
    const availablePerks = perks.filter(p => {
      // Basic exclusions
      if (excludeIds.has(p.id)) return false;
      if (permanentExcludeIds.has(p.id)) return false;
      if (activeConsumableIds.has(p.id)) return false;

      // Block non-stackable (exclude) filter perks if same filterType is already active
      // Stackable boost perks can always appear
      if (p.type === PERK_TYPES.FILTER && !p.stackable && activeExcludeFilterTypes.has(p.filterType)) {
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

  // Re-generate options while keeping the modal open (costs 1 life in Game.jsx)
  const rerollPerks = useCallback(() => {
    const perks = generateRandomPerks();
    setAvailablePerks(perks);
  }, [generateRandomPerks]);

  // Close perk selection without picking anything
  const skipPerkSelection = useCallback(() => {
    setShowPerkSelection(false);
    setAvailablePerks([]);
  }, []);

  const selectPerk = useCallback((perk, { keepOpen = false, hasEternalFlame = false, hasUpgradeMaster = false, doubleDip = false } = {}) => {
    setActivePerks(prev => {
      // Helper: apply one stack of `perk` onto `list`
      const applyOnce = (list) => {
        const basePerkId = getBasePerkId(perk.id);
        const isExtended = isExtendedPerk(perk.id);

        const existingIndex = list.findIndex(p =>
          p.id === perk.id ||
          p.id === basePerkId ||
          (isExtended && p.effect === perk.effect) ||
          getBasePerkId(p.id) === perk.id
        );

        if (existingIndex >= 0) {
          const updated = [...list];
          const existing = updated[existingIndex];
          const bonusDuration = perk.bonusDuration || perk.duration;
          const isSamePerk = existing.id === perk.id;
          const upgradeIncrement = hasUpgradeMaster ? 2 : 1;

          const computeStackedValue = () => {
            if (perk.effect === 'slow_time') {
              // Lower = better: multiplicative for same perk, min for upgrade path
              return isSamePerk
                ? (existing.value ?? 1) * (perk.value ?? 1)
                : Math.min(existing.value ?? 1, perk.value ?? 1);
            }
            if (perk.effect === 'heart_regen') {
              // Lower threshold = better: reduce by 1 per extra pick (min 1)
              return isSamePerk ? Math.max(1, (existing.value ?? 5) - 1) : existing.value;
            }
            if (perk.effect === 'point_multiplier') {
              // Multipliers: keep value (Double Dip just extends duration)
              return Math.max(existing.value ?? 0, perk.value ?? 0);
            }
            if (isSamePerk) {
              // Non-numeric values (e.g. filter perks: value is a string like 'rare') — keep as-is, only duration extends
              if (typeof perk.value !== 'number') return existing.value;
              // Flat numeric values: additive stacking
              return (existing.value ?? 0) + (perk.value ?? 0);
            }
            return Math.max(existing.value ?? 0, perk.value ?? 0);
          };

          if (existing.duration > 0 || perk.duration > 0) {
            const newRemaining = Math.max(
              existing.remainingDuration + bonusDuration,
              perk.duration > 0 ? perk.duration : 0
            );
            const newValue = computeStackedValue();
            updated[existingIndex] = {
              ...existing,
              value: newValue,
              description: newValue === perk.value ? perk.description : existing.description,
              remainingDuration: newRemaining,
              upgradeCount: (existing.upgradeCount || 1) + upgradeIncrement,
              name: existing.name.includes('+') ? existing.name : existing.name + '+',
            };
          } else if (isSamePerk) {
            const newValue = computeStackedValue();
            // Boost perks stack their boostPercent additively (e.g. 40+40=80%)
            const newBoostPercent = perk.isBoost
              ? (existing.boostPercent ?? 40) + (perk.boostPercent ?? 40)
              : existing.boostPercent;
            updated[existingIndex] = {
              ...existing,
              value: newValue,
              ...(newBoostPercent !== undefined ? { boostPercent: newBoostPercent } : {}),
              upgradeCount: (existing.upgradeCount || 1) + upgradeIncrement,
              name: existing.name.includes('+') ? existing.name : existing.name + '+',
            };
          }
          return updated;
        } else {
          // New perk - add it
          const durationBonus = (hasEternalFlame && perk.duration > 0) ? 3 : 0;

          if (perk.type === PERK_TYPES.FILTER && !perk.stackable) {
            // Non-stackable exclude-filter: replace other non-stackable filters of same type,
            // but preserve stackable boost perks (e.g. RED_FOCUS must survive COLOR_EXCLUDE pick)
            const filtered = list.filter(p =>
              !(p.type === PERK_TYPES.FILTER && p.filterType === perk.filterType && !p.stackable)
            );
            return [...filtered, {
              ...perk,
              remainingDuration: perk.duration > 0 ? perk.duration + durationBonus : perk.duration,
              activatedAt: roundsPlayed
            }];
          }

          return [...list, {
            ...perk,
            remainingDuration: perk.duration > 0 ? perk.duration + durationBonus : perk.duration,
            activatedAt: roundsPlayed
          }];
        }
      };

      // First application; if Double Dip, apply a second time atomically
      const afterFirst = applyOnce(prev);
      return doubleDip ? applyOnce(afterFirst) : afterFirst;
    });

    // Track permanent perks (stackable perks are never tracked — they can always re-appear)
    if (perk.duration === -1 && !perk.consumable && !perk.stackable) {
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
    let fullyConsumed = false;
    setActivePerks(prev => {
      const idx = prev.findIndex(p => p.id === perkId);
      if (idx < 0) return prev;
      const perk = prev[idx];
      // Multi-charge: decrement value; remove only when exhausted
      if (perk.value > 1) {
        const updated = [...prev];
        updated[idx] = { ...perk, value: perk.value - 1 };
        return updated;
      }
      fullyConsumed = true;
      return prev.filter(p => p.id !== perkId);
    });

    // Clean up permanentPerks tracking only when fully removed
    const consumedPerk = PERKS[Object.keys(PERKS).find(key => PERKS[key].id === perkId)];
    if (consumedPerk && consumedPerk.duration === -1 && consumedPerk.consumable) {
      setSelectedPermanentPerks(prev => {
        if (!fullyConsumed) return prev;
        return prev.filter(id => id !== perkId);
      });
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
    rerollPerks,
    skipPerkSelection,
    selectPerk,
    decrementPerkDurations,
    consumePerk,
    hasPerk,
    getPerkValue,
    getPerksByEffect,
    getActiveFilterPerks,
    trackCorrectAnswer,
    getHeartRegenProgress,
    correctAnswersForRegen,
    clearPerks,
    reset,
  };
};