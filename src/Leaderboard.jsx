import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";


const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
console.log("API_URL:", process.env.REACT_APP_API_URL);

export default function Leaderboard({ onBack }) {
  const [players, setPlayers] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(API_URL+"/api/leaderboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlayers(res.data);
      } catch (err) {
        console.error("Fehler beim Laden der Rangliste:", err);
      }
    };

    fetchLeaderboard();
  }, [token]);

  return (
    <div className="text-white text-center max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-6">🏆 Rangliste</h2>

      <ol className="bg-white text-black rounded-lg shadow-lg p-4">
        {players.map((player, index) => (
          <li key={index} className="py-1 border-b last:border-none">
            <span className="font-bold">{index + 1}.</span> {player.username} –{" "}
            <span className="text-green-600 font-semibold">{player.highscore}</span>
          </li>
        ))}
      </ol>

      <button
        onClick={onBack}
        className="mt-6 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
      >
        Zurück
      </button>
    </div>
  );
}
