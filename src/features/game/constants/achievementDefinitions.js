// src/features/game/constants/achievementDefinitions.js

export const ACHIEVEMENT_CATEGORIES = {
  STREAK: 'streak',
  SCORE: 'score',
  GAMES: 'games',
  PERKS: 'perks',
  SPEED: 'speed',
  SPECIAL: 'special'
};

export const ACHIEVEMENT_RARITY = {
  COMMON: { name: 'Common', color: 'gray', glow: 'shadow-gray-400' },
  UNCOMMON: { name: 'Uncommon', color: 'green', glow: 'shadow-green-400' },
  RARE: { name: 'Rare', color: 'blue', glow: 'shadow-blue-400' },
  EPIC: { name: 'Epic', color: 'purple', glow: 'shadow-purple-400' },
  LEGENDARY: { name: 'Legendary', color: 'yellow', glow: 'shadow-yellow-400' }
};

export const ACHIEVEMENTS = {
  // === STREAK ACHIEVEMENTS ===
  STREAK_3: {
    id: 'streak_3',
    name: 'Getting Started',
    description: '3 correct answers in a row',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.STREAK,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    condition: (stats) => stats.currentStreak >= 3,
    progress: (stats) => Math.min(stats.currentStreak / 3, 1),
    secret: false
  },
  STREAK_5: {
    id: 'streak_5',
    name: 'On Fire',
    description: '5 correct answers in a row',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.STREAK,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    condition: (stats) => stats.currentStreak >= 5,
    progress: (stats) => Math.min(stats.currentStreak / 5, 1),
    secret: false
  },
  STREAK_10: {
    id: 'streak_10',
    name: 'Unstoppable',
    description: '10 correct answers in a row',
    icon: '💥',
    category: ACHIEVEMENT_CATEGORIES.STREAK,
    rarity: ACHIEVEMENT_RARITY.RARE,
    condition: (stats) => stats.currentStreak >= 10,
    progress: (stats) => Math.min(stats.currentStreak / 10, 1),
    secret: false
  },
  STREAK_20: {
    id: 'streak_20',
    name: 'Price Master',
    description: '20 correct answers in a row',
    icon: '👑',
    category: ACHIEVEMENT_CATEGORIES.STREAK,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    condition: (stats) => stats.currentStreak >= 20,
    progress: (stats) => Math.min(stats.currentStreak / 20, 1),
    secret: false
  },
  STREAK_50: {
    id: 'streak_50',
    name: 'Legendary Trader',
    description: '50 correct answers in a row',
    icon: '🏆',
    category: ACHIEVEMENT_CATEGORIES.STREAK,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    condition: (stats) => stats.currentStreak >= 50,
    progress: (stats) => Math.min(stats.currentStreak / 50, 1),
    secret: false
  },

  // === SCORE ACHIEVEMENTS ===
  SCORE_100: {
    id: 'score_100',
    name: 'First Hundred',
    description: 'Reach 100 points in one game',
    icon: '💯',
    category: ACHIEVEMENT_CATEGORIES.SCORE,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    condition: (stats) => stats.currentScore >= 100,
    progress: (stats) => Math.min(stats.currentScore / 100, 1),
    secret: false
  },
  SCORE_500: {
    id: 'score_500',
    name: 'High Roller',
    description: 'Reach 500 points in one game',
    icon: '💎',
    category: ACHIEVEMENT_CATEGORIES.SCORE,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    condition: (stats) => stats.currentScore >= 500,
    progress: (stats) => Math.min(stats.currentScore / 500, 1),
    secret: false
  },
  SCORE_1000: {
    id: 'score_1000',
    name: 'Thousandaire',
    description: 'Reach 1000 points in one game',
    icon: '💰',
    category: ACHIEVEMENT_CATEGORIES.SCORE,
    rarity: ACHIEVEMENT_RARITY.RARE,
    condition: (stats) => stats.currentScore >= 1000,
    progress: (stats) => Math.min(stats.currentScore / 1000, 1),
    secret: false
  },
  SCORE_2500: {
    id: 'score_2500',
    name: 'Fortune Teller',
    description: 'Reach 2500 points in one game',
    icon: '🔮',
    category: ACHIEVEMENT_CATEGORIES.SCORE,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    condition: (stats) => stats.currentScore >= 2500,
    progress: (stats) => Math.min(stats.currentScore / 2500, 1),
    secret: false
  },
  SCORE_5000: {
    id: 'score_5000',
    name: 'Market Wizard',
    description: 'Reach 5000 points in one game',
    icon: '🧙',
    category: ACHIEVEMENT_CATEGORIES.SCORE,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    condition: (stats) => stats.currentScore >= 5000,
    progress: (stats) => Math.min(stats.currentScore / 5000, 1),
    secret: false
  },

  // === ROUNDS ACHIEVEMENTS ===
  ROUNDS_10: {
    id: 'rounds_10',
    name: 'Warming Up',
    description: 'Survive 10 rounds',
    icon: '🎯',
    category: ACHIEVEMENT_CATEGORIES.GAMES,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    condition: (stats) => stats.currentRound >= 10,
    progress: (stats) => Math.min(stats.currentRound / 10, 1),
    secret: false
  },
  ROUNDS_25: {
    id: 'rounds_25',
    name: 'Endurance',
    description: 'Survive 25 rounds',
    icon: '🏃',
    category: ACHIEVEMENT_CATEGORIES.GAMES,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    condition: (stats) => stats.currentRound >= 25,
    progress: (stats) => Math.min(stats.currentRound / 25, 1),
    secret: false
  },
  ROUNDS_50: {
    id: 'rounds_50',
    name: 'Marathon Runner',
    description: 'Survive 50 rounds',
    icon: '🏅',
    category: ACHIEVEMENT_CATEGORIES.GAMES,
    rarity: ACHIEVEMENT_RARITY.RARE,
    condition: (stats) => stats.currentRound >= 50,
    progress: (stats) => Math.min(stats.currentRound / 50, 1),
    secret: false
  },
  ROUNDS_100: {
    id: 'rounds_100',
    name: 'Iron Will',
    description: 'Survive 100 rounds',
    icon: '⚔️',
    category: ACHIEVEMENT_CATEGORIES.GAMES,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    condition: (stats) => stats.currentRound >= 100,
    progress: (stats) => Math.min(stats.currentRound / 100, 1),
    secret: false
  },

  // === PERK ACHIEVEMENTS ===
  FIRST_PERK: {
    id: 'first_perk',
    name: 'Power Up',
    description: 'Collect your first perk',
    icon: '⭐',
    category: ACHIEVEMENT_CATEGORIES.PERKS,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    condition: (stats) => stats.perksCollected >= 1,
    progress: (stats) => Math.min(stats.perksCollected / 1, 1),
    secret: false
  },
  PERKS_5: {
    id: 'perks_5',
    name: 'Collector',
    description: 'Collect 5 perks in one game',
    icon: '🎁',
    category: ACHIEVEMENT_CATEGORIES.PERKS,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    condition: (stats) => stats.perksCollected >= 5,
    progress: (stats) => Math.min(stats.perksCollected / 5, 1),
    secret: false
  },
  PERKS_10: {
    id: 'perks_10',
    name: 'Hoarder',
    description: 'Collect 10 perks in one game',
    icon: '📦',
    category: ACHIEVEMENT_CATEGORIES.PERKS,
    rarity: ACHIEVEMENT_RARITY.RARE,
    condition: (stats) => stats.perksCollected >= 10,
    progress: (stats) => Math.min(stats.perksCollected / 10, 1),
    secret: false
  },
  SHIELD_SAVE: {
    id: 'shield_save',
    name: 'Second Chance',
    description: 'Get saved by a Shield perk',
    icon: '💚',
    category: ACHIEVEMENT_CATEGORIES.PERKS,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    condition: (stats) => stats.shieldSaves >= 1,
    progress: (stats) => Math.min(stats.shieldSaves / 1, 1),
    secret: false
  },

  // === SPEED ACHIEVEMENTS ===
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answer within 1 second',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.SPEED,
    rarity: ACHIEVEMENT_RARITY.RARE,
    condition: (stats) => stats.fastestAnswer <= 1 && stats.fastestAnswer > 0,
    progress: (stats) => stats.fastestAnswer > 0 ? Math.min(1 / stats.fastestAnswer, 1) : 0,
    secret: false
  },
  QUICK_FIVE: {
    id: 'quick_five',
    name: 'Quick Thinker',
    description: '5 answers under 3 seconds each',
    icon: '🚀',
    category: ACHIEVEMENT_CATEGORIES.SPEED,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    condition: (stats) => stats.quickAnswers >= 5,
    progress: (stats) => Math.min(stats.quickAnswers / 5, 1),
    secret: false
  },

  // === SPECIAL/SECRET ACHIEVEMENTS ===
  PERFECT_START: {
    id: 'perfect_start',
    name: 'Perfect Start',
    description: 'Get the first 5 answers correct',
    icon: '✨',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.RARE,
    condition: (stats) => stats.correctFromStart >= 5 && !stats.isAfterLifeLoss,
    progress: (stats) => {
      if (stats.isAfterLifeLoss) return 0;
      return Math.min(stats.correctFromStart / 5, 1);
    },
    secret: false
  },
  CLOSE_CALL: {
    id: 'close_call',
    name: 'Close Call',
    description: 'Win a round in the last second',
    icon: '😰',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    condition: (stats) => stats.lastSecondWins >= 1,
    progress: (stats) => Math.min(stats.lastSecondWins / 1, 1),
    secret: true
  },
  COMEBACK_KID: {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Win 5 rounds after losing a life',
    icon: '💪',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.RARE,
    condition: (stats) => stats.comebackStreak >= 5,
    progress: (stats) => Math.min(stats.comebackStreak / 5, 1),
    secret: true
  },
  DOUBLE_TROUBLE: {
    id: 'double_trouble',
    name: 'Double Trouble',
    description: 'Use Double Points perk to score 200+ in one round',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    condition: (stats) => stats.biggestDoublePoints >= 200,
    progress: (stats) => Math.min(stats.biggestDoublePoints / 200, 1),
    secret: true
  },
  SURVIVOR: {
    id: 'survivor',
    name: 'Survivor',
    description: 'Win a game with only 1 life remaining',
    icon: '❤️',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.RARE,
    condition: (stats) => stats.wonWithOnLife === true,
    progress: (stats) => stats.wonWithOnLife ? 1 : 0,
    secret: true
  }
};

// Helper: Get all achievements as array
export const getAllAchievements = () => Object.values(ACHIEVEMENTS);

// Helper: Get achievements by category
export const getAchievementsByCategory = (category) => 
  getAllAchievements().filter(a => a.category === category);

// Helper: Get achievement by ID
export const getAchievementById = (id) => ACHIEVEMENTS[id.toUpperCase()] || null;