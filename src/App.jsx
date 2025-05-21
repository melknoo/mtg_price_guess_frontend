import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import LoginForm from "./LoginForm";
import Leaderboard from "./Leaderboard";
import Game from "./Game";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function App() {
  const { user, logout } = useAuth();
  const [screen, setScreen] = useState("menu");
  const [gameKey, setGameKey] = useState(0);

  const handleLogout = () => {
    logout();
    setGameKey((k) => k + 1);
    setScreen("menu");
  };

  const handleDBMagic = async () => {
    try {
      await axios.delete(API_URL + "/api/empty-db");
    } catch (error) {
      console.error("Fehler beim Zurücksetzen der DB:", error);
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
                  setGameKey((k) => k + 1);
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

      {screen === "game" && <Game key={gameKey} user={user} onBack={() => setScreen("menu")} />}
    </div>
  );
}
