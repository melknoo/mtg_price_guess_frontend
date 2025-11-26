import apiClient from '../../../api/axios';

/**
 * Lädt die freigeschalteten Achievements des Users
 */
export const fetchUserAchievements = async () => {
  try {
    const response = await apiClient.get('/api/achievements');
    return response.data.achievements || [];
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};

/**
 * Schaltet ein Achievement frei
 */
export const unlockAchievement = async (achievementId) => {
  try {
    const response = await apiClient.post('/api/achievements/unlock', {
      achievement_id: achievementId
    });
    return response.data;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    throw error;
  }
};

/**
 * Schaltet mehrere Achievements auf einmal frei (Batch)
 */
export const unlockAchievements = async (achievementIds) => {
  try {
    const response = await apiClient.post('/api/achievements/unlock-batch', {
      achievement_ids: achievementIds
    });
    return response.data;
  } catch (error) {
    console.error('Error unlocking achievements:', error);
    throw error;
  }
};

/**
 * Synchronisiert lokale Achievements mit dem Server
 * Nützlich für Gäste die sich später registrieren
 */
export const syncAchievements = async (achievementIds) => {
  try {
    const response = await apiClient.post('/api/achievements/sync', {
      achievement_ids: achievementIds
    });
    return response.data;
  } catch (error) {
    console.error('Error syncing achievements:', error);
    throw error;
  }
};