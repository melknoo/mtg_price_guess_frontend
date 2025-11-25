import { useState, useCallback } from 'react';
import { PERKS, RARITY_WEIGHTS, PERK_CONFIG } from '../constants/perkDefinitions';

export const usePerkSystem = () => {
  const [activePerks, setActivePerks] = useState([]);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [showPerkSelection, setShowPerkSelection] = useState(false);
  const [availablePerks, setAvailablePerks] = useState([]);
  const [selectedPermanentPerks, setSelectedPermanentPerks] = useState([]); // Track permanently selected perks

  // Generiere zufällige Perks basierend auf Rarity
  const generateRandomPerks = useCallback(() => {
    const allPerks = Object.values(PERKS);
    const selectedPerks = [];
    const usedIds = new Set();

    // Filter out permanently selected perks that are not consumable
    const excludedIds = new Set(
      selectedPermanentPerks.filter(id => {
        const perk = allPerks.find(p => p.id === id);
        return perk && perk.duration === -1 && !perk.consumable;
      })
    );

    // Filter out perks that are currently active and consumable
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
        break; // No more valid perks available
      }
    }

    return selectedPerks;
  }, [selectedPermanentPerks, activePerks]);

  // Wähle Perk basierend auf Rarity-Gewichtung
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

  // Trigger Perk Selection
  const triggerPerkSelection = useCallback(() => {
    const perks = generateRandomPerks();
    setAvailablePerks(perks);
    setShowPerkSelection(true);
  }, [generateRandomPerks]);

  // Wähle einen Perk aus
  const selectPerk = useCallback((perk) => {
    setActivePerks(prev => {
      // Prüfe ob Perk bereits aktiv ist
      const existingIndex = prev.findIndex(p => p.id === perk.id);
      
      if (existingIndex >= 0) {
        // Stack: Erhöhe Dauer oder Wert
        const updated = [...prev];
        if (perk.duration > 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            remainingDuration: updated[existingIndex].remainingDuration + perk.duration
          };
        }
        return updated;
      } else {
        // Neuer Perk
        return [...prev, {
          ...perk,
          remainingDuration: perk.duration,
          activatedAt: roundsPlayed
        }];
      }
    });

    // Track permanent perks that should not appear again (unless consumable)
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

  // Reduziere Dauer von Perks nach Runde
  const decrementPerkDurations = useCallback(() => {
    setActivePerks(prev => {
      return prev
        .map(perk => {
          if (perk.duration === -1) return perk; // Permanente Perks
          
          return {
            ...perk,
            remainingDuration: perk.remainingDuration - 1
          };
        })
        .filter(perk => perk.remainingDuration > 0 || perk.duration === -1);
    });
  }, []);

  // Verwende einen einmaligen Perk (z.B. Shield, Skip)
  const consumePerk = useCallback((perkId) => {
    setActivePerks(prev => prev.filter(p => p.id !== perkId));
    
    // If consumed perk was permanent and consumable, remove from permanent list
    const consumedPerk = PERKS[Object.keys(PERKS).find(key => PERKS[key].id === perkId)];
    if (consumedPerk && consumedPerk.duration === -1 && consumedPerk.consumable) {
      setSelectedPermanentPerks(prev => prev.filter(id => id !== perkId));
    }
  }, []);

  // Prüfe ob ein spezifischer Perk aktiv ist
  const hasPerk = useCallback((perkId) => {
    return activePerks.some(p => p.id === perkId);
  }, [activePerks]);

  // Hole Wert eines aktiven Perks
  const getPerkValue = useCallback((effect) => {
    const perk = activePerks.find(p => p.effect === effect);
    return perk ? perk.value : null;
  }, [activePerks]);

  // Hole alle Perks mit bestimmtem Effect
  const getPerksByEffect = useCallback((effect) => {
    return activePerks.filter(p => p.effect === effect);
  }, [activePerks]);

  // Reset für neues Spiel
  const reset = useCallback(() => {
    setActivePerks([]);
    setRoundsPlayed(0);
    setShowPerkSelection(false);
    setAvailablePerks([]);
    setSelectedPermanentPerks([]);
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
    
    // Reset
    reset,
  };
};