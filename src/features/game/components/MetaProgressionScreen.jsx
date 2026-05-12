import { useState } from 'react';
import { motion } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';
import { ASCENSION_LEVELS, MODIFIER_LABELS } from '../hooks/useAscension';

const CATEGORY_ICONS = {
  Survivalist: { icon: 'heart', color: 'red' },
  Scholar:     { icon: 'brain', color: 'purple' },
  Collector:   { icon: 'chest', color: 'amber' },
  Merchant:    { icon: 'coin',  color: 'amber' },
  Kits:        { icon: 'bag',   color: 'teal' },
  Ascension:   { icon: 'star',  color: 'purple' },
};

export default function MetaProgressionScreen({
  crystals, upgrades, upgradeDefs, onBuy, onBack,
  kitDefs = [], ownedKits = {}, selectedKit = null, onBuyKit, onSelectKit,
  ascensionLevel = 0, maxUnlockedLevel = 0,
}) {
  const categories = [...new Set(upgradeDefs.map(d => d.category)), 'Kits', 'Ascension'];
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredDefs = upgradeDefs.filter(d => d.category === activeCategory);

  const currentAscDef = ASCENSION_LEVELS.find(a => a.level === ascensionLevel);
  const nextAscDef = ASCENSION_LEVELS.find(a => a.level === ascensionLevel + 1);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-2xl mx-auto p-4 flex flex-col min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-y-2 gap-x-3">
          <div>
            <h2 className="text-2xl font-black text-amber-300 tracking-wide">Meta Progression</h2>
            <p className="text-indigo-300/60 text-xs mt-0.5">Permanent upgrades that carry over between runs</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="inline-flex items-center gap-1.5 bg-[#111827] border-2 border-purple-500 rounded-sm px-3 py-1.5">
              <GameIcon name="gem" size={16} color="purple" />
              <span className="text-purple-300 font-black">{crystals}</span>
              <span className="text-purple-300/60 text-xs">crystals</span>
            </div>
            <button
              onClick={onBack}
              className="bg-slate-700 hover:bg-slate-600 border-2 border-slate-500 px-3 py-1.5 text-sm text-white rounded-sm transition shadow-pixel-sm"
            >
              Back
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map(cat => {
            const ci = CATEGORY_ICONS[cat] ?? { icon: 'star', color: 'amber' };
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold border-2 transition rounded-sm
                  ${activeCategory === cat
                    ? cat === 'Ascension' ? 'bg-purple-700 border-purple-400 text-white' : 'bg-amber-600 border-amber-400 text-white'
                    : 'bg-slate-800 border-slate-600 text-white/60 hover:bg-slate-700'}`}
              >
                <GameIcon name={ci.icon} size={14} color={activeCategory === cat ? 'white' : ci.color} />
                {cat}
                {cat === 'Ascension' && ascensionLevel > 0 && (
                  <span className="ml-0.5 text-xs bg-purple-500/40 border border-purple-400/40 px-1 rounded-sm">{ascensionLevel}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Upgrade cards */}
        {activeCategory !== 'Ascension' && (
          <div className="flex flex-col gap-3">
            {filteredDefs.map(def => {
              const owned = upgrades?.[def.id] ?? 0;
              const isMaxed = owned >= def.max;
              const canAfford = crystals >= def.cost;
              return (
                <motion.div
                  key={def.id}
                  className={`border-2 p-4 rounded-sm ${isMaxed ? 'border-amber-500/60 bg-amber-900/10' : 'border-slate-600 bg-slate-900/40'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold text-sm">{def.name}</span>
                        {isMaxed && (
                          <span className="text-xs font-bold text-amber-400 border border-amber-500/40 px-1.5 rounded-sm">Owned</span>
                        )}
                        {!isMaxed && owned > 0 && (
                          <span className="text-xs text-indigo-300/60">{owned}/{def.max}</span>
                        )}
                      </div>
                      <p className="text-indigo-300/70 text-xs">{def.description}</p>
                    </div>
                    {!isMaxed && (
                      <button
                        onClick={() => onBuy(def.id)}
                        disabled={!canAfford}
                        className={`shrink-0 inline-flex items-center gap-1 px-3 py-2 border-2 font-bold text-sm transition rounded-sm
                          ${canAfford
                            ? 'bg-purple-800 border-purple-500 text-white hover:bg-purple-700 active:scale-95'
                            : 'bg-slate-800 border-slate-600 text-white/30 cursor-not-allowed'}`}
                      >
                        <GameIcon name="gem" size={13} color={canAfford ? 'purple' : 'gray'} />
                        {def.cost}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Kits tab */}
        {activeCategory === 'Kits' && (
          <div className="flex flex-col gap-3">
            <p className="text-indigo-300/60 text-xs">Buy a kit to unlock it, then select one to use it in your next run. Only one kit can be active at a time.</p>
            {kitDefs.map(kit => {
              const isOwned = ownedKits?.[kit.id];
              const isSelected = selectedKit === kit.id;
              const canAfford = crystals >= kit.cost;
              return (
                <motion.div
                  key={kit.id}
                  className={`border-2 p-4 rounded-sm transition ${
                    isSelected ? 'border-teal-400 bg-teal-900/20' :
                    isOwned ? 'border-slate-500 bg-slate-900/30' :
                    'border-slate-700 bg-slate-900/20'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-bold text-sm">{kit.name}</span>
                        {isSelected && (
                          <span className="text-xs font-bold text-teal-300 border border-teal-400/40 px-1.5 rounded-sm">Active</span>
                        )}
                        {isOwned && !isSelected && (
                          <span className="text-xs text-green-300/70 border border-green-500/30 px-1.5 rounded-sm">Owned</span>
                        )}
                      </div>
                      <p className="text-indigo-300/70 text-xs mb-1.5">{kit.description}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-green-900/30 border border-green-500/30 text-green-300 text-xs px-1.5 py-0.5 rounded-sm">
                          {kit.startingPerkName}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-blue-900/30 border border-blue-500/30 text-blue-300 text-xs px-1.5 py-0.5 rounded-sm">
                          {kit.bonus}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-red-900/30 border border-red-500/30 text-red-300 text-xs px-1.5 py-0.5 rounded-sm">
                          {kit.penalty}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {!isOwned && (
                        <button
                          onClick={() => onBuyKit(kit.id)}
                          disabled={!canAfford}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 border-2 font-bold text-sm transition rounded-sm
                            ${canAfford
                              ? 'bg-purple-800 border-purple-500 text-white hover:bg-purple-700 active:scale-95'
                              : 'bg-slate-800 border-slate-600 text-white/30 cursor-not-allowed'}`}
                        >
                          <GameIcon name="gem" size={13} color={canAfford ? 'purple' : 'gray'} />
                          {kit.cost}
                        </button>
                      )}
                      {isOwned && !isSelected && (
                        <button
                          onClick={() => onSelectKit(kit.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border-2 font-bold text-sm bg-teal-800 border-teal-500 text-white hover:bg-teal-700 active:scale-95 transition rounded-sm"
                        >
                          Select
                        </button>
                      )}
                      {isSelected && (
                        <button
                          onClick={() => onSelectKit(null)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border-2 font-bold text-xs bg-slate-800 border-slate-600 text-white/50 hover:bg-slate-700 transition rounded-sm"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Ascension tab */}
        {activeCategory === 'Ascension' && (
          <div className="flex flex-col gap-4">
            {/* Current level banner */}
            <div className={`border-2 rounded-sm p-4 ${ascensionLevel === 0 ? 'border-slate-600 bg-slate-900/40' : 'border-purple-500/60 bg-purple-900/20'}`}>
              <div className="flex items-center gap-3 mb-2">
                <GameIcon name="star" size={20} color={ascensionLevel === 0 ? 'gray' : 'purple'} />
                <div>
                  <div className="text-white font-black text-lg">
                    {ascensionLevel === 0 ? 'Standard Mode' : `Ascension ${ascensionLevel} — ${currentAscDef?.name}`}
                  </div>
                  <div className="text-indigo-300/60 text-xs">
                    {ascensionLevel === 0
                      ? 'No ascension active. Defeat the Boss to unlock Ascension 1.'
                      : `Active modifiers for your next run`}
                  </div>
                </div>
                {ascensionLevel > 0 && (
                  <div className="ml-auto text-right">
                    <div className="text-purple-300 font-black text-sm">+{Math.round(currentAscDef.crystalBonus * 100)}%</div>
                    <div className="text-purple-300/60 text-xs">crystal bonus</div>
                  </div>
                )}
              </div>
              {ascensionLevel > 0 && currentAscDef && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(currentAscDef.modifiers).map(([key, val]) => (
                    <span key={key} className="inline-flex items-center gap-1 bg-red-900/40 border border-red-500/40 text-red-300 text-xs px-2 py-0.5 rounded-sm font-bold">
                      {MODIFIER_LABELS[key]?.(val)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Next level preview */}
            {nextAscDef && (
              <div className="border-2 border-indigo-500/40 bg-indigo-900/10 rounded-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GameIcon name="lock" size={16} color="blue" />
                  <span className="text-indigo-300 font-bold text-sm">Next: Ascension {nextAscDef.level} — {nextAscDef.name}</span>
                  <span className="ml-auto text-indigo-300/60 text-xs">Defeat Boss at current level</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(nextAscDef.modifiers).map(([key, val]) => (
                    <span key={key} className="inline-flex items-center gap-1 bg-slate-800/60 border border-slate-600/40 text-slate-300 text-xs px-2 py-0.5 rounded-sm">
                      {MODIFIER_LABELS[key]?.(val)}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 bg-purple-900/40 border border-purple-500/40 text-purple-300 text-xs px-2 py-0.5 rounded-sm font-bold">
                    +{Math.round(nextAscDef.crystalBonus * 100)}% crystals
                  </span>
                </div>
              </div>
            )}

            {ascensionLevel >= 10 && (
              <div className="border-2 border-amber-500/60 bg-amber-900/10 rounded-sm p-4 text-center">
                <GameIcon name="trophy" size={24} color="amber" />
                <div className="text-amber-300 font-black mt-2">Max Ascension Reached</div>
                <div className="text-amber-300/60 text-xs mt-1">You have conquered all ascension levels.</div>
              </div>
            )}

            {/* All levels overview */}
            <div className="flex flex-col gap-2">
              <div className="text-indigo-300/60 text-xs uppercase tracking-wider mb-1">All Levels</div>
              {ASCENSION_LEVELS.map(asc => {
                const isUnlocked = asc.level <= maxUnlockedLevel;
                const isCurrent = asc.level === ascensionLevel;
                return (
                  <div
                    key={asc.level}
                    className={`border rounded-sm px-3 py-2 flex items-center gap-3 ${
                      isCurrent ? 'border-purple-500/60 bg-purple-900/20' :
                      isUnlocked ? 'border-slate-600 bg-slate-900/30' :
                      'border-slate-700/40 bg-slate-900/10 opacity-50'
                    }`}
                  >
                    <div className="w-8 text-center">
                      {isUnlocked
                        ? <GameIcon name="star" size={14} color={isCurrent ? 'purple' : 'gray'} />
                        : <GameIcon name="lock" size={14} color="gray" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isCurrent ? 'text-purple-300' : isUnlocked ? 'text-white/80' : 'text-white/30'}`}>
                          {asc.level} — {asc.name}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-purple-500/40 border border-purple-400/40 text-purple-200 px-1.5 rounded-sm font-bold">Active</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {Object.entries(asc.modifiers).map(([key, val]) => (
                          <span key={key} className="text-xs text-red-300/70">{MODIFIER_LABELS[key]?.(val)}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xs font-bold ${isCurrent ? 'text-purple-300' : isUnlocked ? 'text-purple-300/60' : 'text-white/20'}`}>
                        +{Math.round(asc.crystalBonus * 100)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-indigo-300/40 text-xs">
          Crystals are earned per stage cleared (1–4 crystals). Defeat the Boss for 5 base crystals. Ascension multiplies all crystal rewards.
        </div>
      </div>
    </motion.div>
  );
}
