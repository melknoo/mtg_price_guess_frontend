export const GAME_CONFIG = {
    INITIAL_LIVES: 5,
    TIMER_DURATION: 10,
    TIMER_TICK: 0.1,
    PRELOAD_CARDS: 20,
    MIN_CARDS_NEEDED: 2,
    STREAK_BONUS_THRESHOLD: 5,
    STREAK_BONUS_MULTIPLIER: 5,
  };
  
  // SCORE_CONFIG deprecated — Score wurde durch Gold + XP ersetzt
  export const SCORE_CONFIG = {
    BASE_POINTS: 1,
    TIME_BONUS_MULTIPLIER: 1,
    STREAK_BONUS_DIVISOR: 5,
    STREAK_BONUS_POINTS: 5,
  };

  // Neues Reward-System: Gold (In-Run-Währung) + XP (Leveling)
  export const REWARD_CONFIG = {
    BASE_GOLD: 2,                  // Gold pro korrekter Antwort (Base)
    STREAK_GOLD_DIVISOR: 5,        // Streak-Schwelle für Gold-Bonus
    STREAK_GOLD_POINTS: 2,         // Gold pro Streak-Block (5er-Schritte)
    STREAK_GOLD_MILESTONE_5: 5,    // Bonus bei 5-Streak
    STREAK_GOLD_MILESTONE_10: 10,  // Bonus bei 10-Streak
    BASE_XP: 10,                   // XP pro korrekter Antwort (Base)
    TIME_BONUS_XP_MULTIPLIER: 1,   // XP pro verbleibender Sekunde (0-10 bonus XP)
  };
  
  export const STORAGE_KEYS = {
    TOKEN: 'token',
    BEST_STREAK: 'bestStreak',
    GAMES_PLAYED: 'gamesPlayed',
  };
  
  export const SCREENS = {
    MENU: 'menu',
    GAME: 'game',
    LEADERBOARD: 'leaderboard',
    LOGIN: 'login',
    FORGOT_PASSWORD: 'forgot-password',
    RESET_PASSWORD: 'reset-password',
  };