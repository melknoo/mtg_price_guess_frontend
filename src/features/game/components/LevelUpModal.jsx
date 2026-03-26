import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RELICS, RELIC_RARITY_WEIGHTS } from '../constants/relicDefinitions';
import { PERKS, PERK_RARITY, getExtendedVersion } from '../constants/perkDefinitions';
import { SYNERGIES } from '../constants/synergyDefinitions';

// Gewichteter Zufalls-Pick aus einem Array von Objekten mit `rarity`-Property
function weightedRandomPick(items, weights, excludeIds = new Set()) {
  const available = items.filter(i => !excludeIds.has(i.id));
  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, i) => sum + (weights[i.rarity] ?? 1), 0);
  let rand = Math.random() * totalWeight;
  for (const item of available) {
    rand -= weights[item.rarity] ?? 1;
    if (rand <= 0) return item;
  }
  return available[0];
}

// Generiert 3 (oder 4 mit Fortune-Synergy) Optionen: 1 Relic · 1 Item · 1 Upgrade/Relic [· 1 Bonus]
function generateOptions(activeRelics, activePerks, hasForture = false) {
  const usedIds = new Set();
  const options = [];

  const allRelics = Object.values(RELICS);
  const ownedRelicIds = new Set(activeRelics.map(r => r.id));

  // Hilfsfunktion: nächstes Relic das noch nicht in usedIds und nicht owned ist
  const pickRelic = () => {
    const excludeIds = new Set([...ownedRelicIds, ...usedIds]);
    const pick = weightedRandomPick(allRelics, RELIC_RARITY_WEIGHTS, excludeIds);
    if (pick) {
      options.push({ ...pick, category: 'relic' });
      usedIds.add(pick.id);
    }
  };

  // --- Slot 1: Relic ---
  pickRelic();

  // --- Slot 2: Item (zufälliger Perk, kein Filter-Perk, kein bereits aktiver permanent-Perk) ---
  const activePerkIds = new Set(activePerks.map(p => p.id));
  const itemCandidates = Object.values(PERKS).filter(p =>
    p.type !== 'filter' &&
    !p.isExtended &&
    !activePerkIds.has(p.id)
  );
  const perkWeights = {
    [PERK_RARITY.COMMON]: 50,
    [PERK_RARITY.RARE]: 30,
    [PERK_RARITY.EPIC]: 15,
  };
  const itemPick = weightedRandomPick(itemCandidates, perkWeights, usedIds);
  if (itemPick) {
    options.push({ ...itemPick, category: 'item' });
    usedIds.add(itemPick.id);
  }

  // --- Slot 3: Upgrade (Extended-Version eines aktiven Perks) oder 2. Relic ---
  const upgradeCandidates = activePerks
    .filter(p => !p.isExtended)
    .map(p => {
      const ext = getExtendedVersion(p.id);
      return ext ? { ...ext, upgradeFrom: p.name, category: 'upgrade' } : null;
    })
    .filter(Boolean);

  if (upgradeCandidates.length > 0) {
    const upgradePick = upgradeCandidates[Math.floor(Math.random() * upgradeCandidates.length)];
    options.push(upgradePick);
    usedIds.add(upgradePick.id);
  } else {
    pickRelic();
  }

  // --- Slot 4 (Fortune-Synergy): Extra-Option ---
  if (hasForture) {
    pickRelic();
  }

  return options;
}

