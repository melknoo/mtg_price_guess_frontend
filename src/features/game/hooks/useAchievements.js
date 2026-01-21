// src/features/game/hooks/useAchievements.js

import { useState, useCallback, useRef, useEffect } from 'react';
import { ACHIEVEMENTS, getAllAchievements } from '../constants/achievementDefinitions';
import { 
  fetchUserAchievements, 
  unlockAchievements, 
  syncAchievements 
} from '../api/achievementApi';

const LOCAL_STORAGE_KEY = 'magic_price_duel_achievements';

export const useAchievements = (user) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [gameStats, setGameStats] = useState({
    currentStreak: 0,
    currentScore: 0,
    currentRound: 0,
    perksCollected: 0,
    shieldSaves: 0,
    fastestAnswer: Infinity,
    quickAnswers: 0,
    perfectStart: false,
    correctFromStart: 0,
    lastSecondWins: 0,
    comebackStreak: 0,
    biggestDoublePoints: 0,
    wonWithOnLife: false,
    isAfterLifeLoss: false
  });

  const processingRef = useRef(false);
  const pendingUnlocksRef = useRef([]);
  
  const unlockedRef = useRef(new Set());
  const sessionUnlockedRef = useRef(new Set());

  useEffect(() => {
    unlockedRef.current = new Set(unlockedAchievements);
  }, [unlockedAchievements]);

  useEffect(() => {
    loadAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadAchievements = async () => {
    setIsLoading(true);
    sessionUnlockedRef.current = new Set();
    
    try {
      if (user && !user.guest) {
        const serverAchievements = await fetchUserAchievements();
        setUnlockedAchievements(serverAchievements);
        unlockedRef.current = new Set(serverAchievements);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverAchievements));
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setUnlockedAchievements(parsed);
        unlockedRef.current = new Set(parsed);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      setUnlockedAchievements(parsed);
      unlockedRef.current = new Set(parsed);
    } finally {
      setIsLoading(false);
    }
  };

  const syncLocalToServer = useCallback(async () => {
    if (!user || user.guest) return;
    
    const localAchievements = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!localAchievements) return;
    
    const localIds = JSON.parse(localAchievements);
    if (localIds.length === 0) return;

    setIsSyncing(true);
    try {
      await syncAchievements(localIds);
      const serverAchievements = await fetchUserAchievements();
      setUnlockedAchievements(serverAchievements);
      unlockedRef.current = new Set(serverAchievements);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverAchievements));
    } catch (error) {
      console.error('Failed to sync achievements:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  const saveAchievements = useCallback(async (newAchievementIds) => {
    if (newAchievementIds.length === 0) return;

    const allUnlocked = [...unlockedRef.current, ...newAchievementIds];
    const uniqueUnlocked = [...new Set(allUnlocked)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(uniqueUnlocked));
    
    setUnlockedAchievements(uniqueUnlocked);

    if (user && !user.guest) {
      pendingUnlocksRef.current.push(...newAchievementIds);
      
      setTimeout(async () => {
        if (pendingUnlocksRef.current.length > 0) {
          const toUnlock = [...new Set(pendingUnlocksRef.current)];
          pendingUnlocksRef.current = [];
          
          try {
            await unlockAchievements(toUnlock);
          } catch (error) {
            console.error('Failed to save achievements to server:', error);
          }
        }
      }, 500);
    }
  }, [user]);

  useEffect(() => {
    if (toastQueue.length > 0 && !currentToast && !processingRef.current) {
      processingRef.current = true;
      const [next, ...rest] = toastQueue;
      setCurrentToast(next);
      setToastQueue(rest);
      
      setTimeout(() => {
        setCurrentToast(null);
        processingRef.current = false;
      }, 4000);
    }
  }, [toastQueue, currentToast]);

  const checkAchievements = useCallback((stats) => {
    const newlyUnlocked = [];
    
    getAllAchievements().forEach(achievement => {
      if (unlockedRef.current.has(achievement.id)) return;
      if (sessionUnlockedRef.current.has(achievement.id)) return;
      
      if (achievement.condition(stats)) {
        newlyUnlocked.push(achievement);
        sessionUnlockedRef.current.add(achievement.id);
        unlockedRef.current.add(achievement.id);
      }
    });

    if (newlyUnlocked.length > 0) {
      const newIds = newlyUnlocked.map(a => a.id);
      
      setToastQueue(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const trulyNew = newlyUnlocked.filter(a => !existingIds.has(a.id));
        return [...prev, ...trulyNew];
      });
      
      saveAchievements(newIds);
    }

    return newlyUnlocked;
  }, [saveAchievements]);

  const updateStats = useCallback((updates) => {
    setGameStats(prev => {
      const newStats = { ...prev, ...updates };
      
      // FIX: Set perfectStart to true when reaching 5 correct from start
      if (newStats.correctFromStart >= 5 && !newStats.isAfterLifeLoss && !prev.perfectStart) {
        newStats.perfectStart = true;
      }
      
      setTimeout(() => checkAchievements(newStats), 0);
      return newStats;
    });
  }, [checkAchievements]);

  const trackCorrectAnswer = useCallback((timeLeft, timerDuration, hadDoublePoints = false, pointsEarned = 0) => {
    const answerTime = timerDuration - timeLeft;
    
    setGameStats(prev => {
      const newStats = {
        ...prev,
        currentStreak: prev.currentStreak + 1,
        correctFromStart: prev.isAfterLifeLoss ? prev.correctFromStart : prev.correctFromStart + 1,
        comebackStreak: prev.isAfterLifeLoss ? prev.comebackStreak + 1 : 0,
        fastestAnswer: Math.min(prev.fastestAnswer, answerTime),
        quickAnswers: answerTime < 3 ? prev.quickAnswers + 1 : prev.quickAnswers,
        lastSecondWins: timeLeft <= 1 ? prev.lastSecondWins + 1 : prev.lastSecondWins,
        biggestDoublePoints: hadDoublePoints ? Math.max(prev.biggestDoublePoints, pointsEarned) : prev.biggestDoublePoints
      };
      
      // FIX: Check and set perfectStart immediately when reaching 5 correct from start
      if (newStats.correctFromStart >= 5 && !newStats.isAfterLifeLoss && !prev.perfectStart) {
        newStats.perfectStart = true;
      }
      
      setTimeout(() => checkAchievements(newStats), 0);
      return newStats;
    });
  }, [checkAchievements]);

  const trackWrongAnswer = useCallback(() => {
    setGameStats(prev => ({
      ...prev,
      currentStreak: 0,
      isAfterLifeLoss: true,
      comebackStreak: 0,
      // Reset perfectStart tracking when a wrong answer occurs
      correctFromStart: 0
    }));
  }, []);

  const trackShieldSave = useCallback(() => {
    setGameStats(prev => {
      const newStats = { ...prev, shieldSaves: prev.shieldSaves + 1 };
      setTimeout(() => checkAchievements(newStats), 0);
      return newStats;
    });
  }, [checkAchievements]);

  const trackPerkCollected = useCallback(() => {
    setGameStats(prev => {
      const newStats = { ...prev, perksCollected: prev.perksCollected + 1 };
      setTimeout(() => checkAchievements(newStats), 0);
      return newStats;
    });
  }, [checkAchievements]);

  const trackScore = useCallback((score) => {
    setGameStats(prev => {
      const newStats = { ...prev, currentScore: score };
      setTimeout(() => checkAchievements(newStats), 0);
      return newStats;
    });
  }, [checkAchievements]);

  const trackRound = useCallback((round) => {
    setGameStats(prev => {
      const newStats = { ...prev, currentRound: round };
      setTimeout(() => checkAchievements(newStats), 0);
      return newStats;
    });
  }, [checkAchievements]);

  const resetGameStats = useCallback(() => {
    sessionUnlockedRef.current = new Set();
    
    setGameStats({
      currentStreak: 0, currentScore: 0, currentRound: 0,
      perksCollected: 0, shieldSaves: 0, fastestAnswer: Infinity,
      quickAnswers: 0, perfectStart: false, correctFromStart: 0,
      lastSecondWins: 0, comebackStreak: 0, biggestDoublePoints: 0,
      wonWithOnLife: false, isAfterLifeLoss: false
    });
  }, []);

  const dismissToast = useCallback(() => {
    setCurrentToast(null);
    processingRef.current = false;
  }, []);

  const getProgress = useCallback((achievementId) => {
    const achievement = ACHIEVEMENTS[achievementId.toUpperCase()];
    if (!achievement) return 0;
    return achievement.progress(gameStats);
  }, [gameStats]);

  const isUnlocked = useCallback((achievementId) => {
    return unlockedRef.current.has(achievementId);
  }, []);

  const getAllWithStatus = useCallback(() => {
    return getAllAchievements().map(achievement => ({
      ...achievement,
      unlocked: unlockedRef.current.has(achievement.id),
      progress: achievement.progress(gameStats)
    }));
  }, [gameStats]);

  const clearAllAchievements = useCallback(() => {
    setUnlockedAchievements([]);
    unlockedRef.current = new Set();
    sessionUnlockedRef.current = new Set();
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  return {
    unlockedAchievements, currentToast, gameStats,
    isLoading, isSyncing,
    
    trackCorrectAnswer, trackWrongAnswer, trackShieldSave,
    trackPerkCollected, trackScore, trackRound, updateStats,
    
    resetGameStats, dismissToast, getProgress, isUnlocked,
    getAllWithStatus, clearAllAchievements, syncLocalToServer,
    
    totalUnlocked: unlockedAchievements.length,
    totalAchievements: getAllAchievements().length
  };
};