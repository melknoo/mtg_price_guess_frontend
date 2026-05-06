import { useState } from 'react';
import { motion } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';

const CATEGORY_ICONS = {
  Survivalist: { icon: 'heart', color: 'red' },
  Scholar:     { icon: 'brain', color: 'purple' },
  Collector:   { icon: 'chest', color: 'amber' },
  Merchant:    { icon: 'coin',  color: 'amber' },
};

export default function MetaProgressionScreen({ crystals, upgrades, upgradeDefs, onBuy, onBack }) {
  const [activeCategory, setActiveCategory] = useState('Survivalist');
  const categories = [...new Set(upgradeDefs.map(d => d.category))];

  const filteredDefs = upgradeDefs.filter(d => d.category === activeCategory);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-2xl mx-auto p-4 flex flex-col min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-amber-300 tracking-wide">Meta Progression</h2>
            <p className="text-indigo-300/60 text-xs mt-0.5">Permanent upgrades that carry over between runs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 bg-[#111827] border-2 border-purple-500 rounded-sm px-3 py-1.5">
              <GameIcon name="gem" size={16} color="purple" />
              <span className="text-purple-300 font-black">{crystals}</span>
              <span className="text-purple-300/60 text-xs">crystals</span>
            </div>
            <button
              onClick={onBack}
              className="bg-slate-700 hover:bg-slate-600 border-2 border-slate-500 px-3 py-1.5 text-sm text-white rounded-sm transition"
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
                    ? 'bg-amber-600 border-amber-400 text-white'
                    : 'bg-slate-800 border-slate-600 text-white/60 hover:bg-slate-700'}`}
              >
                <GameIcon name={ci.icon} size={14} color={activeCategory === cat ? 'white' : ci.color} />
                {cat}
              </button>
            );
          })}
        </div>

        {/* Upgrade cards */}
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

        <div className="mt-6 text-center text-indigo-300/40 text-xs">
          Crystals are earned by completing runs. Defeat the Boss for bonus crystals.
        </div>
      </div>
    </motion.div>
  );
}
