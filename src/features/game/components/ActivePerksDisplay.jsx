// src/features/game/components/ActivePerksDisplay.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActivePerksDisplay({ perks }) {
  if (!perks || perks.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mb-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
        <h3 className="text-sm font-semibold text-gray-300 mb-2 text-center">
          🎮 Aktive Boni
        </h3>
        
        <div className="flex flex-wrap gap-2 justify-center">
          <AnimatePresence>
            {perks.map((perk) => (
              <motion.div
                key={perk.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                className="relative group"
              >
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg px-3 py-2 border-2 border-purple-400 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{perk.icon}</span>
                    <div className="text-left">
                      <div className="text-white font-semibold text-xs leading-tight">
                        {perk.name}
                      </div>
                      {perk.remainingDuration > 0 && (
                        <div className="text-yellow-300 text-xs">
                          {perk.remainingDuration} {perk.remainingDuration === 1 ? 'Runde' : 'Runden'}
                        </div>
                      )}
                      {perk.duration === -1 && (
                        <div className="text-green-300 text-xs">
                          ♾️ Aktiv
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-700">
                    {perk.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}