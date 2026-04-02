// src/features/game/components/AchievementToast.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const rarityStyles = {
  COMMON: {
    bg: 'bg-gray-800',
    border: 'border-gray-400',
    glow: 'shadow-pixel',
    text: 'text-gray-200'
  },
  UNCOMMON: {
    bg: 'bg-green-900',
    border: 'border-green-400',
    glow: 'shadow-pixel',
    text: 'text-green-200'
  },
  RARE: {
    bg: 'bg-blue-900',
    border: 'border-blue-400',
    glow: 'shadow-pixel',
    text: 'text-blue-200'
  },
  EPIC: {
    bg: 'bg-purple-900',
    border: 'border-purple-400',
    glow: 'shadow-pixel',
    text: 'text-purple-200'
  },
  LEGENDARY: {
    bg: 'bg-amber-900',
    border: 'border-yellow-400',
    glow: 'shadow-pixel',
    text: 'text-yellow-100'
  }
};

export default function AchievementToast({ achievement, onDismiss }) {
  if (!achievement) return null;

  const rarityKey = Object.keys(rarityStyles).find(
    key => achievement.rarity?.name?.toUpperCase() === key
  ) || 'COMMON';
  
  const style = rarityStyles[rarityKey];

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 400, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 25 
          }}
          className="fixed top-20 right-4 z-50 cursor-pointer"
          onClick={onDismiss}
        >
          <div className={`
            relative overflow-hidden
            ${style.bg}
            border-2 ${style.border}
            rounded-sm p-4 pr-6
            min-w-[280px] max-w-[350px]
            ${style.glow}
          `}>
            {/* Shine animation for legendary */}
            {rarityKey === 'LEGENDARY' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  repeatDelay: 2 
                }}
              />
            )}

            {/* Content */}
            <div className="relative flex items-center gap-3">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: 'spring', 
                  delay: 0.2,
                  stiffness: 200 
                }}
                className="text-4xl"
              >
                {achievement.icon}
              </motion.div>

              {/* Text */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs uppercase tracking-wider font-bold text-white/70 mb-0.5"
                >
                  🏆 Achievement Unlocked!
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-bold text-white text-lg leading-tight"
                >
                  {achievement.name}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-sm ${style.text} mt-0.5`}
                >
                  {achievement.description}
                </motion.div>

                {/* Rarity badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2"
                >
                  <span className={`
                    text-xs px-2 py-0.5 rounded-sm
                    bg-black/30 ${style.text} font-semibold border border-current/30
                  `}>
                    {achievement.rarity?.name || 'Common'}
                  </span>
                </motion.div>
              </div>

              {/* Close hint */}
              <div className="absolute top-1 right-1 text-white/40 text-xs">
                ✕
              </div>
            </div>

            {/* Progress bar animation */}
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