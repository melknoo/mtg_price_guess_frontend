// Synergy-Tags — identisch mit RELIC_TAGS aus relicDefinitions.js
// (Import vermieden um Zirkelabhängigkeit zu verhindern)
export const PERK_TAGS = {
    STREAK: 'streak',
    SPEED: 'speed',
    SCORE: 'score',   // deprecated — wird durch GOLD ersetzt
    GOLD: 'gold',     // NEU: Perks die Gold-Rewards beeinflussen
    DEFENSE: 'defense',
    XP: 'xp',
    LUCK: 'luck',
    FAKE: 'fake',
    SACRIFICE: 'sacrifice',
};

export const PERK_TYPES = {
    DEFENSIVE: 'defensive',
    OFFENSIVE: 'offensive',
    UTILITY: 'utility',
    FILTER: 'filter', // Legacy — kept for backward compat, no active filter perks remain
};

export const PERK_SLOT_TYPES = {
    PASSIVE: 'passive',
    UTILITY: 'utility',
};

export const PERK_RARITY = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary',
};

// Legacy export — kept so existing imports don't break (FilterOddsModal etc.)
export const FILTER_EFFECTS = {
    COLOR_EXCLUDE: 'color_exclude_filter',
    CMC_EXCLUDE: 'cmc_exclude_filter',
    RARITY_EXCLUDE: 'rarity_exclude_filter',
    TYPE_EXCLUDE: 'type_exclude_filter',
    COLOR_BOOST: 'color_boost_filter',
    CMC_BOOST: 'cmc_boost_filter',
    BORDER_BOOST: 'border_boost_filter',
    RARITY_BOOST: 'rarity_boost_filter',
    TYPE_BOOST: 'type_boost_filter',
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
        tags: [PERK_TAGS.DEFENSE],
        effect: 'heart_regen',
        value: 5,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
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
        slotType: PERK_SLOT_TYPES.UTILITY,
        maxCharges: 1,
    },

    TIME_BUFFER: {
        id: 'time_buffer',
        name: 'Time Buffer',
        description: '+1 second extra time per round',
        icon: '⏰',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SPEED, PERK_TAGS.DEFENSE],
        effect: 'time_bonus',
        value: 1,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    TIME_BUFFER_EXTENDED: {
        id: 'time_buffer_extended',
        name: 'Time Buffer+',
        description: '+2 seconds extra time per round',
        icon: '⏰',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.SPEED, PERK_TAGS.DEFENSE],
        effect: 'time_bonus',
        value: 6,
        duration: 7,
        basePerkId: 'time_buffer',
        isExtended: true,
        bonusDuration: 2,
    },

    // ==================== OFFENSIVE PERKS ====================
    DOUBLE_POINTS: {
        id: 'double_points',
        name: 'Double Gold',
        description: 'Multiply all Gold earned by x1.5',
        icon: '⚡',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.GOLD],
        effect: 'point_multiplier',
        value: 1.5,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    DOUBLE_POINTS_EXTENDED: {
        id: 'double_points_extended',
        name: 'Double Gold+',
        description: 'Multiply all Gold earned by x2',
        icon: '⚡',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.GOLD],
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
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    PERFECTIONIST: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: '×2 XP when you answer at full time',
        icon: '🎯',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.SPEED, PERK_TAGS.XP],
        effect: 'perfect_multiplier',
        value: 2,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    PERFECTIONIST_EXTENDED: {
        id: 'perfectionist_extended',
        name: 'Perfectionist+',
        description: 'x3 XP when you answer at full time',
        icon: '🎯',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.SPEED, PERK_TAGS.XP],
        effect: 'perfect_multiplier',
        value: 3,
        duration: 7,
        basePerkId: 'perfectionist',
        isExtended: true,
        bonusDuration: 2,
    },

    POINT_BOOST: {
        id: 'point_boost',
        name: 'XP Boost',
        description: '+8 extra XP per correct answer',
        icon: '💎',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.XP],
        effect: 'flat_bonus',
        value: 8,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    POINT_BOOST_EXTENDED: {
        id: 'point_boost_extended',
        name: 'XP Boost+',
        description: '+16 extra XP per correct answer',
        icon: '💎',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.XP],
        effect: 'flat_bonus',
        value: 30,
        duration: 9,
        basePerkId: 'point_boost',
        isExtended: true,
        bonusDuration: 2,
    },

    // ==================== UTILITY PERKS ====================
    SLOW_TIME: {
        id: 'slow_time',
        name: 'Slow Motion',
        description: 'Timer runs at 75% speed',
        icon: '⏱️',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.SPEED],
        effect: 'slow_time',
        value: 0.75,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    SLOW_TIME_EXTENDED: {
        id: 'slow_time_extended',
        name: 'Slow Motion+',
        description: 'Timer runs at 60% speed',
        icon: '⏱️',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.SPEED],
        effect: 'slow_time',
        value: 0.6,
        duration: 7,
        basePerkId: 'slow_time',
        isExtended: true,
        bonusDuration: 2,
    },

    SET_REVEAL: {
        id: 'set_reveal',
        name: 'Set Reveal',
        description: 'Shows the set of both cards',
        icon: '📖',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.LUCK],
        effect: 'show_set',
        value: 1,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
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
        slotType: PERK_SLOT_TYPES.UTILITY,
        maxCharges: 1,
        rechargeRule: 'stage_start',
    },

    // ==================== BALATRO-STYLE PERKS ====================

    GAMBLER: {
        id: 'gambler',
        name: 'Gambler',
        description: '60% chance ×2 Gold, 40% chance ×0 — every answer',
        icon: '🎲',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.LUCK],
        effect: 'gambler_roll',
        value: 0.6,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    CHAIN_LIGHTNING: {
        id: 'chain_lightning',
        name: 'Chain Lightning',
        description: '+0.25x Gold multiplier per consecutive correct answer (resets on wrong)',
        icon: '⚡',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.STREAK, PERK_TAGS.GOLD],
        effect: 'chain_lightning_counter',
        value: 0.25,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    TIME_BOMB: {
        id: 'time_bomb',
        name: 'Time Bomb',
        description: 'On expiry: correct answers ×15 as bonus XP',
        icon: '💣',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.LEGENDARY,
        tags: [PERK_TAGS.XP],
        effect: 'time_bomb_counter',
        value: 15,
        duration: 8,
    },

    DEAD_MANS_HAND: {
        id: 'dead_mans_hand',
        name: "Dead Man's Hand",
        description: 'At 1 life: ×5 Gold. Wrong answer = instant death.',
        icon: '☠️',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.SACRIFICE, PERK_TAGS.GOLD],
        effect: 'dead_mans_hand',
        value: 5,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    MIRROR_IMAGE: {
        id: 'mirror_image',
        name: 'Mirror Image',
        description: 'XP gains also add 35% as Gold each answer',
        icon: '🪞',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.XP, PERK_TAGS.GOLD],
        effect: 'mirror_image',
        value: 0.35,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    OVERCLOCK: {
        id: 'overclock',
        name: 'Overclock',
        description: 'Timer 2× faster, but Gold ×2',
        icon: '⚙️',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SPEED, PERK_TAGS.GOLD],
        effect: 'overclock',
        value: 2,
        duration: 4,
    },

    SACRIFICE_RITUAL: {
        id: 'sacrifice_ritual',
        name: 'Sacrifice Ritual',
        description: 'Spend 1 life this answer: Gold ×3 (consumable)',
        icon: '🩸',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.SACRIFICE],
        effect: 'sacrifice_ritual',
        value: 3,
        duration: -1,
        manual: true,
        consumable: true,
        slotType: PERK_SLOT_TYPES.UTILITY,
    },

    ADRENALINE: {
        id: 'adrenaline',
        name: 'Adrenaline',
        description: '+10% XP multiplier per active perk (including self)',
        icon: '💉',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.XP, PERK_TAGS.STREAK],
        effect: 'adrenaline_mult',
        value: 0.1,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    WILDCARD: {
        id: 'wildcard',
        name: 'Wildcard',
        description: 'Random Gold bonus each answer: ×2, ×3, +10G, +25G, or nothing',
        icon: '🃏',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.LUCK],
        effect: 'wildcard',
        value: 1,
        duration: 5,
    },

    COMPOUND_INTEREST: {
        id: 'compound_interest',
        name: 'Compound Interest',
        description: 'Accumulates +10 per correct answer — pays out as bonus XP on expiry',
        icon: '📈',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.XP],
        effect: 'compound_interest',
        value: 10,
        duration: 7,
    },

    ECHO_CHAMBER: {
        id: 'echo_chamber',
        name: 'Echo Chamber',
        description: "Repeats last answer's Gold bonus on the current answer",
        icon: '🔁',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.GOLD],
        effect: 'echo_chamber',
        value: 1,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    BLOODLUST: {
        id: 'bloodlust',
        name: 'Bloodlust',
        description: 'Wrong answers charge +10G each — next correct answer cashes out all charges',
        icon: '🔴',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.STREAK, PERK_TAGS.GOLD],
        effect: 'bloodlust_charges',
        value: 10,
        duration: 6,
    },

    ROULETTE: {
        id: 'roulette',
        name: 'Roulette',
        description: 'Gold ×(random 1–8) each answer',
        icon: '🎰',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.LUCK],
        effect: 'roulette',
        value: 8,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    GLASS_MIND: {
        id: 'glass_mind',
        name: 'Glass Mind',
        description: 'Perfect answers ×3 Gold. Wrong answers cost 2 lives.',
        icon: '🔮',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.SACRIFICE, PERK_TAGS.GOLD],
        effect: 'glass_mind',
        value: 3,
        duration: 5,
    },

    MOMENTUM_PERK: {
        id: 'momentum_perk',
        name: 'Momentum',
        description: '+3 Gold stacking per consecutive correct answer (resets on wrong)',
        icon: '🚀',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.STREAK, PERK_TAGS.GOLD],
        effect: 'momentum_flat',
        value: 3,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    TREASURE_MAP_PERK: {
        id: 'treasure_map_perk',
        name: 'Treasure Map',
        description: '+12 Gold per correct answer, but XP is halved',
        icon: '🗺️',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.GOLD, PERK_TAGS.SACRIFICE],
        effect: 'treasure_map_gold',
        value: 12,
        xpMultiplier: 0.5,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
    },

    OVERCAUTIOUS: {
        id: 'overcautious',
        name: 'Overcautious',
        description: 'Timer +5s, but Gold capped at 50 per answer',
        icon: '🐢',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.EPIC,
        tags: [PERK_TAGS.DEFENSE, PERK_TAGS.GOLD],
        effect: 'overcautious',
        value: 50,
        duration: -1,
        slotType: PERK_SLOT_TYPES.PASSIVE,
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

// Legacy helpers — kept for backward compat (no active filter perks remain)
export const isFilterPerk = (_perkId) => false;
export const getActiveFilters = (_activePerks) => [];

// Rarity weighting for random drawing
export const RARITY_WEIGHTS = {
    [PERK_RARITY.COMMON]: 60,
    [PERK_RARITY.RARE]: 30,
    [PERK_RARITY.EPIC]: 10,
    [PERK_RARITY.LEGENDARY]: 3,
};

// Config
export const PERK_CONFIG = {
    ROUNDS_BETWEEN_PERKS: 5,
    PERKS_TO_CHOOSE: 3,
    STARTING_PASSIVE_SLOTS: 3,
    MAX_PASSIVE_SLOTS: 5,
    STARTING_UTILITY_SLOTS: 1,
    MAX_UTILITY_SLOTS: 2,
};
