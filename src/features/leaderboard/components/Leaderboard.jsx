import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../api/leaderboardApi";

export default function Leaderboard({ onBack, compact = false }) {
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
    <div className={`text-white text-center ${compact ? "w-full" : "max-w-md mx-auto"}`}>
      <h2 className={`font-bold ${compact ? "text-xl mb-3" : "text-3xl mb-6"}`}>🏆 Leaderboard</h2>

      {players.length === 0 ? (
        <p className="text-gray-400 py-4 text-sm">
          No highscores yet. Be the first!
        </p>
      ) : (
        <ol className="bg-white/10 border border-white/20 rounded-lg p-3">
          {players.map((player, index) => (
            <li
              key={index}
              className={`flex items-center justify-between border-b border-white/10 last:border-none ${compact ? "py-1.5 text-sm" : "py-2"}`}
            >
              <span className="flex items-center gap-2">
                <span className={`font-bold w-5 text-right shrink-0 ${index === 0 ? "text-amber-400" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-700" : "text-white/50"}`}>
                  {index + 1}.
                </span>
                <span className="text-white/90">{player.username}</span>
              </span>
              <span className="text-amber-400 font-semibold">{player.highscore.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}

      {!compact && (
        <button
          onClick={onBack}
          className="mt-6 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded text-white transition"
        >
          Back
        </button>
      )}
    </div>
  );
}