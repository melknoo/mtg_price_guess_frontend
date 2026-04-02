// Synergy-Tags — identisch mit RELIC_TAGS aus relicDefinitions.js
// (Import vermieden um Zirkelabhängigkeit zu verhindern)
export const PERK_TAGS = {
    STREAK: 'streak',
    SPEED: 'speed',
    SCORE: 'score',
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
    COLOR_EXCLUDE: 'color_exclude_filter',
    CMC: 'cmc_filter',
    CMC_EXCLUDE: 'cmc_exclude_filter',
    BORDER: 'border_filter',
    RARITY: 'rarity_filter',
    RARITY_EXCLUDE: 'rarity_exclude_filter',
    TYPE: 'type_filter',
    TYPE_EXCLUDE: 'type_exclude_filter',
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
        description: '+3 seconds extra time per round (5 rounds)',
        icon: '⏰',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SPEED, PERK_TAGS.DEFENSE],
        effect: 'time_bonus',
        value: 3,
        duration: 5,
    },

    TIME_BUFFER_EXTENDED: {
        id: 'time_buffer_extended',
        name: 'Time Buffer+',
        description: '+6 seconds extra time per round (7 rounds)',
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
        description: '+10 extra points per correct answer (7 rounds)',
        icon: '💎',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SCORE],
        effect: 'flat_bonus',
        value: 10,
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
        description: 'Timer runs at 40% speed (5 rounds)',
        icon: '⏱️',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.RARE,
        tags: [PERK_TAGS.SPEED],
        effect: 'slow_time',
        value: 0.4,
        duration: 5,
    },

    SLOW_TIME_EXTENDED: {
        id: 'slow_time_extended',
        name: 'Slow Motion+',
        description: 'Timer runs at 60% speed (7 rounds)',
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
        description: 'Shows the set of both cards for 7 rounds',
        icon: '📖',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.LUCK],
        effect: 'show_set',
        value: 1,
        duration: 7,
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
        description: 'Only red cards appear',
        icon: '🔴',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'R',
        duration: -1,
        filterType: 'color'
    },

    GREEN_FOCUS: {
        id: 'green_focus',
        name: 'Green Focus',
        description: 'Only green cards appear',
        icon: '🟢',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'G',
        duration: -1,
        filterType: 'color'
    },

    BLUE_FOCUS: {
        id: 'blue_focus',
        name: 'Blue Focus',
        description: 'Only blue cards appear',
        icon: '🔵',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'U',
        duration: -1,
        filterType: 'color'
    },

    BLACK_FOCUS: {
        id: 'black_focus',
        name: 'Black Focus',
        description: 'Only black cards appear',
        icon: '⚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'B',
        duration: -1,
        filterType: 'color'
    },

    WHITE_FOCUS: {
        id: 'white_focus',
        name: 'White Focus',
        description: 'Only white cards appear',
        icon: '⚪',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.COLOR,
        value: 'W',
        duration: -1,
        filterType: 'color'
    },

    MULTICOLOR_FOCUS: {
        id: 'multicolor_focus',
        name: 'Multicolor Focus',
        description: 'Only multicolor cards (2+ colors) appear',
        icon: '🌈',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR,
        value: 'multicolor',
        duration: -1,
        filterType: 'color'
    },

    COLORLESS_FOCUS: {
        id: 'colorless_focus',
        name: 'Colorless Focus',
        description: 'Only colorless/artifact cards appear',
        icon: '⚙️',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR,
        value: 'colorless',
        duration: -1,
        filterType: 'color'
    },

    // ==================== FILTER PERKS - COLOR EXCLUDE ====================
    NO_RED: {
        id: 'no_red',
        name: 'No Red',
        description: 'Red cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR_EXCLUDE,
        value: 'R',
        duration: -1,
        filterType: 'color',
        tags: [PERK_TAGS.LUCK],
    },

    NO_GREEN: {
        id: 'no_green',
        name: 'No Green',
        description: 'Green cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR_EXCLUDE,
        value: 'G',
        duration: -1,
        filterType: 'color',
        tags: [PERK_TAGS.LUCK],
    },

    NO_BLUE: {
        id: 'no_blue',
        name: 'No Blue',
        description: 'Blue cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR_EXCLUDE,
        value: 'U',
        duration: -1,
        filterType: 'color',
        tags: [PERK_TAGS.LUCK],
    },

    NO_BLACK: {
        id: 'no_black',
        name: 'No Black',
        description: 'Black cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR_EXCLUDE,
        value: 'B',
        duration: -1,
        filterType: 'color',
        tags: [PERK_TAGS.LUCK],
    },

    NO_WHITE: {
        id: 'no_white',
        name: 'No White',
        description: 'White cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR_EXCLUDE,
        value: 'W',
        duration: -1,
        filterType: 'color',
        tags: [PERK_TAGS.LUCK],
    },

    NO_MULTICOLOR: {
        id: 'no_multicolor',
        name: 'Mono Only',
        description: 'Multicolor cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR_EXCLUDE,
        value: 'multicolor',
        duration: -1,
        filterType: 'color',
        tags: [PERK_TAGS.LUCK],
    },

    NO_COLORLESS: {
        id: 'no_colorless',
        name: 'No Colorless',
        description: 'Colorless cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.COLOR_EXCLUDE,
        value: 'colorless',
        duration: -1,
        filterType: 'color',
        tags: [PERK_TAGS.LUCK],
    },

    // ==================== NEW FILTER PERKS - CMC ====================
    LOW_COST_FOCUS: {
        id: 'low_cost_focus',
        name: 'Low Cost Focus',
        description: 'Only cards with CMC ≤ 3 appear',
        icon: '1️⃣',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.CMC,
        value: { operator: '<=', threshold: 3 },
        duration: -1,
        filterType: 'cmc'
    },

    MID_COST_FOCUS: {
        id: 'mid_cost_focus',
        name: 'Mid Cost Focus',
        description: 'Only cards with CMC 4–6 appear',
        icon: '4️⃣',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.CMC,
        value: { operator: 'between', min: 4, max: 6 },
        duration: -1,
        filterType: 'cmc'
    },

    HIGH_COST_FOCUS: {
        id: 'high_cost_focus',
        name: 'High Cost Focus',
        description: 'Only cards with CMC ≥ 7 appear',
        icon: '7️⃣',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.CMC,
        value: { operator: '>=', threshold: 7 },
        duration: -1,
        filterType: 'cmc'
    },

    // ==================== FILTER PERKS - CMC EXCLUDE ====================
    NO_LOW_COST: {
        id: 'no_low_cost',
        name: 'No Cheap Cards',
        description: 'Cards with CMC ≤ 3 no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.CMC_EXCLUDE,
        value: 'low',
        duration: -1,
        filterType: 'cmc',
        tags: [PERK_TAGS.LUCK],
    },

    NO_MID_COST: {
        id: 'no_mid_cost',
        name: 'No Mid Cards',
        description: 'Cards with CMC 4–6 no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.CMC_EXCLUDE,
        value: 'mid',
        duration: -1,
        filterType: 'cmc',
        tags: [PERK_TAGS.LUCK],
    },

    NO_HIGH_COST: {
        id: 'no_high_cost',
        name: 'No Big Spells',
        description: 'Cards with CMC ≥ 7 no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.EPIC,
        effect: FILTER_EFFECTS.CMC_EXCLUDE,
        value: 'high',
        duration: -1,
        filterType: 'cmc',
        tags: [PERK_TAGS.LUCK],
    },

    // ==================== NEW FILTER PERKS - BORDER ====================
    BLACK_BORDER_FOCUS: {
        id: 'black_border_focus',
        name: 'Black Border Focus',
        description: 'Only black border cards appear',
        icon: '🖤',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.BORDER,
        value: 'black',
        duration: -1,
        filterType: 'border_color'
    },

    WHITE_BORDER_FOCUS: {
        id: 'white_border_focus',
        name: 'White Border Focus',
        description: 'Only white border cards appear',
        icon: '🤍',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.BORDER,
        value: 'white',
        duration: -1,
        filterType: 'border_color'
    },

    // ==================== NEW FILTER PERKS - RARITY ====================
    COMMON_FOCUS: {
        id: 'common_focus',
        name: 'Common Focus',
        description: 'Only common cards appear',
        icon: '⬛',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.RARITY,
        value: 'common',
        duration: -1,
        filterType: 'rarity'
    },

    UNCOMMON_FOCUS: {
        id: 'uncommon_focus',
        name: 'Uncommon Focus',
        description: 'Only uncommon cards appear',
        icon: '🔷',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.RARITY,
        value: 'uncommon',
        duration: -1,
        filterType: 'rarity'
    },

    RARE_FOCUS: {
        id: 'rare_focus',
        name: 'Rare Focus',
        description: 'Only rare cards appear',
        icon: '🟡',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.RARITY,
        value: 'rare',
        duration: -1,
        filterType: 'rarity'
    },

    MYTHIC_FOCUS: {
        id: 'mythic_focus',
        name: 'Mythic Focus',
        description: 'Only mythic rare cards appear',
        icon: '🔶',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.EPIC,
        effect: FILTER_EFFECTS.RARITY,
        value: 'mythic',
        duration: -1,
        filterType: 'rarity'
    },

    // ==================== FILTER PERKS - RARITY EXCLUDE ====================
    NO_COMMON: {
        id: 'no_common',
        name: 'No Commons',
        description: 'Common cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.RARITY_EXCLUDE,
        value: 'common',
        duration: -1,
        filterType: 'rarity',
        tags: [PERK_TAGS.LUCK],
    },

    NO_UNCOMMON: {
        id: 'no_uncommon',
        name: 'No Uncommons',
        description: 'Uncommon cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.RARITY_EXCLUDE,
        value: 'uncommon',
        duration: -1,
        filterType: 'rarity',
        tags: [PERK_TAGS.LUCK],
    },

    NO_RARE: {
        id: 'no_rare',
        name: 'No Rares',
        description: 'Rare cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.EPIC,
        effect: FILTER_EFFECTS.RARITY_EXCLUDE,
        value: 'rare',
        duration: -1,
        filterType: 'rarity',
        tags: [PERK_TAGS.LUCK],
    },

    NO_MYTHIC: {
        id: 'no_mythic',
        name: 'No Mythics',
        description: 'Mythic rare cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.EPIC,
        effect: FILTER_EFFECTS.RARITY_EXCLUDE,
        value: 'mythic',
        duration: -1,
        filterType: 'rarity',
        tags: [PERK_TAGS.LUCK],
    },

    // ==================== NEW FILTER PERKS - TYPE FOCUS ====================
    CREATURE_FOCUS: {
        id: 'creature_focus',
        name: 'Creature Focus',
        description: 'Only creature cards appear',
        icon: '⚔️',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.COMMON,
        effect: FILTER_EFFECTS.TYPE,
        value: 'creature',
        duration: -1,
        filterType: 'type',
        tags: [PERK_TAGS.LUCK],
    },

    INSTANT_SORCERY_FOCUS: {
        id: 'instant_sorcery_focus',
        name: 'Spell Focus',
        description: 'Only instants and sorceries appear',
        icon: '⚡',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.TYPE,
        value: 'instant_sorcery',
        duration: -1,
        filterType: 'type',
        tags: [PERK_TAGS.LUCK],
    },

    ARTIFACT_ENCHANTMENT_FOCUS: {
        id: 'artifact_enchantment_focus',
        name: 'Noncreature Focus',
        description: 'Only artifacts and enchantments appear',
        icon: '🔮',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.TYPE,
        value: 'artifact_enchantment',
        duration: -1,
        filterType: 'type',
        tags: [PERK_TAGS.LUCK],
    },

    LAND_FOCUS: {
        id: 'land_focus',
        name: 'Land Focus',
        description: 'Only land cards appear',
        icon: '🌍',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.EPIC,
        effect: FILTER_EFFECTS.TYPE,
        value: 'land',
        duration: -1,
        filterType: 'type',
        tags: [PERK_TAGS.LUCK],
    },

    // ==================== NEW FILTER PERKS - TYPE EXCLUDE ====================
    NO_LANDS: {
        id: 'no_lands',
        name: 'No Lands',
        description: 'Land cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.TYPE_EXCLUDE,
        value: 'land',
        duration: -1,
        filterType: 'type',
        tags: [PERK_TAGS.LUCK],
    },

    NO_CREATURES: {
        id: 'no_creatures',
        name: 'No Creatures',
        description: 'Creature cards no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.RARE,
        effect: FILTER_EFFECTS.TYPE_EXCLUDE,
        value: 'creature',
        duration: -1,
        filterType: 'type',
        tags: [PERK_TAGS.LUCK],
    },

    NO_INSTANTS_SORCERIES: {
        id: 'no_instants_sorceries',
        name: 'No Spells',
        description: 'Instants and sorceries no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.EPIC,
        effect: FILTER_EFFECTS.TYPE_EXCLUDE,
        value: 'instant_sorcery',
        duration: -1,
        filterType: 'type',
        tags: [PERK_TAGS.LUCK],
    },

    NO_ARTIFACTS_ENCHANTMENTS: {
        id: 'no_artifacts_enchantments',
        name: 'No Artifacts/Enchantments',
        description: 'Artifacts and enchantments no longer appear',
        icon: '🚫',
        type: PERK_TYPES.FILTER,
        rarity: PERK_RARITY.EPIC,
        effect: FILTER_EFFECTS.TYPE_EXCLUDE,
        value: 'artifact_enchantment',
        duration: -1,
        filterType: 'type',
        tags: [PERK_TAGS.LUCK],
    },

    // ==================== COLOR MASTERY PERKS ====================
    WHITE_MASTERY: {
        id: 'white_mastery',
        name: 'Plains Walker',
        description: '+1 point per correct white card guess (stackable)',
        icon: '☀️',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SCORE],
        effect: 'color_bonus',
        colorValue: 'W',
        value: 1,
        duration: -1,
    },

    BLUE_MASTERY: {
        id: 'blue_mastery',
        name: 'Island Sage',
        description: '+1 point per correct blue card guess (stackable)',
        icon: '💧',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SCORE],
        effect: 'color_bonus',
        colorValue: 'U',
        value: 1,
        duration: -1,
    },

    BLACK_MASTERY: {
        id: 'black_mastery',
        name: 'Swamp Lord',
        description: '+1 point per correct black card guess (stackable)',
        icon: '💀',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SCORE],
        effect: 'color_bonus',
        colorValue: 'B',
        value: 1,
        duration: -1,
    },

    RED_MASTERY: {
        id: 'red_mastery',
        name: 'Mountain Kin',
        description: '+1 point per correct red card guess (stackable)',
        icon: '🔥',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SCORE],
        effect: 'color_bonus',
        colorValue: 'R',
        value: 1,
        duration: -1,
    },

    GREEN_MASTERY: {
        id: 'green_mastery',
        name: 'Forest Guide',
        description: '+1 point per correct green card guess (stackable)',
        icon: '🌿',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SCORE],
        effect: 'color_bonus',
        colorValue: 'G',
        value: 1,
        duration: -1,
    },

    COLORLESS_MASTERY: {
        id: 'colorless_mastery',
        name: 'Void Walker',
        description: '+1 point per correct colorless card guess (stackable)',
        icon: '⬡',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.COMMON,
        tags: [PERK_TAGS.SCORE],
        effect: 'color_bonus',
        colorValue: 'colorless',
        value: 1,
        duration: -1,
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