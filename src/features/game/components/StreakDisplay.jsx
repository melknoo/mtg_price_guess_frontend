import React from 'react';
import { motion } from 'framer-motion';
import { FaFire } from 'react-icons/fa';
import { GAME_CONFIG } from '../../../shared/utils/constants';

export default function StreakDisplay({ streak, bestStreak, color, streakBonus }) {
  const hasStreakBonus = streak >= GAME_CONFIG.STREAK_BONUS_THRESHOLD;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Streak Counter */}
      <div className={`flex items-center justify-center gap-2 mb-4 ${color} font-bold text-xl`}>
        <motion.div
          key={streak}
          initial={{ scale: 1 }}
          animate={{ scale: streak > 0 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <FaFire className={hasStreakBonus ? 'animate-pulse' : ''} />
          <span>Streak: {streak}</span>
        </motion.div>
        {bestStreak > 0 && (
          <span className="text-sm text-gray-300 ml-2">
            (Beste: {bestStreak})
          </span>
        )}
      </div>

      {/* Streak Bonus Banner */}
      {hasStreakBonus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mb-2 px-1"
        >
          <div className="bg-orange-500 bg-opacity-20 border-2 border-orange-400 rounded-lg p-2 text-center">
            <span className="text-orange-300 font-bold">
              🔥 Streak Bonus aktiv: +{streakBonus} Punkte beim nächsten Treffer!
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}