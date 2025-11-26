import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useAchievementContext } from "../context/AchievementContext";
import { useGameTimer } from "../hooks/useGameTimer";
import { useStreak } from "../hooks/useStreak";
import { useCardLoader } from "../hooks/useCardLoader";
import { usePerkSystem } from "../hooks/usePerkSystem";
import { updateHighscore } from "../api/gameApi";
import {
  isChoiceCorrect,
  getMoreExpensiveCard,
  createErrorMessage,
  formatPrice,
} from "../utils/cardComparison";
import {
  calculateTimeBonus,
  formatScoreMessage,
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

export default function Game({
  score,
  setScore,
  onBack,
  showRegister,
  setShowRegister,
}) {
  const { user, refreshUser, setUser } = useAuth();
  const achievements = useAchievementContext();

  // Game State
  const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [showPrices, setShowPrices] = useState(false);
  const [message, setMessage] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState([false, false]);
  const [currentRound, setCurrentRound] = useState(1);

  // Custom Hooks
  const cardLoader = useCardLoader();
  const streak = useStreak();
  const perkSystem = usePerkSystem();

  // Timer mit Perk-Modifikationen
  const getTimerDuration = () => {
    let duration = GAME_CONFIG.TIMER_DURATION;
    const timeBufferValue = perkSystem.getPerkValue("time_bonus");
    if (timeBufferValue) duration += timeBufferValue;
    return duration;
  };

  const getTimerSpeed = () => {
    const slowTimeValue = perkSystem.getPerkValue("slow_time");
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

  // Start Timer when images loaded
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

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignoriere Tastatureingaben wenn Perk-Auswahl offen ist
      if (perkSystem.showPerkSelection) return;
      
      // Ignoriere wenn Game Over
      if (gameOver) return;

      const key = e.key.toLowerCase();

      // Kartenauswahl: 1/a für links, 2/d für rechts
      if (selectedCard === null && !showPrices) {
        if (key === "1" || key === "a") {
          e.preventDefault();
          handleChoice(0);
        } else if (key === "2" || key === "d") {
          e.preventDefault();
          handleChoice(1);
        }
      }

      // Weiter mit Leertaste oder Enter
      if (selectedCard !== null && !gameOver && (key === " " || key === "enter")) {
        e.preventDefault();
        handleNextPair();
      }

      // Skip mit S (wenn Perk verfügbar)
      if (key === "s" && perkSystem.hasPerk("skip_card") && selectedCard === null && !showPrices) {
        e.preventDefault();
        handleSkipCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCard, showPrices, gameOver, perkSystem.showPerkSelection, perkSystem]);

  const initGame = async () => {
    achievements.resetGameStats();
    const cards = await cardLoader.preloadCards();
    if (cards && cards.length >= 2) {
      await cardLoader.setNextPair();
    }
  };

  const applyPerkEffects = (basePoints) => {
    let finalPoints = basePoints;
    const multiplier = perkSystem.getPerkValue("point_multiplier");
    if (multiplier) finalPoints *= multiplier;
    const flatBonus = perkSystem.getPerkValue("flat_bonus");
    if (flatBonus) finalPoints += flatBonus;
    if (timer.timeLeft >= getTimerDuration() - 1) {
      const perfectBonus = perkSystem.getPerkValue("perfect_bonus");
      if (perfectBonus) finalPoints += perfectBonus;
    }
    return Math.floor(finalPoints);
  };

  const handleChoice = useCallback(
    async (chosenIndex) => {
      timer.stop();

      const [card1, card2] = cardLoader.currentPair;
      const correct = isChoiceCorrect(chosenIndex, card1, card2);
      const correctCardIndex = correct ? chosenIndex : chosenIndex === 0 ? 1 : 0;

      setCorrectIndex(correctCardIndex);
      setSelectedCard(chosenIndex);
      setShowPrices(true);

      if (correct) {
        const timeBonus = calculateTimeBonus(timer.timeLeft);
        const customThreshold = perkSystem.getPerkValue("streak_threshold");
        const streakBonus = customThreshold
          ? streak.streak >= customThreshold
            ? streak.calculateStreakBonus()
            : 0
          : streak.calculateStreakBonus();

        const basePoints = timeBonus + streakBonus;
        const hadDoublePoints = !!perkSystem.getPerkValue("point_multiplier");
        const totalPoints = applyPerkEffects(basePoints);

        streak.incrementStreak();

        const newScore = score + totalPoints;
        setScore(newScore);

        achievements.trackCorrectAnswer(
          timer.timeLeft,
          getTimerDuration(),
          hadDoublePoints,
          totalPoints
        );
        achievements.trackScore(newScore);

        let scoreMessage = formatScoreMessage(timeBonus, streakBonus);
        if (totalPoints > basePoints) {
          scoreMessage += ` 🎁 Perk Bonus: +${totalPoints - basePoints}`;
        }
        setMessage(scoreMessage);

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
        if (perkSystem.hasPerk("second_chance")) {
          perkSystem.consumePerk("second_chance");
          setMessage("💚 Second Chance activated! Life saved!");
          achievements.trackShieldSave();
        } else {
          streak.resetStreak();
          achievements.trackWrongAnswer();

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

      perkSystem.decrementPerkDurations();
    },
    [cardLoader.currentPair, timer, streak, score, lives, user, setScore, setUser, refreshUser, perkSystem, achievements]
  );

  const handleNextPair = () => {
    setMessage("");
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    achievements.trackRound(nextRound);

    if (nextRound > 0 && nextRound % 5 === 0) {
      perkSystem.triggerPerkSelection();
    } else {
      cardLoader.setNextPair();
    }
  };

  const handlePerkSelect = (perk) => {
    perkSystem.selectPerk(perk);
    achievements.trackPerkCollected();
    cardLoader.setNextPair();
  };

  const handleSkipCard = () => {
    if (perkSystem.hasPerk("skip_card")) {
      perkSystem.consumePerk("skip_card");
      setSelectedCard(null);
      setCorrectIndex(null);
      setShowPrices(false);
      setMessage("⭐️ Card skipped!");
      cardLoader.setNextPair();
      timer.reset();
      setCurrentRound((prev) => prev + 1);
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
    setCurrentRound(1);

    streak.reset();
    timer.reset();
    cardLoader.reset();
    perkSystem.reset();
    achievements.resetGameStats();

    await cardLoader.preloadCards();
    await cardLoader.setNextPair();
  };

  const handleImageLoad = (index) => {
    setImagesLoaded((prev) => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  const showPriceHint = perkSystem.hasPerk("price_hint");
  const showAverage = perkSystem.hasPerk("statistics");

  const getPriceRange = () => {
    if (!showPriceHint || cardLoader.currentPair.length < 2) return null;
    const prices = cardLoader.currentPair.map((c) => parseFloat(c.prices.eur));
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const getAveragePrice = () => {
    if (!showAverage || cardLoader.currentPair.length < 2) return null;
    const prices = cardLoader.currentPair.map((c) => parseFloat(c.prices.eur));
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  };

  if (cardLoader.error) {
    return (
      <div className="text-center text-red-400">
        <p>❌ {cardLoader.error}</p>
        <button onClick={initGame} className="mt-4 bg-blue-600 px-6 py-3 rounded hover:bg-blue-700">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Score Display */}
      <div className="sm:mb-1 flex flex-row w-full max-w-2xl justify-between">
        <div className="sm:w-3/4 flex md:text-left sm:flex-row flex-col">
          <div className="flex items-right items-center justify-end sm:justify-start gap-4 mb-2">
            <div className="bg-white/10 sm:mb-auto backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
              <span className="text-purple-300 text-sm font-semibold">🎯 Round {currentRound}</span>
            </div>
          </div>
          <div className="flex flex-col sm:ml-3">
            <p className="mb-2 text-lg">Your Highscore: {user.highscore}</p>
            <p className="mb-2 font-bold text-2xl">Points: {score}</p>
          </div>
        </div>
        <LivesDisplay lives={lives} />
      </div>

      <ActivePerksDisplay perks={perkSystem.activePerks} />

      <StreakDisplay
        streak={streak.streak}
        bestStreak={streak.bestStreak}
        color={streak.getStreakColor()}
        streakBonus={streak.calculateStreakBonus()}
      />

      {(showPriceHint || showAverage) && (
        <div className="w-full max-w-xl mb-4">
          {showPriceHint && getPriceRange() && (
            <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-2 mb-2">
              <span className="text-blue-200 text-sm font-semibold">
                🔮 Price Range: {formatPrice(getPriceRange().min)} - {formatPrice(getPriceRange().max)}
              </span>
            </div>
          )}
          {showAverage && getAveragePrice() && (
            <div className="bg-green-500/20 border border-green-400 rounded-lg p-2">
              <span className="text-green-200 text-sm font-semibold">📊 Average: {formatPrice(getAveragePrice())}</span>
            </div>
          )}
        </div>
      )}

      <GameTimer timeLeft={timer.timeLeft} possiblePoints={calculateTimeBonus(timer.timeLeft)} progress={timer.progress} />

      {cardLoader.loading ? (
        <p>Loading Cards...</p>
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

      {/* Keyboard Hints */}
      {!gameOver && !perkSystem.showPerkSelection && (
        <div className="text-gray-400 hidden sm:block text-sm mt-2 text-center">
          {selectedCard === null && !showPrices ? (
            <span>⌨️ Press <kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">1</kbd>/<kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">A</kbd> for left, <kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">2</kbd>/<kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">D</kbd> for right</span>
          ) : selectedCard !== null ? (
            <span>⌨️ Press <kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">Space</kbd> or <kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">Enter</kbd> to continue</span>
          ) : null}
        </div>
      )}

      <div className="sm:mt-6 mt-auto flex gap-4 text-lg min-h-[80px] items-center">
        {perkSystem.hasPerk("skip_card") && selectedCard === null && !gameOver && !showPrices && (
          <button
            onClick={handleSkipCard}
            className="bg-yellow-500 text-lg font-semibold hover:bg-yellow-600 text-white px-6 py-4 rounded transition shadow-lg hover:shadow-xl"
            title="Press S to skip"
          >
            ⭐️ Skip
          </button>
        )}

        {selectedCard !== null && !gameOver && (
          <button
            onClick={handleNextPair}
            disabled={perkSystem.showPerkSelection}
            className={`text-2xl min-w-[250px] font-semibold text-white px-6 py-6 rounded transition ${
              perkSystem.showPerkSelection ? "bg-blue-500/50 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            Next
          </button>
        )}
      </div>

      <PerkSelectionModal perks={perkSystem.availablePerks} onSelect={handlePerkSelect} show={perkSystem.showPerkSelection} />

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

      {message && !gameOver && <p className="mt-6 text-xl transition-all duration-500">{message}</p>}
    </>
  );
}