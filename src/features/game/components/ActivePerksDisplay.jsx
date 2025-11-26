// src/features/game/components/ActivePerksDisplay.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActivePerksDisplay({ perks }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!perks || perks.length === 0) return null;

  return (
    <>
      {/* Desktop: Fixed Sidebar (left center) */}
      <div className="hidden md:block fixed left-0 top-1/2 transform -translate-y-1/2 z-40">
        <div className="bg-white/10 backdrop-blur-sm rounded-r-lg p-3 shadow-2xl border-r-4 border-purple-500">
          <h3 className="text-xs font-semibold text-gray-300 mb-3 writing-mode-vertical text-center whitespace-nowrap">
            🎮 Aktive Boni
          </h3>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {perks.map((perk) => (
                <DesktopPerkCard key={perk.id} perk={perk} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile: Collapsible Top-Left Corner */}
      <div className="md:hidden fixed top-8 left-4 z-40">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              className="absolute top-5 left-5 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-2xl border-2 border-purple-500 mb-2 min-w-[300px]"
            >
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                🎮 Aktive Boni
              </h3>
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                {perks.map((perk) => (
                  <MobilePerkCard key={perk.id} perk={perk} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full p-3 shadow-lg border-2 border-purple-400 relative"
        >
          <span className="text-2xl">🎮</span>
          {perks.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {perks.length}
            </span>
          )}
        </motion.button>
      </div>
    </>
  );
}

function DesktopPerkCard({ perk }) {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      whileHover={{ x: 10, scale: 1.05 }}
      className="relative group"
    >
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg p-2 border-2 border-purple-400 shadow-lg min-w-[80px]">
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl">{perk.icon}</span>
          <div className="text-center">
            <div className="text-white font-semibold text-xs leading-tight">
              {perk.name}
            </div>
            {perk.remainingDuration > 0 && (
              <div className="text-yellow-300 text-xs font-bold mt-1">
                {perk.remainingDuration}x
              </div>
            )}
            {perk.duration === -1 && (
              <div className="text-green-300 text-xs mt-1">
                ♾️
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tooltip on Hover - appears to the right */}
      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-gray-900 text-white text-sm rounded-lg px-4 py-3 whitespace-nowrap shadow-2xl border-2 border-purple-400 max-w-xs">
          <div className="font-bold mb-1">{perk.name}</div>
          <div className="text-gray-300 text-xs">{perk.description}</div>
          {perk.remainingDuration > 0 && (
            <div className="text-yellow-300 text-xs mt-2">
              ⏱️ {perk.remainingDuration} {perk.remainingDuration === 1 ? 'Runde' : 'Runden'}
            </div>
          )}
          {perk.duration === -1 && (
            <div className="text-green-300 text-xs mt-2">
              ♾️ Permanent aktiv
            </div>
          )}
          {/* Arrow pointing left */}
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-8 border-transparent border-r-gray-900" />
        </div>
      </div>
    </motion.div>
  );
}

function MobilePerkCard({ perk }) {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg p-2 border-2 border-purple-400 shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{perk.icon}</span>
        <div className="flex-1">
          <div className="text-white font-semibold text-sm leading-tight">
            {perk.name}
          </div>
          <div className="text-gray-200 text-xs mt-0.5">
            {perk.description}
          </div>
          {perk.remainingDuration > 0 && (
            <div className="text-yellow-300 text-xs font-bold mt-1">
              ⏱️ {perk.remainingDuration} {perk.remainingDuration === 1 ? 'Runde' : 'Runden'}
            </div>
          )}
          {perk.duration === -1 && (
            <div className="text-green-300 text-xs mt-1">
              ♾️ Permanent aktiv
            </div>
          )}
        </div>
      </div>
    </div>
  );
}