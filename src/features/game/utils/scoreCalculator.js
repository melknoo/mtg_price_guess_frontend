import { SCORE_CONFIG } from '../../../shared/utils/constants';

export const calculateTimeBonus = (timeLeft) => {
  return Math.ceil(timeLeft * SCORE_CONFIG.TIME_BONUS_MULTIPLIER);
};

export const calculateStreakBonus = (streak) => {
  if (streak < 5) return 0;
  return Math.floor(streak / SCORE_CONFIG.STREAK_BONUS_DIVISOR) * SCORE_CONFIG.STREAK_BONUS_POINTS;
};

export const calculateTotalScore = (timeLeft, streak) => {
  const timeBonus = calculateTimeBonus(timeLeft);
  const streakBonus = calculateStreakBonus(streak);
  return timeBonus + streakBonus;
};

export const formatScoreMessage = (timeBonus, streakBonus) => {
  let message = `✅ Correct! +${timeBonus} Points!`;
  
  if (streakBonus > 0) {
    message += ` 🔥 Streak Bonus: +${streakBonus}`;
  }
  
  return message;
};