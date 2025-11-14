import { useState, useCallback } from 'react';
import { fetchRandomCards } from '../api/gameApi';
import { GAME_CONFIG } from '../../../shared/utils/constants';

export const useCardLoader = () => {
  const [cachedCards, setCachedCards] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const preloadCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cards = await fetchRandomCards(GAME_CONFIG.PRELOAD_CARDS);
      setCachedCards(cards);
      return cards;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const setNextPair = useCallback(async () => {
    let updatedCache = [...cachedCards];

    if (updatedCache.length < GAME_CONFIG.MIN_CARDS_NEEDED) {
      const newCards = await preloadCards();
      updatedCache = [...updatedCache, ...newCards];
    }

    if (updatedCache.length < GAME_CONFIG.MIN_CARDS_NEEDED) {
      setError('Nicht genügend Karten verfügbar');
      return false;
    }

    const nextPair = updatedCache.slice(0, 2);
    const remaining = updatedCache.slice(2);

    setCurrentPair(nextPair);
    setCachedCards(remaining);
    
    return true;
  }, [cachedCards, preloadCards]);

  const reset = useCallback(() => {
    setCachedCards([]);
    setCurrentPair([]);
    setError(null);
  }, []);

  return {
    currentPair,
    loading,
    error,
    preloadCards,
    setNextPair,
    reset,
    hasCards: currentPair.length === 2,
  };
};