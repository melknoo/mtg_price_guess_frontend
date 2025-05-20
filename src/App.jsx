import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "./AuthContext";
import LoginForm from "./LoginForm";
import { FaHeart, FaRegHeart, FaStar, FaStopwatch } from "react-icons/fa";
import Leaderboard from "./Leaderboard";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost";
const PORT = process.env.REACT_APP_API_PORT || 3001;
console.log("API_URL:", process.env.REACT_APP_API_URL);

export default function App() {
  const [cards, setCards] = useState([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [screen, setScreen] = useState("menu");
  const [loading, setLoading] = useState(false);
  const [lives, setLives] = useState(3);
  const [showPrices, setShowPrices] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);      // Sekunden
  const [timerRunning, setTimerRunning] = useState(false);
  const [correctIndex, setCorrectIndex] = useState(null);
  const { user, logout, refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCards();
    }
  }, [user]);
  useEffect(() => {
    if (!timerRunning || showPrices || selectedCard !== null) return;

    if (timeLeft <= 0) {
      setTimerRunning(false);
      handleChoice(-1); // Timeout als falsche Antwort
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 0.1, 0)); // alle 100ms
    }, 100);

    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, showPrices, selectedCard]);

  const handleLogout = () => {
    logout();
    setScore(0);
    setMessage("");
    setCards([]);
  };

  const fetchCards = async () => {
    setLoading(true);
    setMessage("");
    setTimeLeft(10);
    setTimerRunning(false);

    try {
      const res = await axios.get(API_URL+":"+PORT+"/api/random-cards");
      const transformedCards = res.data.map(card => ({
        id: card.id,
        name: card.name,
        prices: { eur: card.price },
        image_uris: { normal: card.image }
      }));

      setCards(transformedCards);
      setTimerRunning(true); // Starte Timer sobald Karten da sind
    } catch (error) {
      console.error("❌ Fehler beim Laden der Karten aus der DB:", error);
      setMessage("Fehler beim Laden der Karten.");
    }

    setLoading(false);
  };

  const resetHighscores = async () => {
    try {
      const res = await axios.post(API_URL+":"+PORT+"/auth/reset-highscores", {}, {
        withCredentials: true
      });
      alert(res.data.message);
    } catch (error) {
      console.error("Fehler beim Zurücksetzen der Highscores:", error);
      alert("Fehler beim Zurücksetzen der Highscores");
    }
  };


  const handleChoice = (chosenIndex) => {
    const price1 = parseFloat(cards[0].prices.eur);
    const price2 = parseFloat(cards[1].prices.eur);
    const correctIndex = price1 >= price2 ? 0 : 1;

    setCorrectIndex(correctIndex);
    setSelectedCard(chosenIndex);

    if (chosenIndex === correctIndex) {
      const bonus = Math.ceil(timeLeft); // 1-10 Punkte Bonus
      const newScore = score + bonus;

      setScore(newScore);
      if (newScore > user.highscore) {
        try {
          axios.post(
            API_URL+":"+PORT+"/api/score",
            { score: newScore },
            { withCredentials: true }
          );
        } catch (error) {
          console.error("Fehler beim Aktualisieren des Highscores", error);
        }
      }
    }
    else {
      // Falsche Antwort: Ein Leben abziehen
      const remaining = lives - 1;
      setLives(remaining);
      setShowPrices(true)

      if (remaining <= 0) {
        setGameOver(true);
        setMessage(`❌ Falsch! ${cards[correctIndex].name} war teurer: €${cards[correctIndex].prices.eur}`);
        return; // Spiel beenden
      }

      setMessage(`❌ Falsch! ${cards[correctIndex].name} war teurer: €${cards[correctIndex].prices.eur}`);
    }

    setShowPrices(true);
    setTimerRunning(false);
    // setTimeout(() => {
    //   fetchCards();
    //   setShowPrices(false);
    //   setSelectedCard(null);
    //   setCorrectIndex(null);
    // }, 1000);
  };
  const handleRestart = () => {
    setScore(0);
    setMessage("");
    setGameOver(false);
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    setLives(3);
    fetchCards();
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
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {screen === "menu" && (
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold mb-4">🧙‍♂️ Magic Preis-Duell</h1>
          <div className="space-x-4">
            {/* <button
              onClick={resetHighscores}
              className="bg-red-600 px-6 py-3 rounded text-white text-lg hover:bg-red-700 transition mt-4"
            >
              Alle Highscores zurücksetzen
            </button> */}
            <button
              onClick={() => {
                handleRestart();        // setzt Spielzustand zurück
                setScreen("game");      // wechselt zur Spielansicht
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
      )}



      {screen === "leaderboard" && (
        <Leaderboard onBack={() => setScreen("menu")} />
      )}

      {screen === "game" && (
        <>
          <h1 className="text-3xl font-bold mb-4">🧙‍♂️ Magic Card Preis-Duell</h1>
          <p className="mb-2 text-lg">Dein Highscore: {user.highscore}</p>
          <p className="mb-6 font-bold text-2xl">Punkte: {score}</p>
          <div className="w-full max-w-xl flex justify-between items-center mb-2 px-1">
            <div className="flex items-center gap-2 text-white font-semibold">
              <span><FaStopwatch className="text-white" /></span>
              <span>{timeLeft.toFixed(1)} Sek</span>
            </div>
            <motion.div
              key={Math.ceil(timeLeft)} // animiert bei jedem Punktewechsel
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 text-green-300 font-semibold"
            >
              <span><FaStar className="text-yellow-400" /></span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl w-full">
              {cards.map((card, index) => (
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
                          <div className="text-2xl p-2 text-gray-700">
                            💵 €{card.prices.eur.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <img
                        src={card.image_uris.normal}
                        alt={card.name}
                        className="w-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {selectedCard !== null && !gameOver && (
            <button
              onClick={() => {
                fetchCards();
                setShowPrices(false);
                setSelectedCard(null);
                refreshUser(); // User neu laden, Highscore wird aktualisiert
                setCorrectIndex(null);
              }}
              className="mt-6 bg-blue-500 text-2xl font-semibold hover:bg-blue-600 text-white px-6 py-6 rounded transition"
            >
              Weiter
            </button>
          )}

          {/* Game Over Overlay */}
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