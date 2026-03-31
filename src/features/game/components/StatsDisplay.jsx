import React, { useState, useEffect } from "react";
import { fetchStats } from "../api/statsApi";
import GameIcon from "../../../shared/components/GameIcon";

function StatCard({ icon, color = "white", label, value, sub }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
      <div className="mb-1 flex justify-center">
        <GameIcon name={icon} size={24} color={color} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-amber-200/80">{label}</div>
      {sub && <div className="text-xs text-amber-300/70 mt-1">{sub}</div>}
    </div>
  );
}

function ScoreBar({ game, maxScore }) {
  const pct = maxScore > 0 ? Math.round((game.score / maxScore) * 100) : 0;
  const isDaily = game.mode === "daily";
  const date = new Date(game.created_at).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
  const accuracy = game.accuracy ?? 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 text-xs text-amber-300/70 text-right shrink-0">{date}</div>
      <div className="flex-1 bg-white/10 rounded-full h-5 overflow-hidden">
        <div
          className={`h-full rounded-full flex items-center justify-end pr-2 transition-all ${
            isDaily ? "bg-yellow-500" : "bg-blue-600/80"
          }`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        >
          <span className="text-xs font-bold text-white leading-none">{pct > 20 ? game.score : ""}</span>
        </div>
      </div>
      <div className="w-20 text-xs text-amber-200/80 shrink-0">
        {pct <= 20 && <span className="mr-1">{game.score}</span>}
        <span className="text-amber-400/60">{accuracy}%</span>
      </div>
    </div>
  );
}

export default function StatsDisplay({ onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError("Statistiken konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <GameIcon name="stat" size={22} color="white" />
        <span>Meine Statistiken</span>
      </h2>

      {loading && (
        <div className="text-center text-amber-300/70 py-12">
          Lade Statistiken…
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 text-red-300 rounded-xl p-4 text-center">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Übersicht */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="human_controller" label="Spiele" value={stats.games_played} />
            <StatCard
              icon="target"
              label="Trefferquote"
              value={`${stats.accuracy}%`}
            />
            <StatCard
              icon="trophy"
              color="amber"
              label="Bester Score"
              value={stats.best_score ?? "—"}
            />
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon="thunder"
              color="yellow"
              label="Beste Streak"
              value={stats.best_streak ?? 0}
            />
            <StatCard
              icon="graph"
              label="Ø Score"
              value={stats.avg_score ?? 0}
            />
            <StatCard
              icon="list"
              label="Runden gesamt"
              value={stats.total_rounds ?? 0}
            />
          </div>

          {/* Score-Verlauf */}
          {stats.recent_games && stats.recent_games.length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-200/80 mb-3">
                Letzte Spiele{" "}
                <span className="text-amber-400/60 font-normal">
                  (<span className="text-blue-400">■</span> Normal{" "}
                  <span className="text-yellow-400">■</span> Daily)
                </span>
              </h3>
              <div className="space-y-2">
                {stats.recent_games.map((game, i) => {
                  const maxScore = Math.max(
                    ...stats.recent_games.map((g) => g.score),
                    1
                  );
                  return <ScoreBar key={i} game={game} maxScore={maxScore} />;
                })}
              </div>
            </div>
          )}

          {/* Daily Challenge */}
          {stats.daily_challenge && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-yellow-300 mb-3">
                <span className="inline-flex items-center gap-2">
                  <GameIcon name="time" size={16} color="yellow" />
                  <span>Daily Challenge</span>
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon="timeline"
                  label="Gespielt"
                  value={stats.daily_challenge.games_played}
                  sub="Tage"
                />
                <StatCard
                  icon="trophy_2"
                  color="amber"
                  label="Bester Score"
                  value={stats.daily_challenge.best_score ?? "—"}
                />
              </div>
            </div>
          )}

          {stats.games_played === 0 && (
            <div className="text-center text-amber-300/70 py-4">
              Noch keine Spiele gespielt. Starte dein erstes Spiel!
            </div>
          )}
        </>
      )}

      <button
        onClick={onBack}
        className="mt-2 w-full bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded text-white transition"
      >
        Back to Menu
      </button>
    </div>
  );
}
