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
export const saveRunLog = async ({
  mode,
  final_score,
  final_level,
  rounds_played,
  best_streak,
  client_session_id,
  perks,
  relics,
  synergies,
  rounds,
  // Roguelike-Stage-Felder (optional)
  stages_cleared,
  total_stages,
  node_path,
  score_per_stage,
  run_mode,
}) => {
  try {
    await apiClient.post('/api/stats/run-log', {
      mode: run_mode ?? mode,
      final_score,
      final_level,
      rounds_played,
      best_streak,
      client_session_id,
      perks,
      relics,
      synergies,
      rounds,
      stages_cleared,
      total_stages,
      node_path,
      score_per_stage,
    });
  } catch {
    // Nicht kritisch — kein Fehler nach oben propagieren
  }
};

/**
 * Speichert einen Mid-Run-Checkpoint nach jedem Stage-Abschluss.
 * Nutzt updateOrCreate (client_session_id) um denselben Run zu überschreiben.
 * Fire-and-forget.
 */
export const saveStageCheckpoint = async ({
  client_session_id,
  stages_cleared,
  node_path,
  score_per_stage,
  current_score,
  current_level,
  perks,
  relics,
  synergies,
}) => {
  try {
    await apiClient.post('/api/stats/stage-checkpoint', {
      client_session_id,
      stages_cleared,
      node_path,
      score_per_stage,
      final_score: current_score,
      final_level: current_level,
      perks,
      relics,
      synergies,
    });
  } catch {
    // Nicht kritisch
  }
};
