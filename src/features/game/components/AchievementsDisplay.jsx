// src/features/game/components/AchievementsDisplay.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENT_CATEGORIES } from '../constants/achievementDefinitions';

const categoryInfo = {
  [ACHIEVEMENT_CATEGORIES.STREAK]: { name: 'Streak', icon: '🔥' },
  [ACHIEVEMENT_CATEGORIES.SCORE]: { name: 'Score', icon: '💰' },
  [ACHIEVEMENT_CATEGORIES.GAMES]: { name: 'Rounds', icon: '🎯' },
  [ACHIEVEMENT_CATEGORIES.PERKS]: { name: 'Perks', icon: '⭐' },
  [ACHIEVEMENT_CATEGORIES.SPEED]: { name: 'Speed', icon: '⚡' },
  [ACHIEVEMENT_CATEGORIES.SPECIAL]: { name: 'Special', icon: '✨' }
};

const rarityColors = {
  Common: 'from-gray-500 to-gray-700 border-gray-400',
  Uncommon: 'from-green-500 to-green-700 border-green-400',
  Rare: 'from-blue-500 to-blue-700 border-blue-400',
  Epic: 'from-purple-500 to-purple-700 border-purple-400',
  Legendary: 'from-yellow-400 to-amber-600 border-yellow-300'
};

const AchievementCard = React.forwardRef(({ achievement, index }, ref) => {
  const rarityName = achievement.rarity?.name || 'Common';
  const colorClass = rarityColors[rarityName] || rarityColors.Common;
  const isSecret = achievement.secret && !achievement.unlocked;
  const progress = achievement.progress || 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative overflow-hidden rounded-xl border-2 p-4
        ${achievement.unlocked 
          ? `bg-gradient-to-br ${colorClass}` 
          : 'bg-gray-800/50 border-gray-600'
        }
        ${!achievement.unlocked && 'opacity-60'}
      `}
    >
      {/* Locked overlay for secrets */}
      {isSecret && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
          <div className="text-center">
            <span className="text-4xl">🔒</span>
            <p className="text-gray-400 text-sm mt-2">Secret Achievement</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className={`text-3xl ${!achievement.unlocked && !isSecret ? 'grayscale' : ''}`}>
          {isSecret ? '❓' : achievement.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold truncate ${achievement.unlocked ? 'text-white' : 'text-gray-300'}`}>
            {isSecret ? '???' : achievement.name}
          </h3>
          
          <p className={`text-sm mt-0.5 ${achievement.unlocked ? 'text-white/80' : 'text-gray-400'}`}>
            {isSecret ? 'Keep playing to discover!' : achievement.description}
          </p>

          {/* Rarity Badge */}
          {!isSecret && (
            <span className={`
              inline-block mt-2 text-xs px-2 py-0.5 rounded-full
              ${achievement.unlocked ? 'bg-black/30 text-white' : 'bg-gray-700 text-gray-300'}
            `}>
              {rarityName}
            </span>
          )}
        </div>

        {/* Checkmark for unlocked */}
        {achievement.unlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl"
          >
            ✅
          </motion.div>
        )}
      </div>

      {/* Progress bar for locked achievements */}
      {!achievement.unlocked && !isSecret && progress > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {Math.round(progress * 100)}% complete
          </p>
        </div>
      )}
    </motion.div>
  );
});

AchievementCard.displayName = 'AchievementCard';

export default function AchievementsDisplay({ achievements, onBack }) {
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl w-full mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">🏆 Achievements</h2>
          <p className="text-gray-300 mt-1">
            {unlockedCount} / {totalCount} unlocked ({progressPercent}%)
          </p>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="w-48">
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg transition font-medium ${
            selectedCategory === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          All
        </button>
        {Object.entries(categoryInfo).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              selectedCategory === key
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {info.icon} {info.name}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
        {filteredAchievements.map((achievement, index) => (
          <AchievementCard 
            key={achievement.id} 
            achievement={achievement}
            index={index}
          />
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition font-medium text-white"
      >
        ← Back to Menu
      </button>
    </motion.div>
  );
}