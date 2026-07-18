import { useState, useCallback, useRef } from 'react';
import { PERKS, RARITY_WEIGHTS, PERK_CONFIG, PERK_TYPES, PERK_SLOT_TYPES, getBasePerkId, isExtendedPerk } from '../constants/perkDefinitions';
import { filterAvailable } from '../utils/contentAvailability';

const applyPerkToList = (list, perk, roundsPlayed, { hasEternalFlame = false, hasUpgradeMaster = false } = {}) => {
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
        return isSamePerk
          ? (existing.value ?? 1) * (perk.value ?? 1)
          : Math.min(existing.value ?? 1, perk.value ?? 1);
      }
      if (perk.effect === 'heart_regen') {
        return isSamePerk ? Math.max(1, (existing.value ?? 5) - 1) : existing.value;
      }
      if (perk.effect === 'point_multiplier') {
        return Math.max(existing.value ?? 0, perk.value ?? 0);
      }
      if (isSamePerk) {
        if (typeof perk.value !== 'number') return existing.value;
        return (existing.value ?? 0) + (perk.value ?? 0);
      }
      return Math.max(existing.value ?? 0, perk.value ?? 0);
    };

    if (existing.duration === -1 && perk.duration === -1 && !isSamePerk) {
      // Permanent perk upgraded by another permanent perk — add values, stay permanent
      const newValue = (existing.value ?? 0) + (perk.value ?? 0);
      updated[existingIndex] = {
        ...existing,
        value: newValue,
        upgradeCount: (existing.upgradeCount || 1) + upgradeIncrement,
        name: existing.name.includes('+') ? existing.name : existing.name + '+',
      };
      return updated;
    }

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
  }

  const durationBonus = (hasEternalFlame && perk.duration > 0) ? 3 : 0;

  if (perk.type === PERK_TYPES.FILTER && !perk.stackable) {
    const filtered = list.filter(p =>
      !(p.type === PERK_TYPES.FILTER && p.filterType === perk.filterType && !p.stackable)
    );
    return [...filtered, {
      ...perk,
      remainingDuration: perk.duration > 0 ? perk.duration + durationBonus : perk.duration,
      activatedAt: roundsPlayed,
    }];
  }

  return [...list, {
    ...perk,
    remainingDuration: perk.duration > 0 ? perk.duration + durationBonus : perk.duration,
    activatedAt: roundsPlayed,
  }];
};

