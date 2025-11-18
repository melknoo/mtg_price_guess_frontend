import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useGameTimer } from "../hooks/useGameTimer";
import { useStreak } from "../hooks/useStreak";
import { useCardLoader } from "../hooks/useCardLoader";
import { updateHighscore } from "../api/gameApi";
import { 
  isChoiceCorrect, 
  getMoreExpensiveCard, 
  createErrorMessage 
} from "../utils/cardComparison";
import { 
  calculateTimeBonus, 
  formatScoreMessage 
} from "../utils/scoreCalculator";
import { GAME_CONFIG } from "../../../shared/utils/constants";
import GameTimer from "./GameTimer";
import StreakDisplay from "./StreakDisplay";
import LivesDisplay from "./LivesDisplay";
import CardPair from "./CardPair";
import GameOverScreen from "./GameOverScreen";
import RegisterWithScore from "../../auth/components/RegisterWithScore";

export default function Game({ score, setScore, onBack, showRegister, setShowRegister }) {
  const { user, refreshUser, setUser } = useAuth();
  
  // Game State
  const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [showPrices, setShowPrices] = useState(false);
  const [message, setMessage] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState([false, false]);

  // Custom Hooks
  const cardLoader = useCardLoader();
  const streak = useStreak();
  const timer = useGameTimer({
    onTimeUp: () => handleChoice(-1),
    enabled: !showPrices && selectedCard === null,
  });

  // Initial Load - NUR beim ersten Mount
  useEffect(() => {
    if (user || user?.guest) {
      initGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Starte Timer wenn beide Bilder geladen sind
  useEffect(() => {
    if (imagesLoaded.every(Boolean) && !showPrices) {
      timer.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesLoaded, showPrices]);

  // Reset bei neuem Paar
  useEffect(() => {
    setImagesLoaded([false, false]);
    timer.reset();
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardLoader.currentPair]);

  const initGame = async () => {
    const cards = await cardLoader.preloadCards();
    if (cards && cards.length >= 2) {
      await cardLoader.setNextPair();
    }
  };

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
            console.error("Highscore update failed:", error);
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
    setScore, 
    setUser, 
    refreshUser
  ]);

  const handleNextPair = () => {
    cardLoader.setNextPair();
    setMessage("");
  };

  const handleRestart = async () => {
    setScore(0);
    setMessage("");
    setGameOver(false);
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    setLives(GAME_CONFIG.INITIAL_LIVES);
    
    streak.reset();
    timer.reset();
    cardLoader.reset();
    
    await cardLoader.preloadCards();
    await cardLoader.setNextPair();
  };

  const handleImageLoad = (index) => {
    setImagesLoaded(prev => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  if (cardLoader.error) {
    return (
      <div className="text-center text-red-400">
        <p>❌ {cardLoader.error}</p>
        <button 
          onClick={initGame}
          className="mt-4 bg-blue-600 px-6 py-3 rounded hover:bg-blue-700"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="md:text-3xl hidden md:block md:mt-0 mt-6 font-bold mb-4">
        🧙‍♂️ Magic Card Preis-Duell
      </h1>

      {/* Score Display */}
      <div className="flex md:text-center w-full flex-col">
        <p className="mb-2 text-lg">Dein Highscore: {user.highscore}</p>
        <p className="mb-2 font-bold text-2xl">Punkte: {score}</p>
      </div>

      {/* Streak Display */}
      <StreakDisplay
        streak={streak.streak}
        bestStreak={streak.bestStreak}
        color={streak.getStreakColor()}
        streakBonus={streak.calculateStreakBonus()}
      />

      {/* Timer */}
      <GameTimer
        timeLeft={timer.timeLeft}
        possiblePoints={calculateTimeBonus(timer.timeLeft)}
        progress={timer.progress}
      />

      {/* Lives */}
      <LivesDisplay lives={lives} />

      {/* Card Pair */}
      {cardLoader.loading ? (
        <p>Lade Karten...</p>
      ) : (
        <CardPair
          cards={cardLoader.currentPair}
          selectedCard={selectedCard}
          correctIndex={correctIndex}
          showPrices={showPrices}
          onChoice={handleChoice}
          onImageLoad={handleImageLoad}
        />
      )}

      {/* Next Button */}
      <div className="mt-6 flex text-lg min-h-[80px]">
        {selectedCard !== null && !gameOver && (
          <button
            onClick={handleNextPair}
            className="bg-blue-500 text-2xl font-semibold hover:bg-blue-600 text-white px-6 py-6 rounded transition"
          >
            Weiter
          </button>
        )}
      </div>

      {/* Game Over Screen */}
      {gameOver && (
        <GameOverScreen
          message={message}
          bestStreak={streak.bestStreak}
          onRestart={handleRestart}
          onBack={onBack}
          showRegister={showRegister}
          onShowRegister={() => setShowRegister(true)}
          isGuest={user?.guest}
        >
          {user?.guest && showRegister && (
            <RegisterWithScore
              score={user?.highscore ?? score}
              onSuccess={(newUser) => {
                setUser(newUser);
                refreshUser();
                setShowRegister(false);
              }}
            />
          )}
        </GameOverScreen>
      )}

      {/* Message */}
      {message && !gameOver && (
        <p className="mt-6 text-xl transition-all duration-500">{message}</p>
      )}
    </>
  );
}