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
        name: 'Zweite Chance',
        description: 'Dein nächster Fehler zählt nicht',
        icon: '💚',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.EPIC,
        effect: 'shield',
        value: 1,
        duration: 3, // 1 Fehler
    },

    TIME_BUFFER: {
        id: 'time_buffer',
        name: 'Zeitpuffer',
        description: '+5 Sekunden zusätzliche Zeit pro Runde',
        icon: '⏰',
        type: PERK_TYPES.DEFENSIVE,
        rarity: PERK_RARITY.COMMON,
        effect: 'time_bonus',
        value: 5,
        duration: 5, // 5 Runden
    },

    // OFFENSIVE PERKS
    DOUBLE_POINTS: {
        id: 'double_points',
        name: 'Doppelte Punkte',
        description: 'Verdopple alle Punkte für die nächsten 5 Runden',
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
        description: 'Streak Bonus schon ab 3 statt 5 richtigen Antworten',
        icon: '🔥',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        effect: 'streak_threshold',
        value: 3,
        duration: -1, // Permanent für dieses Spiel
    },

    PERFECTIONIST: {
        id: 'perfectionist',
        name: 'Perfektionist',
        description: '+50 Bonus wenn du bei voller Zeit antwortest',
        icon: '🎯',
        type: PERK_TYPES.OFFENSIVE,
        rarity: PERK_RARITY.RARE,
        effect: 'perfect_bonus',
        value: 50,
        duration: 5,
    },

    POINT_BOOST: {
        id: 'point_boost',
        name: 'Punkte Boost',
        description: '+20 Extra-Punkte pro richtiger Antwort',
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
        name: 'Preis-Hinweis',
        description: 'Zeigt die Preisspanne für die nächsten 3 Runden',
        icon: '🔮',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.RARE,
        effect: 'price_range',
        value: 1,
        duration: 3,
    },

    SLOW_TIME: {
        id: 'slow_time',
        name: 'Zeitlupe',
        description: 'Der Timer läuft 50% langsamer für 5 Runden',
        icon: '⏱️',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.EPIC,
        effect: 'slow_time',
        value: 0.5, // 50% langsamer
        duration: 5,
    },

    STATISTICS: {
        id: 'statistics',
        name: 'Statistik',
        description: 'Zeigt den Durchschnittspreis beider Karten',
        icon: '📊',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.COMMON,
        effect: 'show_average',
        value: 1,
        duration: 3,
    },

    SKIP_CARD: {
        id: 'skip_card',
        name: 'Karte Überspringen',
        description: 'Überspringe ein Kartenpaar ohne Strafe (manuell aktivierbar)',
        icon: '⏭️',
        type: PERK_TYPES.UTILITY,
        rarity: PERK_RARITY.COMMON,
        effect: 'skip',
        value: 1,
        duration: -1,
        manual: true,
    },
};

// Gewichtung für Rarity beim zufälligen Ziehen
export const RARITY_WEIGHTS = {
    [PERK_RARITY.COMMON]: 60,
    [PERK_RARITY.RARE]: 30,
    [PERK_RARITY.EPIC]: 10,
};

// Config
export const PERK_CONFIG = {
    ROUNDS_BETWEEN_PERKS: 5, // Alle 5 Runden gibt es Perks
    PERKS_TO_CHOOSE: 3, // Anzahl der zur Auswahl stehenden Perks
};