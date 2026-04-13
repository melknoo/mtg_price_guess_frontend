import { useState, useCallback } from 'react';
import { fetchRandomCards } from '../api/gameApi';
import { GAME_CONFIG } from '../../../shared/utils/constants';
import { FILTER_EFFECTS } from '../constants/perkDefinitions';

const BOOST_EFFECTS = [
  FILTER_EFFECTS.COLOR_BOOST,
  FILTER_EFFECTS.CMC_BOOST,
  FILTER_EFFECTS.BORDER_BOOST,
  FILTER_EFFECTS.RARITY_BOOST,
  FILTER_EFFECTS.TYPE_BOOST,
];

/**
 * Prüft ob eine Karte einem Boost-Perk entspricht
 */
const cardMatchesBoost = (card, boost) => {
  const { effect, value } = boost;
  switch (effect) {
    case FILTER_EFFECTS.COLOR_BOOST: {
      const cardColor = card.color || '';
      if (value === 'multicolor') return cardColor.length > 1;
      if (value === 'colorless') return cardColor === '' || cardColor === 'C';
      return cardColor.includes(value);
    }
    case FILTER_EFFECTS.CMC_BOOST: {
      const cmc = card.cmc ?? 0;
      if (value.operator === '<=') return cmc <= value.threshold;
      if (value.operator === '>=') return cmc >= value.threshold;
      if (value.operator === 'between') return cmc >= value.min && cmc <= value.max;
      return false;
    }
    case FILTER_EFFECTS.BORDER_BOOST:
      return card.border_color === value;
    case FILTER_EFFECTS.RARITY_BOOST:
      return card.rarity === value;
    case FILTER_EFFECTS.TYPE_BOOST: {
      const typeLine = (card.type_line || '').toLowerCase();
      if (value === 'creature') return typeLine.includes('creature');
      if (value === 'instant_sorcery') return typeLine.includes('instant') || typeLine.includes('sorcery');
      if (value === 'artifact_enchantment') return typeLine.includes('artifact') || typeLine.includes('enchantment');
      if (value === 'land') return typeLine.includes('land');
      return false;
    }
    default:
      return false;
  }
};

/**
 * Zieht einen zufälligen Index aus einem Pool mit Gewichtung durch aktive Boosts
 */
const weightedPick = (pool, boosts) => {
  const weights = pool.map(card => {
    let weight = 1.0;
    boosts.forEach(boost => {
      if (cardMatchesBoost(card, boost)) {
        weight *= (1 + (boost.boostPercent || 40) / 100);
      }
    });
    return weight;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return i;
  }
  return pool.length - 1;
};

export const useCardLoader = () => {
  const [cachedCards, setCachedCards] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [activeBoosts, setActiveBoosts] = useState([]);

  /**
   * Setzt aktive Filter und Boosts basierend auf Perks.
   * Hard-Filter (Exclude) gehen an das Backend, Boost-Filter werden frontend-seitig angewendet.
   * @param {Array} filterPerks - Array von Filter-Perks
   */
  const updateFilters = useCallback((filterPerks) => {
    const filters = {};
    const boosts = [];

    filterPerks.forEach(perk => {
      if (BOOST_EFFECTS.includes(perk.effect)) {
        boosts.push(perk);
        return;
      }
      switch (perk.effect) {
        case FILTER_EFFECTS.COLOR_EXCLUDE:
          filters.color_exclude = perk.value;
          break;
        case FILTER_EFFECTS.CMC_EXCLUDE:
          filters.cmc_exclude = perk.value;
          break;
        case FILTER_EFFECTS.RARITY_EXCLUDE:
          filters.rarity_exclude = perk.value;
          break;
        case FILTER_EFFECTS.TYPE_EXCLUDE:
          filters.type_exclude = perk.value;
          break;
        default:
          break;
      }
    });

    setActiveBoosts(boosts);

    // Nur updaten wenn sich die Filter tatsächlich geändert haben
    setActiveFilters(prev => {
      const prevString = JSON.stringify(prev);
      const newString = JSON.stringify(filters);
      if (prevString === newString) return prev;
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

  const setNextPair = useCallback(async (forceReload = false, providedCards = null, boostsOverride = null) => {
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

    // boostsOverride: für den Fall dass activeBoosts noch nicht per state geupdated ist (z.B. direkt nach selectPerk)
    const effectiveBoosts = boostsOverride ?? activeBoosts;

    // Gewichtete Auswahl wenn Boost-Perks aktiv sind
    if (effectiveBoosts.length > 0 && cardsToUse.length > 2) {
      const remaining = [...cardsToUse];
      const selected = [];
      for (let i = 0; i < 2; i++) {
        const idx = weightedPick(remaining, effectiveBoosts);
        selected.push(remaining[idx]);
        remaining.splice(idx, 1);
      }
      setCurrentPair(selected);
      setCachedCards(remaining);
    } else {
      setCurrentPair(cardsToUse.slice(0, 2));
      setCachedCards(cardsToUse.slice(2));
    }

    return true;
  }, [cachedCards, preloadCards, activeBoosts]);

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
    setActiveBoosts([]);
  }, []);

  return {
    currentPair,
    loading,
    error,
    activeFilters,
    activeBoosts,
    preloadCards,
    setNextPair,
    updateFilters,
    initWithCards,
    reset,
    hasCards: currentPair.length === 2,
  };
};
