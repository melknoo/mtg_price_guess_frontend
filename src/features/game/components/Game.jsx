import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useGameTimer } from "../hooks/useGameTimer";
import { useStreak } from "../hooks/useStreak";
import { useCardLoader } from "../hooks/useCardLoader";
import { usePerkSystem } from "../hooks/usePerkSystem";
import { updateHighscore } from "../api/gameApi";
import { 
  isChoiceCorrect, 
  getMoreExpensiveCard, 
  createErrorMessage,
  formatPrice 
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
import PerkSelectionModal from "./PerkSelectionModal";
import ActivePerksDisplay from "./ActivePerksDisplay";
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
  const [currentRound, setCurrentRound] = useState(1); // NEU: Rundenzähler
  const [perkJustSelected, setPerkJustSelected] = useState(false); // NEU: Flag ob Perk gerade ausgewählt wurde

  // Custom Hooks
  const cardLoader = useCardLoader();
  const streak = useStreak();
  const perkSystem = usePerkSystem();

  // Timer mit Perk-Modifikationen
  const getTimerDuration = () => {
    let duration = GAME_CONFIG.TIMER_DURATION;
    
    // Time Buffer Perk
    const timeBufferValue = perkSystem.getPerkValue('time_bonus');
    if (timeBufferValue) {
      duration += timeBufferValue;
    }
    
    return duration;
  };

  const getTimerSpeed = () => {
    // Slow Time Perk
    const slowTimeValue = perkSystem.getPerkValue('slow_time');
    return slowTimeValue || 1;
  };

  const timer = useGameTimer({
    onTimeUp: () => handleChoice(-1),
    enabled: !showPrices && selectedCard === null,
    duration: getTimerDuration(),
    speed: getTimerSpeed(),
  });

  // Initial Load
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

  const applyPerkEffects = (basePoints) => {
    let finalPoints = basePoints;

    // Point Multiplier (Double Points)
    const multiplier = perkSystem.getPerkValue('point_multiplier');
    if (multiplier) {
      finalPoints *= multiplier;
    }

    // Flat Bonus
    const flatBonus = perkSystem.getPerkValue('flat_bonus');
    if (flatBonus) {
      finalPoints += flatBonus;
    }

    // Perfect Bonus
    if (timer.timeLeft >= getTimerDuration() - 1) {
      const perfectBonus = perkSystem.getPerkValue('perfect_bonus');
      if (perfectBonus) {
        finalPoints += perfectBonus;
      }
    }

    return Math.floor(finalPoints);
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
      
      // Streak Threshold Perk
      const customThreshold = perkSystem.getPerkValue('streak_threshold');
      const streakBonus = customThreshold 
        ? (streak.streak >= customThreshold ? streak.calculateStreakBonus() : 0)
        : streak.calculateStreakBonus();
      
      const basePoints = timeBonus + streakBonus;
      const totalPoints = applyPerkEffects(basePoints);
      
      streak.incrementStreak();
      
      const newScore = score + totalPoints;
      setScore(newScore);
      
      let scoreMessage = formatScoreMessage(timeBonus, streakBonus);
      if (totalPoints > basePoints) {
        scoreMessage += ` 🎁 Perk Bonus: +${totalPoints - basePoints}`;
      }
      setMessage(scoreMessage);

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

      // Increment Perk Round Counter
      perkSystem.incrementRound();
    } else {
      // Falsche Antwort - prüfe Shield Perk
      if (perkSystem.hasPerk('second_chance')) {
        perkSystem.consumePerk('second_chance');
        setMessage("💚 Zweite Chance aktiviert! Leben gespart!");
        // Kein Leben verlieren
      } else {
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
    }

    // NEU: Perk Durations NACH der Runde reduzieren
    perkSystem.decrementPerkDurations();
  }, [
    cardLoader.currentPair, 
    timer, 
    streak, 
    score, 
    lives, 
    user, 
    setScore, 
    setUser, 
    refreshUser,
    perkSystem
  ]);

  const handleNextPair = () => {
    // Perk Durations werden jetzt in handleChoice reduziert
    cardLoader.setNextPair();
    setMessage("");
    setCurrentRound(prev => prev + 1); // NEU: Erhöhe Rundenzähler
  };

  const handleSkipCard = () => {
    if (perkSystem.hasPerk('skip_card')) {
      perkSystem.consumePerk('skip_card');
      
      // Reset current round state
      setSelectedCard(null);
      setCorrectIndex(null);
      setShowPrices(false);
      setMessage("⭐️ Karte übersprungen!");
      
      // Load new cards
      cardLoader.setNextPair();
      timer.reset();
      setCurrentRound(prev => prev + 1); // NEU: Erhöhe auch beim Überspringen
    }
  };

  const handleRestart = async () => {
    setScore(0);
    setMessage("");
    setGameOver(false);
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    setLives(GAME_CONFIG.INITIAL_LIVES);
    setCurrentRound(1); // NEU: Reset Rundenzähler
    
    streak.reset();
    timer.reset();
    cardLoader.reset();
    perkSystem.reset();
    
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

  // Berechne ob Price Hint aktiv ist
  const showPriceHint = perkSystem.hasPerk('price_hint');
  const showAverage = perkSystem.hasPerk('statistics');
  
  const getPriceRange = () => {
    if (!showPriceHint || cardLoader.currentPair.length < 2) return null;
    
    const prices = cardLoader.currentPair.map(c => parseFloat(c.prices.eur));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return { min, max };
  };

  const getAveragePrice = () => {
    if (!showAverage || cardLoader.currentPair.length < 2) return null;
    
    const prices = cardLoader.currentPair.map(c => parseFloat(c.prices.eur));
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    return avg;
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
      {/* Score Display mit Rundenzähler */}
      <div className="flex md:text-center w-full flex-col">
        <div className="flex items-center justify-start sm:justify-center gap-4 mb-2">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
            <span className="text-purple-300 text-sm font-semibold">
              🎯 Runde {currentRound}
            </span>
          </div>
        </div>
        <p className="mb-2 text-lg">Dein Highscore: {user.highscore}</p>
        <p className="mb-2 font-bold text-2xl">Punkte: {score}</p>
      </div>

      {/* Active Perks Display */}
      <ActivePerksDisplay perks={perkSystem.activePerks} />

      {/* Streak Display */}
      <StreakDisplay
        streak={streak.streak}
        bestStreak={streak.bestStreak}
        color={streak.getStreakColor()}
        streakBonus={streak.calculateStreakBonus()}
      />

      {/* Utility Perks Info */}
      {(showPriceHint || showAverage) && (
        <div className="w-full max-w-xl mb-4">
          {showPriceHint && getPriceRange() && (
            <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-2 mb-2">
              <span className="text-blue-200 text-sm font-semibold">
                🔮 Preisspanne: {formatPrice(getPriceRange().min)} - {formatPrice(getPriceRange().max)}
              </span>
            </div>
          )}
          
          {showAverage && getAveragePrice() && (
            <div className="bg-green-500/20 border border-green-400 rounded-lg p-2">
              <span className="text-green-200 text-sm font-semibold">
                📊 Durchschnitt: {formatPrice(getAveragePrice())}
              </span>
            </div>
          )}
        </div>
      )}

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

      {/* Action Buttons */}
      <div className="sm:mt-6 mt-auto flex gap-4 text-lg min-h-[80px] items-center">
        {/* Skip Button - nur wenn keine Karte ausgewählt und nicht Game Over */}
        {perkSystem.hasPerk('skip_card') && selectedCard === null && !gameOver && !showPrices && (
          <button
            onClick={handleSkipCard}
            className="bg-yellow-500 text-lg font-semibold hover:bg-yellow-600 text-white px-6 py-4 rounded transition shadow-lg hover:shadow-xl"
            title="Überspringe dieses Kartenpaar ohne Strafe"
          >
            ⭐️ Überspringen
          </button>
        )}
        
        {/* Next Button */}
        {selectedCard !== null && !gameOver && (
          <button
            onClick={handleNextPair}
            className="bg-blue-500 text-2xl min-w-[250px] font-semibold hover:bg-blue-600 text-white px-6 py-6 rounded transition"
          >
            Weiter
          </button>
        )}
      </div>

      {/* Perk Selection Modal */}
      <PerkSelectionModal
        perks={perkSystem.availablePerks}
        onSelect={perkSystem.selectPerk}
        show={perkSystem.showPerkSelection}
      />

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