import { motion } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';

export default function RunCompleteModal({ gold, xp, level, onEndRun, onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative w-full max-w-sm mx-4 rounded-sm border-2 border-amber-500/60 bg-[#0d1117] shadow-pixel p-6 text-center"
      >
        {/* Hintergrund-Glow */}
        <div className="absolute inset-0 rounded-sm pointer-events-none"
          style={{ boxShadow: 'inset 0 0 40px rgba(251,191,36,0.12)' }} />

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
          className="flex justify-center mb-3"
        >
          <GameIcon name="star" color="amber" size={52} />
        </motion.div>

        <motion.h2
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-black text-amber-300 mb-1"
        >
          Run Complete!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-sm mb-4"
        >
          You defeated the Boss. What's next?
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex justify-center gap-6 mb-5 bg-white/5 rounded-sm py-3 border border-white/10"
        >
          <div className="flex flex-col items-center gap-1">
            <GameIcon name="coin" color="amber" size={20} />
            <span className="text-yellow-300 font-black text-lg">{gold}</span>
            <span className="text-gray-400 text-xs">Gold</span>
          </div>
          <div className="w-px bg-white/10 self-stretch" />
          <div className="flex flex-col items-center gap-1">
            <GameIcon name="star" color="purple" size={20} />
            <span className="text-purple-300 font-black text-lg">{xp}</span>
            <span className="text-gray-400 text-xs">XP</span>
          </div>
          <div className="w-px bg-white/10 self-stretch" />
          <div className="flex flex-col items-center gap-1">
            <GameIcon name="level" color="amber" size={20} />
            <span className="text-amber-300 font-black text-lg">{level}</span>
            <span className="text-gray-400 text-xs">Level</span>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-2"
        >
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-sm font-bold text-sm border-2 border-amber-500/60 bg-amber-900/30 hover:bg-amber-800/40 text-amber-200 transition-colors shadow-pixel-sm active:scale-95"
          >
            <span className="flex items-center justify-center gap-2">
              <GameIcon name="next" color="amber" size={14} />
              Continue (Endless Mode)
            </span>
            <span className="text-xs text-amber-400/60 font-normal block mt-0.5">Harder timer, tougher cards</span>
          </button>
          <button
            onClick={onEndRun}
            className="w-full py-2 rounded-sm font-bold text-sm border-2 border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors shadow-pixel-sm active:scale-95"
          >
            End Run
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
