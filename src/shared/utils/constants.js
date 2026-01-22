export const GAME_CONFIG = {
    INITIAL_LIVES: 10,
    TIMER_DURATION: 10,
    TIMER_TICK: 0.1,
    PRELOAD_CARDS: 20,
    MIN_CARDS_NEEDED: 2,
    STREAK_BONUS_THRESHOLD: 5,
    STREAK_BONUS_MULTIPLIER: 5,
  };
  
  export const SCORE_CONFIG = {
    BASE_POINTS: 1,
    TIME_BONUS_MULTIPLIER: 1,
    STREAK_BONUS_DIVISOR: 5,
    STREAK_BONUS_POINTS: 5,
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