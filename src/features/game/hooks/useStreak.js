import { useState, useCallback } from 'react';
import { GAME_CONFIG, SCORE_CONFIG } from '../../../shared/utils/constants';

export const useStreak = () => {
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showStreakBonus, setShowStreakBonus] = useState(false);

  const incrementStreak = useCallback(() => {
    setStreak((prev) => {
      const newStreak = prev + 1;
      
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }

      if (newStreak % GAME_CONFIG.STREAK_BONUS_THRESHOLD === 0) {
        setShowStreakBonus(true);
        setTimeout(() => setShowStreakBonus(false), 2000);
      }

      return newStreak;
    });
  }, [bestStreak]);

  const resetStreak = useCallback(() => {
    setStreak(0);
    setShowStreakBonus(false);
  }, []);

  const calculateStreakBonus = useCallback(() => {
    if (streak < GAME_CONFIG.STREAK_BONUS_THRESHOLD) {
      return 0;
    }
    return Math.floor(streak / SCORE_CONFIG.STREAK_BONUS_DIVISOR) * SCORE_CONFIG.STREAK_BONUS_POINTS;
  }, [streak]);

  const setStreakValue = useCallback((value) => {
    setStreak(Math.max(0, Math.floor(value)));
  }, []);

  const reset = useCallback(() => {
    setStreak(0);
    setBestStreak(0);
    setShowStreakBonus(false);
  }, []);

  const getStreakColor = useCallback(() => {
    if (streak >= 10) return 'text-purple-400';
    if (streak >= 5) return 'text-orange-400';
    if (streak >= 3) return 'text-yellow-400';
    return 'text-white';
  }, [streak]);

  return {
    streak,
    bestStreak,
    showStreakBonus,
    incrementStreak,
    resetStreak,
    setStreakValue,
    calculateStreakBonus,
    getStreakColor,
    reset,
    hasStreakBonus: streak >= GAME_CONFIG.STREAK_BONUS_THRESHOLD,
  };
};