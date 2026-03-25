import { useState, useCallback } from 'react';

export const useRelicSystem = () => {
  // Relics sind PERMANENT für den gesamten Run — kein Duration-Decrement
  const [activeRelics, setActiveRelics] = useState([]);

  const addRelic = useCallback((relic) => {
    setActiveRelics(prev => {
      // Kein Duplikat desselben Relics
      if (prev.some(r => r.id === relic.id)) return prev;
      return [...prev, relic];
    });
  }, []);

  const hasRelic = useCallback((id) => {
    return activeRelics.some(r => r.id === id);
  }, [activeRelics]);

  // Gibt den `value`-Wert des ersten Relics mit passendem effect zurück
  const getRelicValue = useCallback((effect) => {
    const relic = activeRelics.find(r => r.effect === effect);
    return relic ? relic.value : null;
  }, [activeRelics]);

  const getRelicsByTag = useCallback((tag) => {
    return activeRelics.filter(r => r.tags?.includes(tag));
  }, [activeRelics]);

  const reset = useCallback(() => {
    setActiveRelics([]);
  }, []);

  return {
    activeRelics,
    addRelic,
    hasRelic,
    getRelicValue,
    getRelicsByTag,
    reset,
  };
};