export const usePerkSystem = () => {
  const [activePerks, setActivePerks] = useState([]);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [showPerkSelection, setShowPerkSelection] = useState(false);
  const [availablePerks, setAvailablePerks] = useState([]);
  const [selectedPermanentPerks, setSelectedPermanentPerks] = useState([]);
  const [correctAnswersForRegen, setCorrectAnswersForRegen] = useState(0);
  const [maxPassiveSlots, setMaxPassiveSlots] = useState(PERK_CONFIG.STARTING_PASSIVE_SLOTS);
  const [maxUtilitySlots, setMaxUtilitySlots] = useState(PERK_CONFIG.STARTING_UTILITY_SLOTS);

  // Balatro-Perk-Zustandsrefs — useRef für synchronen Zugriff ohne Re-Renders
  const chainLightningCounterRef = useRef(0);  // consecutive correct count
  const timeBombCounterRef = useRef(0);         // correct answers while active
  const compoundInterestAccRef = useRef(0);     // accumulated flat bonus
  const echoLastBonusRef = useRef(0);           // last answer's bonus delta
  const bloodlustChargesRef = useRef(0);        // charges from wrong answers
  const momentumFlatStackRef = useRef(0);       // current stacking flat bonus
  const echoPrimeBestRef = useRef(0);           // best flat Gold delta from last answer (for Echo Prime cascade perk)

  const getPerkSlotType = useCallback((perk) => {
    if (!perk) return null;
    if (perk._slotless) return null; // Copycat-Copies belegen keinen Slot
    if (perk.slotType) return perk.slotType;
    if (perk.duration === -1 && perk.consumable) return PERK_SLOT_TYPES.UTILITY;
    if (perk.duration === -1 && !perk.consumable) return PERK_SLOT_TYPES.PASSIVE;
    return null;
  }, []);

  const getUsedPassiveSlots = useCallback((perks = activePerks) => (
    perks.filter(p => getPerkSlotType(p) === PERK_SLOT_TYPES.PASSIVE).length
  ), [activePerks, getPerkSlotType]);

  const getUsedUtilitySlots = useCallback((perks = activePerks) => (
    perks.filter(p => getPerkSlotType(p) === PERK_SLOT_TYPES.UTILITY).length
  ), [activePerks, getPerkSlotType]);

  const hasCapacityForPerk = useCallback((perk, perks = activePerks) => {
    const slotType = getPerkSlotType(perk);
    if (!slotType) return true;

    const basePerkId = getBasePerkId(perk.id);
    const alreadyOwned = perks.some(p =>
      p.id === perk.id ||
      p.id === basePerkId ||
      getBasePerkId(p.id) === basePerkId
    );
    if (alreadyOwned) return true;

    if (slotType === PERK_SLOT_TYPES.PASSIVE) {
      return getUsedPassiveSlots(perks) < maxPassiveSlots;
    }

    if (slotType === PERK_SLOT_TYPES.UTILITY) {
      return getUsedUtilitySlots(perks) < maxUtilitySlots;
    }

    return true;
  }, [activePerks, getPerkSlotType, getUsedPassiveSlots, getUsedUtilitySlots, maxPassiveSlots, maxUtilitySlots]);

  const getReplaceablePerks = useCallback((perk, perks = activePerks) => {
    const slotType = getPerkSlotType(perk);
    if (!slotType) return [];
    return perks.filter(p => getPerkSlotType(p) === slotType);
  }, [activePerks, getPerkSlotType]);

  const getWeightedRandomPerk = useCallback((perks, excludeIds, permanentExcludeIds, activeConsumableIds, activeExcludeFilterTypes) => {
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
  }, []);

  const generateRandomPerks = useCallback((count = PERK_CONFIG.PERKS_TO_CHOOSE) => {
    const allPerks = filterAvailable('perk', Object.values(PERKS).filter(p => !p.isCurse));
    const selectedPerks = [];
    const usedIds = new Set();

    // Exclude permanent perks that were already selected.
    // selectPerk() only adds non-stackable, non-consumable perks to this list,
    // including perks made permanent by Parasite (duration changed at pick-time).
    const excludedIds = new Set(selectedPermanentPerks);

    // Ganze Perk-Familie ausschließen (Base + Extended), sobald irgendeine Variante aktiv ist.
    // Verhindert z.B. dass "Double Gold+" angeboten wird, wenn "Double Gold" bereits aktiv ist (und umgekehrt).
    activePerks.forEach(p => {
      const baseId = p.basePerkId ?? p.id;
      excludedIds.add(baseId);
      const extended = allPerks.find(ep => ep.basePerkId === baseId);
      if (extended) excludedIds.add(extended.id);
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

    while (selectedPerks.length < count && selectedPerks.length < allPerks.length) {
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
  }, [selectedPermanentPerks, activePerks, getWeightedRandomPerk]);

  const triggerPerkSelection = useCallback((count = PERK_CONFIG.PERKS_TO_CHOOSE) => {
    const perks = generateRandomPerks(count);
    setAvailablePerks(perks);
    setShowPerkSelection(true);
  }, [generateRandomPerks]);

  // Re-generate options while keeping the modal open (costs 1 life in Game.jsx)
  const rerollPerks = useCallback((count = PERK_CONFIG.PERKS_TO_CHOOSE) => {
    const perks = generateRandomPerks(count);
    setAvailablePerks(perks);
  }, [generateRandomPerks]);

  // Close perk selection without picking anything
  const skipPerkSelection = useCallback(() => {
    setShowPerkSelection(false);
    setAvailablePerks([]);
  }, []);

  const selectPerk = useCallback((perk, { keepOpen = false, hasEternalFlame = false, hasUpgradeMaster = false, doubleDip = false } = {}) => {
    if (!hasCapacityForPerk(perk)) {
      return false;
    }

    setActivePerks(prev => {
      const afterFirst = applyPerkToList(prev, perk, roundsPlayed, { hasEternalFlame, hasUpgradeMaster });
      return doubleDip ? applyPerkToList(afterFirst, perk, roundsPlayed, { hasEternalFlame, hasUpgradeMaster }) : afterFirst;
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
    return true;
  }, [roundsPlayed, hasCapacityForPerk]);

  const replacePerk = useCallback((targetPerkId, perk, { keepOpen = false, hasEternalFlame = false, hasUpgradeMaster = false, doubleDip = false } = {}) => {
    setActivePerks(prev => {
      const filtered = prev.filter(p => p.id !== targetPerkId);
      const afterFirst = applyPerkToList(filtered, perk, roundsPlayed, { hasEternalFlame, hasUpgradeMaster });
      return doubleDip ? applyPerkToList(afterFirst, perk, roundsPlayed, { hasEternalFlame, hasUpgradeMaster }) : afterFirst;
    });

    const targetBaseId = getBasePerkId(targetPerkId);
    setSelectedPermanentPerks(prev => prev.filter(id => id !== targetBaseId));

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

  const buyPassiveSlot = useCallback(() => {
    if (maxPassiveSlots >= PERK_CONFIG.MAX_PASSIVE_SLOTS) return false;
    setMaxPassiveSlots(prev => prev + 1);
    return true;
  }, [maxPassiveSlots]);

  const buyUtilitySlot = useCallback(() => {
    if (maxUtilitySlots >= PERK_CONFIG.MAX_UTILITY_SLOTS) return false;
    setMaxUtilitySlots(prev => prev + 1);
    return true;
  }, [maxUtilitySlots]);

  const rechargeStageStartUtilities = useCallback(() => {
    setActivePerks(prev => prev.map(perk => {
      if (perk.rechargeRule !== 'stage_start') return perk;
      const maxCharges = perk.maxCharges ?? perk.value ?? 1;
      const currentCharges = perk.value ?? 0;
      if (currentCharges >= maxCharges) return perk;
      return { ...perk, value: maxCharges };
    }));
  }, []);

  const decrementPerkDurations = useCallback((hasRecycler = false, onPerkExpire = null) => {
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
        } else {
          // Perk abgelaufen — Callback für Payouts (Time Bomb, Compound Interest)
          onPerkExpire?.(perk);
          // Counter-Refs resetten
          if (perk.effect === 'chain_lightning_counter') chainLightningCounterRef.current = 0;
          if (perk.effect === 'time_bomb_counter') timeBombCounterRef.current = 0;
          if (perk.effect === 'compound_interest') compoundInterestAccRef.current = 0;
          if (perk.effect === 'momentum_flat') momentumFlatStackRef.current = 0;
          if (perk.effect === 'bloodlust_charges') bloodlustChargesRef.current = 0;
        }
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
      const hasChargePool = perk.consumable && perk.duration === -1 && perk.maxCharges != null;
      // Multi-charge: decrement value; remove only when exhausted
      if (perk.value > 1) {
        const updated = [...prev];
        updated[idx] = { ...perk, value: perk.value - 1 };
        return updated;
      }
      if (hasChargePool) {
        const updated = [...prev];
        updated[idx] = { ...perk, value: 0 };
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
    return activePerks.some(p => {
      const matches =
        p.id === perkId ||
        p.id === perkId + '_extended' ||
        getBasePerkId(p.id) === perkId;
      if (!matches) return false;
      if (p.consumable && p.duration === -1 && p.maxCharges != null) {
        return (p.value ?? 0) > 0;
      }
      return true;
    });
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
    setMaxPassiveSlots(PERK_CONFIG.STARTING_PASSIVE_SLOTS);
    setMaxUtilitySlots(PERK_CONFIG.STARTING_UTILITY_SLOTS);
    // Balatro-Perk-Refs zurücksetzen
    chainLightningCounterRef.current = 0;
    timeBombCounterRef.current = 0;
    compoundInterestAccRef.current = 0;
    echoLastBonusRef.current = 0;
    bloodlustChargesRef.current = 0;
    momentumFlatStackRef.current = 0;
    echoPrimeBestRef.current = 0;
  }, []);

  const restorePerks = useCallback((perks, passiveSlotMax, utilitySlotMax) => {
    setActivePerks(perks ?? []);
    setSelectedPermanentPerks((perks ?? []).filter(p => p.duration === -1).map(p => p.id));
    if (passiveSlotMax != null) setMaxPassiveSlots(passiveSlotMax);
    if (utilitySlotMax != null) setMaxUtilitySlots(utilitySlotMax);
  }, []);

  // Meta-Progression: Start-Slots um Bonus erhöhen (über Soft-Cap hinaus erlaubt)
  const applyStartingSlots = useCallback((passiveBonus = 0, utilityBonus = 0) => {
    if (passiveBonus > 0) setMaxPassiveSlots(PERK_CONFIG.STARTING_PASSIVE_SLOTS + passiveBonus);
    if (utilityBonus > 0) setMaxUtilitySlots(PERK_CONFIG.STARTING_UTILITY_SLOTS + utilityBonus);
  }, []);

  return {
    activePerks,
    roundsPlayed,
    showPerkSelection,
    availablePerks,
    maxPassiveSlots,
    maxUtilitySlots,
    passiveSlotInfo: {
      used: getUsedPassiveSlots(),
      max: maxPassiveSlots,
    },
    utilitySlotInfo: {
      used: getUsedUtilitySlots(),
      max: maxUtilitySlots,
    },
    triggerPerkSelection,
    rerollPerks,
    skipPerkSelection,
    selectPerk,
    replacePerk,
    hasCapacityForPerk,
    getReplaceablePerks,
    buyPassiveSlot,
    buyUtilitySlot,
    applyStartingSlots,
    rechargeStageStartUtilities,
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
    restorePerks,
    // Balatro-Perk-Refs (für Game.jsx Score-Berechnung)
    chainLightningCounterRef,
    timeBombCounterRef,
    compoundInterestAccRef,
    echoLastBonusRef,
    bloodlustChargesRef,
    momentumFlatStackRef,
    echoPrimeBestRef,
  };
};
