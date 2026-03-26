import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { SYNERGIES } from '../constants/synergyDefinitions';

export const useSynergyEngine = (activeRelics, activePerks, onNewSynergy) => {
  // Ref verhindert doppeltes Feuern derselben Synergy-Notification
  const notifiedRef = useRef(new Set());

  // Permanente Synergien: einmal freigeschaltet, bleiben sie für den ganzen Run aktiv
  const [permanentSynergies, setPermanentSynergies] = useState([]);

  // Zählt alle Tags aus aktiven Relics + Perks zusammen
  // upgradeCount sorgt dafür, dass upgegradete Perks mehrfach zählen
  // Phantom Power (fake_double_tags): Fake-Items zählen doppelt, sobald die Synergy permanent ist
  const tagCounts = useMemo(() => {
    const counts = {};
    const hasPhantomPower = permanentSynergies.some(s => s.effect === 'fake_double_tags');
    [...activeRelics, ...activePerks].forEach(item => {
      const weight = item.upgradeCount || 1;
      const isFakeItem = (item.tags || []).includes('fake');
      const finalWeight = (hasPhantomPower && isFakeItem) ? weight * 2 : weight;
      (item.tags || []).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + finalWeight;
      });
    });
    return counts;
  }, [activeRelics, activePerks, permanentSynergies]);

  // Matcht tagCounts gegen alle SYNERGIES — liefert aktuell erfüllte Synergien
  const currentSynergies = useMemo(() => {
    return Object.values(SYNERGIES).filter(synergy =>
      Object.entries(synergy.requiredTags).every(
        ([tag, required]) => (tagCounts[tag] || 0) >= required
      )
    );
  }, [tagCounts]);

  // Feuert Callback für neu aktivierte Synergien (einmalig pro Run) und speichert sie permanent
  useEffect(() => {
    currentSynergies.forEach(synergy => {
      if (!notifiedRef.current.has(synergy.id)) {
        notifiedRef.current.add(synergy.id);
        setPermanentSynergies(prev => [...prev, synergy]);
        onNewSynergy?.(synergy);
      }
    });
  }, [currentSynergies, onNewSynergy]);

  // Effektive Synergien: permanent freigeschaltete + aktuell erfüllte (ohne Duplikate)
  const activeSynergies = useMemo(() => {
    const permanentIds = new Set(permanentSynergies.map(s => s.id));
    const additional = currentSynergies.filter(s => !permanentIds.has(s.id));
    return [...permanentSynergies, ...additional];
  }, [permanentSynergies, currentSynergies]);

  const hasSynergy = useCallback(
    (id) => activeSynergies.some(s => s.id === id),
    [activeSynergies]
  );

  const getSynergyValue = useCallback(
    (effect) => activeSynergies.find(s => s.effect === effect)?.value ?? null,
    [activeSynergies]
  );

  const reset = useCallback(() => {
    notifiedRef.current = new Set();
    setPermanentSynergies([]);
  }, []);

  return { activeSynergies, hasSynergy, getSynergyValue, reset };
};
