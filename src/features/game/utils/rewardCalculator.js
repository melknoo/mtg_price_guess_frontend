import { REWARD_CONFIG, SCORE_CONFIG } from '../../../shared/utils/constants';

// Berechnet Basis-Gold pro korrekter Antwort (ohne Perk-Effekte)
// Streak-Boni werden separat in Game.jsx via handleChoice-Logik angewendet
export const calculateBaseGold = () => {
  return REWARD_CONFIG.BASE_GOLD;
};

// Berechnet Streak-Gold-Bonus — exponentiell ab Streak 5 (pro Antwort)
export const calculateStreakGold = (streak) => {
  if (streak < 5) return 0;
  return Math.floor(streak * 0.4);
};

// Streak-XP-Bonus — gleiche Kurve wie Gold (ab Streak 5, pro Antwort)
export const calculateStreakXP = (streak) => {
  if (streak < 5) return 0;
  return Math.floor(streak * 0.4);
};

// Berechnet Timer-Bonus als XP (Schnelligkeit = Wissen = XP)
export const calculateTimeBonusXP = (timeLeft) => {
  return Math.ceil(timeLeft * REWARD_CONFIG.TIME_BONUS_XP_MULTIPLIER);
};

// Basis-XP pro korrekter Antwort
export const calculateBaseXP = () => {
  return REWARD_CONFIG.BASE_XP;
};

// Exponentieller Streak-Bonus für Hot Streak Synergy (bleibt auf Gold)
export const calculateHotStreakGoldBonus = (streak) => {
  if (streak < 5) return 0;
  const blocks = Math.floor(streak / SCORE_CONFIG.STREAK_BONUS_DIVISOR);
  return SCORE_CONFIG.STREAK_BONUS_POINTS * (Math.pow(2, blocks) - 1);
};

export const formatRewardMessage = (goldGain, xpGain) => {
  let message = `Correct! +${goldGain}G +${xpGain}XP`;
  return message;
};