// Berechnet welche neuen Synergien durch die Wahl dieser Option aktiviert würden
function getNewSynergiesForOption(option, activeRelics, activePerks, activeSynergies) {
  const activeIds = new Set(activeSynergies.map(s => s.id));

  // Aktuelle Tag-Counts
  const tagCounts = {};
  [...activeRelics, ...activePerks].forEach(item => {
    (item.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Tags der neuen Option dazuzählen
  const newTagCounts = { ...tagCounts };
  (option.tags || []).forEach(tag => {
    newTagCounts[tag] = (newTagCounts[tag] || 0) + 1;
  });

  // Synergien die nach der Wahl neu erfüllt wären
  return Object.values(SYNERGIES).filter(synergy => {
    if (activeIds.has(synergy.id)) return false;
    return Object.entries(synergy.requiredTags).every(
      ([tag, required]) => (newTagCounts[tag] || 0) >= required
    );
  });
}

// Berechnet dynamischen Bonus-Hinweis für bestimmte Relics
function getOptionDynamicHint(option, activeRelicsCount) {
  if (option.effect === 'per_relic_flat_bonus') {
    // +1 because picking this relic adds itself
    const total = (activeRelicsCount + 1) * (option.value ?? 15);
    return `Nach Wahl: +${total} Score/Runde`;
  }
  return null;
}

// --- Styling-Helfer pro Kategorie ---
const CATEGORY_STYLES = {
  relic: {
    border: 'border-amber-400',
    gradient: 'from-amber-700 to-yellow-800',
    badge: 'bg-amber-500 text-white',
    badgeLabel: '⭐ Relic',
    glow: 'group-hover:shadow-amber-500/40',
  },
  item: {
    border: 'border-blue-400',
    gradient: 'from-blue-700 to-indigo-800',
    badge: 'bg-blue-500 text-white',
    badgeLabel: '🎮 Item',
    glow: 'group-hover:shadow-blue-500/40',
  },
  upgrade: {
    border: 'border-emerald-400',
    gradient: 'from-emerald-700 to-teal-800',
    badge: 'bg-emerald-500 text-white',
    badgeLabel: '⬆️ Upgrade',
    glow: 'group-hover:shadow-emerald-500/40',
  },
};

const RARITY_BADGE = {
  common: 'bg-gray-500 text-white',
  rare: 'bg-blue-500 text-white',
  epic: 'bg-purple-500 text-white',
  legendary: 'bg-amber-400 text-black',
};

export default function LevelUpModal({ show, newLevel, activeRelics, activePerks, activeSynergies = [], onSelect }) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (show) setIsMinimized(false);
  }, [show]);

  const hasFortune = activeSynergies.some(s => s.effect === 'extra_pick_option');

  const options = useMemo(() => {
    if (!show) return [];
    return generateOptions(activeRelics ?? [], activePerks ?? [], hasFortune);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, activeRelics, activePerks, hasFortune]);

  if (!show || options.length === 0) return null;

  return (
    <>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsMinimized(prev => !prev)}
          className="fixed bottom-12 right-4 z-[60] bg-black/80 text-white text-sm px-4 py-2 rounded-full border border-white/20 shadow-2xl backdrop-blur hover:bg-black/70 transition"
        >
          {isMinimized ? 'Show Reward' : 'Hide Reward'}
        </motion.button>
      )}
    <AnimatePresence>
      {show && !isMinimized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="max-w-5xl w-full p-3 sm:p-6 my-auto"
          >
            {/* Header */}
            <div className="text-center mb-3 sm:mb-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="inline-block text-3xl sm:text-5xl mb-1 sm:mb-3"
              >
                ⭐
              </motion.div>
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl sm:text-4xl font-bold text-amber-300 mb-1"
              >
                Level Up! — Level {newLevel}
              </motion.h2>
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-300 text-sm sm:text-lg"
              >
                Wähle eine Belohnung!
              </motion.p>
            </div>

            {/* Option Cards */}
            <div className={`grid grid-cols-1 gap-2 sm:gap-6 ${hasFortune ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              {options.map((option, index) => {
                const style = CATEGORY_STYLES[option.category] ?? CATEGORY_STYLES.item;
                const newSynergies = getNewSynergiesForOption(option, activeRelics ?? [], activePerks ?? [], activeSynergies);
                return (
                  <motion.div
                    key={option.id + option.category}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.08 * index }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(option)}
                    className={`
                      relative cursor-pointer group
                      bg-gradient-to-br ${style.gradient}
                      border-2 sm:border-4 ${style.border} rounded-xl sm:rounded-2xl
                      p-3 sm:p-6
                      shadow-2xl transition-all duration-300
                      hover:shadow-xl ${style.glow}
                    `}
                  >
                    {/* Mobile: horizontal layout */}
                    <div className="flex items-start gap-3 md:hidden">
                      <div className="text-4xl shrink-0 mt-0.5">{option.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className={`${style.badge} px-1.5 py-0.5 rounded-full text-xs font-bold`}>
                            {style.badgeLabel}
                          </span>
                          <span className={`${RARITY_BADGE[option.rarity] ?? 'bg-gray-500 text-white'} px-1.5 py-0.5 rounded-full text-xs font-bold uppercase`}>
                            {option.rarity}
                          </span>
                        </div>
                        {option.category === 'upgrade' ? (
                          <div>
                            <span className="text-gray-400 text-xs line-through">{option.upgradeFrom}</span>
                            <span className="text-emerald-300 text-xs mx-1">→</span>
                            <span className="text-white font-bold text-sm">{option.name}</span>
                          </div>
                        ) : (
                          <h3 className="text-sm font-bold text-white leading-tight">{option.name}</h3>
                        )}
                        <p className="text-gray-200 text-xs mt-0.5 leading-snug">{option.description}</p>
                        {getOptionDynamicHint(option, (activeRelics ?? []).length) && (
                          <p className="text-amber-300 text-xs font-semibold mt-0.5">{getOptionDynamicHint(option, (activeRelics ?? []).length)}</p>
                        )}
                        <div className="mt-1">
                          {option.category === 'item' && option.duration > 0 && (
                            <span className="text-yellow-300 text-xs">⏱️ {option.duration} Runden</span>
                          )}
                          {option.category === 'item' && option.duration === -1 && (
                            <span className="text-green-300 text-xs">♾️ Permanent</span>
                          )}
                          {option.category === 'relic' && (
                            <span className="text-amber-300 text-xs">♾️ Ganzer Run</span>
                          )}
                        </div>
                        {newSynergies.length > 0 && (
                          <div className="mt-1.5 flex flex-col gap-1">
                            {newSynergies.map(s => (
                              <div key={s.id} className="flex items-center gap-1 bg-teal-500/20 border border-teal-400/60 rounded-md px-1.5 py-0.5">
                                <span className="text-sm leading-none">{s.icon}</span>
                                <span className="text-teal-200 text-xs font-bold truncate">🔗 {s.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop: vertical layout (original) */}
                    <div className="hidden md:block">
                      <div className="absolute top-3 left-4">
                        <span className={`${style.badge} px-2 py-0.5 rounded-full text-xs font-bold`}>
                          {style.badgeLabel}
                        </span>
                      </div>
                      <div className="absolute top-3 right-4">
                        <span className={`${RARITY_BADGE[option.rarity] ?? 'bg-gray-500 text-white'} px-2 py-0.5 rounded-full text-xs font-bold uppercase`}>
                          {option.rarity}
                        </span>
                      </div>
                      <div className="flex flex-col items-center mt-6 mb-4">
                        <motion.div whileHover={{ scale: 1.2, rotate: 5 }} transition={{ duration: 0.3 }} className="text-6xl mb-3">
                          {option.icon}
                        </motion.div>
                        {option.category === 'upgrade' ? (
                          <div className="text-center">
                            <div className="text-gray-400 text-sm line-through">{option.upgradeFrom}</div>
                            <div className="text-white font-bold text-xl flex items-center gap-1 justify-center">
                              <span className="text-emerald-300">→</span>{option.name}
                            </div>
                          </div>
                        ) : (
                          <h3 className="text-xl font-bold text-white text-center">{option.name}</h3>
                        )}
                      </div>
                      <p className="text-gray-200 text-center text-sm leading-relaxed mb-1">{option.description}</p>
                      {getOptionDynamicHint(option, (activeRelics ?? []).length) && (
                        <p className="text-amber-300 text-center text-xs font-semibold mb-4">{getOptionDynamicHint(option, (activeRelics ?? []).length)}</p>
                      )}
                      {option.category === 'item' && option.duration > 0 && (
                        <div className="bg-black/30 rounded-lg p-2 text-center">
                          <span className="text-yellow-300 text-xs font-semibold">⏱️ {option.duration} {option.duration === 1 ? 'Runde' : 'Runden'}</span>
                        </div>
                      )}
                      {option.category === 'item' && option.duration === -1 && (
                        <div className="bg-black/30 rounded-lg p-2 text-center">
                          <span className="text-green-300 text-xs font-semibold">♾️ Permanent</span>
                        </div>
                      )}
                      {option.category === 'relic' && (
                        <div className="bg-black/30 rounded-lg p-2 text-center">
                          <span className="text-amber-300 text-xs font-semibold">♾️ Permanent (ganzer Run)</span>
                        </div>
                      )}
                      {newSynergies.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + 0.1 * index }} className="mt-3 flex flex-col gap-1">
                          {newSynergies.map(s => (
                            <div key={s.id} className="flex items-center gap-1.5 bg-teal-500/20 border border-teal-400/60 rounded-lg px-2 py-1">
                              <span className="text-base leading-none">{s.icon}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-teal-200 text-xs font-bold">🔗 Aktiviert: {s.name}</span>
                                <p className="text-teal-300/70 text-xs truncate">{s.description}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    {/* Hover-Glow */}
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/10" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-gray-400 text-xs sm:text-sm mt-3 sm:mt-8"
            >
              💡 Relics sind permanent — Items sind temporäre Perks.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
