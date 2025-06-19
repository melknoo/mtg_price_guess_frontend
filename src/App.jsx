import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "./AuthContext";
import LoginForm from "./LoginForm";
import { FaHeart, FaRegHeart, FaStar, FaStopwatch } from "react-icons/fa";
import Leaderboard from "./Leaderboard";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function App() {
  const [cachedCards, setCachedCards] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [screen, setScreen] = useState("menu");
  const [loading, setLoading] = useState(false);
  const [lives, setLives] = useState(3);
  const [showPrices, setShowPrices] = useState(false);
  const [hasPreloaded, setHasPreloaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerRunning, setTimerRunning] = useState(false);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState([false, false]); // neu
  const { user, logout, refreshUser, setUser } = useAuth();

  useEffect(() => {
    if ((user || user?.guest) && !hasPreloaded) {
      setHasPreloaded(true);
      preloadCards();
    }
  }, [user, hasPreloaded]);

  // Reset imagesLoaded und Timer wenn currentPair sich ändert
  useEffect(() => {
    setImagesLoaded([false, false]);
    setTimerRunning(false);
    setTimeLeft(10);
  }, [currentPair]);

  // Timer starten, wenn beide Bilder geladen sind
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
  }, [timerRunning, timeLeft, showPrices, selectedCard]);

  useEffect(() => {
    if (screen === "game" && cachedCards.length >= 2 && currentPair.length === 0) {
      setNextPair();
    }
  }, [screen, cachedCards]);

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
        prices: { eur: card.price },
        image_uris: { normal: card.image }
      }));

      setCachedCards(transformed);
      return transformed; // <== HINZUGEFÜGT
    } catch (error) {
      console.error("❌ Fehler beim Laden der Karten:", error);
      setMessage("Fehler beim Laden der Karten.");
      return []; // <== fallback
    } finally {
      setLoading(false);
    }
  };

  const setNextPair = async () => {
    let updatedCache = [...cachedCards];

    // Wenn weniger als 2 Karten übrig, neue dazuladen (nicht ersetzen!)
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
  };

  const handleLogout = () => {
    if (user?.guest) {
      setUser(null);
    } else {
      logout();
    }
    setScore(0);
    setMessage("");
    setCachedCards([]);
  };
  const handleDBMagic = async () => {
    console.log("DB MAGIC");
    try {
      await axios.delete(API_URL + "/api/empty-db");
      console.log("db geleert");
    } catch (error) {
      console.error("Fehler beim Zurücksetzen der DB:", error);
    }
  };

  const handleChoice = (chosenIndex) => {
    const price1 = parseFloat(currentPair[0].prices.eur);
    const price2 = parseFloat(currentPair[1].prices.eur);
    const correct = price1 >= price2 ? 0 : 1;
    console.log("in handleChoice");
    setCorrectIndex(correct);
    setSelectedCard(chosenIndex);
    console.log("chosenIndex:", chosenIndex);

    if (chosenIndex === correct) {
      const bonus = Math.ceil(timeLeft);
      const newScore = score + bonus;

      setScore(newScore);
      setMessage(`✅ Richtig! +${bonus} Punkte!`);
      if (newScore > user.highscore) {
        if (user?.guest) {
          setUser({ ...user, highscore: newScore });
        } else {
          axios.post(API_URL + "/api/score", { score: newScore })
            .then(() => refreshUser()) // <- Nutzer aktualisieren
            .catch(e => {
              console.error("Fehler beim Highscore-Update", e);
            });
        }
      }
    } else {
      const remaining = lives - 1;
      setLives(remaining);
      setShowPrices(true);

      const losingCard = currentPair[correct];
      setMessage(`❌ Falsch! ${losingCard.name} war teurer: €${losingCard.prices.eur.toFixed(2)}`);

      if (remaining <= 0) {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex gap-2">
        {screen === "game" && (
          <button
            onClick={() => setScreen("menu")}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Zurück zum Menü
          </button>
        )}
      </div>

      {screen === "menu" && (
        <div>
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Logout
            </button>
            {user.username === "melle" && (
              <button
                onClick={handleDBMagic}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                DB MAGIC
              </button>
            )}

          </div>
          <div className="text-center space-y-4">

            <h1 className="text-3xl font-bold mb-4">🧙‍♂️ Magic Preis-Duell</h1>
            <h2 className="text-2xl font-bold mb-4">Hallo {user.username}</h2>
            <div className="space-x-4">
              <button
                onClick={() => {
                  handleRestart();
                  setScreen("game");
                }}
                className="bg-green-600 px-6 py-3 rounded text-white text-lg hover:bg-green-700 transition"
              >
                Neues Spiel
              </button>
              <button
                onClick={() => setScreen("leaderboard")}
                className="bg-purple-600 px-6 py-3 rounded text-white text-lg hover:bg-purple-700 transition"
              >
                Rangliste
              </button>
            </div>
          </div>
        </div>

      )}

      {screen === "leaderboard" && <Leaderboard onBack={() => setScreen("menu")} />}

      {screen === "game" && (
        <>
          <h1 className="md:text-3xl hidden md:block md:mt-0 mt-6 font-bold mb-4">🧙‍♂️ Magic Card Preis-Duell</h1>
          <div className="flex md:text-center w-full flex-col">
            <p className="mb-2 text-lg">Dein Highscore: {user.highscore}</p>
            <p className="mb-6 font-bold text-2xl">Punkte: {score}</p>
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
                  className={`transition ${selectedCard !== null ? "pointer-events-none" : "cursor-pointer"
                    } ${selectedCard !== null &&
                    (selectedCard === index
                      ? correctIndex === index
                        ? "border-4 border-green-500"
                        : "border-4 border-red-500"
                      : "border-4 border-transparent")
                    }`}
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
              <p className="mb-6 text-lg">{message}</p>
              <button
                onClick={handleRestart}
                className="bg-green-600 px-6 py-3 rounded text-white text-lg hover:bg-green-700 transition"
              >
                Neustarten
              </button>
              <button
                onClick={() => setScreen("menu")}
                className="mt-4 bg-blue-600 px-6 py-3 rounded text-white text-lg hover:bg-blue-700 transition"
              >
                Zurück zum Menü
              </button>
            </div>
          )}

          {message && !gameOver && (
            <p className="mt-6 text-xl transition-all duration-500">{message}</p>
          )}
        </>
      )}
    </div>
  );
}
