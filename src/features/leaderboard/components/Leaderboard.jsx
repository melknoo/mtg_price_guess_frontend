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
          className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded text-white transition"
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
        <ol className="bg-white/10 border border-white/20 rounded-lg p-4">
          {players.map((player, index) => (
            <li key={index} className="py-1 border-b border-white/10 last:border-none">
              <span className="font-bold">{index + 1}.</span> {player.username} –{" "}
              <span className="text-amber-400 font-semibold">{player.highscore}</span>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={onBack}
        className="mt-6 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded text-white transition"
      >
        Back
      </button>
    </div>
  );
}