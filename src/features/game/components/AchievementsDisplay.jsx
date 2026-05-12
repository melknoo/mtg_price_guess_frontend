// src/features/game/components/AchievementsDisplay.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENT_CATEGORIES } from '../constants/achievementDefinitions';
import GameIcon from '../../../shared/components/GameIcon';

const categoryInfo = {
  [ACHIEVEMENT_CATEGORIES.STREAK]: { name: 'Streak' },
  [ACHIEVEMENT_CATEGORIES.SCORE]: { name: 'Score' },
  [ACHIEVEMENT_CATEGORIES.GAMES]: { name: 'Rounds' },
  [ACHIEVEMENT_CATEGORIES.PERKS]: { name: 'Perks' },
  [ACHIEVEMENT_CATEGORIES.SPEED]: { name: 'Speed' },
  [ACHIEVEMENT_CATEGORIES.SPECIAL]: { name: 'Special' }
};

function CategoryIcon({ category, size = 16 }) {
  switch (category) {
    case ACHIEVEMENT_CATEGORIES.STREAK:
      return <GameIcon name="thunder" size={size} color="yellow" />;
    case ACHIEVEMENT_CATEGORIES.SCORE:
      return <GameIcon name="coin" size={size} color="amber" />;
    case ACHIEVEMENT_CATEGORIES.GAMES:
      return <GameIcon name="target" size={size} color="white" />;
    case ACHIEVEMENT_CATEGORIES.PERKS:
      return <GameIcon name="potion" size={size} color="purple" />;
    case ACHIEVEMENT_CATEGORIES.SPEED:
      return <GameIcon name="wind" size={size} color="blue" />;
    case ACHIEVEMENT_CATEGORIES.SPECIAL:
      return <GameIcon name="star" size={size} color="amber" />;
    default:
      return <GameIcon name="stat" size={size} color="white" />;
  }
}

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
        relative overflow-hidden rounded-sm border-2 p-4
        ${achievement.unlocked
          ? `bg-gradient-to-br ${colorClass}`
          : 'bg-gray-800/50 border-gray-600'
        }
        ${!achievement.unlocked && 'opacity-60'}
      `}
    >
      {isSecret && (
        <div className="absolute inset-0 bg-gray-900/80 rounded-sm flex items-center justify-center z-10">
          <div className="text-center">
            <GameIcon name="lock" size={28} color="gray" />
            <p className="text-gray-400 text-sm mt-2">Secret Achievement</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`text-3xl ${!achievement.unlocked && !isSecret ? 'grayscale' : ''} flex items-center justify-center w-10 h-10`}>
          {isSecret
            ? <GameIcon name="interrogation" size={20} color="white" />
            : <span>{achievement.icon}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-bold truncate ${achievement.unlocked ? 'text-white' : 'text-gray-300'}`}>
            {isSecret ? '???' : achievement.name}
          </h3>

          <p className={`text-sm mt-0.5 ${achievement.unlocked ? 'text-white/80' : 'text-gray-400'}`}>
            {isSecret ? 'Keep playing to discover!' : achievement.description}
          </p>

          {!isSecret && (
            <span className={`
              inline-block mt-2 text-xs px-2 py-0.5 rounded-sm
              ${achievement.unlocked ? 'bg-black/30 text-white' : 'bg-gray-700 text-gray-300'}
            `}>
              {rarityName}
            </span>
          )}
        </div>

        {achievement.unlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl flex items-center"
          >
            <GameIcon name="star" size={18} color="amber" />
          </motion.div>
        )}
      </div>

      {!achievement.unlocked && !isSecret && progress > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
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

// Mobile Filter Dropdown Component
function MobileFilterDropdown({ selectedCategory, setSelectedCategory, categoryInfo }) {
  const [isOpen, setIsOpen] = useState(false);

  const getCurrentLabel = () => {
    if (selectedCategory === 'all') return 'All Categories';
    const info = categoryInfo[selectedCategory];
    return info ? info.name : 'Select Category';
  };

  const handleSelect = (category) => {
    setSelectedCategory(category);
    setIsOpen(false);
  };

  return (
    <div className="relative sm:hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111827] border-2 border-[#2d3a5c] rounded-sm text-white font-medium"
      >
        <span className="flex items-center gap-2">
          {selectedCategory === 'all'
            ? <GameIcon name="list" size={16} color="white" />
            : <CategoryIcon category={selectedCategory} size={16} />}
          <span>{getCurrentLabel()}</span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#111827] border-2 border-[#2d3a5c] rounded-sm shadow-pixel z-20 overflow-hidden"
          >
            <button
              onClick={() => handleSelect('all')}
              className={`w-full px-4 py-3 text-left flex items-center gap-2 transition ${selectedCategory === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-300 hover:bg-white/10'
                }`}
            >
              <CategoryIcon category={ACHIEVEMENT_CATEGORIES.SPECIAL} size={16} />
              <span>All Categories</span>
              {selectedCategory === 'all' && <span className="ml-auto">✓</span>}
            </button>

            {Object.entries(categoryInfo).map(([key, info]) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`w-full px-4 py-3 text-left flex items-center gap-2 transition border-t border-white/10 ${selectedCategory === key
                    ? 'bg-amber-600 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                  }`}
              >
              <CategoryIcon category={key} size={16} />
                <span>{info.name}</span>
                {selectedCategory === key && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Desktop Filter Buttons Component
function DesktopFilterButtons({ selectedCategory, setSelectedCategory, categoryInfo }) {
  return (
    <div className="hidden sm:flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => setSelectedCategory('all')}
        className={`px-4 py-2 rounded-sm transition font-medium ${selectedCategory === 'all'
            ? 'bg-amber-600 text-white'
            : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
      >
        All
      </button>
      {Object.entries(categoryInfo).map(([key, info]) => (
        <button
          key={key}
          onClick={() => setSelectedCategory(key)}
          className={`px-4 py-2 rounded-sm transition font-medium ${selectedCategory === key
              ? 'bg-amber-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
        >
          <span className="inline-flex items-center gap-2">
            <CategoryIcon category={key} size={16} />
            <span>{info.name}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default function AchievementsDisplay({ achievements, onBack }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

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
      className="max-w-4xl w-full mx-auto bg-[#111827] border-2 border-[#2d3a5c] rounded-sm p-4 sm:p-6 shadow-pixel relative"
    >
      {/* Mobile Close Button */}
      <button
        onClick={onBack}
        className="sm:hidden absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-[#111827] border-2 border-[#2d3a5c] rounded-sm shadow-pixel-sm hover:bg-[#1e293b] transition text-white/70 text-sm font-bold"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Header */}
      <div className="flex items-left sm:items-center sm:flex-row flex-col mb-4 sm:justify-between sm:mb-6 pr-12 sm:pr-0">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <GameIcon name="trophy" size={26} color="amber" />
            <span>Achievements</span>
          </h2>
          <p className="text-gray-300 mt-1">
            {unlockedCount} / {totalCount} unlocked ({progressPercent}%)
          </p>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full sm:w-48 mt-3 sm:mt-0">
          <div className="h-3 bg-gray-700 rounded-sm overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Dropdown */}
      <MobileFilterDropdown
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categoryInfo={categoryInfo}
      />

      {/* Desktop Filter Buttons */}
      <DesktopFilterButtons
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categoryInfo={categoryInfo}
      />

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="mb-2 flex justify-center">
            <GameIcon name="search" size={24} color="gray" />
          </div>
          <p>No achievements in this category yet.</p>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="mt-6 w-full bg-[#111827] hover:bg-[#1e293b] border-2 border-[#2d3a5c] px-6 py-3 rounded-sm shadow-pixel-sm transition font-medium text-white"
      >
        Back to Menu
      </button>
    </motion.div>
  );
}