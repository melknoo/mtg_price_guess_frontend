import { useState, useEffect, useCallback } from 'react';
import { GAME_CONFIG } from '../../../shared/utils/constants';

export const useGameTimer = ({ 
  onTimeUp, 
  enabled = true,
  duration = GAME_CONFIG.TIMER_DURATION,
  speed = 1 // Neue Option: 1 = normal, 0.5 = halb so schnell (Slow Time Perk)
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
      // Multipliziere den Tick mit speed: 
      // speed = 1 → normale Geschwindigkeit
      // speed = 0.5 → halbe Geschwindigkeit (Slow Time Perk)
      setTimeLeft((prev) => Math.max(prev - (GAME_CONFIG.TIMER_TICK * speed), 0));
    }, GAME_CONFIG.TIMER_TICK * 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, enabled, onTimeUp, speed]);

  // Update timeLeft wenn duration sich ändert (Time Buffer Perk)
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  return {
    timeLeft,
    isRunning,
    start,
    stop,
    reset,
    progress: (timeLeft / duration) * 100,
  };
};