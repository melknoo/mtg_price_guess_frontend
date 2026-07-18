import React, { useEffect, useState, useCallback } from "react";
import Game from "./Game";
import {
  fetchDailyChallengeCards,
  saveDailyChallengeScore,
  fetchDailyChallengeLeaderboard,
} from "../api/dailyChallengeApi";
import GameIcon from "../../../shared/components/GameIcon";

function Countdown() {
  const getMsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
  };

  const [ms, setMs] = useState(getMsUntilMidnight);

  useEffect(() => {
    const interval = setInterval(() => setMs(getMsUntilMidnight()), 1000);
    return () => clearInterval(interval);
  }, []);

  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");

  return (
    <span className="font-mono text-yellow-300 text-xl">
      {h}:{m}:{s}
    </span>
  );
}

function DailyLeaderboard({ leaderboard, userRank, userScore }) {
  if (!leaderboard) return null;

  return (
    <div className="w-full max-w-sm mt-4">
      <h3 className="text-lg font-bold text-center mb-2 text-purple-300">
        Today's Top 10
      </h3>
      {leaderboard.data && leaderboard.data.length > 0 ? (
        <div className="space-y-1">
          {leaderboard.data.map((entry) => (
            <div
              key={entry.rank}
              className={`flex justify-between items-center px-3 py-1.5 rounded text-sm ${
                entry.rank === userRank
                  ? "bg-yellow-600/40 border border-yellow-400"
                  : "bg-white/10"
              }`}
            >
              <span className="text-gray-300 w-6">#{entry.rank}</span>
              <span className="flex-1 font-medium truncate mx-2">{entry.username}</span>
              <span className="text-green-400 font-bold">{entry.score}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm">No scores yet today.</p>
      )}
      <p className="text-center text-gray-400 text-xs mt-2">
        {leaderboard.total_players ?? 0} player{leaderboard.total_players !== 1 ? "s" : ""} today
      </p>
    </div>
  );
}

export default function DailyChallengeGame({ onBack, accountProgression = null }) {

  const [status, setStatus] = useState("loading"); // loading | ready | already_played | finished | error
  const [crystalReward, setCrystalReward] = useState(null); // { crystals } vom Daily-Claim
  const [dailyCards, setDailyCards] = useState(null);
  const [challengeDate, setChallengeDate] = useState("");
  const [finalScore, setFinalScore] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const loadLeaderboard = useCallback(async () => {
    try {
      const lb = await fetchDailyChallengeLeaderboard();
      setLeaderboard(lb);
    } catch {
      // Leaderboard-Fehler sind nicht kritisch
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDailyChallengeCards();
        setChallengeDate(data.challenge_date);

        if (data.already_played) {
          setFinalScore(data.score);
          setUserRank(data.rank);
          setStatus("already_played");
          await loadLeaderboard();
        } else {
          setDailyCards(data.cards);
          setStatus("ready");
        }
      } catch (err) {
        setErrorMessage(err?.response?.data?.message || "Failed to load daily challenge.");
        setStatus("error");
      }
    };

    load();
  }, [loadLeaderboard]);

  const handleGameOver = useCallback(
    async (score) => {
      setFinalScore(score);
      try {
        const result = await saveDailyChallengeScore(score);
        setUserRank(result.rank);
      } catch {
        // Score konnte nicht gespeichert werden — trotzdem Ergebnis zeigen
      }
      await loadLeaderboard();
      // Daily-Challenge-Crystals (einmal täglich, Guard im Hook)
      setCrystalReward(accountProgression?.claimDailyChallengeReward?.() ?? null);
      setStatus("finished");
    },
    [loadLeaderboard, accountProgression]
  );

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="text-4xl animate-pulse">📅</div>
        <p className="text-gray-300">Loading today's challenge...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-red-400 text-lg">{errorMessage}</p>
        <button onClick={onBack} className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded text-white transition">
          Back to Menu
        </button>
      </div>
    );
  }

  if (status === "already_played" || status === "finished") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center px-4 py-8">
        <h2 className="text-2xl font-bold">
          {status === "finished" ? "🏁 Challenge Complete!" : "📅 Already played today!"}
        </h2>
        <p className="text-gray-300 text-sm">
          {challengeDate && `Challenge: ${challengeDate}`}
        </p>

        <div className="bg-white/10 rounded-xl px-8 py-4 mt-2">
          <p className="text-gray-400 text-sm mb-1">Your Score</p>
          <p className="text-4xl font-bold text-green-400">{finalScore}</p>
          {userRank && (
            <p className="text-yellow-300 mt-1 font-semibold">Rank #{userRank} today</p>
          )}
        </div>

        {status === "finished" && crystalReward && (
          <div className="inline-flex items-center gap-2 bg-purple-500/15 border-2 border-purple-400/40 rounded-sm px-3 py-1.5">
            <GameIcon name="crystal" size={18} color="purple" />
            <span className="text-purple-200 font-bold">+{crystalReward.crystals} Crystals</span>
          </div>
        )}

        <DailyLeaderboard leaderboard={leaderboard} userRank={userRank} userScore={finalScore} />

        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Next challenge in</p>
          <Countdown />
        </div>

        <button
          onClick={onBack}
          className="mt-4 bg-purple-600 px-6 py-3 rounded text-white hover:bg-purple-700 transition"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  // status === "ready" → Spiel starten
  return (
    <div className="w-full flex flex-col items-center relative">
      <div className="flex justify-center w-full mb-2">
        <div className="bg-yellow-600/80 text-white text-xs font-bold px-3 py-1 rounded-lg">
          📅 DAILY CHALLENGE — {challengeDate}
        </div>
      </div>
      <Game
        key={gameKey}
        score={gameScore}
        setScore={setGameScore}
        onBack={onBack}
        showRegister={false}
        setShowRegister={() => {}}
        initialCards={dailyCards}
        onGameOver={handleGameOver}
      />
    </div>
  );
}
