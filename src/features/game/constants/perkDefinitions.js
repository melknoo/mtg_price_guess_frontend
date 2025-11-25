export const PERK_TYPES = {
    DEFENSIVE: 'defensive',
    OFFENSIVE: 'offensive',
    UTILITY: 'utility'
};

export const PERK_RARITY = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic'
};

export const PERKS = {
    SECOND_CHANCE: {
        id: 'second_chance',
        name: 'Extra Life',
        description: 'Your next mistake doesn\'t count',
        icon: '💚',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.EPIC,
        effect: 'shield',
        value: 1,
        duration: -1,
        consumable: true, // Can be selected again after being consumed
    },

    TIME_BUFFER: {
        id: 'time_buffer',
        name: 'Time Buffer',
        description: '+5 seconds extra time per round',
        icon: '⏰',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.COMMON,
        effect: 'time_bonus',
        value: 5,
        duration: 5,
    },

    // OFFENSIVE PERKS
    DOUBLE_POINTS: {
        id: 'double_points',
        name: 'Double Points',
        description: 'Double all points for the next 5 rounds',
        icon: '⚡',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        effect: 'point_multiplier',
        value: 2,
        duration: 5,
    },

    STREAK_BOOSTER: {
        id: 'streak_booster',
        name: 'Streak Booster',
        description: 'Streak bonus from 3 instead of 5 correct answers',
        icon: '🔥',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        effect: 'streak_threshold',
        value: 3,
        duration: -1, // Permanent for this game
        consumable: false, // Cannot be selected again once chosen
    },

    PERFECTIONIST: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: '+50 bonus when you answer at full time',
        icon: '🎯',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        effect: 'perfect_bonus',
        value: 50,
        duration: 5,
    },

    POINT_BOOST: {
        id: 'point_boost',
        name: 'Point Boost',
        description: '+20 extra points per correct answer',
        icon: '💎',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        effect: 'flat_bonus',
        value: 20,
        duration: 5,
    },

    // UTILITY PERKS
    PRICE_HINT: {
        id: 'price_hint',
        name: 'Price Hint',
        description: 'Shows the price range for the next 3 rounds',
        icon: '🔮',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.RARE,
        effect: 'price_range',
        value: 1,
        duration: 3,
    },

    SLOW_TIME: {
        id: 'slow_time',
        name: 'Slow Motion',
        description: 'Timer runs 50% slower for 5 rounds',
        icon: '⏱️',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.EPIC,
        effect: 'slow_time',
        value: 0.5, // 50% slower
        duration: 5,
    },

    STATISTICS: {
        id: 'statistics',
        name: 'Statistics',
        description: 'Shows the average price of both cards',
        icon: '📊',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.COMMON,
        effect: 'show_average',
        value: 1,
        duration: 3,
    },

    SKIP_CARD: {
        id: 'skip_card',
        name: 'Skip Card',
        description: 'Skip a card pair without penalty (manually activated)',
        icon: '⭐',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.COMMON,
        effect: 'skip',
        value: 1,
        duration: -1,
        manual: true,
        consumable: true, // Can be selected again after being used
    },
};

// Rarity weighting for random drawing
export const RARITY_WEIGHTS = {
    [PERK_RARITY.COMMON]: 60,
    [PERK_RARITY.RARE]: 30,
    [PERK_RARITY.EPIC]: 10,
};

// Config
export const PERK_CONFIG = {
    ROUNDS_BETWEEN_PERKS: 5, // Perks every 5 rounds
    PERKS_TO_CHOOSE: 3, // Number of perks to choose from
};