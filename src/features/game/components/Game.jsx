import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useAchievementContext } from "../context/AchievementContext";
import { useGameTimer } from "../hooks/useGameTimer";
import { useStreak } from "../hooks/useStreak";
import { useCardLoader } from "../hooks/useCardLoader";
import { usePerkSystem } from "../hooks/usePerkSystem";
import { useLevel } from "../hooks/useLevel";
import { useRelicSystem } from "../hooks/useRelicSystem";
import { useSynergyEngine } from "../hooks/useSynergyEngine";
import { updateHighscore } from "../api/gameApi";
import { saveGameSession, saveRunLog } from "../api/statsApi";
import useRunLogger from "../hooks/useRunLogger";
import {
  isChoiceCorrect,
  getMoreExpensiveCard,
  createErrorMessage,
} from "../utils/cardComparison";
import {
  calculateTimeBonus,
} from "../utils/scoreCalculator";
import { GAME_CONFIG, SCORE_CONFIG } from "../../../shared/utils/constants";
import { FILTER_EFFECTS } from "../constants/perkDefinitions";
import { motion, AnimatePresence } from "framer-motion";
import GameTimer from "./GameTimer";
import StreakDisplay from "./StreakDisplay";
import LivesDisplay from "./LivesDisplay";
import CardPair from "./CardPair";
import GameOverScreen from "./GameOverScreen";
import PerkSelectionModal from "./PerkSelectionModal";
import LevelUpModal from "./LevelUpModal";
import ProgressionRoadmapModal from "./ProgressionRoadmapModal";
import SynergyToast from "./SynergyToast";
import GameIcon from "../../../shared/components/GameIcon";
import ActivePerksDisplay from "./ActivePerksDisplay";
import RegisterWithScore from "../../auth/components/RegisterWithScore";
import DebugPanel from "./DebugPanel";


function ScoreTooltip({ message, breakdown }) {
  const [open, setOpen] = useState(false);

  const panel = (
    <div className="w-64 bg-gray-900/95 border border-gray-600 rounded-xl p-3 shadow-2xl">
      <p className="text-xs font-bold text-gray-300 mb-2 border-b border-gray-600 pb-1">Score Breakdown</p>
      {breakdown.items.map((item, i) => (
        <div key={i} className="flex justify-between items-center text-xs py-0.5">
          <span className={item.delta === 0 ? 'text-gray-500' : 'text-gray-300'}>
            {item.isMult
              ? <span className="text-blue-400 font-bold mr-0.5">×</span>
              : <span className="text-green-500/60 mr-0.5">+</span>
            }
            {item.icon} {item.label}
          </span>
          <span className={item.delta === 0 ? 'text-gray-500' : item.isMult ? 'text-blue-300 font-semibold' : 'text-green-400 font-semibold'}>
            {item.delta === 0 ? '—' : `+${item.delta}`}
          </span>
        </div>
      ))}
      <div className="flex justify-between items-center text-sm font-bold mt-2 pt-2 border-t border-gray-600">
        <span className="text-white">Total</span>
        <span className="text-green-400">+{breakdown.total}</span>
      </div>
    </div>
  );

  const chip = (panelDir) => (
    <div className="relative group">
      <button
        onClick={() => setOpen(s => !s)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-150 active:scale-95
          ${open
            ? 'bg-green-500/20 border-green-400/60 shadow-sm shadow-green-500/20'
            : 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-400/50'
          }`}
      >
        <span className="text-green-400 font-bold text-sm sm:text-base leading-none">{message}</span>
        <span className={`text-green-500/70 text-xs transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      <div className={`absolute ${panelDir === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 z-50 transition-all duration-150 pointer-events-none
        ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'}`}>
        {panel}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: fixed top-left, panel opens downward */}
      <div className="sm:hidden fixed top-3 left-3 z-[64]">
        {chip('down')}
      </div>
      {/* Desktop: in normal flow, panel opens upward */}
      <div className="hidden sm:block">
        {chip('up')}
      </div>
    </>
  );
}

