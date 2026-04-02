import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';
import { FILTER_EFFECTS } from '../constants/perkDefinitions';

const getCMCKey = (value) => {
  if (!value || typeof value !== 'object') return null;
  if (value.operator === '<=') return 'low';
  if (value.operator === 'between') return 'mid';
  if (value.operator === '>=') return 'high';
  return null;
};

const COLORS = [
  { key: 'W', label: 'White',     dot: 'bg-yellow-50 border border-gray-400' },
  { key: 'U', label: 'Blue',      dot: 'bg-blue-500' },
  { key: 'B', label: 'Black',     dot: 'bg-gray-900 border border-gray-500' },
  { key: 'R', label: 'Red',       dot: 'bg-red-500' },
  { key: 'G', label: 'Green',     dot: 'bg-green-500' },
  { key: 'multicolor', label: 'Multi',    dot: 'bg-gradient-to-r from-red-400 via-yellow-300 to-blue-400' },
  { key: 'colorless',  label: 'Colorless', dot: 'bg-gray-500' },
];

const RARITIES = [
  { key: 'common',   label: 'Common' },
  { key: 'uncommon', label: 'Uncommon' },
  { key: 'rare',     label: 'Rare' },
  { key: 'mythic',   label: 'Mythic' },
];

const CMC_RANGES = [
  { key: 'low',  label: 'CMC ≤ 3' },
  { key: 'mid',  label: 'CMC 4–6' },
  { key: 'high', label: 'CMC ≥ 7' },
];

const TYPES = [
  { key: 'creature',             label: 'Creature' },
  { key: 'instant_sorcery',      label: 'Inst. / Sorc.' },
  { key: 'artifact_enchantment', label: 'Art. / Ench.' },
  { key: 'land',                 label: 'Land' },
];

const BORDERS = [
  { key: 'black', label: 'Black' },
  { key: 'white', label: 'White' },
];

function StatusBadge({ status, boostPercent }) {
  if (status === 'banned') {
    return (
      <span className="shrink-0 text-red-500 font-bold text-sm leading-none" title="Excluded — cannot appear">
        ✕
      </span>
    );
  }
  if (status === 'boost') {
    return (
      <span className="shrink-0 text-xs font-bold text-green-300 bg-green-950/60 border border-green-600/50 px-1.5 py-0.5 rounded leading-none">
        +{boostPercent}%
      </span>
    );
  }
  return <span className="shrink-0 text-xs text-gray-700">—</span>;
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <GameIcon name={icon} size={12} color="gray" />
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
    </div>
  );
}

export default function FilterOddsModal({ show, onClose, activeBoosts = [], activeFilters = {} }) {
  // Boosts per category
  const colorBoostMap = {};
  const cmcBoostMap   = {};
  const rarityBoostMap = {};
  const borderBoostMap = {};
  const typeBoostMap   = {};

  activeBoosts.forEach(b => {
    const pct = b.boostPercent || 40;
    switch (b.effect) {
      case FILTER_EFFECTS.COLOR_BOOST:
        colorBoostMap[b.value] = pct;
        break;
      case FILTER_EFFECTS.CMC_BOOST: {
        const k = getCMCKey(b.value);
        if (k) cmcBoostMap[k] = pct;
        break;
      }
      case FILTER_EFFECTS.RARITY_BOOST:
        rarityBoostMap[b.value] = pct;
        break;
      case FILTER_EFFECTS.BORDER_BOOST:
        borderBoostMap[b.value] = pct;
        break;
      case FILTER_EFFECTS.TYPE_BOOST:
        typeBoostMap[b.value] = pct;
        break;
      default: break;
    }
  });

  const getStatus = (boostMap, excludeValue, key) => {
    if (excludeValue === key) return { status: 'banned' };
    if (boostMap[key])        return { status: 'boost', boostPercent: boostMap[key] };
    return { status: 'normal' };
  };

  const hasAnyFilter = activeBoosts.length > 0 || Object.keys(activeFilters).length > 0;

  const borderBoostsActive = Object.keys(borderBoostMap).length > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <GameIcon name="magnifier" size={16} color="amber" />
                <span className="text-base font-bold text-white">Card Pool</span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors text-lg leading-none px-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              {hasAnyFilter ? 'Active filter perks affect which cards appear.' : 'All cards appear with equal probability.'}
            </p>

            <div className="space-y-4 overflow-y-auto max-h-[65vh] pr-1">

              {/* Color */}
              <div>
                <SectionHeader icon="color_correction" title="Color" />
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {COLORS.map(({ key, label, dot }) => {
                    const { status, boostPercent } = getStatus(colorBoostMap, activeFilters.color_exclude, key);
                    return (
                      <div key={key} className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`shrink-0 w-3 h-3 rounded-sm ${dot}`} />
                          <span className={`text-sm truncate ${status === 'normal' ? 'text-gray-500' : 'text-gray-200'}`}>
                            {label}
                          </span>
                        </div>
                        <StatusBadge status={status} boostPercent={boostPercent} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-800" />

              {/* Rarity */}
              <div>
                <SectionHeader icon="star" title="Rarity" />
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {RARITIES.map(({ key, label }) => {
                    const { status, boostPercent } = getStatus(rarityBoostMap, activeFilters.rarity_exclude, key);
                    return (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${status === 'normal' ? 'text-gray-500' : 'text-gray-200'}`}>
                          {label}
                        </span>
                        <StatusBadge status={status} boostPercent={boostPercent} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-800" />

              {/* CMC */}
              <div>
                <SectionHeader icon="coin" title="Mana Cost" />
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {CMC_RANGES.map(({ key, label }) => {
                    const { status, boostPercent } = getStatus(cmcBoostMap, activeFilters.cmc_exclude, key);
                    return (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${status === 'normal' ? 'text-gray-500' : 'text-gray-200'}`}>
                          {label}
                        </span>
                        <StatusBadge status={status} boostPercent={boostPercent} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-800" />

              {/* Card Type */}
              <div>
                <SectionHeader icon="card" title="Card Type" />
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {TYPES.map(({ key, label }) => {
                    const { status, boostPercent } = getStatus(typeBoostMap, activeFilters.type_exclude, key);
                    return (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${status === 'normal' ? 'text-gray-500' : 'text-gray-200'}`}>
                          {label}
                        </span>
                        <StatusBadge status={status} boostPercent={boostPercent} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Border — nur anzeigen wenn aktive Border-Boosts vorhanden */}
              {borderBoostsActive && (
                <>
                  <div className="border-t border-gray-800" />
                  <div>
                    <SectionHeader icon="square" title="Border" />
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {BORDERS.map(({ key, label }) => {
                        const { status, boostPercent } = getStatus(borderBoostMap, null, key);
                        return (
                          <div key={key} className="flex items-center justify-between gap-2">
                            <span className={`text-sm ${status === 'normal' ? 'text-gray-500' : 'text-gray-200'}`}>
                              {label}
                            </span>
                            <StatusBadge status={status} boostPercent={boostPercent} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {activeBoosts.length > 1 && (
                <p className="text-gray-700 text-xs text-center pt-1 pb-1">
                  Multiple boosts stack multiplicatively
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
