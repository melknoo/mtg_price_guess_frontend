import React from 'react';
import { motion } from 'framer-motion';
import { FaFire } from 'react-icons/fa';
import { GAME_CONFIG } from '../../../shared/utils/constants';

export default function StreakDisplay({ streak, bestStreak, color, streakBonus }) {
  const hasStreakBonus = streak >= GAME_CONFIG.STREAK_BONUS_THRESHOLD;

  return (
    <div className="flex justify-between sm:justify-evenly flex-row items-center w-full sm:max-w-2xl">
      {/* Streak Counter */}
      <div className={`flex sm:flex-col items-center justify-center gap-2 mb-1 sm:mb-4 ${color} font-bold text-xl`}>
        <motion.div
          key={streak}
          initial={{ scale: 1 }}
          animate={{ scale: streak > 0 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center sm:gap-2 gap-0"
        >
          <FaFire className={hasStreakBonus ? 'animate-pulse' : ''} />
          <span className='sm:block hidden'>Streak: </span>
          <span>{streak}</span>
        </motion.div>
        {bestStreak > 0 && (
          <span className="text-sm sm:block hidden text-gray-700 ml-2">
            (Best: {bestStreak})
          </span>
        )}
      </div>

      {/* Streak Bonus Banner */}
      {hasStreakBonus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:w-3/4 sm:max-w-[250px] max-w-xl mb-2 px-1"
        >
          <div className="bg-orange-500 bg-opacity-20 border border-orange-400 sm:border-2 rounded-lg px-2 py-1 sm:p-2 text-center">
            <span className="text-orange-300 font-bold text-xs sm:text-base">
              🔥 Streak Bonus: +{streakBonus} Pts!
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}