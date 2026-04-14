import { useMemo } from 'react';
import { motion } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';

const PERK_INTERVAL = 5;
const RELIC_INTERVAL = 10;
const XP_PER_LEVEL = (lvl) => 50 + lvl * 25;

// Nächste N Runden-Events (abwechselnd Perk / Relic alle 5 Runden)
function getUpcomingRoundEvents(currentRound, count = 8) {
  const result = [];
  let next = Math.ceil((currentRound + 0.5) / PERK_INTERVAL) * PERK_INTERVAL;
  for (let i = 0; i < count; i++) {
    const round = next + i * PERK_INTERVAL;
    result.push({ round, isRelic: round % RELIC_INTERVAL === 0 });
  }
  return result;
}

// Nächste N Level-Ups (nur Perk-Rewards)
function getUpcomingLevels(currentLevel, currentXp, xpToNext, count = 5) {
  const result = [];
  let xpLeft = xpToNext - currentXp;
  for (let i = 0; i < count; i++) {
    const lvl = currentLevel + i + 1;
    result.push({ level: lvl, xpLeft });
    xpLeft += XP_PER_LEVEL(lvl);
  }
  return result;
}

export default function ProgressionRoadmapModal({ onClose, currentRound, level, hasNoPerkRelic }) {
  const roundEvents = useMemo(() => getUpcomingRoundEvents(currentRound), [currentRound]);
  const upcomingLevels = useMemo(
    () => getUpcomingLevels(level.level, level.xp, level.xpToNextLevel),
    [level.level, level.xp, level.xpToNextLevel]
  );

  const xpPercent = Math.min(100, Math.round((level.xp / level.xpToNextLevel) * 100));

  // Nächstes Perk-Event (round % 10 !== 0) und nächstes Relic-Event
  const nextPerkEvent = roundEvents.find(e => !e.isRelic);
  const nextRelicEvent = roundEvents.find(e => e.isRelic);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-[#0d1117] border-2 border-indigo-500/50 rounded-sm shadow-pixel text-white overflow-y-auto max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0d1117]/95 backdrop-blur px-5 pt-4 pb-3 border-b-2 border-indigo-500/30 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GameIcon name="map" size={18} color="amber" />
            <div>
              <h2 className="text-lg font-bold text-amber-200">Progression Roadmap</h2>
              <p className="text-white/50 text-xs mt-0.5">
                Round {currentRound} · Level {level.level} · {level.xp}/{level.xpToNextLevel} XP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 text-xl leading-none mt-0.5 ml-4 shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">

          {/* XP Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-amber-300 font-semibold uppercase tracking-widest">Current XP</span>
              <span className="text-xs text-white/50">{level.xp} / {level.xpToNextLevel}</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-sm overflow-hidden shadow-pixel-inset">
              <motion.div
                className="h-full bg-amber-400 rounded-sm"
                initial={false}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1 text-right">
              {level.xpToNextLevel - level.xp} XP to Level {level.level + 1}
            </p>
          </div>

          {/* Quick summary badges */}
          <div className="grid grid-cols-3 gap-2">
            {!hasNoPerkRelic && nextPerkEvent ? (
              <div className="bg-purple-500/15 border border-purple-400/30 rounded-sm p-3 text-center">
                <div className="text-purple-300 text-lg font-bold">R{nextPerkEvent.round}</div>
                <div className="flex items-center justify-center gap-1 text-purple-200/70 text-xs mt-0.5">
                  <GameIcon name="glow" size={11} color="purple" />
                  Next Perk
                </div>
                <div className="text-white/40 text-xs">in {nextPerkEvent.round - currentRound}r</div>
              </div>
            ) : (
              <div className="bg-gray-500/15 border border-gray-400/20 rounded-sm p-3 text-center">
                <div className="text-gray-400 text-lg font-bold">—</div>
                <div className="text-gray-400/70 text-xs mt-0.5">Perks off</div>
              </div>
            )}
            {nextRelicEvent && (
              <div className="bg-yellow-500/15 border border-yellow-400/30 rounded-sm p-3 text-center">
                <div className="text-yellow-300 text-lg font-bold">R{nextRelicEvent.round}</div>
                <div className="flex items-center justify-center gap-1 text-yellow-200/70 text-xs mt-0.5">
                  <GameIcon name="gem" size={11} color="amber" />
                  Next Relic
                </div>
                <div className="text-white/40 text-xs">in {nextRelicEvent.round - currentRound}r</div>
              </div>
            )}
            <div className="bg-amber-500/15 border border-amber-400/30 rounded-sm p-3 text-center">
              <div className="text-amber-300 text-lg font-bold">Lv {level.level + 1}</div>
              <div className="flex items-center justify-center gap-1 text-amber-200/70 text-xs mt-0.5">
                <GameIcon name="star" size={11} color="amber" />
                Next Level
              </div>
              <div className="text-white/40 text-xs">{level.xpToNextLevel - level.xp} XP</div>
            </div>
          </div>

          {/* Round Timeline */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
              <GameIcon name="timeline" size={13} color="white" />
              Upcoming Round Events
            </h3>
            <div className="space-y-1">
              {roundEvents.map((event, i) => {
                const dist = event.round - currentRound;
                const isFirst = i === 0;
                return (
                  <div
                    key={event.round}
                    className={`flex items-center gap-3 rounded-sm px-3 py-2 ${
                      event.isRelic
                        ? isFirst
                          ? 'bg-yellow-500/20 border border-yellow-400/40'
                          : 'bg-yellow-500/8 border border-yellow-400/15'
                        : isFirst
                        ? 'bg-purple-500/20 border border-purple-400/40'
                        : 'bg-white/5 border border-white/5'
                    }`}
                  >
                    <span className={`text-xs font-mono font-bold w-8 shrink-0 ${
                      event.isRelic ? 'text-yellow-300' : isFirst ? 'text-purple-300' : 'text-white/40'
                    }`}>
                      R{event.round}
                    </span>
                    <div className="flex items-center gap-1.5 flex-1">
                      {event.isRelic ? (
                        <>
                          <GameIcon name="gem" size={12} color={isFirst ? 'amber' : 'gray'} />
                          <span className={`text-xs font-semibold ${isFirst ? 'text-yellow-200' : 'text-white/40'}`}>
                            Relic Selection
                          </span>
                        </>
                      ) : (
                        <>
                          <GameIcon name="glow" size={12} color={isFirst ? 'purple' : 'gray'} />
                          <span className={`text-xs ${isFirst ? 'text-white/90' : 'text-white/40'}`}>
                            {hasNoPerkRelic ? 'Perk Selection (disabled)' : 'Perk Selection'}
                          </span>
                        </>
                      )}
                    </div>
                    <span className={`text-xs tabular-nums ${isFirst ? (event.isRelic ? 'text-yellow-300 font-semibold' : 'text-purple-300 font-semibold') : 'text-white/25'}`}>
                      +{dist}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level Timeline */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 uppercase tracking-widest mb-2">
              <GameIcon name="star" size={13} color="amber" />
              Upcoming Levels
            </h3>
            <div className="space-y-1">
              {upcomingLevels.map((item, i) => (
                <div
                  key={item.level}
                  className={`flex items-center gap-3 rounded-sm px-3 py-2 ${
                    i === 0
                      ? 'bg-amber-500/15 border border-amber-400/30'
                      : 'bg-white/5 border border-white/5'
                  }`}
                >
                  <span className={`text-xs font-mono font-bold w-8 shrink-0 ${i === 0 ? 'text-amber-300' : 'text-white/40'}`}>
                    L{item.level}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1">
                    <GameIcon name="star" size={12} color={i === 0 ? 'amber' : 'gray'} />
                    <span className={`text-xs ${i === 0 ? 'text-white/90' : 'text-white/40'}`}>
                      Level Up — Perk reward
                    </span>
                  </div>
                  {i === 0 && (
                    <span className="text-xs text-amber-300/70 tabular-nums">{item.xpLeft} XP</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
