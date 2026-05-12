import { useMemo, useCallback } from 'react';
import { PERK_COMBOS } from '../constants/perkCombos';

/**
 * Berechnet aktive Perk-Combos basierend auf activePerks.
 * Rein derived state — kein eigener State, keine Side Effects.
 * Recomputed nur wenn activePerks sich ändert (nicht per Antwort).
 */
export const usePerkCombos = (activePerks) => {
  const activeCombos = useMemo(() => {
    const activePerkIds = new Set(
      activePerks.map(p => p.basePerkId ?? p.id)
    );
    return PERK_COMBOS.filter(combo =>
      combo.requiredPerkIds.every(id => activePerkIds.has(id))
    );
  }, [activePerks]);

  const hasCombo = useCallback((comboId) =>
    activeCombos.some(c => c.id === comboId),
  [activeCombos]);

  return { activeCombos, hasCombo };
};
