import apiClient from '../../../api/axios';

/**
 * Sendet eine Suggestion ans Backend
 * @param {string} text - Der Vorschlag-Text
 * @returns {Promise} Response vom Backend
 */
export const submitSuggestion = async (text) => {
  try {
    const response = await apiClient.post('/api/suggestions', { 
      text 
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    throw new Error(
      error.response?.data?.message || 'Error submitting suggestion'
    );
  }
};

/**
 * Optional: Lädt alle Suggestions (falls du das später brauchst)
 */
export const fetchSuggestions = async () => {
  try {
    const response = await apiClient.get('/api/suggestions');
    return response.data;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    throw new Error('Error fetching suggestions');
  }
};