import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RELICS, RELIC_RARITY_WEIGHTS } from '../constants/relicDefinitions';
import { PERKS, PERK_RARITY, getExtendedVersion } from '../constants/perkDefinitions';
import { SYNERGIES } from '../constants/synergyDefinitions';
import GameIcon from '../../../shared/components/GameIcon';
import TagIcons from '../../../shared/components/TagIcons';
import { ITEM_ICONS } from '../../../shared/constants/itemIconMap';

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

// Relic-Selection: Nur Relics zur Wahl (alle 10 Runden)
function generateRelicMilestoneOptions(activeRelics, hasForture = false) {
  const usedIds = new Set();
  const options = [];

  const allRelics = Object.values(RELICS);
  const ownedRelicIds = new Set(activeRelics.map(r => r.id));

  const pickRelic = () => {
    const excludeIds = new Set([...ownedRelicIds, ...usedIds]);
    const pick = weightedRandomPick(allRelics, RELIC_RARITY_WEIGHTS, excludeIds);
    if (pick) {
      options.push({ ...pick, category: 'relic' });
      usedIds.add(pick.id);
    }
  };

  pickRelic();
  pickRelic();
  pickRelic();

  if (hasForture) pickRelic();

  return options;
}

// Normaler Level-Up: 3x Perk/Upgrade, kein Relic
function generateNormalOptions(activeRelics, activePerks, hasForture = false) {
  const usedIds = new Set();
  const options = [];

  const activePerkIds = new Set(activePerks.map(p => p.id));
  const itemCandidates = Object.values(PERKS).filter(p =>
    p.type !== 'filter' &&
    !p.isExtended &&
    (!activePerkIds.has(p.id) || p.stackable)
  );
  const perkWeights = {
    [PERK_RARITY.COMMON]: 50,
    [PERK_RARITY.RARE]: 30,
    [PERK_RARITY.EPIC]: 15,
  };

  const pickPerk = () => {
    const pick = weightedRandomPick(itemCandidates, perkWeights, usedIds);
    if (pick) {
      options.push({ ...pick, category: 'item' });
      usedIds.add(pick.id);
    }
  };

  // --- Slot 1: Perk ---
  pickPerk();

  // --- Slot 2: Perk oder Upgrade ---
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
    pickPerk();
  }

  // --- Slot 3: weiterer Perk oder Upgrade ---
  const remainingUpgrades = activePerks
    .filter(p => !p.isExtended && !usedIds.has(getExtendedVersion(p.id)?.id))
    .map(p => {
      const ext = getExtendedVersion(p.id);
      return ext && !usedIds.has(ext.id) ? { ...ext, upgradeFrom: p.name, category: 'upgrade' } : null;
    })
    .filter(Boolean);

  if (remainingUpgrades.length > 0) {
    const upgradePick = remainingUpgrades[Math.floor(Math.random() * remainingUpgrades.length)];
    options.push(upgradePick);
    usedIds.add(upgradePick.id);
  } else {
    pickPerk();
  }

  // --- Slot 4 (Fortune-Synergy): Extra Perk ---
  if (hasForture) pickPerk();

  return options;
}

