import apiClient from '../../../api/axios';

/**
 * Lädt zufällige Karten vom Backend mit optionalen Filtern
 * @param {number} count - Anzahl der Karten
 * @param {Object} filters - Filter-Objekt mit color, cmc, border_color, rarity
 */
export const fetchRandomCards = async (count = 20, filters = {}) => {
  try {
    const params = { count };
    
    // Füge Filter hinzu wenn vorhanden
    if (filters.color) {
      params.color = filters.color;
    }
    if (filters.cmc) {
      // CMC kann ein Objekt mit operator und threshold/min/max sein
      if (filters.cmc.operator === '<=') {
        params.cmc_max = filters.cmc.threshold;
      } else if (filters.cmc.operator === '>=') {
        params.cmc_min = filters.cmc.threshold;
      } else if (filters.cmc.operator === 'between') {
        params.cmc_min = filters.cmc.min;
        params.cmc_max = filters.cmc.max;
      }
    }
    if (filters.border_color) {
      params.border_color = filters.border_color;
    }
    if (filters.rarity) {
      params.rarity = filters.rarity;
    }

    const response = await apiClient.get('/api/random-cards', { params });

    // Transformiere die Daten in einheitliches Format
    return response.data.map(card => ({
      id: card.id,
      name: card.name,
      set: card.set,
      prices: { 
        eur: parseFloat(card.price) 
      },
      image_uris: { 
        normal: card.image 
      },
      // Neue Felder
      color: card.color,
      cmc: card.cmc,
      border_color: card.border_color,
      rarity: card.rarity,
      set_code: card.set,
      set_name: card.edition || card.set
    }));
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw new Error('Error loading cards');
  }
};

/**
 * Speichert den Highscore
 */
export const updateHighscore = async (score) => {
  try {
    const response = await apiClient.post('/api/score', { score });
    return response.data;
  } catch (error) {
    console.error('Error updating highscore:', error);
    throw new Error('Error saving highscore');
  }
};