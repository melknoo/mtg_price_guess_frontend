import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../api/leaderboardApi";

export default function Leaderboard({ onBack, onShowFull, compact = false, mobileLimit = 5 }) {
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
    <div className={`text-gray-900 text-center ${compact ? "w-full" : "max-w-md mx-auto"}`}>
      <h2 className={`font-bold ${compact ? "text-xl mb-3" : "text-3xl mb-6"}`}>🏆 Leaderboard</h2>

      {players.length === 0 ? (
        <p className="text-gray-600 py-4 text-sm">
          No highscores yet. Be the first!
        </p>
      ) : (
        <ol className="bg-black/10 border border-black/10 rounded-lg p-3">
          {(compact ? players.slice(0, mobileLimit) : players).map((player, index) => (
            <li
              key={index}
              className={`flex items-center justify-between border-b border-black/10 last:border-none ${compact ? "py-1.5 text-sm" : "py-2"}`}
            >
              <span className="flex items-center gap-2">
                <span className={`font-bold w-5 text-right shrink-0 ${index === 0 ? "text-amber-500" : index === 1 ? "text-slate-500" : index === 2 ? "text-amber-700" : "text-gray-500"}`}>
                  {index + 1}.
                </span>
                <span className="text-gray-800">{player.username}</span>
              </span>
              <span className="text-amber-600 font-semibold">{player.highscore.toLocaleString()}</span>
            </li>
          ))}
          {compact && players.length > mobileLimit && (
            <li className="pt-2 text-center">
              <button
                onClick={onShowFull}
                className="text-xs text-gray-500 hover:text-amber-600 transition-colors cursor-pointer"
              >
                +{players.length - mobileLimit} more · see full leaderboard
              </button>
            </li>
          )}
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