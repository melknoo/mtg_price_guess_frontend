import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { saveRunToServer, loadRunFromServer, deleteRunFromServer } from '../api/runApi';

const SAVE_KEY = 'mtg_saved_run';

export function useSavedRun() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user && !user.guest);

  // Reaktiver State statt statischer Boolean — wird bei save/clear aktualisiert
  const [hasSavedRun, setHasSavedRun] = useState(
    () => Boolean(localStorage.getItem(SAVE_KEY))
  );

  const saveRun = useCallback((payload) => {
    const data = { ...payload, savedAt: Date.now() };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      setHasSavedRun(true);
    } catch {}

    if (isLoggedIn) {
      saveRunToServer(data); // fire-and-forget
    }
  }, [isLoggedIn]);

  const loadRun = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const clearRun = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setHasSavedRun(false);

    if (isLoggedIn) {
      deleteRunFromServer(); // fire-and-forget
    }
  }, [isLoggedIn]);

  /**
   * Wird in App.jsx aufgerufen wenn der User eingeloggt ist.
   * Vergleicht Server-Run und localStorage — neuerer gewinnt (via savedAt).
   * Lokal neuerer Run wird zurück auf den Server gepusht.
   */
  const syncFromServer = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const serverRun = await loadRunFromServer();

      const localRaw = localStorage.getItem(SAVE_KEY);
      const localRun = localRaw ? JSON.parse(localRaw) : null;

      if (!serverRun && !localRun) return;

      if (!serverRun && localRun) {
        // Nur lokal vorhanden — auf Server pushen
        saveRunToServer(localRun);
        setHasSavedRun(true);
        return;
      }

      if (serverRun && !localRun) {
        // Nur auf Server vorhanden — in localStorage schreiben
        localStorage.setItem(SAVE_KEY, JSON.stringify(serverRun));
        setHasSavedRun(true);
        return;
      }

      // Beide vorhanden — neuerer gewinnt
      const serverNewer = (serverRun.savedAt ?? 0) >= (localRun.savedAt ?? 0);
      if (serverNewer) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(serverRun));
      } else {
        // Lokaler Run ist neuer — Server aktualisieren
        saveRunToServer(localRun);
      }
      setHasSavedRun(true);
    } catch {}
  }, [isLoggedIn]);

  return { saveRun, loadRun, clearRun, hasSavedRun, syncFromServer };
}
