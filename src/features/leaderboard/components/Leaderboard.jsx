import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../api/leaderboardApi";

export default function Leaderboard({ onBack }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await fetchLeaderboard();
        setPlayers(data);
      } catch (err) {
        setError('Error while loading leaderboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="text-white text-center">
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-white text-center">
        <p className="text-red-400 mb-4">❌ {error}</p>
        <button
          onClick={onBack}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="text-white text-center max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-6">🏆 Leaderboard</h2>

      {players.length === 0 ? (
        <p className="text-gray-400 py-4">
          No highscores yet. Be the first!
        </p>
      ) : (
        <ol className="bg-white text-black rounded-lg shadow-lg p-4">
          {players.map((player, index) => (
            <li key={index} className="py-1 border-b last:border-none">
              <span className="font-bold">{index + 1}.</span> {player.username} –{" "}
              <span className="text-green-600 font-semibold">{player.highscore}</span>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={onBack}
        className="mt-6 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
      >
        Back
      </button>
    </div>
  );
}