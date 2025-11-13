import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaHeart, FaRegHeart, FaStar, FaStopwatch, FaFire } from "react-icons/fa";
import axios from "axios";
import { useAuth } from "./AuthContext";
import RegisterWithScore from "./RegisterWithScore";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function Game({ score, setScore, onBack, showRegister, setShowRegister }) {
  const [cachedCards, setCachedCards] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lives, setLives] = useState(3);
  const [showPrices, setShowPrices] = useState(false);
  const [hasPreloaded, setHasPreloaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerRunning, setTimerRunning] = useState(false);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState([false, false]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const { user, refreshUser, setUser } = useAuth();

  useEffect(() => {
    if ((user || user?.guest) && !hasPreloaded) {
      setHasPreloaded(true);
      preloadCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasPreloaded]);

  useEffect(() => {
    setImagesLoaded([false, false]);
    setTimerRunning(false);
    setTimeLeft(10);
  }, [currentPair]);

  useEffect(() => {
    if (imagesLoaded.every(Boolean)) {
      setTimerRunning(true);
    }
  }, [imagesLoaded]);

  useEffect(() => {
    if (!timerRunning || showPrices || selectedCard !== null) return;
    if (timeLeft <= 0) {
      setTimerRunning(false);
      handleChoice(-1);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 0.1, 0));
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, timeLeft, showPrices, selectedCard]);

  useEffect(() => {
    if (cachedCards.length >= 2 && currentPair.length === 0) {
      setNextPair();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedCards]);

  const preloadCards = async () => {
    setLoading(true);
    setMessage("");
    setTimeLeft(10);
    setTimerRunning(false);

    try {
      const res = await axios.get(API_URL + "/api/random-cards?count=20");
      const transformed = res.data.map(card => ({
        id: card.id,
        name: card.name,
        prices: { eur: parseFloat(card.price) },
        image_uris: { normal: card.image }
      }));
      console.log(transformed);

      setCachedCards(transformed);
      return transformed;
    } catch (error) {
      console.error("❌ Fehler beim Laden der Karten:", error);
      setMessage("Fehler beim Laden der Karten.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const setNextPair = async () => {
    let updatedCache = [...cachedCards];

    if (updatedCache.length < 2) {
      const newCards = await preloadCards();
      updatedCache = [...updatedCache, ...newCards];
    }

    if (updatedCache.length < 2) {
      setMessage("Nicht genügend Karten verfügbar.");
      return;
    }

    const next = updatedCache.slice(0, 2);
    const remaining = updatedCache.slice(2);

    setCurrentPair(next);
    setCachedCards(remaining);
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    setTimeLeft(10);
    setTimerRunning(true);
    setShowStreakBonus(false);
  };

  const handleChoice = (chosenIndex) => {
    const price1 = parseFloat(currentPair[0].prices.eur);
    const price2 = parseFloat(currentPair[1].prices.eur);
    const correct = price1 >= price2 ? 0 : 1;
    setCorrectIndex(correct);
    setSelectedCard(chosenIndex);

    if (chosenIndex === correct) {
      const bonus = Math.ceil(timeLeft);
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Update best streak
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }

      // Calculate streak bonus
      let streakBonus = 0;
      if (newStreak >= 5) {
        streakBonus = Math.floor(newStreak / 5) * 5;
        setShowStreakBonus(true);
      }

      const totalPoints = bonus + streakBonus;
      const newScore = score + totalPoints;
      setScore(newScore);

      let msg = `✅ Richtig! +${bonus} Punkte!`;
      if (streakBonus > 0) {
        msg += ` 🔥 Streak Bonus: +${streakBonus}`;
      }
      setMessage(msg);

      if (newScore > user.highscore) {
        if (user?.guest) {
          setUser({ ...user, highscore: newScore });
        } else {
          axios.post(API_URL + "/api/score", { score: newScore })
            .then(() => refreshUser())
            .catch(e => {
              console.error("Fehler beim Highscore-Update", e);
            });
        }
      }
    } else {
      // Reset streak on wrong answer
      setStreak(0);
      const remainingLives = lives - 1;
      setLives(remainingLives);
      setShowPrices(true);

      const losingCard = currentPair[correct];
      setMessage(`❌ Falsch! ${losingCard.name} war teurer: €${losingCard.prices.eur.toFixed(2)}`);

      if (remainingLives <= 0) {
        setGameOver(true);
        return;
      }
    }

    setShowPrices(true);
    setTimerRunning(false);
  };

  const handleRestart = async () => {
    setScore(0);
    setMessage("");
    setGameOver(false);
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    setLives(3);
    setStreak(0);
    setBestStreak(0);
    setShowStreakBonus(false);

    const newCards = await preloadCards();
    if (newCards.length >= 2) {
      const next = newCards.slice(0, 2);
      const remaining = newCards.slice(2);
      setCurrentPair(next);
      setCachedCards(remaining);
    } else {
      setMessage("Nicht genügend Karten geladen.");
    }
  };

  const getStreakColor = () => {
    if (streak >= 10) return "text-purple-400";
    if (streak >= 5) return "text-orange-400";
    if (streak >= 3) return "text-yellow-400";
    return "text-white";
  };

  return (
    <>
      <h1 className="md:text-3xl hidden md:block md:mt-0 mt-6 font-bold mb-4">🧙‍♂️ Magic Card Preis-Duell</h1>
      <div className="flex md:text-center w-full flex-col">
        <p className="mb-2 text-lg">Dein Highscore: {user.highscore}</p>
        <p className="mb-2 font-bold text-2xl">Punkte: {score}</p>
        
        {/* Streak Display */}
        <div className={`flex items-center justify-center gap-2 mb-4 ${getStreakColor()} font-bold text-xl`}>
          <motion.div
            key={streak}
            initial={{ scale: 1 }}
            animate={{ scale: streak > 0 ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <FaFire className={streak >= 5 ? "animate-pulse" : ""} />
            <span>Streak: {streak}</span>
          </motion.div>
          {bestStreak > 0 && <span className="text-sm text-gray-300 ml-2">(Beste: {bestStreak})</span>}
        </div>
      </div>

      <div className="w-full max-w-xl flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2 text-white font-semibold">
          <FaStopwatch />
          <span>{timeLeft.toFixed(1)} Sek</span>
        </div>
        <motion.div
          key={Math.ceil(timeLeft)}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1 text-green-300 font-semibold"
        >
          <FaStar className="text-yellow-400" />
          <span>+{Math.ceil(timeLeft)} Punkte möglich</span>
        </motion.div>
      </div>

      {/* Streak Bonus Indicator */}
      {streak >= 5 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mb-2 px-1"
        >
          <div className="bg-orange-500 bg-opacity-20 border-2 border-orange-400 rounded-lg p-2 text-center">
            <span className="text-orange-300 font-bold">
              🔥 Streak Bonus aktiv: +{Math.floor(streak / 5) * 5} Punkte beim nächsten Treffer!
            </span>
          </div>
        </motion.div>
      )}

      <div className="w-full max-w-xl h-4 bg-gray-700 rounded mb-6 overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-100"
          style={{ width: `${(timeLeft / 10) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        {[...Array(3)].map((_, i) =>
          i < lives ? (
            <FaHeart key={i} className="text-red-500 text-2xl" />
          ) : (
            <FaRegHeart key={i} className="text-gray-400 text-2xl" />
          )
        )}
      </div>

      {loading ? (
        <p>Lade Karten...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-xs sm:max-w-4xl w-full">
          {currentPair.map((card, index) => (
            <motion.div
              key={card.id}
              whileHover={{ scale: selectedCard === null ? 1.05 : 1 }}
              whileTap={{ scale: selectedCard === null ? 0.95 : 1 }}
              onClick={() => selectedCard === null && handleChoice(index)}
              className={`transition ${selectedCard !== null ? "pointer-events-none" : "cursor-pointer"}
                ${selectedCard !== null &&
                (selectedCard === index
                  ? correctIndex === index
                    ? "border-4 border-green-500"
                    : "border-4 border-red-500"
                  : "border-4 border-transparent")}
              `}
            >
              <div className="bg-white text-black rounded-2xl shadow-xl overflow-hidden">
                <div className="p-0">
                  <div className="text-center font-semibold text-lg">
                    {showPrices && (
                      <div className="md:text-2xl text-base p-2 text-gray-700">
                        💵 €{card.prices.eur.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <img
                    src={card.image_uris.normal}
                    alt={card.name}
                    className="w-full h-auto sm:max-h-[500px] object-contain"
                    onLoad={() => {
                      setImagesLoaded(prev => {
                        const newLoaded = [...prev];
                        newLoaded[index] = true;
                        return newLoaded;
                      });
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <div className="mt-6 flex text-lg min-h-[80px]">
        {selectedCard !== null && !gameOver && (
          <button
            onClick={() => {
              setNextPair();
            }}
            className=" bg-blue-500 text-2xl font-semibold hover:bg-blue-600 text-white px-6 py-6 rounded transition"
          >
            Weiter
          </button>
        )}
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
          <h2 className="text-2xl mb-4 font-bold">❌ Falsch geraten!</h2>
          <p className="mb-2 text-lg">{message}</p>
          {bestStreak > 0 && (
            <p className="mb-6 text-xl text-orange-400 font-bold">
              🔥 Beste Streak: {bestStreak}
            </p>
          )}
          <button
            onClick={handleRestart}
            className="bg-green-600 px-6 py-3 rounded text-white text-lg hover:bg-green-700 transition"
          >
            Neustarten
          </button>
          <button
            onClick={onBack}
            className="mt-4 bg-blue-600 px-6 py-3 rounded text-white text-lg hover:bg-blue-700 transition"
          >
            Zurück zum Menü
          </button>
          {user?.guest && !showRegister && (
            <button
              onClick={() => setShowRegister(true)}
              className="mt-4 bg-blue-400 px-6 py-3 rounded text-white text-lg hover:bg-blue-600 transition"
            >
              Registrieren & Score speichern
            </button>
          )}

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
        </div>
      )}

      {message && !gameOver && (
        <p className="mt-6 text-xl transition-all duration-500">{message}</p>
      )}
    </>
  );
}