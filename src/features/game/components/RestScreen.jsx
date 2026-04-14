import { motion } from 'framer-motion';
import { GAME_CONFIG } from '../../../shared/utils/constants';

export default function RestScreen({ lives, maxLives = GAME_CONFIG.INITIAL_LIVES, activePerks = [], onRest, onUpgradePerk }) {
  const upgradablePerks = activePerks.filter(p => p.duration > 0);
  const canHeal = lives < maxLives;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-sm mx-4 rounded-2xl border border-green-400/40 bg-gradient-to-b from-slate-900 to-green-950 shadow-2xl p-6"
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 30 }}
        transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      >
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🔥</div>
          <h2 className="text-2xl font-black text-green-300">Rest Site</h2>
          <p className="text-indigo-300/70 text-sm mt-1">Recover or strengthen a perk</p>
        </div>

        {/* Current lives */}
        <div className="flex justify-center gap-1 mb-5">
          {Array.from({ length: maxLives }).map((_, i) => (
            <span key={i} className="text-xl">{i < lives ? '❤️' : '🖤'}</span>
          ))}
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {/* Rest: +2 lives */}
          <motion.button
            onClick={onRest}
            disabled={!canHeal}
            className={`w-full py-4 rounded-xl border font-bold text-base transition-all
              ${canHeal
                ? 'border-green-400/60 bg-green-900/30 hover:bg-green-800/50 text-green-200'
                : 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed'}`}
            whileHover={canHeal ? { scale: 1.02 } : {}}
            whileTap={canHeal ? { scale: 0.98 } : {}}
          >
            <div className="text-2xl mb-1">❤️❤️</div>
            <div>Rest</div>
            <div className="text-sm font-normal opacity-70">+2 lives (max {maxLives})</div>
            {!canHeal && <div className="text-xs text-red-300 mt-1">Already at full health</div>}
          </motion.button>

          {/* Upgrade perk */}
          {upgradablePerks.length > 0 ? (
            <div>
              <div className="text-indigo-300 text-xs font-bold mb-2 uppercase tracking-widest">Or upgrade a perk:</div>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {upgradablePerks.map(perk => (
                  <motion.button
                    key={perk.id}
                    onClick={() => onUpgradePerk(perk)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-amber-400/40 bg-amber-900/20 hover:bg-amber-800/30 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{perk.icon ?? '✨'}</span>
                      <div>
                        <div className="text-amber-200 font-bold text-sm">{perk.name}</div>
                        <div className="text-indigo-300/70 text-xs">+{perk.bonusDuration ?? perk.duration ?? 2} rounds duration</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-white/30 text-sm py-2">No upgradable perks active</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