export default function Game({
  score,
  setScore,
  onBack,
  showRegister,
  setShowRegister,
  initialCards = null,
  onGameOver = null,
}) {
  const { user, refreshUser, setUser } = useAuth();
  const achievements = useAchievementContext();

  // Game State
  const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [showPrices, setShowPrices] = useState(false);
  const [message, setMessage] = useState("");
  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState([false, false]);
  const [currentRound, setCurrentRound] = useState(1);
  // Roguelike State
  const [comboMultiplier, setComboMultiplier] = useState(1);   // Combo Master Relic
  const [ironWillActive, setIronWillActive] = useState(false); // Iron Will Relic
  const [nextRoundDouble, setNextRoundDouble] = useState(false); // Perfectionist Echo Relic
  const [synergyToast, setSynergyToast] = useState(null);      // aktuelle Synergy-Notification
  const bestComboMultiplierRef = useRef(1);                    // Für Game-Over Summary
  const runLoggedRef = useRef(false);                          // Verhindert doppeltes Logging
  const saveCurrentRunRef = useRef(null);                      // Immer aktuelle saveCurrentRun-Ref
  const [flashingRelics, setFlashingRelics] = useState(new Set()); // Relic-Trigger-Animation
  const [tickingRelics, setTickingRelics] = useState(new Set());  // Subtler Tick-Animation
  const [fortressRegenCount, setFortressRegenCount] = useState(0); // Fortress unabhängiger Zähler
  const [masochistMult, setMasochistMult] = useState(0); // Masochist Synergy: permanent per damage
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showRelicSelection, setShowRelicSelection] = useState(false);

  // Animated score counter
  const [displayScore, setDisplayScore] = useState(0);
  const [scoreGain, setScoreGain] = useState(null);
  const displayScoreRef = useRef(0);
  const scoreAnimRef = useRef(null);
  const scoreGainTimerRef = useRef(null);

  useEffect(() => {
    if (score === 0) {
      if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current);
      displayScoreRef.current = 0;
      setDisplayScore(0);
      setScoreGain(null);
      return;
    }
    const start = displayScoreRef.current;
    const end = score;
    const delta = end - start;
    if (delta <= 0) return;

    setScoreGain(delta);
    if (scoreGainTimerRef.current) clearTimeout(scoreGainTimerRef.current);
    scoreGainTimerRef.current = setTimeout(() => setScoreGain(null), 1600);

    if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current);
    const duration = Math.min(Math.max(delta * 1.5, 300), 700);
    const startTime = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + delta * eased);
      displayScoreRef.current = current;
      setDisplayScore(current);
      if (progress < 1) {
        scoreAnimRef.current = requestAnimationFrame(animate);
      } else {
        displayScoreRef.current = end;
        setDisplayScore(end);
      }
    };
    scoreAnimRef.current = requestAnimationFrame(animate);
    return () => { if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current); };
  }, [score]);

  // Custom Hooks
  const cardLoader = useCardLoader();
  const streak = useStreak();
  const perkSystem = usePerkSystem();
  const level = useLevel();
  const relicSystem = useRelicSystem();
  const runLogger = useRunLogger();

  // Blinkt ein Relic kurz auf (1.2s) — visuelles Feedback wenn es triggert
  const flashRelic = useCallback((id) => {
    setFlashingRelics(prev => new Set([...prev, id]));
    setTimeout(() => {
      setFlashingRelics(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 1200);
  }, []);

  const tickRelic = useCallback((id) => {
    setTickingRelics(prev => new Set([...prev, id]));
    setTimeout(() => {
      setTickingRelics(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 600);
  }, []);

  // Synergy-Callback — stabil via useCallback
  const handleNewSynergy = useCallback((synergy) => {
    console.log('[Synergy ACTIVATED]', synergy.name, '— permanent for this run');
    setSynergyToast(synergy);
    setTimeout(() => setSynergyToast(null), 4000);
    achievements.trackSynergyActivated(
      // activeSynergies.length ist hier nicht direkt verfügbar, wird im Engine-Effect getrackt
      1 // Dummy — trackSynergyActivated zählt selbst hoch und prüft max
    );
  }, [achievements]);

  const synergyEngine = useSynergyEngine(
    relicSystem.activeRelics,
    perkSystem.activePerks,
    handleNewSynergy
  );

  // Timer mit Perk-Modifikationen
  const getTimerDuration = useCallback(() => {
    let duration = GAME_CONFIG.TIMER_DURATION;
    const timeBufferValue = perkSystem.getPerkValue("time_bonus") ?? 0;
    const meditationBonus = relicSystem.getRelicValue("permanent_time_bonus") ?? 0;
    // Speed Demon Synergy: verdoppelt alle Timer-Boni (nicht die Basis-Zeit)
    const timeMult = synergyEngine.getSynergyValue('double_time_bonus') ?? 1;
    duration += (timeBufferValue + meditationBonus) * timeMult;
    return duration;
  }, [perkSystem, relicSystem, synergyEngine]);

  const getTimerSpeed = useCallback(() => {
    const slowTimeValue = perkSystem.getPerkValue("slow_time");
    return slowTimeValue || 1;
  }, [perkSystem]);

  // Fake-Helpers: überschreiben echte Werte wenn entsprechende Relics aktiv sind
  const getEffectiveLives = useCallback(() => {
    if (relicSystem.hasRelic('deaths_mask')) return 1;
    return lives;
  }, [lives, relicSystem]);

  const getEffectiveStreak = useCallback(() => {
    const real = streak.streak;
    if (relicSystem.hasRelic('phantom_streak')) return Math.max(real, 10);
    return real;
  }, [streak.streak, relicSystem]);

  const getEffectiveAnswerTime = useCallback((realTimeLeft) => {
    if (relicSystem.hasRelic('timeless')) return getTimerDuration() - 0.5;
    return realTimeLeft;
  }, [relicSystem, getTimerDuration]);

  // Ref für handleChoice, damit timer.onTimeUp darauf zugreifen kann
  const handleChoiceRef = useRef(null);

  // Refs für Session-Statistiken (kein Re-render nötig)
  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);

  const timer = useGameTimer({
    onTimeUp: () => handleChoiceRef.current?.(-1),
    // Timer pausiert bei Perk-Auswahl UND Level-Up (analog zu showPerkSelection)
    enabled: !showPrices && selectedCard === null && !level.showLevelUp,
    duration: getTimerDuration(),
    speed: getTimerSpeed(),
  });

  const applyPerkEffects = useCallback((basePoints, timeLeft, winnerCard = null) => {
    let finalPoints = basePoints;
    const breakdown = [];
    let fakeBonus = 0; // Tracking für Cheater: Bonus der durch gefakte Bedingungen entstand

    const snap = (label, icon, before, isMult = false) => {
      const delta = Math.round(finalPoints - before);
      if (Math.abs(delta) >= 1) breakdown.push({ label, icon, delta, isMult });
    };

    // Hermit: alle Synergy-Checks deaktiviert, dafür Relic-Boni ×2 am Ende
    const hermitActive = relicSystem.hasRelic('hermit');
    // Timeless: Bedingungschecks (Speed) nutzen effektive Antwortzeit
    const effectiveTimeLeft = relicSystem.hasRelic('timeless') ? getTimerDuration() - 0.5 : timeLeft;
    const currentDuration = getTimerDuration();

    // --- Perk-Effekte ---
    const multiplierPerk = perkSystem.activePerks.find(p => p.effect === 'point_multiplier');
    const multiplier = multiplierPerk?.value ?? null;
    if (multiplier) { const b = finalPoints; finalPoints *= multiplier; snap(multiplierPerk.name, multiplierPerk.icon, b, true); }
    const flatPerk = perkSystem.activePerks.find(p => p.effect === 'flat_bonus');
    const flatBonus = flatPerk?.value ?? null;
    if (flatBonus) { const b = finalPoints; finalPoints += flatBonus; snap(flatPerk.name, flatPerk.icon, b); }
    // Color Mastery Perks: +N points wenn die korrekte Karte die passende Farbe hat
    if (winnerCard) {
      const cardColor = winnerCard.color || '';
      const colorBonusPerks = perkSystem.activePerks.filter(p => p.effect === 'color_bonus');
      colorBonusPerks.forEach(cbp => {
        const matches = cbp.colorValue === 'colorless'
          ? (!cardColor || cardColor === 'colorless')
          : cardColor.includes(cbp.colorValue);
        if (matches) { const b = finalPoints; finalPoints += cbp.value; snap(cbp.name, cbp.icon, b); }
      });
    }
    // Perfectionist Perk: effectiveTimeLeft für Timeless-Fake
    if (effectiveTimeLeft >= currentDuration - 1) {
      const perfectPerk = perkSystem.activePerks.find(p => p.effect === 'perfect_bonus');
      const perfectBonus = perfectPerk?.value ?? null;
      if (perfectBonus) {
        const b = finalPoints; finalPoints += perfectBonus; snap(perfectPerk.name, perfectPerk.icon, b);
        if (relicSystem.hasRelic('timeless') && timeLeft < currentDuration - 1) fakeBonus += finalPoints - b;
      }
    }

    // --- Relic-Effekte ---
    if (relicSystem.hasRelic('glass_cannon')) {
      const b = finalPoints; finalPoints *= relicSystem.getRelicValue('glass_cannon'); snap('Glass Cannon', '💥', b, true);
    }
    if (relicSystem.hasRelic('treasure_hunter')) {
      const perkBonusOnly = finalPoints - basePoints;
      if (perkBonusOnly > 0) {
        const b = finalPoints;
        finalPoints += perkBonusOnly * (relicSystem.getRelicValue('perk_bonus_amplifier') - 1);
        snap('Treasure Hunter', '🗝️', b);
      }
    }
    if (ironWillActive && relicSystem.hasRelic('iron_will')) {
      const b = finalPoints; finalPoints *= relicSystem.getRelicValue('comeback_bonus'); snap('Iron Will', '🛡️', b, true);
    }
    if (comboMultiplier > 1) {
      const b = finalPoints; finalPoints *= comboMultiplier; snap(`Combo ×${comboMultiplier.toFixed(2)}`, '🔗', b, true);
    }

    // --- Synergy-Effekte (Hermit deaktiviert diese) ---
    if (!hermitActive && synergyEngine.hasSynergy('gold_rush')) {
      const b = finalPoints; finalPoints *= synergyEngine.getSynergyValue('permanent_score_mult'); snap('Gold Rush', '💎💎', b, true);
    }
    // Berserker: effectiveLives — Deaths Mask macht es permanent aktiv
    const effectiveLives = relicSystem.hasRelic('deaths_mask') ? 1 : lives;
    if (!hermitActive && synergyEngine.hasSynergy('berserker') && effectiveLives === 1) {
      const b = finalPoints; finalPoints *= synergyEngine.getSynergyValue('low_hp_bonus'); snap('Berserker', '😤', b, true);
      if (lives !== 1) fakeBonus += finalPoints - b; // Deaths Mask triggered this
    }

    // === META-RELIC EFFEKTE ===
    const afterPerks = finalPoints; // Referenzpunkt für Hermit/Minimalist Relic-Portion

    // Amplifier: Relic-Boni 50% stärker
    if (relicSystem.hasRelic('amplifier')) {
      const b = finalPoints;
      finalPoints += (finalPoints - basePoints) * (relicSystem.getRelicValue('mult_amplifier') - 1);
      snap('Amplifier', '📡', b);
    }

    // Alchemist: Flat-Boni (Perks) → Multiplikator
    if (relicSystem.hasRelic('alchemist')) {
      const totalFlat = flatBonus || 0;
      if (totalFlat > 0) {
        const b = finalPoints; finalPoints *= 1 + (totalFlat * relicSystem.getRelicValue('flat_to_mult')); snap('Alchemist', '⚗️', b, true);
      }
    }

    // Risk & Reward: weniger Restzeit = höherer Multiplikator (nutzt echte Zeit, kein Fake)
    if (relicSystem.hasRelic('risk_reward')) {
      const maxTime = currentDuration;
      if (maxTime > 0) {
        const b = finalPoints;
        const timeUsed = Math.max(0, maxTime - timeLeft);
        const riskFactor = 1 + (timeUsed / maxTime) * (relicSystem.getRelicValue('time_risk_mult') - 1);
        finalPoints *= riskFactor;
        snap('Risk & Reward', '🎲', b, true);
      }
    }

    // Snowball: +0.1× pro gespielte Runde (× 3 mit Infinite Engine Synergy)
    if (relicSystem.hasRelic('snowball')) {
      const b = finalPoints;
      const snowballMult = relicSystem.getRelicValue('round_scaling_mult');
      const finalMult = (!hermitActive && synergyEngine.hasSynergy('infinite_engine'))
        ? snowballMult * (synergyEngine.getSynergyValue('triple_snowball') ?? 3)
        : snowballMult;
      finalPoints *= 1 + (currentRound * finalMult);
      snap((!hermitActive && synergyEngine.hasSynergy('infinite_engine')) ? 'Snowball ∞' : 'Snowball', '☃️', b, true);
    }

    // Collector Bonus: +15 flat pro aktivem Relic
    if (relicSystem.hasRelic('collector_bonus')) {
      const b = finalPoints;
      finalPoints += relicSystem.activeRelics.length * relicSystem.getRelicValue('per_relic_flat_bonus');
      snap('Collector Bonus', '🏛️', b);
    }

    // Tag Master: +0.1× pro einzigartigen Tag
    if (relicSystem.hasRelic('tag_master')) {
      const b = finalPoints;
      const uniqueTags = new Set();
      [...relicSystem.activeRelics, ...perkSystem.activePerks].forEach(item => {
        (item.tags || []).forEach(tag => uniqueTags.add(tag));
      });
      finalPoints *= 1 + (uniqueTags.size * relicSystem.getRelicValue('unique_tag_mult'));
      snap('Tag Master', '🏷️', b, true);
    }

    // Synergy Chain: +0.25× pro aktive Synergy
    if (relicSystem.hasRelic('synergy_chain')) {
      const b = finalPoints;
      const synCount = hermitActive ? 0 : synergyEngine.activeSynergies.length;
      if (synCount > 0) { finalPoints *= 1 + (synCount * relicSystem.getRelicValue('per_synergy_mult')); snap('Synergy Chain', '⛓️', b, true); }
    }

    // Perk Mastery: +0.15× pro aktiven Perk
    if (relicSystem.hasRelic('perk_mastery')) {
      const b = finalPoints;
      finalPoints *= 1 + (perkSystem.activePerks.length * relicSystem.getRelicValue('per_perk_mult'));
      snap('Perk Mastery', '🎓', b, true);
    }

    // Level Power: +2% pro Level
    if (relicSystem.hasRelic('level_power')) {
      const b = finalPoints;
      finalPoints *= 1 + (level.level * relicSystem.getRelicValue('level_scaling'));
      snap('Level Power', '📈', b, true);
    }

    // Overkill: Score über Threshold → überschüssige Punkte verdoppelt
    if (relicSystem.hasRelic('overkill')) {
      const threshold = relicSystem.getRelicValue('overkill_bonus');
      if (finalPoints > threshold) {
        const b = finalPoints;
        finalPoints = threshold + (finalPoints - threshold) * 2;
        snap('Overkill', '💀', b);
      }
    }

    // Last Stand: effectiveLives — Deaths Mask macht es permanent aktiv
    if (relicSystem.hasRelic('last_stand') && effectiveLives === 1) {
      const b = finalPoints; finalPoints *= relicSystem.getRelicValue('last_stand_double'); snap('Last Stand', '⚔️', b, true);
      if (lives !== 1) fakeBonus += finalPoints - b; // Deaths Mask triggered this
    }

    // Chain Reaction: Iron Will oder Combo aktiv → +50% Bonus
    if (relicSystem.hasRelic('chain_reaction') && (ironWillActive || comboMultiplier > 1.15)) {
      const b = finalPoints; finalPoints *= relicSystem.getRelicValue('chain_reaction'); snap('Chain Reaction', '💥⚡', b, true);
    }

    // Synergy Amplifier: +10% pro aktive Synergy (kein Hermit-Block, da Relic-basiert)
    if (relicSystem.hasRelic('synergy_amp') && !hermitActive && synergyEngine.activeSynergies.length > 0) {
      const b = finalPoints;
      finalPoints *= 1 + (synergyEngine.activeSynergies.length * relicSystem.getRelicValue('synergy_multiplier'));
      snap('Synergy Amp', '🔗📡', b, true);
    }

    // Mirror: Bei mind. 2 Multiplikatoren → +30% auf Gesamt
    if (relicSystem.hasRelic('mirror')) {
      const multCount = [
        multiplier,
        comboMultiplier > 1,
        ironWillActive && relicSystem.hasRelic('iron_will'),
        effectiveLives === 1 && relicSystem.hasRelic('last_stand'),
        !hermitActive && synergyEngine.hasSynergy('gold_rush'),
        !hermitActive && synergyEngine.hasSynergy('berserker') && effectiveLives === 1,
        relicSystem.hasRelic('glass_cannon'),
      ].filter(Boolean).length;
      if (multCount >= 2) {
        const b = finalPoints; finalPoints *= relicSystem.getRelicValue('equalize_multipliers'); snap('Mirror', '🪞', b, true);
      }
    }

    // Masochist Synergy: permanenter Damage-Multiplikator
    if (masochistMult > 0) {
      const b = finalPoints; finalPoints *= 1 + masochistMult; snap('Masochist', '🩸🩸', b, true);
    }

    // Sacrifice Reward Synergy: +50% pro Sacrifice-Relic
    if (!hermitActive && synergyEngine.hasSynergy('sacrifice_reward')) {
      const sacrificeRelics = relicSystem.activeRelics.filter(r => (r.tags || []).includes('sacrifice')).length;
      if (sacrificeRelics > 0) {
        const b = finalPoints;
        finalPoints *= 1 + (sacrificeRelics * (synergyEngine.getSynergyValue('per_sacrifice_mult') ?? 0.5));
        snap('Sacrifice Reward', '🔥💀', b, true);
      }
    }

    // Echo: Relic-Boni werden verdoppelt
    if (relicSystem.hasRelic('echo')) {
      const b = finalPoints; finalPoints += (finalPoints - basePoints); snap('Echo', '🔁', b);
    }

    // Hermit: Relic-Boni (alles über afterPerks) werden verdoppelt
    if (hermitActive) {
      const relicBonus = finalPoints - afterPerks;
      if (relicBonus > 0) { const b = finalPoints; finalPoints += relicBonus; snap('Hermit', '🏚️', b); }
    }

    // Minimalist: Relic-Boni werden verdreifacht (×3 total → add 2× extra)
    if (relicSystem.hasRelic('minimalist')) {
      const relicBonus = finalPoints - afterPerks;
      if (relicBonus > 0) { const b = finalPoints; finalPoints += relicBonus * 2; snap('Minimalist', '🧹', b); }
    }

    // Cheater Synergy: Fake-getriggerte Boni werden verdoppelt
    if (!hermitActive && synergyEngine.hasSynergy('cheater') && fakeBonus > 0) {
      const b = finalPoints; finalPoints += fakeBonus; snap('Cheater', '🃏🃏', b);
    }

    return { total: Math.floor(finalPoints), breakdown };
  }, [perkSystem, getTimerDuration, relicSystem, ironWillActive, comboMultiplier, synergyEngine, lives, level, currentRound, masochistMult]);

  const saveCurrentRun = useCallback(() => {
    if (user?.guest || currentRound <= 1 || runLoggedRef.current) return;
    runLoggedRef.current = true;
    const runSummary = runLogger.getRunSummary(synergyEngine.activeSynergies);
    saveRunLog({
      mode:              initialCards ? 'daily' : 'normal',
      final_score:       score,
      final_level:       level.level,
      rounds_played:     currentRound,
      best_streak:       streak.bestStreak,
      client_session_id: runSummary.client_session_id,
      perks:             runSummary.perks,
      relics:            runSummary.relics,
      synergies:         runSummary.synergies,
      rounds:            runSummary.rounds,
    });
  }, [user, currentRound, score, level.level, streak.bestStreak, initialCards, runLogger, synergyEngine]);

  // Ref immer aktuell halten — wird beim Unmount (Back to Menu) aufgerufen
  useEffect(() => { saveCurrentRunRef.current = saveCurrentRun; }, [saveCurrentRun]);
  useEffect(() => { return () => { saveCurrentRunRef.current?.(); }; }, []);

  const handleChoice = useCallback(
    async (chosenIndex) => {
      timer.stop();

      const [card1, card2] = cardLoader.currentPair;
      const correct = isChoiceCorrect(chosenIndex, card1, card2);
      const correctCardIndex = correct ? chosenIndex : chosenIndex === 0 ? 1 : 0;

      setCorrectIndex(correctCardIndex);
      setSelectedCard(chosenIndex);
      setShowPrices(true);

      if (correct) {
        correctCountRef.current++;
        // Reverse Timer: invertiert Time-Bonus (wenig Restzeit → hoher Bonus)
        let timeBonus;
        if (relicSystem.hasRelic('reverse_timer')) {
          timeBonus = calculateTimeBonus(getTimerDuration() - timer.timeLeft);
          flashRelic('reverse_timer');
        } else {
          timeBonus = calculateTimeBonus(timer.timeLeft);
        }
        // Phantom Streak: faked Mindest-Streak für Bonus-Berechnung
        const effectiveStreakForBonus = getEffectiveStreak();
        const calcStreakBonus = (s) =>
          s < GAME_CONFIG.STREAK_BONUS_THRESHOLD ? 0
          : Math.floor(s / SCORE_CONFIG.STREAK_BONUS_DIVISOR) * SCORE_CONFIG.STREAK_BONUS_POINTS;
        const customThreshold = perkSystem.getPerkValue("streak_threshold");
        let streakBonus = customThreshold
          ? effectiveStreakForBonus >= customThreshold
            ? calcStreakBonus(effectiveStreakForBonus)
            : 0
          : calcStreakBonus(effectiveStreakForBonus);

        // Hot Streak Synergy: exponentieller Bonus — effectiveStreak für Phantom Streak
        if (synergyEngine.hasSynergy('hot_streak') && streakBonus > 0) {
          const blocks = Math.floor(effectiveStreakForBonus / SCORE_CONFIG.STREAK_BONUS_DIVISOR);
          streakBonus = SCORE_CONFIG.STREAK_BONUS_POINTS * (Math.pow(2, blocks) - 1);
        }

        const basePoints = timeBonus + streakBonus;
        const hadDoublePoints = !!perkSystem.getPerkValue("point_multiplier");
        const winnerCard = cardLoader.currentPair[correctCardIndex];
        const { total: applied, breakdown: perkBreakdown } = applyPerkEffects(basePoints, timer.timeLeft, winnerCard);
        let totalPoints = applied;
        const extraBreakdown = [];

        // Perfectionist Echo: nächste-Runde-Verdopplung anwenden
        if (nextRoundDouble) {
          const _nrd = totalPoints;
          totalPoints *= relicSystem.getRelicValue('perfect_next_double') ?? 2;
          extraBreakdown.push({ label: 'Perfectionist Echo', icon: '✨🔁', delta: Math.round(totalPoints - _nrd) });
          setNextRoundDouble(false);
          flashRelic('perfectionist_echo');
        }

        streak.incrementStreak();

        // --- XP-Vergabe ---
        let xpGained = 10; // Richtige Antwort: Basis-XP
        const currentDuration = getTimerDuration();
        if (timer.timeLeft >= currentDuration - 1) xpGained += 10; // Perfekte Antwort
        if (timer.timeLeft > currentDuration - 3) xpGained += 5;   // Schnelle Antwort
        const newStreakValue = streak.streak + 1;
        if (newStreakValue % 5 === 0 && newStreakValue > 0) xpGained += 15; // Streak-Milestone

        // MOMENTUM Relic: +2 XP pro Streak-Stufe
        if (relicSystem.hasRelic('momentum')) {
          xpGained += newStreakValue * relicSystem.getRelicValue('streak_xp_scaling');
          flashRelic('momentum');
        }
        // PRICE_SENSE Relic: 1.5x XP bei >€10 Preisdifferenz
        if (relicSystem.hasRelic('price_sense') && cardLoader.currentPair.length === 2) {
          const prices = cardLoader.currentPair.map(c => parseFloat(c.prices?.eur || 0));
          const diff = Math.abs(prices[0] - prices[1]);
          if (diff > relicSystem.getRelicValue('price_diff_xp_bonus') || diff > 10) {
            xpGained = Math.floor(xpGained * relicSystem.getRelicValue('price_diff_xp_bonus'));
            flashRelic('price_sense');
          }
        }
        // QUICK_LEARNER Relic: +50% XP für Antworten unter 3 Sekunden (effectiveTime für Timeless)
        const effectiveAnswerTimeLeft = getEffectiveAnswerTime(timer.timeLeft);
        if (relicSystem.hasRelic('quick_learner') && effectiveAnswerTimeLeft > currentDuration - 3) {
          xpGained = Math.floor(xpGained * relicSystem.getRelicValue('speed_xp_bonus'));
          flashRelic('quick_learner');
          if (relicSystem.hasRelic('timeless')) flashRelic('timeless');
        }
        // Berserker Synergy: 2x XP bei 1 Leben (effectiveLives für Deaths Mask)
        if (synergyEngine.hasSynergy('berserker') && getEffectiveLives() === 1) {
          xpGained *= synergyEngine.getSynergyValue('low_hp_bonus');
        }

        // Combo Master: Multiplikator aktualisieren
        if (relicSystem.hasRelic('combo_master')) {
          const milestones = Math.floor(newStreakValue / 3);
          const newMultiplier = 1 + milestones * relicSystem.getRelicValue('streak_multiplier_stack');
          setComboMultiplier(newMultiplier);
          if (newMultiplier > bestComboMultiplierRef.current) {
            bestComboMultiplierRef.current = newMultiplier;
          }
          if (newStreakValue % 3 === 0) flashRelic('combo_master');
        }

        // Iron Will zurücksetzen nach Verwendung
        if (ironWillActive) {
          if (relicSystem.hasRelic('iron_will')) flashRelic('iron_will');
          setIronWillActive(false);
        }

        // Treasure Hunter: flashen wenn Perk-Boni vorhanden
        if (relicSystem.hasRelic('treasure_hunter') && totalPoints > basePoints) {
          flashRelic('treasure_hunter');
        }

        // XP Converter: überschüssige XP nach Level-Up → Score
        if (relicSystem.hasRelic('xp_converter')) {
          const scholarMult = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
          const effectiveThreshold = Math.floor(level.xpToNextLevel * scholarMult);
          const overflow = Math.max(0, level.xp + xpGained - effectiveThreshold);
          if (overflow > 0) {
            const xpBonus = overflow * (relicSystem.getRelicValue('xp_to_score') ?? 2);
            totalPoints += xpBonus;
            extraBreakdown.push({ label: 'XP Converter', icon: '💱', delta: xpBonus });
            flashRelic('xp_converter');
          }
        }

        // Jackpot Synergy: jede 10. richtige Antwort → ×10 Score
        if (synergyEngine.hasSynergy('jackpot') && correctCountRef.current % 10 === 0) {
          const _jp = totalPoints;
          totalPoints *= synergyEngine.getSynergyValue('jackpot') ?? 10;
          extraBreakdown.push({ label: 'Jackpot!', icon: '🎰🎰', delta: Math.round(totalPoints - _jp) });
        }

        // Perfectionist Echo trigger: effectiveTime für Timeless
        if (relicSystem.hasRelic('perfectionist_echo') && effectiveAnswerTimeLeft >= getTimerDuration() - 1) {
          setNextRoundDouble(true);
          tickRelic('perfectionist_echo');
        }

        // Meta-Relic visual flashes
        if (relicSystem.hasRelic('snowball')) flashRelic('snowball');
        if (relicSystem.hasRelic('risk_reward')) tickRelic('risk_reward');
        if (relicSystem.hasRelic('echo') && totalPoints > basePoints) flashRelic('echo');
        if (relicSystem.hasRelic('amplifier') && totalPoints > basePoints) tickRelic('amplifier');
        if (relicSystem.hasRelic('collector_bonus')) tickRelic('collector_bonus');
        if (relicSystem.hasRelic('synergy_chain') && synergyEngine.activeSynergies.length > 0) flashRelic('synergy_chain');
        if (relicSystem.hasRelic('perk_mastery') && perkSystem.activePerks.length > 0) tickRelic('perk_mastery');
        if (relicSystem.hasRelic('tag_master')) tickRelic('tag_master');
        if (relicSystem.hasRelic('level_power')) tickRelic('level_power');
        if (relicSystem.hasRelic('overkill') && totalPoints > 100) flashRelic('overkill');
        if (relicSystem.hasRelic('last_stand') && getEffectiveLives() === 1) flashRelic('last_stand');
        if (relicSystem.hasRelic('chain_reaction') && (ironWillActive || comboMultiplier > 1.15)) flashRelic('chain_reaction');
        if (relicSystem.hasRelic('synergy_amp') && synergyEngine.activeSynergies.length > 0) tickRelic('synergy_amp');
        // Neue Relic-Flashes
        if (relicSystem.hasRelic('deaths_mask')) tickRelic('deaths_mask');
        if (relicSystem.hasRelic('phantom_streak') && effectiveStreakForBonus > streak.streak) flashRelic('phantom_streak');
        if (relicSystem.hasRelic('mirror') && totalPoints > basePoints) tickRelic('mirror');
        if (relicSystem.hasRelic('hermit')) tickRelic('hermit');
        if (relicSystem.hasRelic('minimalist') && totalPoints > basePoints) tickRelic('minimalist');
        if (synergyEngine.hasSynergy('masochist') && masochistMult > 0) tickRelic('masochist');
        if (synergyEngine.hasSynergy('sacrifice_reward')) tickRelic('sacrifice_reward');
        if (synergyEngine.hasSynergy('cheater')) tickRelic('cheater');

        // Scholar-Synergy: XP-Schwelle 20% niedriger
        const scholarMult = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
        level.addXP(xpGained, scholarMult);
        achievements.trackLevel(level.level);

        const newScore = score + totalPoints;
        setScore(newScore);

        achievements.trackCorrectAnswer(
          timer.timeLeft,
          getTimerDuration(),
          hadDoublePoints,
          totalPoints
        );
        achievements.trackScore(newScore);
        if (relicSystem.hasRelic('glass_cannon')) achievements.trackGlassCannonScore(newScore);

        // Build and store score breakdown for hover tooltip
        const baseBreakdown = [];
        if (timeBonus > 0) baseBreakdown.push({ label: 'Zeit-Bonus', icon: '⏱️', delta: timeBonus });
        if (effectiveStreakForBonus > 0) baseBreakdown.push({ label: `Streak ${effectiveStreakForBonus}x${effectiveStreakForBonus > streak.streak ? ' 👻' : ''}`, icon: '🔥', delta: streakBonus });
        setScoreBreakdown({ total: totalPoints, items: [...baseBreakdown, ...perkBreakdown, ...extraBreakdown] });

        runLogger.logRound({
          n: currentRound,
          card_left:  { id: card1.id, name: card1.name, price: parseFloat(card1.prices?.eur) || 0 },
          card_right: { id: card2.id, name: card2.name, price: parseFloat(card2.prices?.eur) || 0 },
          chosen: chosenIndex,
          correct: true,
          score: Math.floor(totalPoints),
          time: timer.timeLeft,
          streak: newStreakValue,
          breakdown: [...baseBreakdown, ...perkBreakdown, ...extraBreakdown].map(b => ({ label: b.label, delta: b.delta, mult: !!b.isMult })),
        });

        let scoreMessage = `+${totalPoints} pts`;
        // Heart Regeneration Perk — Overflow konvertiert bei vollem Leben
        const regenResult = perkSystem.trackCorrectAnswer();
        if (regenResult.shouldRegenerate) {
          if (lives >= GAME_CONFIG.INITIAL_LIVES && relicSystem.hasRelic('overflow')) {
            const hasAscension = synergyEngine.hasSynergy('ascension');
            if (hasAscension) {
              const mult = synergyEngine.getSynergyValue('overflow_multiplier') ?? 1.5;
              setScore(prev => Math.floor(prev * mult));
            } else {
              setScore(prev => prev + (relicSystem.getRelicValue('overflow_hp_to_score') ?? 100));
            }
            scoreMessage += ` 🫀`;
            flashRelic('overflow');
          } else {
            setLives(prev => Math.min(prev + 1, GAME_CONFIG.INITIAL_LIVES));
            scoreMessage += ` 💖`;
          }
          flashRelic('heart_regeneration');
        } else if (perkSystem.hasPerk('heart_regeneration')) {
          tickRelic('heart_regeneration');
        }

        // Fortress Synergy — Overflow-Logik integriert
        if (synergyEngine.hasSynergy('fortress')) {
          const fortressThreshold = synergyEngine.getSynergyValue('improved_regen') ?? 8;
          setFortressRegenCount(prev => {
            const next = prev + 1;
            if (next >= fortressThreshold) {
              if (lives >= GAME_CONFIG.INITIAL_LIVES && relicSystem.hasRelic('overflow')) {
                const hasAscension = synergyEngine.hasSynergy('ascension');
                if (hasAscension) {
                  const mult = synergyEngine.getSynergyValue('overflow_multiplier') ?? 1.5;
                  setScore(s => Math.floor(s * mult));
                } else {
                  setScore(s => s + (relicSystem.getRelicValue('overflow_hp_to_score') ?? 100));
                }
                flashRelic('overflow');
              } else {
                setLives(l => Math.min(l + 1, GAME_CONFIG.INITIAL_LIVES));
              }
              scoreMessage += ` 🏰`;
              flashRelic('fortress');
              return 0;
            }
            tickRelic('fortress');
            return next;
          });
        }
        setMessage(scoreMessage);

        if (newScore > user.highscore) {
          if (user?.guest) {
            setUser({ ...user, highscore: newScore });
          } else {
            try {
              await updateHighscore(newScore);
              await refreshUser();
            } catch (error) {
              console.error("Highscore update failed:", error);
            }
          }
        }
      } else {
        setScoreBreakdown(null);
        if (perkSystem.hasPerk("second_chance")) {
          perkSystem.consumePerk("second_chance");
          setMessage("💚 Second Chance activated! Life saved!");
          achievements.trackShieldSave();
        } else {
          wrongCountRef.current++;
          // Unstoppable (Synergy) → Streak Shield (Relic) → Normal Reset
          if (synergyEngine.hasSynergy('unstoppable')) {
            // Streak bleibt unberührt
          } else if (relicSystem.hasRelic('streak_shield')) {
            const preserved = Math.floor(streak.streak * (relicSystem.getRelicValue('streak_preservation') ?? 0.5));
            streak.setStreakValue(preserved);
            flashRelic('streak_shield');
          } else {
            streak.resetStreak();
          }
          achievements.trackWrongAnswer();
          // Iron Will: nächste richtige Antwort gibt 3x Score
          if (relicSystem.hasRelic('iron_will')) setIronWillActive(true);
          // Combo Master Reset bei Fehler (außer Unstoppable)
          if (relicSystem.hasRelic('combo_master') && !synergyEngine.hasSynergy('unstoppable')) setComboMultiplier(1);

          const remainingLives = lives - 1;
          setLives(remainingLives);

          // Pain is Gain: Lebensverlust → +50 Score, +30 XP
          if (relicSystem.hasRelic('pain_is_gain')) {
            const painScore = relicSystem.activeRelics.find(r => r.id === 'pain_is_gain')?.value ?? 50;
            const painXP = relicSystem.activeRelics.find(r => r.id === 'pain_is_gain')?.xpValue ?? 30;
            const scholarMult2 = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
            setScore(prev => prev + painScore);
            level.addXP(painXP, scholarMult2);
            flashRelic('pain_is_gain');
          }
          // Masochist Synergy: permanenter +0.2× Multiplikator pro Lebensverlust
          if (synergyEngine.hasSynergy('masochist')) {
            setMasochistMult(prev => prev + (synergyEngine.getSynergyValue('permanent_damage_mult') ?? 0.2));
          }

          const correctCard = getMoreExpensiveCard(card1, card2);
          setMessage(createErrorMessage(correctCard));

          runLogger.logRound({
            n: currentRound,
            card_left:  { id: card1.id, name: card1.name, price: parseFloat(card1.prices?.eur) || 0 },
            card_right: { id: card2.id, name: card2.name, price: parseFloat(card2.prices?.eur) || 0 },
            chosen: chosenIndex,
            correct: false,
            score: 0,
            time: timer.timeLeft,
            streak: 0,
            breakdown: [],
          });

          if (remainingLives <= 0) {
            setGameOver(true);
            if (!user?.guest) {
              saveGameSession({
                score,
                rounds_played: currentRound,
                correct_answers: correctCountRef.current,
                wrong_answers: wrongCountRef.current,
                best_streak: streak.bestStreak,
                mode: initialCards ? 'daily' : 'normal',
              });
              saveCurrentRun();
            }
            if (onGameOver) onGameOver(score);
            return;
          }
        }
      }

      perkSystem.decrementPerkDurations(relicSystem.hasRelic('perk_recycler'));
    },
    [cardLoader.currentPair, timer, streak, score, lives, user, setScore, setUser, refreshUser, perkSystem, achievements, applyPerkEffects, getTimerDuration, onGameOver, currentRound, initialCards, level, relicSystem, synergyEngine, ironWillActive, comboMultiplier, nextRoundDouble, flashRelic, tickRelic, getEffectiveLives, getEffectiveStreak, getEffectiveAnswerTime, masochistMult, runLogger, saveCurrentRun]
  );

  // Update handleChoiceRef when handleChoice changes
  useEffect(() => {
    handleChoiceRef.current = handleChoice;
  }, [handleChoice]);

  const initGame = useCallback(async () => {
    achievements.resetGameStats();
    correctCountRef.current = 0;
    wrongCountRef.current = 0;
    if (initialCards && initialCards.length >= 2) {
      cardLoader.initWithCards(initialCards);
    } else {
      const cards = await cardLoader.preloadCards();
      if (cards && cards.length >= 2) {
        await cardLoader.setNextPair();
      }
    }
  }, [achievements, cardLoader, initialCards]);

  // Initial Load
  useEffect(() => {
    if (user || user?.guest) {
      initGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update filters when filter perks change
  useEffect(() => {
    const filterPerks = perkSystem.getActiveFilterPerks();
    cardLoader.updateFilters(filterPerks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perkSystem.activePerks]);

  // Start Timer when images loaded
  useEffect(() => {
    if (imagesLoaded.every(Boolean) && !showPrices) {
      timer.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesLoaded, showPrices]);

  // Reset bei neuem Paar
  useEffect(() => {
    setImagesLoaded([false, false]);
    timer.reset();
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardLoader.currentPair]);

  const handleNextPair = useCallback(() => {
    setMessage("");
    setScoreBreakdown(null);
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    achievements.trackRound(nextRound);

    // Card Counter Relic: alle 10 Runden +1 Leben — Overflow konvertiert Über-Heals zu Score
    const cardCounterInterval = relicSystem.getRelicValue('round_heal');
    if (cardCounterInterval) {
      if (nextRound % cardCounterInterval === 0) {
        const hasAscension = synergyEngine.hasSynergy('ascension');
        if (lives >= GAME_CONFIG.INITIAL_LIVES && relicSystem.hasRelic('overflow')) {
          if (hasAscension) {
            const mult = synergyEngine.getSynergyValue('overflow_multiplier') ?? 1.5;
            setScore(prev => Math.floor(prev * mult));
          } else {
            setScore(prev => prev + (relicSystem.getRelicValue('overflow_hp_to_score') ?? 100));
          }
          flashRelic('overflow');
        } else {
          setLives(prev => Math.min(prev + 1, GAME_CONFIG.INITIAL_LIVES));
        }
        flashRelic('card_counter');
      } else {
        tickRelic('card_counter');
      }
    }

    if (nextRound > 0 && nextRound % 10 === 0) {
      // Alle 10 Runden: Relic-Auswahl
      setShowRelicSelection(true);
    } else if (nextRound > 0 && nextRound % 5 === 0) {
      // Alle 5 Runden (außer Relic-Runden): Perk-Auswahl
      if (relicSystem.hasRelic('no_perks')) {
        cardLoader.setNextPair();
      } else {
        perkSystem.triggerPerkSelection();
      }
    } else {
      cardLoader.setNextPair();
    }
  }, [currentRound, achievements, perkSystem, cardLoader, relicSystem, setLives, flashRelic, tickRelic, lives, setScore, synergyEngine]);

  const handlePerkSelect = useCallback(async (perk) => {
    const hasEternalFlame = relicSystem.hasRelic('eternal_flame');
    const hasUpgradeMaster = relicSystem.hasRelic('upgrade_master');
    const hasDoubleDip = relicSystem.hasRelic('double_dip');
    if (hasDoubleDip) flashRelic('double_dip');

    if (perk.type === 'filter' && !perk.isBoost) {
      // Hard-Filter (Exclude): Karten neu vom Backend laden
      const currentFilterPerks = perkSystem.getActiveFilterPerks();
      const otherFilterPerks = currentFilterPerks.filter(p => p.filterType !== perk.filterType && !p.isBoost);
      const allHardFilterPerks = [...otherFilterPerks, perk];
      const filters = {};
      allHardFilterPerks.forEach(filterPerk => {
        switch (filterPerk.effect) {
          case FILTER_EFFECTS.COLOR_EXCLUDE:   filters.color_exclude = filterPerk.value; break;
          case FILTER_EFFECTS.CMC_EXCLUDE:     filters.cmc_exclude = filterPerk.value; break;
          case FILTER_EFFECTS.RARITY_EXCLUDE:  filters.rarity_exclude = filterPerk.value; break;
          case FILTER_EFFECTS.TYPE_EXCLUDE:    filters.type_exclude = filterPerk.value; break;
          default: break;
        }
      });
      const newCards = await cardLoader.preloadCards(filters);
      perkSystem.selectPerk(perk, { hasEternalFlame, hasUpgradeMaster, doubleDip: hasDoubleDip });
      achievements.trackPerkCollected();
      await cardLoader.setNextPair(false, newCards);
    } else {
      // Parasite: macht temporären Perk permanent, verbraucht sich dabei
      let finalPerk = perk;
      if (relicSystem.hasRelic('parasite') && perk.duration > 0) {
        finalPerk = { ...perk, duration: -1 };
        relicSystem.consumeRelic('parasite');
        flashRelic('parasite');
      }
      perkSystem.selectPerk(finalPerk, { hasEternalFlame, hasUpgradeMaster, doubleDip: hasDoubleDip });
      achievements.trackPerkCollected();

      // Copycat: halbe Kopie des Perks (nur temporäre Perks)
      if (relicSystem.hasRelic('copycat') && perk.duration > 0) {
        const copyPerk = {
          ...perk,
          id: perk.id + '_copy',
          name: perk.name + ' (Copy)',
          value: typeof perk.value === 'number' ? Math.max(1, Math.floor(perk.value * 0.5)) : perk.value,
          duration: Math.max(1, Math.ceil(perk.duration * 0.5)),
        };
        perkSystem.selectPerk(copyPerk, { hasEternalFlame, hasUpgradeMaster });
        flashRelic('copycat');
      }

      await cardLoader.setNextPair();
    }
    runLogger.logPerkSelected({
      round:       currentRound,
      perk_id:     perk.id,
      perk_name:   perk.name,
      offered_ids: perkSystem.availablePerks.map(p => p.id),
    });
  }, [perkSystem, achievements, cardLoader, relicSystem, flashRelic, runLogger, currentRound]);

  // Level-Up-Pick: Relic → relicSystem, Item (Perk) → perkSystem, Upgrade → perkSystem
  // WICHTIG: Kein cardLoader.setNextPair() hier!
  // Der Spieler klickt danach ganz normal "Next" → handleNextPair läuft sauber durch
  // (Round-Counter, Achievements, Perk-Selektion alle korrekt).
  // Verhindert auch dass beide Modals gleichzeitig aktiv sind.
  const handleLevelUpSelect = useCallback((pick) => {
    console.log('[LevelUp]', pick.category.toUpperCase(), pick.name, `(${pick.id})`, pick.tags ?? []);
    const hasEternalFlame = relicSystem.hasRelic('eternal_flame');
    const hasUpgradeMaster = relicSystem.hasRelic('upgrade_master');
    if (pick.category === 'relic') {
      // Blueprint: kopiert Effekt eines zufälligen anderen Relics
      if (pick.effect === 'blueprint_copy') {
        const otherRelics = relicSystem.activeRelics.filter(r => r.id !== 'blueprint');
        if (otherRelics.length > 0) {
          const src = otherRelics[Math.floor(Math.random() * otherRelics.length)];
          relicSystem.addRelic({
            ...src,
            id: `blueprint_copy_${Date.now()}`,
            name: `Blueprint (${src.name})`,
            icon: '📋',
            description: `Kopie: ${src.description}`,
          });
        } else {
          relicSystem.addRelic(pick);
        }
      } else {
        relicSystem.addRelic(pick);
      }
      achievements.trackRelicCollected();
      runLogger.logRelicSelected({ level: level.level, relic_id: pick.id, relic_name: pick.name });
      if (pick.effect === 'glass_cannon') setLives(1);
    } else if (pick.category === 'item') {
      perkSystem.selectPerk(pick, { hasEternalFlame, hasUpgradeMaster });
      achievements.trackPerkCollected();
      runLogger.logPerkSelected({ round: currentRound, perk_id: pick.id, perk_name: pick.name, source: 'level_up', offered_ids: [] });
    } else if (pick.category === 'upgrade') {
      perkSystem.selectPerk(pick, { hasEternalFlame, hasUpgradeMaster });
      runLogger.logPerkSelected({ round: currentRound, perk_id: pick.id, perk_name: pick.name, source: 'upgrade', offered_ids: [] });
    }
    level.dismissLevelUp();
  }, [relicSystem, perkSystem, level, achievements, setLives, runLogger, currentRound]);

  const handleRelicRoundSelect = useCallback((pick) => {
    console.log('[RelicRound]', pick.name, `(${pick.id})`);
    if (pick.effect === 'blueprint_copy') {
      const otherRelics = relicSystem.activeRelics.filter(r => r.id !== 'blueprint');
      if (otherRelics.length > 0) {
        const src = otherRelics[Math.floor(Math.random() * otherRelics.length)];
        relicSystem.addRelic({ ...src, id: `blueprint_copy_${Date.now()}`, name: `Blueprint (${src.name})`, icon: '📋', description: `Kopie: ${src.description}` });
      } else {
        relicSystem.addRelic(pick);
      }
    } else {
      relicSystem.addRelic(pick);
    }
    if (pick.effect === 'glass_cannon') setLives(1);
    achievements.trackRelicCollected();
    runLogger.logRelicSelected({ level: level.level, relic_id: pick.id, relic_name: pick.name });
    setShowRelicSelection(false);
    cardLoader.setNextPair();
  }, [relicSystem, achievements, runLogger, level, setLives, cardLoader]);

  const handleSkipCard = useCallback(() => {
    if (perkSystem.hasPerk("skip_card")) {
      perkSystem.consumePerk("skip_card");
      setSelectedCard(null);
      setCorrectIndex(null);
      setShowPrices(false);
      setMessage("⭐ Card skipped!");
      cardLoader.setNextPair();
      timer.reset();
      setCurrentRound((prev) => prev + 1);
    }
  }, [perkSystem, cardLoader, timer]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (perkSystem.showPerkSelection || level.showLevelUp) return;
      if (gameOver) return;

      const key = e.key.toLowerCase();

      if (selectedCard === null && !showPrices) {
        if (key === "1" || key === "a") {
          e.preventDefault();
          handleChoice(0);
        } else if (key === "2" || key === "d") {
          e.preventDefault();
          handleChoice(1);
        }
      }

      if (selectedCard !== null && !gameOver && (key === " " || key === "enter")) {
        e.preventDefault();
        handleNextPair();
      }

      if (key === "s" && perkSystem.hasPerk("skip_card") && selectedCard === null && !showPrices) {
        e.preventDefault();
        handleSkipCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCard, showPrices, gameOver, perkSystem.showPerkSelection, perkSystem, handleChoice, handleNextPair, handleSkipCard, level.showLevelUp]);

  const handleRestart = useCallback(async () => {
    saveCurrentRun();
    runLoggedRef.current = false;
    setScore(0);
    setMessage("");
    setScoreBreakdown(null);
    setGameOver(false);
    setSelectedCard(null);
    setCorrectIndex(null);
    setShowPrices(false);
    setLives(GAME_CONFIG.INITIAL_LIVES);
    setCurrentRound(1);

    streak.reset();
    timer.reset();
    cardLoader.reset();
    perkSystem.reset();
    level.reset();
    relicSystem.reset();
    synergyEngine.reset();
    setComboMultiplier(1);
    setIronWillActive(false);
    setNextRoundDouble(false);
    setMasochistMult(0);
    setFortressRegenCount(0);
    bestComboMultiplierRef.current = 1;
    achievements.resetGameStats();
    runLogger.reset();

    await cardLoader.preloadCards();
    await cardLoader.setNextPair();
  }, [setScore, streak, timer, cardLoader, perkSystem, level, relicSystem, synergyEngine, achievements, runLogger, saveCurrentRun]);

  const handleImageLoad = useCallback((index) => {
    setImagesLoaded((prev) => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  }, []);

  const showSet = perkSystem.hasPerk("set_reveal");



  if (cardLoader.error) {
    return (
      <div className="text-center text-red-400">
        <p>❌ {cardLoader.error}</p>
        <button onClick={initGame} className="mt-4 bg-amber-600 px-6 py-3 rounded hover:bg-amber-500">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Score Display */}
      {/* Mobile: single compact row */}
      <div className="flex sm:hidden flex-row w-full justify-between items-center mb-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg px-2 py-1 border border-white/20 shrink-0">
            <span className="text-amber-300 text-xs font-semibold">🎯 R{currentRound}</span>
          </div>
          <div className="relative min-w-0">
            <span className="font-bold text-lg">Pts: {displayScore.toLocaleString()}</span>
            <AnimatePresence>
              {scoreGain && (
                <motion.span
                  key={score}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -16 }}
                  exit={{}}
                  transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                  className="absolute left-0 top-full text-green-400 text-xs font-bold pointer-events-none whitespace-nowrap"
                >
                  +{scoreGain.toLocaleString()}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <LivesDisplay lives={lives} />
      </div>
      {/* Desktop: original layout */}
      <div className="hidden sm:flex sm:mb-1 flex-row w-full max-w-2xl justify-between">
        <div className="sm:w-3/4 flex md:text-left sm:flex-row flex-col">
          <div className="flex items-center justify-start gap-4 mb-2">
            <div className="bg-white/10 sm:mb-auto backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
              <span className="text-amber-300 text-sm font-semibold">🎯 Round {currentRound}</span>
            </div>
          </div>
          <div className="flex flex-col sm:ml-3">
            <p className="mb-2 text-lg">Your Highscore: {user.highscore}</p>
            <div className="relative mb-2">
              <p className="font-bold text-2xl">Points: {displayScore.toLocaleString()}</p>
              <AnimatePresence>
                {scoreGain && (
                  <motion.span
                    key={score}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -18 }}
                    exit={{}}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                    className="absolute left-0 top-full text-green-400 text-sm font-bold pointer-events-none"
                  >
                    +{scoreGain.toLocaleString()}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <LivesDisplay lives={lives} />
      </div>

      {/* XP / Level-Display */}
      <div className="w-full max-w-2xl mb-1 sm:mb-2">
        <div className="flex items-center gap-3">
          {/* Level-Badge mit Glow bei Level-Up */}
          <AnimatePresence mode="wait">
            <motion.div
              key={level.level}
              initial={{ scale: 1.4, boxShadow: "0 0 16px #fbbf24" }}
              animate={{ scale: 1, boxShadow: "0 0 0px transparent" }}
              transition={{ duration: 0.6 }}
              className="bg-amber-500/20 border border-amber-400/50 rounded-lg px-3 py-1 shrink-0"
            >
              <span className="text-amber-300 text-sm font-bold">⭐ Level {level.level}</span>
            </motion.div>
          </AnimatePresence>

          {/* XP-Fortschrittsbalken */}
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>XP</span>
              <span>{level.xp} / {level.xpToNextLevel}</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full"
                initial={false}
                animate={{ width: `${(level.xp / level.xpToNextLevel) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Roadmap Button */}
          <button
            onClick={() => setShowRoadmap(true)}
            title="Progression Roadmap"
            className="shrink-0 opacity-40 hover:opacity-80 transition-opacity"
          >
            <GameIcon name="map" size={16} color="amber" />
          </button>
        </div>
      </div>

      <ActivePerksDisplay
        perks={perkSystem.activePerks}
        relics={relicSystem.activeRelics}
        synergies={synergyEngine.activeSynergies}
        flashingRelics={flashingRelics}
        tickingRelics={tickingRelics}
        currentRound={currentRound}
        heartRegenProgress={perkSystem.getHeartRegenProgress()}
        fortressRegenCount={fortressRegenCount}
        level={level.level}
        showPerkSelection={perkSystem.showPerkSelection}
      />

      <StreakDisplay
        streak={streak.streak}
        bestStreak={streak.bestStreak}
        color={streak.getStreakColor()}
        streakBonus={streak.calculateStreakBonus()}
      />

      {/* Heart Regen Progress */}
      {perkSystem.getHeartRegenProgress() && (
        <div className="w-full max-w-xl mb-1 sm:mb-4">
          <div className="bg-pink-500/20 border border-pink-400 rounded-lg px-2 py-1 sm:p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-pink-200 text-xs sm:text-sm font-semibold">
                💖 Heart Regen: {perkSystem.getHeartRegenProgress().current}/{perkSystem.getHeartRegenProgress().threshold}
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-gray-700 rounded overflow-hidden">
              <div
                className="h-full bg-pink-500 transition-all duration-300"
                style={{ width: `${perkSystem.getHeartRegenProgress().progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <GameTimer timeLeft={timer.timeLeft} possiblePoints={calculateTimeBonus(timer.timeLeft)} progress={timer.progress} />

      {cardLoader.loading ? (
        <p>Loading Cards...</p>
      ) : (
        <CardPair
          cards={cardLoader.currentPair}
          selectedCard={selectedCard}
          correctIndex={correctIndex}
          showPrices={showPrices}
          onChoice={handleChoice}
          onImageLoad={handleImageLoad}
          showSet={showSet}
        />
      )}

      {/* Keyboard Hints */}
      {!gameOver && !perkSystem.showPerkSelection && (
        <div className="text-gray-400 hidden sm:block text-sm mt-2 text-center">
          {selectedCard === null && !showPrices ? (
            <span>⌨️ Press <kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">1</kbd>/<kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">A</kbd> for left, <kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">2</kbd>/<kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">D</kbd> for right</span>
          ) : selectedCard !== null ? (
            <span>⌨️ Press <kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">Space</kbd> or <kbd className="bg-gray-700 px-2 py-0.5 rounded mx-1">Enter</kbd> to continue</span>
          ) : null}
        </div>
      )}

      <div className="sm:mt-6 mt-auto w-full flex gap-4 items-center justify-center pb-1 sm:pb-2 pl-14 sm:pl-0">
        {perkSystem.hasPerk("skip_card") && selectedCard === null && !gameOver && !showPrices && (
          <button
            onClick={handleSkipCard}
            className="bg-yellow-500 text-lg font-semibold hover:bg-yellow-600 active:scale-95 text-white px-6 py-4 rounded-xl transition shadow-lg hover:shadow-xl"
            title="Press S to skip"
          >
            ⭐ Skip{(() => { const sc = perkSystem.activePerks.find(p => p.id === 'skip_card'); return sc && sc.value > 1 ? ` (×${sc.value})` : ''; })()}
          </button>
        )}

        {selectedCard !== null && !gameOver && (
          <button
            onClick={handleNextPair}
            disabled={perkSystem.showPerkSelection || level.showLevelUp}
            className={`text-xl sm:text-2xl w-full sm:w-auto sm:min-w-[250px] font-bold text-white
              px-6 py-5 sm:px-6 sm:py-6
              [@media(max-height:500px)]:py-2 [@media(max-height:500px)]:text-base
              rounded-xl sm:rounded
              transition-all duration-150
              active:scale-[0.97]
              ${(perkSystem.showPerkSelection || level.showLevelUp)
                ? "bg-amber-600/50 cursor-not-allowed shadow-none"
                : "bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/30 hover:shadow-amber-400/40"
              }`}
          >
            Next →
          </button>
        )}
      </div>

      <AnimatePresence>
        {showRoadmap && (
          <ProgressionRoadmapModal
            onClose={() => setShowRoadmap(false)}
            currentRound={currentRound}
            level={level}
            hasNoPerkRelic={relicSystem.hasRelic('no_perks')}
          />
        )}
      </AnimatePresence>

      <LevelUpModal
        show={level.showLevelUp}
        newLevel={level.level}
        activeRelics={relicSystem.activeRelics}
        activePerks={perkSystem.activePerks}
        activeSynergies={synergyEngine.activeSynergies}
        onSelect={handleLevelUpSelect}
      />

      <LevelUpModal
        show={showRelicSelection}
        newLevel={currentRound}
        activeRelics={relicSystem.activeRelics}
        activePerks={perkSystem.activePerks}
        activeSynergies={synergyEngine.activeSynergies}
        onSelect={handleRelicRoundSelect}
        forceRelicMode
      />

      <PerkSelectionModal perks={perkSystem.availablePerks} onSelect={handlePerkSelect} show={perkSystem.showPerkSelection} hasDoubleDip={relicSystem.hasRelic('double_dip')} />

      <SynergyToast synergy={synergyToast} onDismiss={() => setSynergyToast(null)} />

      {gameOver && (
        <GameOverScreen
          message={message}
          bestStreak={streak.bestStreak}
          onRestart={handleRestart}
          onBack={onBack}
          showRegister={showRegister}
          onShowRegister={() => setShowRegister(true)}
          isGuest={user?.guest}
          score={score}
          level={level.level}
          relics={relicSystem.activeRelics}
          synergies={synergyEngine.activeSynergies}
          bestComboMultiplier={bestComboMultiplierRef.current}
        >
          {user?.guest && showRegister && (
            <RegisterWithScore
              score={user?.highscore ?? score}
              onSuccess={(newUser) => {
                setUser(newUser);
                refreshUser();
                setShowRegister(false);
              }}
            />
          )}
        </GameOverScreen>
      )}

      <div className="w-full sm:min-h-[2.5rem] pt-1 pb-2 sm:pb-0 hidden sm:flex items-center sm:justify-center">
        {message && !gameOver && !scoreBreakdown && (
          <p className="text-base sm:text-xl transition-all duration-500 sm:text-center">{message}</p>
        )}
      </div>
      {/* ScoreTooltip handles its own mobile (fixed top-left) and desktop rendering */}
      {message && !gameOver && scoreBreakdown && (
        <ScoreTooltip message={message} breakdown={scoreBreakdown} />
      )}
      {/* Mobile: plain message when no breakdown */}
      {message && !gameOver && !scoreBreakdown && (
        <p className="sm:hidden text-base transition-all duration-500 pt-1 pb-2 pl-14">{message}</p>
      )}

      {process.env.NODE_ENV === 'development' && (
        <DebugPanel
          relicSystem={relicSystem}
          perkSystem={perkSystem}
          synergyEngine={synergyEngine}
          level={level}
          lives={lives}
          setLives={setLives}
          streak={streak}
          score={score}
          setScore={setScore}
          currentRound={currentRound}
          setCurrentRound={setCurrentRound}
          applyPerkEffects={applyPerkEffects}
          timer={timer}
        />
      )}
    </>
  );
}