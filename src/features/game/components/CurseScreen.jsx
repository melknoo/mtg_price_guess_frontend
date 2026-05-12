import { useMemo } from 'react';
import { motion } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';
import { PERKS } from '../constants/perkDefinitions';

const CURSE_PERK_IDS = [
  'curse_fragile_mind',
  'curse_gold_debt',
  'curse_foggy',
  'curse_slow_bleed',
  'curse_amnesia',
];

function pickRandomCursePerk() {
  const pool = CURSE_PERK_IDS
    .map(id => Object.values(PERKS).find(p => p.id === id))
    .filter(Boolean);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function CurseScreen({ gold, onTake, onSkip }) {
  const cursePerk = useMemo(() => pickRandomCursePerk(), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cursePerk) return null;

  const rewardGold = cursePerk.curseRewardGold ?? 40;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/40 border-2 border-red-500/60 mb-4">
            <GameIcon name="skull" size={32} color="red" />
          </div>
          <h2 className="text-3xl font-black text-red-300 tracking-wide">Curse</h2>
          <p className="text-red-300/60 text-sm mt-1">Accept a curse for immediate rewards</p>
        </div>

        {/* Curse card */}
        <div className="border-2 border-red-500/60 bg-red-900/10 rounded-sm p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-sm bg-red-900/40 border border-red-500/40 flex items-center justify-center shrink-0">
              <GameIcon name="skull" size={20} color="red" />
            </div>
            <div>
              <div className="text-white font-black text-base">{cursePerk.name}</div>
              <p className="text-red-300/80 text-sm mt-0.5">{cursePerk.description}</p>
            </div>
          </div>

          {/* Reward preview */}
          <div className="border-t border-red-500/20 pt-3">
            <div className="text-red-300/60 text-xs uppercase tracking-wider mb-2">Reward for accepting</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <GameIcon name="coin" size={16} color="amber" />
                <span className="text-amber-300 font-black">+{rewardGold}G</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GameIcon name="gem" size={16} color="purple" />
                <span className="text-purple-300 font-bold text-sm">Free Relic Pick</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onTake(cursePerk)}
            className="flex-1 py-3 px-4 bg-red-800 border-2 border-red-500 text-white font-black text-base hover:bg-red-700 active:scale-95 transition rounded-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <GameIcon name="skull" size={16} color="white" />
              Accept Curse
            </div>
          </button>
          <button
            onClick={onSkip}
            className="flex-1 py-3 px-4 bg-slate-700 border-2 border-slate-500 text-white/70 font-bold text-base hover:bg-slate-600 active:scale-95 transition rounded-sm"
          >
            Skip
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          Curse perks bypass perk slots and persist for the rest of the run.
        </p>
      </div>
    </motion.div>
  );
}
