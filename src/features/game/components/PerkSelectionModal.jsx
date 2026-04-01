import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERK_RARITY, PERK_CONFIG } from '../constants/perkDefinitions';
import GameIcon from '../../../shared/components/GameIcon';
import { ITEM_ICONS } from '../../../shared/constants/itemIconMap';

export default function PerkSelectionModal({ perks, onSelect, show, hasDoubleDip = false }) {
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (show) setIsMinimized(false);
    }, [show]);

    const handlePerkClick = (perk) => {
        onSelect(perk);
    };

    if (!show || !perks || perks.length === 0) return null;

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case PERK_RARITY.COMMON:
                return 'from-gray-600 to-gray-700 border-gray-400';
            case PERK_RARITY.RARE:
                return 'from-blue-600 to-blue-700 border-blue-400';
            case PERK_RARITY.EPIC:
                return 'from-purple-600 to-purple-700 border-purple-400';
            default:
                return 'from-gray-600 to-gray-700 border-gray-400';
        }
    };

    const getRarityBadgeColor = (rarity) => {
        switch (rarity) {
            case PERK_RARITY.COMMON:
                return 'bg-gray-500 text-white';
            case PERK_RARITY.RARE:
                return 'bg-blue-500 text-white';
            case PERK_RARITY.EPIC:
                return 'bg-purple-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const getRarityLabel = (rarity) => {
        switch (rarity) {
            case PERK_RARITY.COMMON:
                return 'Common';
            case PERK_RARITY.RARE:
                return 'Rare';
            case PERK_RARITY.EPIC:
                return 'Epic';
            default:
                return 'Unknown';
        }
    };

    return (
        <>
            {/* Floating toggle so players can restore the modal while perks are active */}
            {show && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setIsMinimized((prev) => !prev)}
                    className="fixed bottom-12 right-4 z-[60] bg-black/80 text-white text-sm sm:text-2xl px-4 py-2 rounded-full border border-white/20 shadow-2xl backdrop-blur hover:bg-black/70 transition"
                >
                    {isMinimized ? 'Show Perks' : 'Hide Perks'}
                </motion.button>
            )}

            <AnimatePresence>
                {show && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="max-w-5xl w-full relative p-3 sm:p-6 my-auto"
                        >
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="absolute top-0 left-3 sm:left-0 sm:-top-7 bg-black/70 text-white px-3 py-1 text-sm rounded-full border border-white/20 shadow-lg hover:bg-black/60 transition"
                            >
                                Minimize
                            </button>

                            {/* Header */}
                            <div className="text-center mb-2 sm:mb-8 mt-8 sm:mt-0">
                                <motion.h2
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-xl sm:text-4xl font-bold text-white mb-1"
                                >
                                    ✨ Choose Your Bonus!
                                </motion.h2>
                                <motion.p
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-gray-300 text-sm sm:text-lg"
                                >
                                    You've mastered {PERK_CONFIG.ROUNDS_BETWEEN_PERKS} rounds! Time for an upgrade.
                                </motion.p>
                                {hasDoubleDip && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="mt-2 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/50 rounded-full px-4 py-1"
                                    >
                                        <span className="text-amber-300 font-bold text-sm">✌️ Double Dip — your pick will be applied twice!</span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Perk Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-6">
                                {perks.map((perk, index) => (
                                    <motion.div
                                        key={perk.id}
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.08 * index }}
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handlePerkClick(perk)}
                                        className={`
                    relative cursor-pointer group
                    bg-gradient-to-br ${getRarityColor(perk.rarity)}
                    border-2 sm:border-4 rounded-xl sm:rounded-2xl p-3 sm:p-6
                    shadow-2xl transition-all duration-300
                  `}
                                    >
                                        {/* Mobile: horizontal layout */}
                                        <div className="flex items-center gap-3 md:hidden">
                                            <div className="shrink-0 w-10 h-10 flex items-center justify-center">
                                              {ITEM_ICONS[perk.id]
                                                ? <GameIcon name={ITEM_ICONS[perk.id].icon} color={ITEM_ICONS[perk.id].color} size={36} />
                                                : <span className="text-4xl">{perk.icon}</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                    <span className={`${getRarityBadgeColor(perk.rarity)} px-1.5 py-0.5 rounded-full text-xs font-bold uppercase`}>
                                                        {getRarityLabel(perk.rarity)}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-white leading-tight">{perk.name}</h3>
                                                <p className="text-gray-200 text-xs mt-0.5 leading-snug">{perk.description}</p>
                                                <div className="mt-1">
                                                    {perk.duration > 0 && (
                                                        <span className="text-yellow-300 text-xs">⏱️ {perk.duration} {perk.duration === 1 ? 'Round' : 'Rounds'}</span>
                                                    )}
                                                    {perk.duration === -1 && (
                                                        <span className="text-green-300 text-xs">♾️ Permanent</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop: vertical layout (original) */}
                                        <div className="hidden md:block">
                                            {/* Rarity Badge */}
                                            <div className="absolute top-4 right-4">
                                                <span className={`${getRarityBadgeColor(perk.rarity)} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                                                    {getRarityLabel(perk.rarity)}
                                                </span>
                                            </div>

                                            {/* Icon + Name */}
                                            <div className="flex flex-col items-center mt-2 mb-4">
                                                <motion.div
                                                    whileHover={{ scale: 1.2 }}
                                                    transition={{ duration: 0.5 }}
                                                    className="mb-3 flex items-center justify-center w-20 h-20"
                                                >
                                                  {ITEM_ICONS[perk.id]
                                                    ? <GameIcon name={ITEM_ICONS[perk.id].icon} color={ITEM_ICONS[perk.id].color} size={36} />
                                                    : <span className="text-7xl">{perk.icon}</span>}
                                                </motion.div>
                                                <h3 className="text-2xl font-bold text-white text-center">
                                                    {perk.name}
                                                </h3>
                                            </div>

                                            {/* Description */}
                                            <p className="text-gray-200 text-center text-sm leading-relaxed mb-4">
                                                {perk.description}
                                            </p>

                                            {/* Duration Info */}
                                            {perk.duration > 0 && (
                                                <div className="bg-black/30 rounded-lg p-2 text-center">
                                                    <span className="text-yellow-300 text-xs font-semibold">
                                                        ⏱️ {perk.duration} {perk.duration === 1 ? 'Round' : 'Rounds'}
                                                    </span>
                                                </div>
                                            )}
                                            {perk.duration === -1 && (
                                                <div className="bg-black/30 rounded-lg p-2 text-center">
                                                    <span className="text-green-300 text-xs font-semibold">
                                                        ♾️ Permanent (this game)
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/10" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Footer Hint */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-center text-gray-400 text-xs sm:text-sm mt-3 sm:mt-8"
                            >
                                💡 Tip: Choose wisely! Some perks can be stacked.
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
