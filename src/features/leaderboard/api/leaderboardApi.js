import apiClient from '../../../api/axios';

/**
 * Lädt die Leaderboard-Daten
 */
export const fetchLeaderboard = async () => {
  try {
    const response = await apiClient.get('/api/leaderboard');
    
    // Handle beide Formate: { data: [...] } oder direkt [...]
    if (response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw new Error('Error fetching leaderboard');
  }
};