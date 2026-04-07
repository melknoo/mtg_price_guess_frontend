import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';
import { ITEM_ICONS } from '../../../shared/constants/itemIconMap';

// Modal erscheint wenn alle 3 Synergy-Slots belegt sind und eine neue Synergy aktivieren würde.
// Spieler muss entweder eine bestehende droppen oder die neue überspringen.
export default function SynergyConflictModal({ show, pendingSynergy, activeSynergies, onResolve }) {
  if (!show || !pendingSynergy) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-[70] bg-black/80"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="max-w-lg w-full mx-4 bg-[#0d1117] border-2 border-teal-500 rounded-sm shadow-pixel overflow-hidden"
          >
            {/* Header */}
            <div className="bg-teal-900/60 border-b border-teal-600 px-5 py-4 flex items-center gap-3">
              <div className="shrink-0">
                {ITEM_ICONS[pendingSynergy.id]
                  ? <GameIcon name={ITEM_ICONS[pendingSynergy.id].icon} color={ITEM_ICONS[pendingSynergy.id].color} size={32} />
                  : <GameIcon name="follow" color="teal" size={32} />}
              </div>
              <div>
                <div className="text-xs text-teal-400 font-bold uppercase tracking-wider">Synergy Available</div>
                <div className="text-white font-bold text-lg leading-tight">{pendingSynergy.name}</div>
                <div className="text-teal-200 text-xs">{pendingSynergy.description}</div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-gray-300 text-sm mb-4">
                All <span className="text-teal-300 font-bold">3 synergy slots</span> are occupied.
                Drop one to make room, or skip this synergy.
              </p>

              <div className="flex flex-col gap-2">
                {activeSynergies.map((synergy) => (
                  <motion.button
                    key={synergy.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onResolve(synergy.id, pendingSynergy)}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-red-950/40 border-2 border-red-800/60 hover:border-red-500 hover:bg-red-950/70 rounded-sm text-left transition-all"
                  >
                    <div className="shrink-0">
                      {ITEM_ICONS[synergy.id]
                        ? <GameIcon name={ITEM_ICONS[synergy.id].icon} color={ITEM_ICONS[synergy.id].color} size={24} />
                        : <GameIcon name="disable" color="red" size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">{synergy.name}</span>
                        <span className="text-red-400 text-xs">drop</span>
                      </div>
                      <p className="text-gray-400 text-xs truncate">{synergy.description}</p>
                    </div>
                    <GameIcon name="clear" color="red" size={16} />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Skip */}
            <div className="px-5 pb-4">
              <button
                onClick={() => onResolve(null, pendingSynergy)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111827] border-2 border-[#2d3a5c] hover:bg-[#1e293b] text-gray-300 hover:text-white text-sm rounded-sm transition-all"
              >
                <GameIcon name="next" color="gray" size={14} />
                Skip — keep current synergies
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
