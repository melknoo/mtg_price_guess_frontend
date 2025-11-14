import React from 'react';
import { motion } from 'framer-motion';
import { FaStopwatch, FaStar } from 'react-icons/fa';

export default function GameTimer({ timeLeft, possiblePoints, progress }) {
  return (
    <>
      {/* Timer Info */}
      <div className="w-full max-w-xl flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2 text-white font-semibold">
          <FaStopwatch />
          <span>{timeLeft.toFixed(1)} Sek</span>
        </div>
        
        <motion.div
          key={Math.ceil(timeLeft)}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1 text-green-300 font-semibold"
        >
          <FaStar className="text-yellow-400" />
          <span>+{possiblePoints} Punkte möglich</span>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xl h-4 bg-gray-700 rounded mb-6 overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
}