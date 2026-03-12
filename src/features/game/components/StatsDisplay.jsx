import React, { useState, useEffect } from "react";
import { fetchStats } from "../api/statsApi";

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-purple-200">{label}</div>
      {sub && <div className="text-xs text-purple-300 mt-1">{sub}</div>}
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
      <div className="w-14 text-xs text-purple-300 text-right shrink-0">{date}</div>
      <div className="flex-1 bg-white/10 rounded-full h-5 overflow-hidden">
        <div
          className={`h-full rounded-full flex items-center justify-end pr-2 transition-all ${
            isDaily ? "bg-yellow-500" : "bg-purple-500"
          }`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        >
          <span className="text-xs font-bold text-white leading-none">{pct > 20 ? game.score : ""}</span>
        </div>
      </div>
      <div className="w-20 text-xs text-purple-200 shrink-0">
        {pct <= 20 && <span className="mr-1">{game.score}</span>}
        <span className="text-purple-400">{accuracy}%</span>
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
      <h2 className="text-2xl font-bold text-white">📊 Meine Statistiken</h2>

      {loading && (
        <div className="text-center text-purple-300 py-12">
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
            <StatCard icon="🎮" label="Spiele" value={stats.games_played} />
            <StatCard
              icon="🎯"
              label="Trefferquote"
              value={`${stats.accuracy}%`}
            />
            <StatCard
              icon="🏆"
              label="Bester Score"
              value={stats.best_score ?? "—"}
            />
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon="⚡"
              label="Beste Streak"
              value={stats.best_streak ?? 0}
            />
            <StatCard
              icon="📊"
              label="Ø Score"
              value={stats.avg_score ?? 0}
            />
            <StatCard
              icon="🔢"
              label="Runden gesamt"
              value={stats.total_rounds ?? 0}
            />
          </div>

          {/* Score-Verlauf */}
          {stats.recent_games && stats.recent_games.length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <h3 className="text-sm font-semibold text-purple-200 mb-3">
                Letzte Spiele{" "}
                <span className="text-purple-400 font-normal">
                  (<span className="text-purple-500">■</span> Normal{" "}
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
                📅 Daily Challenge
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon="📅"
                  label="Gespielt"
                  value={stats.daily_challenge.games_played}
                  sub="Tage"
                />
                <StatCard
                  icon="🥇"
                  label="Bester Score"
                  value={stats.daily_challenge.best_score ?? "—"}
                />
              </div>
            </div>
          )}

          {stats.games_played === 0 && (
            <div className="text-center text-purple-300 py-4">
              Noch keine Spiele gespielt. Starte dein erstes Spiel!
            </div>
          )}
        </>
      )}

      <button
        onClick={onBack}
        className="mt-2 w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded text-white transition"
      >
        Back to Menu
      </button>
    </div>
  );
}
