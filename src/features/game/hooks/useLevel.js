import { useState, useCallback } from 'react';

// XP-Kurve: Level N braucht 50 + (N * 25) XP
const getXpToNextLevel = (level) => 50 + level * 25;

export const useLevel = () => {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(getXpToNextLevel(1));
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Fügt XP hinzu; gibt true zurück wenn Level-Up passiert ist
  // thresholdMultiplier: Scholar-Synergy senkt die Schwelle (z.B. 0.8 = 20% weniger XP nötig)
  const addXP = useCallback((amount, thresholdMultiplier = 1) => {
    if (amount <= 0) return false;

    let didLevelUp = false;

    setXp((prevXp) => {
      let newXp = prevXp + amount;
      let newLevel = level;
      let threshold = Math.floor(getXpToNextLevel(newLevel) * thresholdMultiplier);

      // Mehrere Level-Ups hintereinander möglich (z.B. bei hohem XP-Boost)
      while (newXp >= threshold) {
        newXp -= threshold;
        newLevel++;
        threshold = Math.floor(getXpToNextLevel(newLevel) * thresholdMultiplier);
        didLevelUp = true;
      }

      if (didLevelUp) {
        setLevel(newLevel);
        setXpToNextLevel(getXpToNextLevel(newLevel));
        setShowLevelUp(true);
      }

      return newXp;
    });

    return didLevelUp;
  }, [level]);

  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(false);
  }, []);

  const reset = useCallback(() => {
    setXp(0);
    setLevel(1);
    setXpToNextLevel(getXpToNextLevel(1));
    setShowLevelUp(false);
  }, []);

  return {
    xp,
    level,
    xpToNextLevel,
    showLevelUp,
    addXP,
    dismissLevelUp,
    reset,
  };
};
