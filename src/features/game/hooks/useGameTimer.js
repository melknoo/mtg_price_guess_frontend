import { useState, useEffect, useCallback } from 'react';
import { GAME_CONFIG } from '../../../shared/utils/constants';

export const useGameTimer = ({ 
  onTimeUp, 
  enabled = true,
  duration = GAME_CONFIG.TIMER_DURATION 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(duration);
    setIsRunning(false);
  }, [duration]);

  useEffect(() => {
    if (!isRunning || !enabled) return;

    if (timeLeft <= 0) {
      setIsRunning(false);
      onTimeUp?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - GAME_CONFIG.TIMER_TICK, 0));
    }, GAME_CONFIG.TIMER_TICK * 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, enabled, onTimeUp]);

  return {
    timeLeft,
    isRunning,
    start,
    stop,
    reset,
    progress: (timeLeft / duration) * 100,
  };
};