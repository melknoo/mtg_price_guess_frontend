import { useState, useCallback } from 'react';
import { fetchRandomCards } from '../api/gameApi';
import { GAME_CONFIG } from '../../../shared/utils/constants';
import { FILTER_EFFECTS } from '../constants/perkDefinitions';

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
      switch (perk.effect) {
        case FILTER_EFFECTS.COLOR:
          filters.color = perk.value;
          break;
        case FILTER_EFFECTS.COLOR_EXCLUDE:
          filters.color_exclude = perk.value;
          break;
        case FILTER_EFFECTS.CMC:
          filters.cmc = perk.value;
          break;
        case FILTER_EFFECTS.CMC_EXCLUDE:
          filters.cmc_exclude = perk.value;
          break;
        case FILTER_EFFECTS.BORDER:
          filters.border_color = perk.value;
          break;
        case FILTER_EFFECTS.RARITY:
          filters.rarity = perk.value;
          break;
        case FILTER_EFFECTS.RARITY_EXCLUDE:
          filters.rarity_exclude = perk.value;
          break;
        case FILTER_EFFECTS.TYPE:
          filters.type = perk.value;
          break;
        case FILTER_EFFECTS.TYPE_EXCLUDE:
          filters.type_exclude = perk.value;
          break;
        default:
          break;
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
      setError('Not enough cards available');
      return false;
    }

    const nextPair = cardsToUse.slice(0, 2);
    const remaining = cardsToUse.slice(2);

    setCurrentPair(nextPair);
    setCachedCards(remaining);
    
    return true;
  }, [cachedCards, preloadCards]);

  /**
   * Initialisiert den Card-Pool direkt mit vorgegebenen Karten (z.B. Daily Challenge).
   * Setzt das erste Paar sofort, ohne einen API-Call zu machen.
   */
  const initWithCards = useCallback((cards) => {
    if (!cards || cards.length < 2) {
      setError('Not enough cards available');
      return false;
    }
    setCurrentPair(cards.slice(0, 2));
    setCachedCards(cards.slice(2));
    return true;
  }, []);

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
    initWithCards,
    reset,
    hasCards: currentPair.length === 2,
  };
};