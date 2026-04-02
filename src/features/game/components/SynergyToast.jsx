import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';
import { ITEM_ICONS } from '../../../shared/constants/itemIconMap';

export default function SynergyToast({ synergy, onDismiss }) {
  if (!synergy) return null;

  return (
    <AnimatePresence>
      {synergy && (
        <motion.div
          initial={{ x: -400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -400, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-[30%] sm:bottom-24 sm:top-auto left-4 z-[60] cursor-pointer"
          onClick={onDismiss}
        >
          <div className="relative overflow-hidden bg-teal-900 border-2 border-teal-400 rounded-sm p-2 sm:p-4 sm:pr-6 min-w-[200px] sm:min-w-[280px] max-w-[260px] sm:max-w-[350px] shadow-pixel">
            {/* Shine */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
            />

            <div className="relative flex items-center gap-2 sm:gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                className="shrink-0 w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center"
              >
                {ITEM_ICONS[synergy.id]
                  ? <GameIcon name={ITEM_ICONS[synergy.id].icon} color={ITEM_ICONS[synergy.id].color} size={40} />
                  : <span className="text-2xl sm:text-4xl">{synergy.icon}</span>}
              </motion.div>

              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs uppercase tracking-wider font-bold text-white/70 mb-0.5"
                >
                  🔗 Synergy Activated!
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-bold text-white text-sm sm:text-lg leading-tight"
                >
                  {synergy.name}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="hidden sm:block text-sm text-teal-200 mt-0.5"
                >
                  {synergy.description}
                </motion.div>
              </div>

              <div className="absolute top-1 right-1 text-white/40 text-xs">✕</div>
            </div>

            {/* Countdown bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
