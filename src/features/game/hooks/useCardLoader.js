import { useState, useCallback } from 'react';
import { fetchRandomCards } from '../api/gameApi';
import { GAME_CONFIG } from '../../../shared/utils/constants';

export const useCardLoader = () => {
  const [cachedCards, setCachedCards] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});

  /**
   * Setzt aktive Filter basierend auf Perks
   * @param {Array} filterPerks - Array von Filter-Perks
   */
  const updateFilters = useCallback((filterPerks) => {
    const filters = {};

    filterPerks.forEach(perk => {
      if (perk.filterType === 'color') {
        filters.color = perk.value;
      } else if (perk.filterType === 'cmc') {
        filters.cmc = perk.value;
      } else if (perk.filterType === 'border_color') {
        filters.border_color = perk.value;
      } else if (perk.filterType === 'rarity') {
        filters.rarity = perk.value;
      }
    });

    // Nur updaten wenn sich die Filter tatsächlich geändert haben
    setActiveFilters(prev => {
      const prevString = JSON.stringify(prev);
      const newString = JSON.stringify(filters);
      
      if (prevString === newString) {
        return prev; // Keine Änderung, alten State behalten
      }
      return filters;
    });
  }, []);

  const preloadCards = useCallback(async (filters = activeFilters) => {
    setLoading(true);
    setError(null);

    try {
      const cards = await fetchRandomCards(GAME_CONFIG.PRELOAD_CARDS, filters);
      setCachedCards(cards);
      return cards;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  const setNextPair = useCallback(async (forceReload = false, providedCards = null) => {
    let cardsToUse;

    // Wenn Karten direkt übergeben werden, verwende diese
    if (providedCards && providedCards.length > 0) {
      cardsToUse = providedCards;
    } else {
      cardsToUse = [...cachedCards];

      // Wenn forceReload = true, erzwinge das Laden neuer Karten
      if (forceReload || cardsToUse.length < GAME_CONFIG.MIN_CARDS_NEEDED) {
        const newCards = await preloadCards();
        cardsToUse = newCards;
      }
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
    setActiveFilters({});
  }, []);

  return {
    currentPair,
    loading,
    error,
    activeFilters,
    preloadCards,
    setNextPair,
    updateFilters,
    reset,
    hasCards: currentPair.length === 2,
  };
};