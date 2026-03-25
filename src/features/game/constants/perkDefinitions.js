// Synergy-Tags — identisch mit RELIC_TAGS aus relicDefinitions.js
// (Import vermieden um Zirkelabhängigkeit zu verhindern)
export const PERK_TAGS = {
    STREAK: 'streak',
    SPEED: 'speed',
    SCORE: 'score',
    DEFENSE: 'defense',
    XP: 'xp',
    LUCK: 'luck',
};

export const PERK_TYPES = {
    DEFENSIVE: 'defensive',
    OFFENSIVE: 'offensive',
    UTILITY: 'utility',
    FILTER: 'filter' // NEU: Filter-Perks
};

export const PERK_RARITY = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic'
};

// Filter-Effekt-Typen
export const FILTER_EFFECTS = {
    COLOR: 'color_filter',
    CMC: 'cmc_filter',
    BORDER: 'border_filter',
    RARITY: 'rarity_filter'
};

export const PERKS = {
    // ==================== EXISTING DEFENSIVE PERKS ====================
    HEART_REGENERATION: {
        id: 'heart_regeneration',
        name: 'Heart Regeneration',
        description: 'Regenerate 1 life after 5 correct answers (not consecutive)',
        icon: '💖',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.DEFENSE],
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
        tags: [PERK_TAGS.DEFENSE],
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
        tags: [PERK_TAGS.SPEED, PERK_TAGS.DEFENSE],
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
        tags: [PERK_TAGS.SPEED, PERK_TAGS.DEFENSE],
        effect: 'time_bonus',
        value: 5,
        duration: 7,
        basePerkId: 'time_buffer',
        isExtended: true,
        bonusDuration: 2,
    },

    // ==================== EXISTING OFFENSIVE PERKS ====================
    DOUBLE_POINTS: {
        id: 'double_points',
        name: 'Double Points',
        description: 'Double all points for the next 5 rounds',
        icon: '⚡',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.SCORE],
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
        tags: [PERK_TAGS.SCORE],
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
        tags: [PERK_TAGS.STREAK],
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
        tags: [PERK_TAGS.SPEED, PERK_TAGS.SCORE],
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
        tags: [PERK_TAGS.SPEED, PERK_TAGS.SCORE],
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
        tags: [PERK_TAGS.SCORE],
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
        tags: [PERK_TAGS.SCORE],
        effect: 'flat_bonus',
        value: 20,
        duration: 9,
        basePerkId: 'point_boost',
        isExtended: true,
        bonusDuration: 2,
    },

    // ==================== EXISTING UTILITY PERKS ====================
    PRICE_HINT: {
        id: 'price_hint',
        name: 'Price Hint',
        description: 'Shows the price range for the next 10 rounds',
        icon: '🔮',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.LUCK],
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
        tags: [PERK_TAGS.SPEED],
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
        tags: [PERK_TAGS.SPEED],
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
        tags: [PERK_TAGS.LUCK],
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
        tags: [PERK_TAGS.LUCK],
        effect: 'skip',
        value: 1,
        duration: -1,
        manual: true,
        consumable: true,
    },

    // ==================== NEW FILTER PERKS - COLOR ====================
    RED_FOCUS: {
        id: 'red_focus',
        name: 'Red Focus',
        description: 'More red cards appear (10 rounds)',
        icon: '🔴',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'R',
        duration: 10,
        filterType: 'color'
    },

    GREEN_FOCUS: {
        id: 'green_focus',
        name: 'Green Focus',
        description: 'More green cards appear (10 rounds)',
        icon: '🟢',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'G',
        duration: 10,
        filterType: 'color'
    },

    BLUE_FOCUS: {
        id: 'blue_focus',
        name: 'Blue Focus',
        description: 'More blue cards appear (10 rounds)',
        icon: '🔵',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'U',
        duration: 10,
        filterType: 'color'
    },

    BLACK_FOCUS: {
        id: 'black_focus',
        name: 'Black Focus',
        description: 'More black cards appear (10 rounds)',
        icon: '⚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'B',
        duration: 10,
        filterType: 'color'
    },

    WHITE_FOCUS: {
        id: 'white_focus',
        name: 'White Focus',
        description: 'More white cards appear (10 rounds)',
        icon: '⚪',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'W',
        duration: 10,
        filterType: 'color'
    },

    MULTICOLOR_FOCUS: {
        id: 'multicolor_focus',
        name: 'Multicolor Focus',
        description: 'More multicolor cards (2+ colors) appear (10 rounds)',
        icon: '🌈',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR,
        value: 'multicolor',
        duration: 10,
        filterType: 'color'
    },

    COLORLESS_FOCUS: {
        id: 'colorless_focus',
        name: 'Colorless Focus',
        description: 'More colorless/artifact cards appear (10 rounds)',
        icon: '⚙️',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR,
        value: 'colorless',
        duration: 10,
        filterType: 'color'
    },

    // ==================== NEW FILTER PERKS - CMC ====================
    LOW_COST_FOCUS: {
        id: 'low_cost_focus',
        name: 'Low Cost Focus',
        description: 'More cards with CMC ≤ 3 appear (10 rounds)',
        icon: '1️⃣',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.CMC,
        value: { operator: '<=', threshold: 3 },
        duration: 10,
        filterType: 'cmc'
    },

    MID_COST_FOCUS: {
        id: 'mid_cost_focus',
        name: 'Mid Cost Focus',
        description: 'More cards with CMC 4-6 appear (10 rounds)',
        icon: '4️⃣',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.CMC,
        value: { operator: 'between', min: 4, max: 6 },
        duration: 10,
        filterType: 'cmc'
    },

    HIGH_COST_FOCUS: {
        id: 'high_cost_focus',
        name: 'High Cost Focus',
        description: 'More cards with CMC ≥ 7 appear (10 rounds)',
        icon: '7️⃣',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.CMC,
        value: { operator: '>=', threshold: 7 },
        duration: 10,
        filterType: 'cmc'
    },

    // ==================== NEW FILTER PERKS - BORDER ====================
    BLACK_BORDER_FOCUS: {
        id: 'black_border_focus',
        name: 'Black Border Focus',
        description: 'More black border cards appear (10 rounds)',
        icon: '🖤',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.BORDER,
        value: 'black',
        duration: 10,
        filterType: 'border_color'
    },

    WHITE_BORDER_FOCUS: {
        id: 'white_border_focus',
        name: 'White Border Focus',
        description: 'More white border cards appear (10 rounds)',
        icon: '🤍',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.BORDER,
        value: 'white',
        duration: 10,
        filterType: 'border_color'
    },

    // ==================== NEW FILTER PERKS - RARITY ====================
    COMMON_FOCUS: {
        id: 'common_focus',
        name: 'Common Focus',
        description: 'More common cards appear (10 rounds)',
        icon: '⬛',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.RARITY,
        value: 'common',
        duration: 10,
        filterType: 'rarity'
    },

    UNCOMMON_FOCUS: {
        id: 'uncommon_focus',
        name: 'Uncommon Focus',
        description: 'More uncommon cards appear (10 rounds)',
        icon: '🔷',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.RARITY,
        value: 'uncommon',
        duration: 10,
        filterType: 'rarity'
    },

    RARE_FOCUS: {
        id: 'rare_focus',
        name: 'Rare Focus',
        description: 'More rare cards appear (10 rounds)',
        icon: '🟡',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.RARITY,
        value: 'rare',
        duration: 10,
        filterType: 'rarity'
    },

    MYTHIC_FOCUS: {
        id: 'mythic_focus',
        name: 'Mythic Focus',
        description: 'More mythic rare cards appear (8 rounds)',
        icon: '🔶',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.EPIC,
        effect: FILTER_EFFECTS.RARITY,
        value: 'mythic',
        duration: 8,
        filterType: 'rarity'
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

// Helper: Check if perk is a filter perk
export const isFilterPerk = (perkId) => {
    const perk = Object.values(PERKS).find(p => p.id === perkId);
    return perk?.type === PERK_TYPES.FILTER;
};

// Helper: Get all active filter perks
export const getActiveFilters = (activePerks) => {
    return activePerks.filter(p => p.type === PERK_TYPES.FILTER);
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