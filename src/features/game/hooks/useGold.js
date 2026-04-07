import { useState, useCallback, useRef } from 'react';

// Gold ist die In-Run-Währung für Rerolls, Extra-Relics und Synergy-Slots.
// Der Hook ist so designed, dass Meta-Progression (Persistenz über Runs) später einfach nachrüstbar ist.
export const useGold = (initialGold = 0) => {
  const [gold, setGold] = useState(initialGold);
  // Ref für synchronen Zugriff im spendGold-Callback
  const goldRef = useRef(initialGold);

  const addGold = useCallback((amount) => {
    if (amount <= 0) return;
    setGold(prev => {
      const next = prev + amount;
      goldRef.current = next;
      return next;
    });
  }, []);

  // Gibt true zurück wenn erfolgreich ausgegeben, false wenn nicht genug Gold
  const spendGold = useCallback((amount) => {
    if (goldRef.current < amount) return false;
    setGold(prev => {
      const next = Math.max(0, prev - amount);
      goldRef.current = next;
      return next;
    });
    return true;
  }, []);

  const canAfford = useCallback((amount) => {
    return goldRef.current >= amount;
  }, []);

  const reset = useCallback(() => {
    setGold(0);
    goldRef.current = 0;
  }, []);

  return { gold, addGold, spendGold, canAfford, reset };
};
