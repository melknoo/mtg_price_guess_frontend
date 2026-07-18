import { useState, useCallback, useRef } from 'react';

// XP-Kurve: Level 1→2 = 30 XP (ca. 3 richtige Antworten), dann +25 pro Level
const getXpToNextLevel = (level) => 30 + (level - 1) * 25;

export const useLevel = () => {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(getXpToNextLevel(1));
  // Anzahl ausstehender Level-Up-Modals (je Level-Up +1, je Dismiss -1)
  const [pendingLevelUps, setPendingLevelUps] = useState(0);
  // Gesamte im Run verdiente XP (Ref für synchronen Zugriff am Run-Ende).
  // Nicht aus level+xp ableitbar, da Scholar-Synergy die Thresholds verändert.
  const totalXpEarnedRef = useRef(0);

  // Fügt XP hinzu; gibt true zurück wenn Level-Up passiert ist
  // thresholdMultiplier: Scholar-Synergy senkt die Schwelle (z.B. 0.8 = 20% weniger XP nötig)
  const addXP = useCallback((amount, thresholdMultiplier = 1) => {
    if (amount <= 0) return false;

    totalXpEarnedRef.current += amount;

    let didLevelUp = false;

    setXp((prevXp) => {
      let newXp = prevXp + amount;
      let newLevel = level;
      let levelsGained = 0;
      let threshold = Math.floor(getXpToNextLevel(newLevel) * thresholdMultiplier);

      // Mehrere Level-Ups hintereinander möglich (z.B. bei hohem XP-Boost)
      while (newXp >= threshold) {
        newXp -= threshold;
        newLevel++;
        threshold = Math.floor(getXpToNextLevel(newLevel) * thresholdMultiplier);
        levelsGained++;
      }

      if (levelsGained > 0) {
        setLevel(newLevel);
        setXpToNextLevel(getXpToNextLevel(newLevel));
        setPendingLevelUps(prev => prev + levelsGained);
        didLevelUp = true;
      }

      return newXp;
    });

    return didLevelUp;
  }, [level]);

  const dismissLevelUp = useCallback(() => {
    setPendingLevelUps(prev => Math.max(0, prev - 1));
  }, []);

  const setLevelDirect = useCallback((newLevel) => {
    const lvl = Math.max(1, Math.floor(newLevel));
    setLevel(lvl);
    setXp(0);
    setXpToNextLevel(getXpToNextLevel(lvl));
    setPendingLevelUps(0);
  }, []);

  const reset = useCallback(() => {
    setXp(0);
    setLevel(1);
    setXpToNextLevel(getXpToNextLevel(1));
    setPendingLevelUps(0);
    totalXpEarnedRef.current = 0;
  }, []);

  const restoreLevel = useCallback((savedLevel, savedXp, savedTotalXpEarned) => {
    const lvl = Math.max(1, Math.floor(savedLevel ?? 1));
    setLevel(lvl);
    setXp(savedXp ?? 0);
    setXpToNextLevel(getXpToNextLevel(lvl));
    setPendingLevelUps(0);
    // Ältere Saves ohne Feld: 0 — Run zählt dann nur ab jetzt (leicht unter-belohnt, akzeptiert)
    totalXpEarnedRef.current = savedTotalXpEarned ?? 0;
  }, []);

  return {
    xp,
    level,
    xpToNextLevel,
    showLevelUp: pendingLevelUps > 0,
    pendingLevelUps,
    totalXpEarnedRef,
    addXP,
    dismissLevelUp,
    setLevelDirect,
    reset,
    restoreLevel,
  };
};
