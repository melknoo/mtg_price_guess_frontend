import { motion } from 'framer-motion';
import { EXCHANGE_RATES } from '../constants/mapDefinitions';
import GameIcon from '../../../shared/components/GameIcon';

const LEVEL_UP_COST = EXCHANGE_RATES[0].gold;  // 10G
const LEVEL_UP_XP   = EXCHANGE_RATES[0].xp;    // 25 XP

export default function ExchangeScreen({ gold, level, xp, xpToNextLevel, onExchange, onComplete }) {
  const canAfford = gold >= LEVEL_UP_COST;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-sm mx-4 border border-teal-400/40 bg-gradient-to-b from-slate-900 to-teal-950 shadow-2xl p-6"
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 30 }}
        transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      >
        <div className="text-center mb-5">
          <div className="mb-2"><GameIcon name="star" size={40} color="teal" /></div>
          <h2 className="text-2xl font-black text-teal-300">Exchange</h2>
          <p className="text-indigo-300/70 text-sm mt-1">Convert Gold into XP</p>
        </div>

        {/* Current level + XP */}
        <div className="mb-5 border border-teal-400/20 bg-teal-900/20 px-4 py-3 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-indigo-300/70 text-xs font-bold tracking-widest uppercase">Level</span>
            <span className="text-white font-black text-lg">{level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-indigo-300/70 text-xs font-bold tracking-widest uppercase">XP</span>
            <span className="text-purple-300 font-black text-sm">
              {xp} / {xpToNextLevel}
            </span>
          </div>
          {/* XP progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (xp / xpToNextLevel) * 100)}%` }}
            />
          </div>
        </div>

        {/* Gold available */}
        <div className="flex justify-center gap-1 mb-4">
          <span className="text-amber-300 font-black text-sm inline-flex items-center gap-1">
            <GameIcon name="coin" size={16} color="amber" /> {gold}G available
          </span>
        </div>

        {/* LEVEL UP button */}
        <motion.button
          onClick={() => canAfford && onExchange(LEVEL_UP_COST, LEVEL_UP_XP)}
          disabled={!canAfford}
          className={`w-full py-4 px-4 border font-black text-base tracking-widest transition-all flex items-center justify-between mb-3
            ${canAfford
              ? 'border-teal-400/60 bg-teal-900/30 hover:bg-teal-800/50 text-teal-200 cursor-pointer'
              : 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed'}`}
          whileHover={canAfford ? { scale: 1.02 } : {}}
          whileTap={canAfford ? { scale: 0.98 } : {}}
        >
          <span className="text-sm font-black tracking-widest">LEVEL UP</span>
          <span className="inline-flex items-center gap-1.5">
            <GameIcon name="coin" size={16} color={canAfford ? 'amber' : 'gray'} />
            <span className="text-sm">{LEVEL_UP_COST}G</span>
            <span className="text-indigo-300/60 text-xs font-normal">→</span>
            <GameIcon name="star" size={16} color={canAfford ? 'purple' : 'gray'} />
            <span className="text-sm">+{LEVEL_UP_XP} XP</span>
          </span>
        </motion.button>

        {/* Leave button */}
        <motion.button
          onClick={onComplete}
          className="w-full py-3 border border-indigo-400/40 bg-indigo-900/20 hover:bg-indigo-800/30 text-indigo-200 font-bold text-sm transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Leave
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