// Berechnet welche neuen Synergien durch die Wahl dieser Option aktiviert würden
function getNewSynergiesForOption(option, activeRelics, activePerks, activeSynergies, maxSynergySlots) {
  const availableSlots = Math.max(0, maxSynergySlots - activeSynergies.length);
  if (availableSlots === 0) return [];

  const activeIds = new Set(activeSynergies.map(s => s.id));

  // Tag-Counts OHNE die neue Option
  const tagCounts = {};
  [...activeRelics, ...activePerks].forEach(item => {
    (item.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Tag-Counts MIT der neuen Option
  const newTagCounts = { ...tagCounts };
  (option.tags || []).forEach(tag => {
    newTagCounts[tag] = (newTagCounts[tag] || 0) + 1;
  });

  // Nur Synergien zeigen die:
  // 1. Noch nicht aktiv sind
  // 2. Ohne die neue Option NICHT erfüllt waren (sonst wären sie schon im Engine-Queue)
  // 3. Mit der neuen Option erfüllt wären (die Option ist der ausschlaggebende Pick)
  const newSynergies = Object.values(SYNERGIES).filter(synergy => {
    if (activeIds.has(synergy.id)) return false;
    const alreadySatisfied = Object.entries(synergy.requiredTags).every(
      ([tag, req]) => (tagCounts[tag] || 0) >= req
    );
    if (alreadySatisfied) return false;
    return Object.entries(synergy.requiredTags).every(
      ([tag, req]) => (newTagCounts[tag] || 0) >= req
    );
  });

  // Auf freie Slots begrenzen
  return newSynergies.slice(0, availableSlots);
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

// Rarity → Hintergrundfarbe, Borderfarbe, Glow, Rarity-Badge
const RARITY_STYLES = {
  common:    { gradient: 'bg-[#111827]',  borderColor: 'border-gray-500',   glow: 'group-hover:brightness-110', badge: 'bg-gray-500 text-white' },
  rare:      { gradient: 'bg-[#0c1a3a]',  borderColor: 'border-blue-500',   glow: 'group-hover:brightness-110', badge: 'bg-blue-500 text-white' },
  epic:      { gradient: 'bg-[#1a0a2e]',  borderColor: 'border-purple-500', glow: 'group-hover:brightness-110', badge: 'bg-purple-500 text-white' },
  legendary: { gradient: 'bg-[#1a1500]',  borderColor: 'border-yellow-500', glow: 'group-hover:brightness-110', badge: 'bg-yellow-500 text-black' },
};

// Kategorie → Borderbreite + Badge-Style
const CATEGORY_STYLES = {
  relic:   { borderWidth: 'border-4', badgeStyle: 'bg-amber-500/20 border border-amber-400/40' },
  item:    { borderWidth: 'border-2', badgeStyle: 'bg-blue-500/20 border border-blue-400/40' },
  upgrade: { borderWidth: 'border-2', badgeStyle: 'bg-emerald-500/20 border border-emerald-400/40' },
};


// RELIC_FREE_CAP: ab dieser Anzahl aktiver Relics kostet jedes weitere 25 Gold
const RELIC_FREE_CAP = 6;
const RELIC_EXTRA_COST = 25;

export default function LevelUpModal({ show, newLevel, activeRelics, activePerks, activeSynergies = [], maxSynergySlots = 3, onSelect, forceRelicMode = false, onSkip, onReroll, gold = 0, rerollKey = 0 }) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (show) setIsMinimized(false);
  }, [show]);

  const hasFortune = activeSynergies.some(s => s.effect === 'extra_pick_option');
  const isRelicMilestone = forceRelicMode;

  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (show) {
      setOptions(
        isRelicMilestone
          ? generateRelicMilestoneOptions(activeRelics ?? [], hasFortune)
          : generateNormalOptions(activeRelics ?? [], activePerks ?? [], hasFortune)
      );
    } else {
      setOptions([]);
    }
  // Only re-generate when show turns true or rerollKey changes (explicit reroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, rerollKey]);

  if (!show || options.length === 0) return null;

  return (
    <>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsMinimized(prev => !prev)}
          className="fixed bottom-12 right-4 z-[60] bg-black/80 text-white text-sm px-4 py-2 rounded-sm border-2 border-[#2d3a5c] shadow-pixel hover:bg-black/70 transition"
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
          className={`fixed inset-0 flex items-start justify-center z-50 overflow-y-auto ${isRelicMilestone ? 'bg-amber-950/75' : 'bg-black/75'}`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="max-w-5xl w-full p-3 sm:p-6 my-auto"
          >
            {/* Header */}
            <div className="text-center mb-3 sm:mb-8 bg-black/50 rounded-xl py-3 px-4 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="inline-block mb-1 sm:mb-3"
              >
                {isRelicMilestone
                  ? <GameIcon name="gem" color="amber" size={52} />
                  : <GameIcon name="star" color="white" size={44} />
                }
              </motion.div>
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`text-xl sm:text-4xl font-bold mb-1 ${isRelicMilestone ? 'text-yellow-200' : 'text-amber-300'}`}
              >
                {isRelicMilestone ? 'Relic Selection!' : `Level Up! — Level ${newLevel}`}
              </motion.h2>
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-300 text-sm sm:text-lg"
              >
                {isRelicMilestone ? 'Choose a permanent relic for your run!' : 'Choose a reward!'}
              </motion.p>
            </div>

            {/* Option Cards */}
            <div className={`grid grid-cols-1 gap-2 sm:gap-6 ${(hasFortune) ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              {options.map((option, index) => {
                const rStyle = RARITY_STYLES[option.rarity] ?? RARITY_STYLES.common;
                const cStyle = CATEGORY_STYLES[option.category] ?? CATEGORY_STYLES.item;
                const newSynergies = getNewSynergiesForOption(option, activeRelics ?? [], activePerks ?? [], activeSynergies, maxSynergySlots);
                const isRelicOverCap = option.category === 'relic' && (activeRelics ?? []).length >= RELIC_FREE_CAP;
                const cantAfford = isRelicOverCap && gold < RELIC_EXTRA_COST;
                return (
                  <motion.div
                    key={option.id + option.category}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: cantAfford ? 0.5 : 1 }}
                    transition={{ delay: 0.08 * index }}
                    whileHover={cantAfford ? {} : { scale: 1.02, y: -4 }}
                    whileTap={cantAfford ? {} : { scale: 0.97 }}
                    onClick={() => !cantAfford && onSelect(option)}
                    className={`
                      relative group overflow-hidden pixel-scanlines
                      ${cantAfford ? 'cursor-not-allowed' : 'cursor-pointer'}
                      ${rStyle.gradient}
                      ${cStyle.borderWidth} ${isRelicMilestone ? 'border-amber-400' : rStyle.borderColor} rounded-sm
                      p-3 sm:p-6
                      shadow-pixel transition-all duration-200
                      ${cantAfford ? '' : rStyle.glow}
                    `}
                  >
                    {/* Relic: diagonales Muster-Overlay */}
                    {isRelicMilestone && (
                      <div
                        className="absolute inset-0 pointer-events-none rounded-sm"
                        style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(251,191,36,0.07) 0px, rgba(251,191,36,0.07) 1px, transparent 1px, transparent 9px)' }}
                      />
                    )}
                    {/* Relic: pulsierender innerer Glow-Ring */}
                    {isRelicMilestone && (
                      <motion.div
                        className="absolute inset-0 rounded-sm pointer-events-none"
                        animate={{ opacity: [0.35, 0.7, 0.35] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', delay: index * 0.3 }}
                        style={{ boxShadow: 'inset 0 0 18px rgba(251,191,36,0.35)' }}
                      />
                    )}
                    {/* Relic: Gem-Wasserzeichen */}
                    {isRelicMilestone && (
                      <div className="absolute bottom-1 right-1 sm:bottom-3 sm:right-3 opacity-[0.07] pointer-events-none">
                        <GameIcon name="gem" size={64} color="amber" />
                      </div>
                    )}
                    {/* Mobile: horizontal layout */}
                    <div className="flex items-center gap-3 md:hidden">
                      <div className="shrink-0 w-10 h-10 flex items-center justify-center">
                        {ITEM_ICONS[option.id]
                          ? <GameIcon name={ITEM_ICONS[option.id].icon} color={ITEM_ICONS[option.id].color} size={36} />
                          : <span className="text-4xl">{option.icon}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <TagIcons tags={option.tags ?? []} size={16} />
                          <span className={`${rStyle.badge} px-1.5 py-0.5 rounded-sm text-xs font-bold uppercase`}>
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
                        <div className="mt-1 flex flex-wrap gap-1">
                          {option.category === 'item' && option.duration > 0 && (
                            <span className="inline-flex items-center gap-1 text-yellow-300 text-xs"><GameIcon name="time" color="amber" size={11} /> {option.duration} Runden</span>
                          )}
                          {option.category === 'item' && option.duration === -1 && (
                            <span className="inline-flex items-center gap-1 text-green-300 text-xs"><GameIcon name="ring" color="green" size={11} /> Permanent</span>
                          )}
                          {option.category === 'relic' && (
                            <span className="inline-flex items-center gap-1 text-amber-300 text-xs"><GameIcon name="ring" color="amber" size={11} /> Ganzer Run</span>
                          )}
                          {option.category === 'relic' && (activeRelics ?? []).length >= RELIC_FREE_CAP && (
                            <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1 rounded-sm border ${gold >= RELIC_EXTRA_COST ? 'text-yellow-300 border-yellow-600 bg-yellow-900/30' : 'text-red-400 border-red-700 bg-red-900/30'}`}>
                              <GameIcon name="coin" color={gold >= RELIC_EXTRA_COST ? 'amber' : 'red'} size={10} /> {RELIC_EXTRA_COST}
                            </span>
                          )}
                        </div>
                        {newSynergies.length > 0 && (
                          <div className="mt-1.5 flex flex-col gap-1">
                            {newSynergies.map(s => (
                              <div key={s.id} className="flex items-center gap-1 bg-teal-500/20 border border-teal-400/60 rounded-sm px-1.5 py-0.5">
                                {ITEM_ICONS[s.id]
                                  ? <GameIcon name={ITEM_ICONS[s.id].icon} color={ITEM_ICONS[s.id].color} size={14} />
                                  : <span className="text-sm leading-none">{s.icon}</span>}
                                <span className="inline-flex items-center gap-1 text-teal-200 text-xs font-bold truncate"><GameIcon name="follow" color="teal" size={11} /> {s.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop: vertical layout (original) */}
                    <div className="hidden md:block">
                      <div className="absolute top-3 left-4 flex gap-1">
                        <TagIcons tags={option.tags ?? []} size={16} />
                      </div>
                      <div className="absolute top-3 right-4">
                        <span className={`${rStyle.badge} px-2 py-0.5 rounded-sm text-xs font-bold uppercase`}>
                          {option.rarity}
                        </span>
                      </div>
                      <div className="flex flex-col items-center mt-6 mb-4">
                        <motion.div whileHover={{ scale: 1.2, rotate: 5 }} transition={{ duration: 0.3 }} className="mb-3 flex items-center justify-center w-16 h-16">
                          {ITEM_ICONS[option.id]
                            ? <GameIcon name={ITEM_ICONS[option.id].icon} color={ITEM_ICONS[option.id].color} size={36} />
                            : <span className="text-6xl">{option.icon}</span>}
                        </motion.div>
                        {option.category === 'upgrade' ? (
                          <div className="text-center">
                            <div className="text-gray-400 text-sm line-through">{option.upgradeFrom}</div>
                            <div className="text-white font-bold text-xl flex items-center gap-1 justify-center">
                              <span className="text-emerald-300">→</span>{option.name}
                            </div>
                          </div>
                        ) : (
                          <h3 className="text-xl font-bold text-white text-center break-words hyphens-auto">{option.name}</h3>
                        )}
                      </div>
                      <p className="text-gray-200 text-center text-sm leading-relaxed mb-1">{option.description}</p>
                      {getOptionDynamicHint(option, (activeRelics ?? []).length) && (
                        <p className="text-amber-300 text-center text-xs font-semibold mb-4">{getOptionDynamicHint(option, (activeRelics ?? []).length)}</p>
                      )}
                      {option.category === 'item' && option.duration > 0 && (
                        <div className="bg-black/30 rounded-sm p-2 text-center border border-white/10">
                          <span className="inline-flex items-center gap-1 text-yellow-300 text-xs font-semibold"><GameIcon name="time" color="amber" size={11} /> {option.duration} {option.duration === 1 ? 'Runde' : 'Runden'}</span>
                        </div>
                      )}
                      {option.category === 'item' && option.duration === -1 && (
                        <div className="bg-black/30 rounded-sm p-2 text-center border border-white/10">
                          <span className="inline-flex items-center gap-1 text-green-300 text-xs font-semibold"><GameIcon name="ring" color="green" size={11} /> Permanent</span>
                        </div>
                      )}
                      {option.category === 'relic' && (
                        <div className="bg-black/30 rounded-sm p-2 text-center border border-white/10 flex flex-col gap-1">
                          <span className="inline-flex items-center justify-center gap-1 text-amber-300 text-xs font-semibold"><GameIcon name="ring" color="amber" size={11} /> Permanent (ganzer Run)</span>
                          {(activeRelics ?? []).length >= RELIC_FREE_CAP && (
                            <span className={`inline-flex items-center justify-center gap-1 text-xs font-bold ${gold >= RELIC_EXTRA_COST ? 'text-yellow-300' : 'text-red-400'}`}>
                              <GameIcon name="coin" color={gold >= RELIC_EXTRA_COST ? 'amber' : 'red'} size={11} />
                              {gold >= RELIC_EXTRA_COST ? `Costs ${RELIC_EXTRA_COST} Gold` : `Need ${RELIC_EXTRA_COST} Gold (have ${gold})`}
                            </span>
                          )}
                        </div>
                      )}
                      {newSynergies.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + 0.1 * index }} className="mt-3 flex flex-col gap-1">
                          {newSynergies.map(s => (
                            <div key={s.id} className="flex items-center gap-1.5 bg-teal-500/20 border border-teal-400/60 rounded-sm px-2 py-1">
                              {ITEM_ICONS[s.id]
                                ? <GameIcon name={ITEM_ICONS[s.id].icon} color={ITEM_ICONS[s.id].color} size={16} />
                                : <span className="text-base leading-none">{s.icon}</span>}
                              <div className="flex-1 min-w-0">
                                <span className="inline-flex items-center gap-1 text-teal-200 text-xs font-bold"><GameIcon name="follow" color="teal" size={11} /> Aktiviert: {s.name}</span>
                                <p className="text-teal-300/70 text-xs truncate">{s.description}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    {/* Hover-Glow */}
                    <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="absolute inset-0 rounded-sm bg-white/10" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Skip / Reroll */}
            {(onSkip || onReroll) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-3 mt-4 sm:mt-6"
              >
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[#111827] border-2 border-[#2d3a5c] text-gray-300 text-sm hover:bg-[#1e293b] hover:text-white transition shadow-pixel-sm"
                  >
                    <GameIcon name="next" color="gray" size={14} />
                    Skip
                  </button>
                )}
                {onReroll && (
                  <button
                    onClick={onReroll}
                    disabled={gold < 15}
                    className={`flex items-center gap-2 px-4 py-2 rounded-sm border-2 text-sm transition shadow-pixel-sm
                      ${gold < 15
                        ? 'bg-[#111827] border-gray-700 text-gray-600 cursor-not-allowed'
                        : 'bg-yellow-950 border-yellow-700 text-yellow-300 hover:bg-yellow-900 hover:text-yellow-200'
                      }`}
                  >
                    <GameIcon name="reset" color={gold < 15 ? 'gray' : 'amber'} size={14} />
                    Reroll
                    <span className="flex items-center gap-1 text-xs opacity-80">
                      (<GameIcon name="coin" color={gold < 15 ? 'gray' : 'amber'} size={11} /> 15)
                    </span>
                  </button>
                )}
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4"
            >
              {isRelicMilestone
                ? <span className="inline-flex items-center gap-1"><GameIcon name="gem" color="amber" size={13} /> Relics are permanent bonuses for your entire run.</span>
                : <span className="inline-flex items-center gap-1"><GameIcon name="light_bulb" color="gray" size={13} /> Relics every 10 rounds — Items are temporary perks.</span>}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
