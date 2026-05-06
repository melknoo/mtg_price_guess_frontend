import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { SYNERGIES } from '../constants/synergyDefinitions';

export const useSynergyEngine = (activeRelics, activePerks, onNewSynergy, onSynergyConflict) => {
  // Ref verhindert doppeltes Feuern derselben Synergy-Notification
  const notifiedRef = useRef(new Set());
  // Synergies die auf Konflikt-Auflösung warten (separates Tracking um doppelte Conflict-Calls zu verhindern)
  const pendingConflictRef = useRef(new Set());

  // Permanente Synergien: einmal freigeschaltet, bleiben sie für den ganzen Run aktiv
  const [permanentSynergies, setPermanentSynergies] = useState([]);
  // Ref-Kopie für synchronen Zugriff in Effects ohne Re-Run-Trigger
  const permanentSynergiesRef = useRef([]);

  // Max Slots — default 3, erweiterbar durch Relic "Synergy Expander"
  const maxSynergySlots = useMemo(() => {
    const expanders = activeRelics.filter(r => r.effect === 'synergy_slot_expand');
    return 3 + expanders.length;
  }, [activeRelics]);
  const maxSynergySlatsRef = useRef(maxSynergySlots);
  useEffect(() => { maxSynergySlatsRef.current = maxSynergySlots; }, [maxSynergySlots]);

  // Zählt alle Tags aus aktiven Relics + Perks zusammen (jedes Item zählt als 1, unabhängig von upgradeCount)
  // Phantom Power (fake_double_tags): Fake-Items zählen doppelt, sobald die Synergy permanent ist
  const tagCounts = useMemo(() => {
    const counts = {};
    const hasPhantomPower = permanentSynergies.some(s => s.effect === 'fake_double_tags');
    [...activeRelics, ...activePerks].forEach(item => {
      const isFakeItem = (item.tags || []).includes('fake');
      const finalWeight = (hasPhantomPower && isFakeItem) ? 2 : 1;
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

  // Feuert Callback für neu aktivierte Synergien (einmalig pro Run) und speichert sie permanent.
  // Wenn Slots voll: → onSynergyConflict Callback statt Aktivierung
  useEffect(() => {
    // slotsBeingUsed zählt synchron mit — verhindert Race Condition wenn mehrere Synergien
    // gleichzeitig qualifizieren und setState-Callbacks noch nicht gefeuert haben
    let slotsBeingUsed = 0;
    currentSynergies.forEach(synergy => {
      if (notifiedRef.current.has(synergy.id)) return;
      if (pendingConflictRef.current.has(synergy.id)) return;

      const currentSlots = permanentSynergiesRef.current.length + slotsBeingUsed;
      const maxSlots = maxSynergySlatsRef.current;

      if (currentSlots >= maxSlots) {
        // Slots voll — einmalig Konflikt-Callback feuern
        pendingConflictRef.current.add(synergy.id);
        onSynergyConflict?.(synergy);
      } else {
        // Slot frei — direkt aktivieren
        slotsBeingUsed++;
        notifiedRef.current.add(synergy.id);
        setPermanentSynergies(prev => {
          const next = [...prev, synergy];
          permanentSynergiesRef.current = next;
          return next;
        });
        onNewSynergy?.(synergy);
      }
    });
  }, [currentSynergies, onNewSynergy, onSynergyConflict]);

  // Nur permanent freigeschaltete Synergien sind aktiv.
  // currentSynergies im Conflict-Zustand (pendingConflictRef) werden NICHT mitgezählt —
  // sonst würden sie als aktiv gelten obwohl der Spieler noch keine Entscheidung getroffen hat.
  const activeSynergies = permanentSynergies;

  const hasSynergy = useCallback(
    (id) => activeSynergies.some(s => s.id === id),
    [activeSynergies]
  );

  const getSynergyValue = useCallback(
    (effect) => activeSynergies.find(s => s.effect === effect)?.value ?? null,
    [activeSynergies]
  );

  // Löst einen Synergy-Slot-Konflikt auf:
  // dropId = ID der zu droppenden Synergy, pendingSynergy = die neue wartende Synergy
  // dropId = null → neue Synergy ablehnen (als notified markieren damit sie nicht wieder kommt)
  const resolveConflict = useCallback((dropId, pendingSynergy) => {
    if (!pendingSynergy) return;
    pendingConflictRef.current.delete(pendingSynergy.id);
    notifiedRef.current.add(pendingSynergy.id);

    if (!dropId) return; // Skip: neue Synergy ablehnen, keine Änderungen

    setPermanentSynergies(prev => {
      const next = [...prev.filter(s => s.id !== dropId), pendingSynergy];
      permanentSynergiesRef.current = next;
      return next;
    });
    onNewSynergy?.(pendingSynergy);
  }, [onNewSynergy]);

  const reset = useCallback(() => {
    notifiedRef.current = new Set();
    pendingConflictRef.current = new Set();
    permanentSynergiesRef.current = [];
    setPermanentSynergies([]);
  }, []);

  const restoreSynergies = useCallback((savedSynergies) => {
    const s = savedSynergies ?? [];
    permanentSynergiesRef.current = s;
    setPermanentSynergies(s);
    // Mark all restored synergies as already notified to prevent re-firing
    s.forEach(syn => notifiedRef.current.add(syn.id));
  }, []);

  return { activeSynergies, permanentSynergies, maxSynergySlots, hasSynergy, getSynergyValue, resolveConflict, reset, restoreSynergies };
};
