import apiClient from '../../../api/axios';

/**
 * Speichert eine abgeschlossene Spielsession serverseitig.
 * Fire-and-forget — Fehler werden ignoriert um das UI nicht zu blockieren.
 */
export const saveGameSession = async ({ score, rounds_played, correct_answers, wrong_answers, best_streak, mode }) => {
  try {
    await apiClient.post('/api/stats/session', {
      score,
      rounds_played,
      correct_answers,
      wrong_answers,
      best_streak,
      mode,
    });
  } catch {
    // Statistiken sind nicht kritisch — kein Fehler nach oben propagieren
  }
};

/**
 * Lädt die aggregierten Statistiken des eingeloggten Users.
 */
export const fetchStats = async () => {
  const response = await apiClient.get('/api/stats');
  return response.data;
};

/**
 * Speichert den vollständigen Run-Log (Runden, Perks, Relics, Synergien).
 * Fire-and-forget — Fehler werden ignoriert um das UI nicht zu blockieren.
 */
export const saveRunLog = async (payload) => {
  try {
    await apiClient.post('/api/stats/run-log', payload);
  } catch {
    // Nicht kritisch — kein Fehler nach oben propagieren
  }
};
