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
    let cardsToUse = [...cachedCards];

    // Nur neue Karten laden wenn weniger als 2 Karten im Cache
    if (cardsToUse.length < GAME_CONFIG.MIN_CARDS_NEEDED) {
      const newCards = await preloadCards();
      cardsToUse = newCards;
    }

    if (cardsToUse.length < GAME_CONFIG.MIN_CARDS_NEEDED) {
      setError('Nicht genügend Karten verfügbar');
      return false;
    }

    const nextPair = cardsToUse.slice(0, 2);
    const remaining = cardsToUse.slice(2);

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