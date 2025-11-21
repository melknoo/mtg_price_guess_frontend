import { useState, useCallback } from 'react';
import { PERKS, RARITY_WEIGHTS, PERK_CONFIG } from '../constants/perkDefinitions';

export const usePerkSystem = () => {
  const [activePerks, setActivePerks] = useState([]);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [showPerkSelection, setShowPerkSelection] = useState(false);
  const [availablePerks, setAvailablePerks] = useState([]);

  // Generiere zufällige Perks basierend auf Rarity
  const generateRandomPerks = useCallback(() => {
    const allPerks = Object.values(PERKS);
    const selectedPerks = [];
    const usedIds = new Set();

    while (selectedPerks.length < PERK_CONFIG.PERKS_TO_CHOOSE && selectedPerks.length < allPerks.length) {
      const perk = getWeightedRandomPerk(allPerks, usedIds);
      if (perk) {
        selectedPerks.push(perk);
        usedIds.add(perk.id);
      }
    }

    return selectedPerks;
  }, []);

  // Wähle Perk basierend auf Rarity-Gewichtung
  const getWeightedRandomPerk = (perks, excludeIds) => {
    const availablePerks = perks.filter(p => !excludeIds.has(p.id));
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

  // NEU: Trigger Perk Selection (wird von Game.jsx aufgerufen)
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
  }, []);

  return {
    // State
    activePerks,
    roundsPlayed,
    showPerkSelection,
    availablePerks,

    // Actions
    triggerPerkSelection, // NEU: Exportiere diese Funktion
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