import { motion, AnimatePresence } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';
import { ITEM_ICONS } from '../../../shared/constants/itemIconMap';

export default function ReplacePerkModal({ show, pendingPerk, replaceablePerks = [], onReplace, onCancel }) {
  if (!show || !pendingPerk) return null;

  const pendingIcon = ITEM_ICONS[pendingPerk.id];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80"
      >
        <motion.div
          initial={{ scale: 0.92, y: 18, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 18, opacity: 0 }}
          className="w-full max-w-lg mx-4 rounded-sm border-2 border-amber-500/60 bg-[#0d1117] shadow-pixel p-5"
        >
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-sm border border-amber-500/40 bg-amber-900/20 mb-2">
              {pendingIcon
                ? <GameIcon name={pendingIcon.icon} color={pendingIcon.color} size={28} />
                : <GameIcon name="star" color="amber" size={28} />}
            </div>
            <h2 className="text-xl font-black text-amber-300">Replace a Perk</h2>
            <p className="text-indigo-300/70 text-sm mt-1">
              No free slot for <span className="text-white font-bold">{pendingPerk.name}</span>. Choose one perk to remove.
            </p>
          </div>

          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {replaceablePerks.map((perk) => {
              const icon = ITEM_ICONS[perk.id];
              return (
                <button
                  key={perk.id}
                  onClick={() => onReplace(perk.id)}
                  className="w-full rounded-sm border-2 border-white/10 bg-white/5 px-3 py-3 text-left hover:bg-white/10 hover:border-amber-500/40 transition shadow-pixel-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {icon
                        ? <GameIcon name={icon.icon} color={icon.color} size={20} />
                        : <GameIcon name="star" color="amber" size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-bold text-sm">{perk.name}</div>
                      <div className="text-indigo-300/70 text-xs">{perk.description}</div>
                    </div>
                    <div className="ml-auto shrink-0 text-amber-300">
                      <GameIcon name="next" color="amber" size={16} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={onCancel}
            className="w-full mt-4 py-3 rounded-sm border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition shadow-pixel-sm"
          >
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
