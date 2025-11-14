import apiClient from '../../../api/axios';

/**
 * Lädt zufällige Karten vom Backend
 */
export const fetchRandomCards = async (count = 20) => {
  try {
    const response = await apiClient.get('/api/random-cards', {
      params: { count }
    });

    // Transformiere die Daten in einheitliches Format
    return response.data.map(card => ({
      id: card.id,
      name: card.name,
      prices: { 
        eur: parseFloat(card.price) 
      },
      image_uris: { 
        normal: card.image 
      }
    }));
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw new Error('Fehler beim Laden der Karten');
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
    throw new Error('Fehler beim Speichern des Highscores');
  }
};