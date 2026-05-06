import apiClient from '../../../api/axios';

/**
 * Speichert den aktiven Run serverseitig (Upsert per User).
 * Fire-and-forget — Fehler blockieren das UI nicht.
 */
export const saveRunToServer = async (runData) => {
  try {
    await apiClient.post('/api/runs/save', { run_data: runData });
  } catch {
    // Nicht kritisch — localStorage bleibt als Fallback
  }
};

/**
 * Lädt den gespeicherten Run vom Server.
 * Gibt null zurück wenn kein Run existiert oder der Request fehlschlägt.
 */
export const loadRunFromServer = async () => {
  try {
    const res = await apiClient.get('/api/runs/current');
    return res.data?.run_data ?? null;
  } catch {
    return null;
  }
};

/**
 * Löscht den gespeicherten Run serverseitig (Tod, Restart, Run Complete).
 * Fire-and-forget.
 */
export const deleteRunFromServer = async () => {
  try {
    await apiClient.delete('/api/runs/current');
  } catch {
    // Nicht kritisch
  }
};
