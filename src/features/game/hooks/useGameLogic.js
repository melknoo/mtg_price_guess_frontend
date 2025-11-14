import { useState, useCallback } from 'react';
import { useGameTimer } from './useGameTimer';
import { useStreak } from './useStreak';
import { useCardLoader } from './useCardLoader';
import { updateHighscore } from '../api/gameApi';
import { isChoiceCorrect, getMoreExpensiveCard, createErrorMessage } from '../utils/cardComparison';
import { calculateTimeBonus, formatScoreMessage } from '../utils/scoreCalculator';
import { GAME_CONFIG } from '../../../shared/utils/constants';

/**
 * Master Hook für gesamte Game-Logik
 * Kombiniert alle Game-Hooks zu einem
 */
export const useGameLogic = ({ user, setUser, refreshUser }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [showPrices, setShowPrices] = useState(false);
  const [message, setMessage] = useState('');
  const [imagesLoaded, setImagesLoaded] = useState([false, false]);

  const cardLoader = useCardLoader();
  const streak = useStreak();
  const timer = useGameTimer({
    onTimeUp: () => handleChoice(-1),
    enabled: !showPrices && selectedCard === null,
  });

  // Handle Card Choice
  const handleChoice = useCallback(async (chosenIndex) => {
    timer.stop();
    
    const [card1, card2] = cardLoader.currentPair;
    const correct = isChoiceCorrect(chosenIndex, card1, card2);
    const correctCardIndex = correct ? chosenIndex : (chosenIndex === 0 ? 1 : 0);
    
    setCorrectIndex(correctCardIndex);
    setSelectedCard(chosenIndex);
    setShowPrices(true);

    if (correct) {
      // Richtige Antwort
      const timeBonus = calculateTimeBonus(timer.timeLeft);
      const streakBonus = streak.calculateStreakBonus();
      const totalPoints = timeBonus + streakBonus;
      
      streak.incrementStreak();
      
      const newScore = score + totalPoints;
      setScore(newScore);
      setMessage(formatScoreMessage(timeBonus, streakBonus));

      // Highscore Update
      if (newScore > user.highscore) {
        if (user?.guest) {
          setUser({ ...user, highscore: newScore });
        } else {
          try {
            await updateHighscore(newScore);
            await refreshUser();
          } catch (error) {
            console.error('Highscore update failed:', error);
          }
        }
      }
    } else {
      // Falsche Antwort
      streak.resetStreak();
      const remainingLives = lives - 1;
      setLives(remainingLives);

      const correctCard = getMoreExpensiveCard(card1, card2);
      setMessage(createErrorMessage(correctCard));

      if (remainingLives <= 0) {
        setGameOver(true);
        return;
      }
    }
  }, [
    cardLoader.currentPair,
    timer,
    streak,
    score,
    lives,
    user,
    setUser,
    refreshUser,
  ]);

  // Next Pair
  const nextPair = useCallback(() => {
    cardLoader.setNextPair();
    setMessage('');
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    setImagesLoaded([false, false]);
  }, [cardLoader]);

  // Restart Game
  const restart = useCallback(async () => {
    setScore(0);
    setMessage('');
    setGameOver(false);
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    setLives(GAME_CONFIG.INITIAL_LIVES);
    setImagesLoaded([false, false]);
    
    streak.reset();
    timer.reset();
    cardLoader.reset();
    
    await cardLoader.preloadCards();
  }, [streak, timer, cardLoader]);

  // Initialize Game
  const init = useCallback(async () => {
    await cardLoader.preloadCards();
  }, [cardLoader]);

  // Handle Image Load
  const handleImageLoad = useCallback((index) => {
    setImagesLoaded(prev => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  }, []);

  return {
    // State
    score,
    lives,
    gameOver,
    selectedCard,
    correctIndex,
    showPrices,
    message,
    imagesLoaded,
    
    // Sub-hooks
    cardLoader,
    streak,
    timer,
    
    // Actions
    handleChoice,
    nextPair,
    restart,
    init,
    handleImageLoad,
  };
};