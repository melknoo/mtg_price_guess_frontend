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
    // ==================== DEFENSIVE PERKS ====================
    HEART_REGENERATION: {
        id: 'heart_regeneration',
        name: 'Heart Regeneration',
        description: 'Regenerate 1 life after 5 correct answers (not consecutive)',
        icon: '💖',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.RARE,
        effect: 'heart_regen',
        value: 5,
        duration: -1,
    },
    
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
        consumable: true,
    },

    TIME_BUFFER: {
        id: 'time_buffer',
        name: 'Time Buffer',
        description: '+5 seconds extra time per round (5 rounds)',
        icon: '⏰',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.COMMON,
        effect: 'time_bonus',
        value: 5,
        duration: 5,
    },

    TIME_BUFFER_EXTENDED: {
        id: 'time_buffer_extended',
        name: 'Time Buffer+',
        description: '+5 seconds extra time per round (7 rounds)',
        icon: '⏰',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.RARE,
        effect: 'time_bonus',
        value: 5,
        duration: 7,
        basePerkId: 'time_buffer',
        isExtended: true,
        bonusDuration: 2,
    },

    // ==================== OFFENSIVE PERKS ====================
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

    DOUBLE_POINTS_EXTENDED: {
        id: 'double_points_extended',
        name: 'Double Points+',
        description: 'Double all points for the next 7 rounds',
        icon: '⚡',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        effect: 'point_multiplier',
        value: 2,
        duration: 7,
        basePerkId: 'double_points',
        isExtended: true,
        bonusDuration: 2,
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
        duration: -1,
        consumable: false,
    },

    PERFECTIONIST: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: '+50 bonus when you answer at full time (5 rounds)',
        icon: '🎯',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        effect: 'perfect_bonus',
        value: 50,
        duration: 5,
    },

    PERFECTIONIST_EXTENDED: {
        id: 'perfectionist_extended',
        name: 'Perfectionist+',
        description: '+50 bonus when you answer at full time (7 rounds)',
        icon: '🎯',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        effect: 'perfect_bonus',
        value: 50,
        duration: 7,
        basePerkId: 'perfectionist',
        isExtended: true,
        bonusDuration: 2,
    },

    POINT_BOOST: {
        id: 'point_boost',
        name: 'Point Boost',
        description: '+20 extra points per correct answer (7 rounds)',
        icon: '💎',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        effect: 'flat_bonus',
        value: 20,
        duration: 7,
    },

    POINT_BOOST_EXTENDED: {
        id: 'point_boost_extended',
        name: 'Point Boost+',
        description: '+20 extra points per correct answer (9 rounds)',
        icon: '💎',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        effect: 'flat_bonus',
        value: 20,
        duration: 9,
        basePerkId: 'point_boost',
        isExtended: true,
        bonusDuration: 2,
    },

    // ==================== UTILITY PERKS ====================
    PRICE_HINT: {
        id: 'price_hint',
        name: 'Price Hint',
        description: 'Shows the price range for the next 10 rounds',
        icon: '🔮',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.COMMON,
        effect: 'price_range',
        value: 1,
        duration: 10,
    },

    SLOW_TIME: {
        id: 'slow_time',
        name: 'Slow Motion',
        description: 'Timer runs 50% slower (5 rounds)',
        icon: '⏱️',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.RARE,
        effect: 'slow_time',
        value: 0.5,
        duration: 5,
    },

    SLOW_TIME_EXTENDED: {
        id: 'slow_time_extended',
        name: 'Slow Motion+',
        description: 'Timer runs 50% slower (7 rounds)',
        icon: '⏱️',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.EPIC,
        effect: 'slow_time',
        value: 0.5,
        duration: 7,
        basePerkId: 'slow_time',
        isExtended: true,
        bonusDuration: 2,
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
        consumable: true,
    },
};

// Helper: Get base perk ID for extended perks
export const getBasePerkId = (perkId) => {
    const perk = Object.values(PERKS).find(p => p.id === perkId);
    return perk?.basePerkId || perkId;
};

// Helper: Check if perk is extended version
export const isExtendedPerk = (perkId) => {
    const perk = Object.values(PERKS).find(p => p.id === perkId);
    return perk?.isExtended || false;
};

// Helper: Get extended version of a perk
export const getExtendedVersion = (perkId) => {
    return Object.values(PERKS).find(p => p.basePerkId === perkId);
};

// Rarity weighting for random drawing
export const RARITY_WEIGHTS = {
    [PERK_RARITY.COMMON]: 60,
    [PERK_RARITY.RARE]: 30,
    [PERK_RARITY.EPIC]: 10,
};

// Config
export const PERK_CONFIG = {
    ROUNDS_BETWEEN_PERKS: 5,
    PERKS_TO_CHOOSE: 3,
};