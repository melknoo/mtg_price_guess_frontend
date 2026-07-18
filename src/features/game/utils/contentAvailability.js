// Modul-Snapshot der aktuell gesperrten Content-Keys.
// App.jsx aktualisiert den Snapshot via useEffect, sobald sich Account-Level,
// Stats oder Achievements ändern. Die Offer-Sites (usePerkSystem, LevelUpModal,
// MerchantPanel) filtern ihre Pools über filterAvailable() — ohne Prop-Drilling.
//
// snapshot === null bedeutet: kein Gating aktiv, alles verfügbar (Failsafe).

let snapshot = null; // Set<'perk:id' | 'relic:id'>

export function setLockedSnapshot(lockedKeys) {
  snapshot = lockedKeys ? new Set(lockedKeys) : null;
}

export function isUnlocked(type, id) {
  return !snapshot || !snapshot.has(`${type}:${id}`);
}

// Filtert einen Item-Pool auf freigeschaltete Einträge.
// basePerkId ?? id: Extended-Perk-Varianten folgen automatisch dem Lock-Status
// ihres Base-Perks (kein eigener Tabellen-Eintrag nötig).
export function filterAvailable(type, items) {
  if (!snapshot) return items;
  return items.filter(item => isUnlocked(type, item.basePerkId ?? item.id));
}

// Nur für Debug/Tests
export function getLockedSnapshot() {
  return snapshot;
}
