import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERK_RARITY, PERK_CONFIG } from '../constants/perkDefinitions';

export default function PerkSelectionModal({ perks, onSelect, show }) {
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        // Whenever the modal is triggered again, ensure it starts expanded
        if (show) {
            setIsMinimized(false);
        }
    }, [show]);

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="max-w-5xl w-full relative"
                        >
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="absolute -top-7 left-0 bg-black/70 text-white px-3 py-1 text-sm sm:text-2xl rounded-full border border-white/20 shadow-lg hover:bg-black/60 transition"
                            >
                                Minimize
                            </button>

                            {/* Header */}
                            <div className="text-center mb-2 sm:mb-8">
                                <motion.h2
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="sm:text-4xl text-2xl font-bold text-white mb-2"
                                >
                                    ✨ Choose Your Bonus!
                                </motion.h2>
                                <motion.p
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-gray-300 text-lg"
                                >
                                    You've mastered {PERK_CONFIG.ROUNDS_BETWEEN_PERKS} rounds! Time for an upgrade.
                                </motion.p>
                            </div>

                            {/* Perk Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {perks.map((perk, index) => (
                                    <motion.div
                                        key={perk.id}
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 * index }}
                                        whileHover={{ scale: 1.05, y: -10 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onSelect(perk)}
                                        className={`
                    relative cursor-pointer
                    bg-gradient-to-br ${getRarityColor(perk.rarity)}
                    border-4 rounded-2xl p-6
                    shadow-2xl hover:shadow-3xl
                    transition-all duration-300
                    group
                  `}
                                    >
                                        {/* Rarity Badge */}
                                        <div className="absolute top-4 right-4">
                                            <span className={`
                      ${getRarityBadgeColor(perk.rarity)}
                      px-3 py-1 rounded-full text-xs font-bold uppercase
                    `}>
                                                {getRarityLabel(perk.rarity)}
                                            </span>
                                        </div>

                                        {/* Icon */}
                                        <div className="flex justify-center sm:flex-col mb-1 sm:mb-4">
                                            <div className="text-center sm:mb-4">
                                                <motion.div
                                                    whileHover={{ rotate: 360, scale: 1.2 }}
                                                    transition={{ duration: 0.5 }}
                                                    className="sm:text-7xl text-2xl inline-block"
                                                >
                                                    {perk.icon}
                                                </motion.div>
                                            </div>

                                            {/* Name */}
                                            <h3 className="text-2xl font-bold text-white text-center sm:mb-3">
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

                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <div className="absolute inset-0 rounded-2xl bg-white/10" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Footer Hint */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-center text-gray-400 text-sm mt-2 sm:mt-8"
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
