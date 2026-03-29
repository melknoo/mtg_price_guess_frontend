import { useRef, useCallback } from 'react';

const generateSessionId = () =>
  Math.random().toString(16).slice(2, 10); // 8-char hex, z.B. "a3f7c2b1"

/**
 * Sammelt alle Game-Events eines Runs via Refs (keine Re-Renders).
 * Gibt beim Run-Ende ein strukturiertes Objekt zurück.
 */
const useRunLogger = () => {
  const roundsRef    = useRef([]);
  const perksRef     = useRef([]);
  const relicsRef    = useRef([]);
  const sessionIdRef = useRef(generateSessionId());

  const logRound = useCallback((data) => {
    roundsRef.current.push(data);
  }, []);

  const logPerkSelected = useCallback((data) => {
    perksRef.current.push(data);
  }, []);

  const logRelicSelected = useCallback((data) => {
    relicsRef.current.push(data);
  }, []);

  const getRunSummary = useCallback((activeSynergies) => ({
    client_session_id: sessionIdRef.current,
    rounds:    roundsRef.current,
    perks:     perksRef.current,
    relics:    relicsRef.current,
    synergies: (activeSynergies || []).map(s => s.id),
  }), []);

  const reset = useCallback(() => {
    roundsRef.current    = [];
    perksRef.current     = [];
    relicsRef.current    = [];
    sessionIdRef.current = generateSessionId();
  }, []);

  return { logRound, logPerkSelected, logRelicSelected, getRunSummary, reset };
};

export default useRunLogger;
