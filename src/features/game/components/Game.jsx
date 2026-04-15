import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { useAchievementContext } from "../context/AchievementContext";
import { useGameTimer } from "../hooks/useGameTimer";
import { useStreak } from "../hooks/useStreak";
import { useCardLoader } from "../hooks/useCardLoader";
import { usePerkSystem } from "../hooks/usePerkSystem";
import { useLevel } from "../hooks/useLevel";
import { useRelicSystem } from "../hooks/useRelicSystem";
import { useSynergyEngine } from "../hooks/useSynergyEngine";
import { useGold } from "../hooks/useGold";
import { useMapSystem } from "../hooks/useMapSystem";
import { ROUNDS_PER_STAGE, TOTAL_STAGES, NODE_TYPES } from "../constants/mapDefinitions";
import { RELICS } from "../constants/relicDefinitions";
import { updateHighscore } from "../api/gameApi";
import { saveGameSession, saveRunLog, saveStageCheckpoint } from "../api/statsApi";
import useRunLogger from "../hooks/useRunLogger";
import {
  isChoiceCorrect,
  getMoreExpensiveCard,
  createErrorMessage,
  createErrorData,
} from "../utils/cardComparison";
import {
  calculateTimeBonus,
} from "../utils/scoreCalculator";
import { GAME_CONFIG, SCORE_CONFIG } from "../../../shared/utils/constants";
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
import SynergyConflictModal from "./SynergyConflictModal";
import GameIcon from "../../../shared/components/GameIcon";
import ActivePerksDisplay from "./ActivePerksDisplay";
import RegisterWithScore from "../../auth/components/RegisterWithScore";
import DebugPanel from "./DebugPanel";
import ScoreComboReveal from "./ScoreComboReveal";
import StageCompleteScreen from "./StageCompleteScreen";
import MapScreen from "./MapScreen";
import ShopScreen from "./ShopScreen";
import RestScreen from "./RestScreen";

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
  const [wrongData, setWrongData] = useState(null); // { name, price } for styled wrong-answer banner
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
  const [levelUpRerollKey, setLevelUpRerollKey] = useState(0);
  // Stage/Map System
  const mapSystem = useMapSystem();
  const stageScoreRef = useRef({}); // { stageIndex: score } — für Backend + StageCompleteScreen
  const stageCorrectRef = useRef(0); // richtige Antworten in dieser Stage
  const [synergyConflictQueue, setSynergyConflictQueue] = useState([]); // Queue wartender Synergy-Konflikte
  const [xpBling, setXpBling] = useState(false); // XP-Bar Bling bei Level-Up
  const xpBlingLevelRef = useRef(1); // Track letztes Level für Bling-Trigger

  // Combo-Animation: blockiert Level-Up/Relic-Modals bis die Combo-Sequenz fertig ist
  const [comboAnimationDone, setComboAnimationDone] = useState(true);

  // Animated score counter — only animates after combo popup dismisses
  const [displayScore, setDisplayScore] = useState(0);
  const [scoreGain, setScoreGain] = useState(null);
  const displayScoreRef = useRef(0);
  const scoreAnimRef = useRef(null);
  const scoreGainTimerRef = useRef(null);
  const pendingScoreRef = useRef(null); // holds score to animate until popup is gone

  const animateToScore = useCallback((end) => {
    if (end === 0) {
      if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current);
      displayScoreRef.current = 0;
      setDisplayScore(0);
      setScoreGain(null);
      pendingScoreRef.current = null;
      return;
    }
    const start = displayScoreRef.current;
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
  }, []);

  // When score resets to 0, reset immediately
  useEffect(() => {
    if (score === 0) animateToScore(0);
  }, [score, animateToScore]);

  // Called when combo popup fully disappears — now animate the score
  const handleComboComplete = useCallback(() => {
    setComboAnimationDone(true);
    if (pendingScoreRef.current !== null) {
      animateToScore(pendingScoreRef.current);
      pendingScoreRef.current = null;
    }
  }, [animateToScore]);

  // Custom Hooks
  const cardLoader = useCardLoader();
  const streak = useStreak();
  const perkSystem = usePerkSystem();
  const level = useLevel();
  const relicSystem = useRelicSystem();
  const runLogger = useRunLogger();
  const gold = useGold();

  // XP-Bar Bling: triggert wenn Level steigt
  useEffect(() => {
    if (level.level > xpBlingLevelRef.current) {
      xpBlingLevelRef.current = level.level;
      setXpBling(true);
      const t = setTimeout(() => setXpBling(false), 750);
      return () => clearTimeout(t);
    }
    xpBlingLevelRef.current = level.level;
  }, [level.level]); // eslint-disable-line react-hooks/exhaustive-deps

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
    achievements.trackSynergyActivated(1);
  }, [achievements]);

  // Synergy-Konflikt-Callback — wenn alle 3 Slots belegt sind
  const handleSynergyConflict = useCallback((synergy) => {
    console.log('[Synergy CONFLICT]', synergy.name, '— waiting for slot');
    setSynergyConflictQueue(prev => [...prev, synergy]);
  }, []);

  const synergyEngine = useSynergyEngine(
    relicSystem.activeRelics,
    perkSystem.activePerks,
    handleNewSynergy,
    handleSynergyConflict
  );

  // Timer mit Perk-Modifikationen
  const getTimerDuration = useCallback(() => {
    let duration = GAME_CONFIG.TIMER_DURATION;
    const timeBufferValue = perkSystem.getPerkValue("time_bonus") ?? 0;
    const meditationBonus = relicSystem.getRelicValue("permanent_time_bonus") ?? 0;
    // Speed Demon Synergy: verdoppelt alle Timer-Boni (nicht die Basis-Zeit)
    const timeMult = synergyEngine.getSynergyValue('double_time_bonus') ?? 1;
    duration += (timeBufferValue + meditationBonus) * timeMult;
    // Overcautious Perk: +5s
    if (perkSystem.activePerks.some(p => p.effect === 'overcautious')) duration += 5;
    // Node-Schwierigkeit: Elite -2s, Boss -3s
    if (mapSystem.currentNodeType === NODE_TYPES.ELITE) duration -= 2;
    if (mapSystem.currentNodeType === NODE_TYPES.BOSS) duration -= 3;
    return Math.max(3, duration); // nie unter 3s
  }, [perkSystem, relicSystem, synergyEngine, mapSystem]);

  const getTimerSpeed = useCallback(() => {
    // Overclock Perk: Timer läuft 2× schnell
    if (perkSystem.activePerks.some(p => p.effect === 'overclock')) return 2;
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
    // Timer pausiert bei Perk-Auswahl, Level-Up und Synergy-Konflikt-Modal
    enabled: !showPrices && selectedCard === null && !level.showLevelUp && synergyConflictQueue.length === 0,
    duration: getTimerDuration(),
    speed: getTimerSpeed(),
  });

  const applyPerkEffects = useCallback((basePoints, timeLeft, winnerCard = null, isPerfect = false) => {
    let finalPoints = basePoints;
    const breakdown = [];
    let fakeBonus = 0; // Tracking für Cheater: Bonus der durch gefakte Bedingungen entstand

    const snap = (label, icon, before, isMult = false) => {
      const delta = Math.round(finalPoints - before);
      if (Math.abs(delta) >= 1) breakdown.push({ label, icon, delta, isMult });
    };

    // Setup: gemeinsame Hilfswerte
    const hermitActive = relicSystem.hasRelic('hermit');
    const currentDuration = getTimerDuration();
    const effectiveLives = relicSystem.hasRelic('deaths_mask') ? 1 : lives;
    const multiplierPerk = perkSystem.activePerks.find(p => p.effect === 'point_multiplier');

    // ═══════════════════════════════════════════════════════
    // PHASE A — PERK-FLATS (alle additiven Perk-Boni zuerst)
    // ═══════════════════════════════════════════════════════
    let flatPerkBonus = 0; // Summe der rohen Perk-Flats — für Alchemist & Treasure Hunter

    const flatPerk = perkSystem.activePerks.find(p => p.effect === 'flat_bonus');
    if (flatPerk?.value) { const b = finalPoints; finalPoints += flatPerk.value; flatPerkBonus += flatPerk.value; snap(flatPerk.name, flatPerk.icon, b); }

    // Color Mastery Perks: +N points wenn die korrekte Karte die passende Farbe hat
    if (winnerCard) {
      const cardColor = winnerCard.color || '';
      perkSystem.activePerks.filter(p => p.effect === 'color_bonus').forEach(cbp => {
        const matches = cbp.colorValue === 'colorless'
          ? (!cardColor || cardColor === 'colorless')
          : cardColor.includes(cbp.colorValue);
        if (matches) { const b = finalPoints; finalPoints += cbp.value; flatPerkBonus += cbp.value; snap(cbp.name, cbp.icon, b); }
      });
    }

    // ── Balatro Phase A: Flat-Effekte ──────────────────────────

    // Momentum: stacking +15 flat per correct (reset on wrong via handleChoice)
    if (perkSystem.activePerks.some(p => p.effect === 'momentum_flat')) {
      const momentumPerk = perkSystem.activePerks.find(p => p.effect === 'momentum_flat');
      perkSystem.momentumFlatStackRef.current += momentumPerk?.value ?? 15;
      const bonus = perkSystem.momentumFlatStackRef.current;
      const b = finalPoints; finalPoints += bonus; flatPerkBonus += bonus; snap('Momentum', momentumPerk?.icon ?? '🌊', b);
    }

    // Compound Interest: accumulate +10 per correct; payout on expiry via decrementPerkDurations callback
    if (perkSystem.activePerks.some(p => p.effect === 'compound_interest')) {
      perkSystem.compoundInterestAccRef.current += 10;
    }

    // Time Bomb: count correct answers; massive payout on expiry
    if (perkSystem.activePerks.some(p => p.effect === 'time_bomb_counter')) {
      perkSystem.timeBombCounterRef.current += 1;
    }

    // Chain Lightning: consecutive correct streak → ×(1 + count×0.5) flat bonus applied as flat here
    if (perkSystem.activePerks.some(p => p.effect === 'chain_lightning_counter')) {
      perkSystem.chainLightningCounterRef.current += 1;
      const chainCount = perkSystem.chainLightningCounterRef.current;
      if (chainCount > 1) {
        const bonus = Math.floor(finalPoints * (chainCount - 1) * 0.5);
        const b = finalPoints; finalPoints += bonus; flatPerkBonus += bonus;
        snap(`Chain Lightning ×${chainCount}`, '⚡', b);
      }
    }

    // Bloodlust: cashout accumulated charges on correct answer
    if (perkSystem.bloodlustChargesRef.current > 0 && perkSystem.activePerks.some(p => p.effect === 'bloodlust_charges')) {
      const charges = perkSystem.bloodlustChargesRef.current;
      perkSystem.bloodlustChargesRef.current = 0;
      const b = finalPoints; finalPoints += charges; flatPerkBonus += charges; snap('Bloodlust', '🩸', b);
    }

    // Echo Chamber: repeat last answer's bonus delta
    if (perkSystem.activePerks.some(p => p.effect === 'echo_chamber') && perkSystem.echoLastBonusRef.current > 0) {
      const echo = perkSystem.echoLastBonusRef.current;
      const b = finalPoints; finalPoints += echo; flatPerkBonus += echo; snap('Echo Chamber', '🔊', b);
    }

    // ════════════════════════════════════════════════════════════
    // PHASE B — PERK-MULTIPLIKATOR (nach den Flats — multipliziert Base + alle Perk-Flats)
    // ════════════════════════════════════════════════════════════
    if (multiplierPerk?.value) { const b = finalPoints; finalPoints *= multiplierPerk.value; snap(multiplierPerk.name, multiplierPerk.icon, b, true); }

    // ── Balatro Phase B: Mult-Effekte ──────────────────────────

    // Perfectionist: ×3 on perfect answer (replaces old flat perfect_bonus)
    if (isPerfect && perkSystem.activePerks.some(p => p.effect === 'perfect_multiplier')) {
      const b = finalPoints; finalPoints *= 3; snap('Perfectionist', '✨', b, true);
    }

    // Glass Mind: ×3 on perfect; wrong = extra -1 life (handled in handleChoice)
    if (isPerfect && perkSystem.activePerks.some(p => p.effect === 'glass_mind')) {
      const b = finalPoints; finalPoints *= 3; snap('Glass Mind', '🔮', b, true);
    }

    // Dead Man's Hand: ×5 at 1 life (effectiveLives for Deaths Mask compat)
    if (effectiveLives === 1 && perkSystem.activePerks.some(p => p.effect === 'dead_mans_hand')) {
      const b = finalPoints; finalPoints *= 5; snap("Dead Man's Hand", '☠️', b, true);
      if (lives !== 1) fakeBonus += finalPoints - b;
    }

    // Overclock: ×2 (timer also runs at 2× speed via getTimerSpeed)
    if (perkSystem.activePerks.some(p => p.effect === 'overclock')) {
      const b = finalPoints; finalPoints *= 2; snap('Overclock', '⚡⚡', b, true);
    }

    // Adrenaline: +20% per active temp perk (duration > 0)
    const tempPerkCount = perkSystem.activePerks.filter(p => p.duration > 0 && p.effect !== 'adrenaline_mult').length;
    if (tempPerkCount > 0 && perkSystem.activePerks.some(p => p.effect === 'adrenaline_mult')) {
      const b = finalPoints; finalPoints *= 1 + tempPerkCount * 0.2; snap(`Adrenaline ×${tempPerkCount}`, '💉', b, true);
    }

    // Gambler: 60% ×2, 40% ×0
    if (perkSystem.activePerks.some(p => p.effect === 'gambler_roll')) {
      const b = finalPoints;
      const roll = Math.random();
      if (roll < 0.6) { finalPoints *= 2; snap('Gambler Win', '🎲', b, true); }
      else { finalPoints = 0; snap('Gambler Loss', '🎲💀', b, true); }
    }

    // Roulette: ×(1–8) zufällig
    if (perkSystem.activePerks.some(p => p.effect === 'roulette')) {
      const b = finalPoints;
      const roll = Math.floor(Math.random() * 8) + 1;
      finalPoints *= roll; snap(`Roulette ×${roll}`, '🎰', b, true);
    }

    // Wildcard: random effect
    if (perkSystem.activePerks.some(p => p.effect === 'wildcard')) {
      const wildcardRoll = Math.random();
      const b = finalPoints;
      if (wildcardRoll < 0.25) { finalPoints *= 2; snap('Wildcard ×2', '🃏', b, true); }
      else if (wildcardRoll < 0.45) { finalPoints *= 3; snap('Wildcard ×3', '🃏', b, true); }
      else if (wildcardRoll < 0.65) { finalPoints += 50; snap('Wildcard +50', '🃏', b); }
      else if (wildcardRoll < 0.85) { finalPoints += 100; snap('Wildcard +100', '🃏', b); }
      // else: nothing (~15%)
    }

    // Referenzpunkt für Hermit/Minimalist: alles ab hier ist Relic-Anteil
    const afterPerks = finalPoints;

    // ════════════════════════════════════════════════════════════
    // PHASE C — RELIC-FLATS (vor den Multiplikatoren → werden von Phase D multipliziert)
    // ════════════════════════════════════════════════════════════

    // Collector Bonus: +15 flat pro aktivem Relic
    if (relicSystem.hasRelic('collector_bonus')) {
      const b = finalPoints;
      finalPoints += relicSystem.activeRelics.length * relicSystem.getRelicValue('per_relic_flat_bonus');
      snap('Collector Bonus', '🏛️', b);
    }

    // Treasure Hunter: Perk-Flat-Boni werden als Relic-Flat hinzugefügt (danach multipliziert)
    if (relicSystem.hasRelic('treasure_hunter') && flatPerkBonus > 0) {
      const b = finalPoints;
      finalPoints += flatPerkBonus * (relicSystem.getRelicValue('perk_bonus_amplifier') - 1);
      snap('Treasure Hunter', '🗝️', b);
    }

    // ════════════════════════════════════════════════════════════
    // PHASE D — ALLE MULTIPLIKATOREN (Relics + Synergies)
    // ════════════════════════════════════════════════════════════

    if (relicSystem.hasRelic('glass_cannon')) {
      const b = finalPoints; finalPoints *= relicSystem.getRelicValue('glass_cannon'); snap('Glass Cannon', '💥', b, true);
    }
    if (ironWillActive && relicSystem.hasRelic('iron_will')) {
      const b = finalPoints; finalPoints *= relicSystem.getRelicValue('comeback_bonus'); snap('Iron Will', '🛡️', b, true);
    }
    if (comboMultiplier > 1) {
      const b = finalPoints; finalPoints *= comboMultiplier; snap(`Combo ×${comboMultiplier.toFixed(2)}`, '🔗', b, true);
    }

    // Synergy-Effekte (Hermit deaktiviert diese)
    if (!hermitActive && synergyEngine.hasSynergy('gold_rush')) {
      const b = finalPoints; finalPoints *= synergyEngine.getSynergyValue('permanent_score_mult'); snap('Gold Rush', '💎💎', b, true);
    }
    // Berserker: effectiveLives — Deaths Mask macht es permanent aktiv
    if (!hermitActive && synergyEngine.hasSynergy('berserker') && effectiveLives === 1) {
      const b = finalPoints; finalPoints *= synergyEngine.getSynergyValue('low_hp_bonus'); snap('Berserker', '😤', b, true);
      if (lives !== 1) fakeBonus += finalPoints - b; // Deaths Mask triggered this
    }

    // Alchemist: Perk-Flat-Boni → Multiplikator (nutzt rohe flatPerkBonus-Summe)
    if (relicSystem.hasRelic('alchemist') && flatPerkBonus > 0) {
      const b = finalPoints; finalPoints *= 1 + (flatPerkBonus * relicSystem.getRelicValue('flat_to_mult')); snap('Alchemist', '⚗️', b, true);
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
        multiplierPerk?.value,
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

    // ════════════════════════════════════════════════════════════
    // PHASE E — META / SPECIAL (nach allen Multiplikatoren)
    // ════════════════════════════════════════════════════════════

    // Overkill: Score über Threshold → überschüssige Punkte verdoppelt
    if (relicSystem.hasRelic('overkill')) {
      const threshold = relicSystem.getRelicValue('overkill_bonus');
      if (finalPoints > threshold) {
        const b = finalPoints;
        finalPoints = threshold + (finalPoints - threshold) * 2;
        snap('Overkill', '💀', b);
      }
    }

    // Amplifier: Gesamt-Gain 50% stärker
    if (relicSystem.hasRelic('amplifier')) {
      const b = finalPoints;
      finalPoints += (finalPoints - basePoints) * (relicSystem.getRelicValue('mult_amplifier') - 1);
      snap('Amplifier', '📡', b);
    }

    // Echo: Gesamt-Gain verdoppeln
    if (relicSystem.hasRelic('echo')) {
      const b = finalPoints; finalPoints += (finalPoints - basePoints); snap('Echo', '🔁', b);
    }

    // Hermit: Relic-Anteil (alles über afterPerks) verdoppeln
    if (hermitActive) {
      const relicBonus = finalPoints - afterPerks;
      if (relicBonus > 0) { const b = finalPoints; finalPoints += relicBonus; snap('Hermit', '🏚️', b); }
    }

    // Minimalist: Relic-Anteil verdreifachen (×3 total → add 2× extra)
    if (relicSystem.hasRelic('minimalist')) {
      const relicBonus = finalPoints - afterPerks;
      if (relicBonus > 0) { const b = finalPoints; finalPoints += relicBonus * 2; snap('Minimalist', '🧹', b); }
    }

    // Cheater Synergy: Fake-getriggerte Boni verdoppeln
    if (!hermitActive && synergyEngine.hasSynergy('cheater') && fakeBonus > 0) {
      const b = finalPoints; finalPoints += fakeBonus; snap('Cheater', '🃏🃏', b);
    }

    // Overcautious: Score-Cap 100 per answer
    if (perkSystem.activePerks.some(p => p.effect === 'overcautious')) {
      if (finalPoints > 100) {
        const b = finalPoints; finalPoints = 100; snap('Overcautious', '🛡️🐢', b);
      }
    }

    // Echo Chamber: speichere aktuellen Bonus-Delta für nächste Runde
    if (perkSystem.activePerks.some(p => p.effect === 'echo_chamber')) {
      perkSystem.echoLastBonusRef.current = Math.max(0, finalPoints - basePoints);
    }

    return { total: Math.floor(finalPoints), breakdown };
  }, [perkSystem, getTimerDuration, relicSystem, ironWillActive, comboMultiplier, synergyEngine, lives, level, currentRound, masochistMult]);

  const saveCurrentRun = useCallback(() => {
    if (user?.guest || currentRound <= 1 || runLoggedRef.current) return;
    runLoggedRef.current = true;
    const runSummary = runLogger.getRunSummary(synergyEngine.activeSynergies);
    saveRunLog({
      run_mode:          initialCards ? 'daily' : 'roguelike',
      final_score:       score,
      final_level:       level.level,
      rounds_played:     currentRound,
      best_streak:       streak.bestStreak,
      client_session_id: runSummary.client_session_id,
      perks:             runSummary.perks,
      relics:            runSummary.relics,
      synergies:         runSummary.synergies,
      rounds:            runSummary.rounds,
      stages_cleared:    mapSystem.currentStage - 1,
      total_stages:      TOTAL_STAGES,
      node_path:         mapSystem.getChosenPathSoFar(),
      score_per_stage:   stageScoreRef.current,
    });
  }, [user, currentRound, score, level.level, streak.bestStreak, initialCards, runLogger, synergyEngine, mapSystem]);

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
        const relicEventQueue = [];
        let timeBonus;
        if (relicSystem.hasRelic('reverse_timer')) {
          timeBonus = calculateTimeBonus(getTimerDuration() - timer.timeLeft);
          relicEventQueue.push({ id: 'reverse_timer', type: 'flash' });
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
        const _currentDuration = getTimerDuration();
        const isPerfect = timer.timeLeft >= _currentDuration - 1;
        const { total: applied, breakdown: perkBreakdown } = applyPerkEffects(basePoints, timer.timeLeft, winnerCard, isPerfect);
        let totalPoints = applied;
        const extraBreakdown = [];

        // Perfectionist Echo: nächste-Runde-Verdopplung anwenden
        if (nextRoundDouble) {
          const _nrd = totalPoints;
          totalPoints *= relicSystem.getRelicValue('perfect_next_double') ?? 2;
          extraBreakdown.push({ label: 'Perfectionist Echo', icon: '✨🔁', delta: Math.round(totalPoints - _nrd) });
          setNextRoundDouble(false);
          relicEventQueue.push({ id: 'perfectionist_echo', type: 'flash' });
        }

        streak.incrementStreak();

        // --- Gold verdienen ---
        const baseGoldPerAnswer = 3 + (relicSystem.getRelicValue('bonus_gold_per_answer') ?? 0);
        gold.addGold(baseGoldPerAnswer);
        const newStreakValueForGold = streak.streak + 1;
        if (newStreakValueForGold % 10 === 0 && newStreakValueForGold > 0) gold.addGold(25); // +25 bei 10er Streak
        else if (newStreakValueForGold % 5 === 0 && newStreakValueForGold > 0) gold.addGold(10); // +10 bei 5er Streak

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
          relicEventQueue.push({ id: 'momentum', type: 'flash' });
        }
        // PRICE_SENSE Relic: 1.5x XP bei >€10 Preisdifferenz
        if (relicSystem.hasRelic('price_sense') && cardLoader.currentPair.length === 2) {
          const prices = cardLoader.currentPair.map(c => parseFloat(c.prices?.eur || 0));
          const diff = Math.abs(prices[0] - prices[1]);
          if (diff > relicSystem.getRelicValue('price_diff_xp_bonus') || diff > 10) {
            xpGained = Math.floor(xpGained * relicSystem.getRelicValue('price_diff_xp_bonus'));
            relicEventQueue.push({ id: 'price_sense', type: 'flash' });
          }
        }
        // QUICK_LEARNER Relic: +50% XP für Antworten unter 3 Sekunden (effectiveTime für Timeless)
        const effectiveAnswerTimeLeft = getEffectiveAnswerTime(timer.timeLeft);
        if (relicSystem.hasRelic('quick_learner') && effectiveAnswerTimeLeft > currentDuration - 3) {
          xpGained = Math.floor(xpGained * relicSystem.getRelicValue('speed_xp_bonus'));
          relicEventQueue.push({ id: 'quick_learner', type: 'flash' });
          if (relicSystem.hasRelic('timeless')) relicEventQueue.push({ id: 'timeless', type: 'flash' });
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
          if (newStreakValue % 3 === 0) relicEventQueue.push({ id: 'combo_master', type: 'flash' });
        }

        // Iron Will zurücksetzen nach Verwendung
        if (ironWillActive) {
          if (relicSystem.hasRelic('iron_will')) relicEventQueue.push({ id: 'iron_will', type: 'flash' });
          setIronWillActive(false);
        }

        // Treasure Hunter: flashen wenn Perk-Boni vorhanden
        if (relicSystem.hasRelic('treasure_hunter') && totalPoints > basePoints) {
          relicEventQueue.push({ id: 'treasure_hunter', type: 'flash' });
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
            relicEventQueue.push({ id: 'xp_converter', type: 'flash' });
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
          relicEventQueue.push({ id: 'perfectionist_echo', type: 'tick' });
        }

        // Meta-Relic visual flashes — in queue for sequential combo effect
        if (relicSystem.hasRelic('snowball')) relicEventQueue.push({ id: 'snowball', type: 'flash' });
        if (relicSystem.hasRelic('risk_reward')) relicEventQueue.push({ id: 'risk_reward', type: 'tick' });
        if (relicSystem.hasRelic('echo') && totalPoints > basePoints) relicEventQueue.push({ id: 'echo', type: 'flash' });
        if (relicSystem.hasRelic('amplifier') && totalPoints > basePoints) relicEventQueue.push({ id: 'amplifier', type: 'tick' });
        if (relicSystem.hasRelic('collector_bonus')) relicEventQueue.push({ id: 'collector_bonus', type: 'tick' });
        if (relicSystem.hasRelic('synergy_chain') && synergyEngine.activeSynergies.length > 0) relicEventQueue.push({ id: 'synergy_chain', type: 'flash' });
        if (relicSystem.hasRelic('perk_mastery') && perkSystem.activePerks.length > 0) relicEventQueue.push({ id: 'perk_mastery', type: 'tick' });
        if (relicSystem.hasRelic('tag_master')) relicEventQueue.push({ id: 'tag_master', type: 'tick' });
        if (relicSystem.hasRelic('level_power')) relicEventQueue.push({ id: 'level_power', type: 'tick' });
        if (relicSystem.hasRelic('overkill') && totalPoints > 100) relicEventQueue.push({ id: 'overkill', type: 'flash' });
        if (relicSystem.hasRelic('last_stand') && getEffectiveLives() === 1) relicEventQueue.push({ id: 'last_stand', type: 'flash' });
        if (relicSystem.hasRelic('chain_reaction') && (ironWillActive || comboMultiplier > 1.15)) relicEventQueue.push({ id: 'chain_reaction', type: 'flash' });
        if (relicSystem.hasRelic('synergy_amp') && synergyEngine.activeSynergies.length > 0) relicEventQueue.push({ id: 'synergy_amp', type: 'tick' });
        // Neue Relic-Flashes
        if (relicSystem.hasRelic('deaths_mask')) relicEventQueue.push({ id: 'deaths_mask', type: 'tick' });
        if (relicSystem.hasRelic('phantom_streak') && effectiveStreakForBonus > streak.streak) relicEventQueue.push({ id: 'phantom_streak', type: 'flash' });
        if (relicSystem.hasRelic('mirror') && totalPoints > basePoints) relicEventQueue.push({ id: 'mirror', type: 'tick' });
        if (relicSystem.hasRelic('hermit')) relicEventQueue.push({ id: 'hermit', type: 'tick' });
        if (relicSystem.hasRelic('minimalist') && totalPoints > basePoints) relicEventQueue.push({ id: 'minimalist', type: 'tick' });
        if (synergyEngine.hasSynergy('masochist') && masochistMult > 0) relicEventQueue.push({ id: 'masochist', type: 'tick' });
        if (synergyEngine.hasSynergy('sacrifice_reward')) relicEventQueue.push({ id: 'sacrifice_reward', type: 'tick' });
        if (synergyEngine.hasSynergy('cheater')) relicEventQueue.push({ id: 'cheater', type: 'tick' });

        // Staggered combo flash — jedes Relic feuert 180ms nach dem vorherigen
        relicEventQueue.forEach(({ id, type }, i) => {
          setTimeout(() => type === 'flash' ? flashRelic(id) : tickRelic(id), i * 180);
        });

        // Scholar-Synergy: XP-Schwelle 20% niedriger
        const scholarMult = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
        level.addXP(xpGained, scholarMult);
        achievements.trackLevel(level.level);

        // Mirror Image: XP gain also added as score
        if (perkSystem.activePerks.some(p => p.effect === 'mirror_image')) {
          totalPoints += xpGained;
        }

        // Treasure Map: convert score to gold instead
        if (perkSystem.activePerks.some(p => p.effect === 'treasure_map_gold')) {
          gold.addGold(10);
          totalPoints = 0; // no score this round
        }

        // Heart Regeneration Overflow: vorab berechnen damit es im Score-Breakdown erscheint
        const regenResult = perkSystem.trackCorrectAnswer();
        const _overflowMaxLives = relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES;
        if (regenResult.shouldRegenerate && lives >= _overflowMaxLives && relicSystem.hasRelic('overflow') && !synergyEngine.hasSynergy('ascension')) {
          const overflowVal = relicSystem.getRelicValue('overflow_hp_to_score') ?? 100;
          totalPoints += overflowVal;
          extraBreakdown.push({ label: 'Overflow', icon: '🫀', delta: overflowVal });
        }

        const newScore = score + totalPoints;
        setScore(newScore);
        pendingScoreRef.current = newScore; // animate after combo popup dismisses
        // Stage-Score tracken für Backend-Persistenz
        stageScoreRef.current[mapSystem.currentStage] =
          (stageScoreRef.current[mapSystem.currentStage] ?? 0) + Math.floor(totalPoints);
        stageCorrectRef.current += 1;

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
        setComboAnimationDone(false);
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
        // Heart Regeneration Perk — Overflow-Score bereits oben in Breakdown integriert
        if (regenResult.shouldRegenerate) {
          const maxLives = relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES;
          if (lives >= maxLives && relicSystem.hasRelic('overflow')) {
            if (synergyEngine.hasSynergy('ascension')) {
              // Ascension multipliziert den Gesamt-Score — kann nicht vorab in totalPoints
              const mult = synergyEngine.getSynergyValue('overflow_multiplier') ?? 1.5;
              setScore(prev => Math.floor(prev * mult));
              scoreMessage += ` 🫀 ×${mult}`;
            }
            // non-ascension: bereits in totalPoints + extraBreakdown oben
            flashRelic('overflow');
          } else {
            setLives(prev => Math.min(prev + 1, maxLives));
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
              const maxLivesFortress = relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES;
              if (lives >= maxLivesFortress && relicSystem.hasRelic('overflow')) {
                const hasAscension = synergyEngine.hasSynergy('ascension');
                if (hasAscension) {
                  const mult = synergyEngine.getSynergyValue('overflow_multiplier') ?? 1.5;
                  setScore(s => Math.floor(s * mult));
                } else {
                  setScore(s => s + (relicSystem.getRelicValue('overflow_hp_to_score') ?? 100));
                }
                flashRelic('overflow');
              } else {
                setLives(l => Math.min(l + 1, maxLivesFortress));
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

          // ── Balatro Wrong-Answer Effects ──────────────────────
          // Chain Lightning: reset consecutive counter
          perkSystem.chainLightningCounterRef.current = 0;
          // Momentum: reset stacking flat
          perkSystem.momentumFlatStackRef.current = 0;
          // Bloodlust: add charges
          if (perkSystem.activePerks.some(p => p.effect === 'bloodlust_charges')) {
            perkSystem.bloodlustChargesRef.current += 30;
          }
          // Echo Chamber: reset last bonus (wrong = no echo next round)
          perkSystem.echoLastBonusRef.current = 0;

          // Glass Mind: extra -1 life on wrong
          const hasGlassMind = perkSystem.activePerks.some(p => p.effect === 'glass_mind');
          // Dead Man's Hand: instant death on wrong at 1 life
          const hasDeadMansHand = perkSystem.activePerks.some(p => p.effect === 'dead_mans_hand');
          const livesLost = 1 + (hasGlassMind ? 1 : 0);
          const remainingLives = hasDeadMansHand ? 0 : lives - livesLost;
          setLives(Math.max(0, remainingLives));

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
          setWrongData(createErrorData(correctCard));

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

          // 25% XP auch bei falscher Antwort
          const wrongXP = Math.round(10 * 0.25); // 25% des Basis-XP (10)
          const scholarMultWrong = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
          level.addXP(wrongXP, scholarMultWrong);

          if (remainingLives <= 0) {
            setGameOver(true);
            level.dismissLevelUp();
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

      perkSystem.decrementPerkDurations(relicSystem.hasRelic('perk_recycler'), (expiredPerk) => {
        // Perk-Payout bei Ablauf (Time Bomb, Compound Interest)
        if (expiredPerk.effect === 'time_bomb_counter') {
          const payout = perkSystem.timeBombCounterRef.current * 15;
          if (payout > 0) setScore(prev => prev + payout);
        }
        if (expiredPerk.effect === 'compound_interest') {
          const payout = perkSystem.compoundInterestAccRef.current;
          if (payout > 0) setScore(prev => prev + payout);
        }
      });
    },
    [cardLoader.currentPair, timer, streak, score, lives, user, setScore, setUser, refreshUser, perkSystem, achievements, applyPerkEffects, getTimerDuration, onGameOver, currentRound, initialCards, level, relicSystem, synergyEngine, ironWillActive, comboMultiplier, nextRoundDouble, flashRelic, tickRelic, getEffectiveLives, getEffectiveStreak, getEffectiveAnswerTime, masochistMult, runLogger, saveCurrentRun, gold, mapSystem]
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
    mapSystem.generateMap();
  }, [achievements, cardLoader, initialCards, mapSystem]);

  // Initial Load
  useEffect(() => {
    if (user || user?.guest) {
      initGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // +15 Gold bei Level-Up
  useEffect(() => {
    if (level.showLevelUp) {
      gold.addGold(15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.showLevelUp]);

  // Update filters when filter perks change
  useEffect(() => {
    const filterPerks = perkSystem.getActiveFilterPerks();
    cardLoader.updateFilters(filterPerks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perkSystem.activePerks]);

  // Map-Transition: Nach Shop/Rest/Map-Screen → neue Karte laden
  useEffect(() => {
    if (
      !mapSystem.showMap &&
      !mapSystem.showShop &&
      !mapSystem.showRest &&
      !mapSystem.showStageComplete &&
      mapSystem.map &&
      mapSystem.currentStage > 1 &&
      !gameOver
    ) {
      cardLoader.setNextPair(false, null, null, mapSystem.getCardParams());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapSystem.showMap, mapSystem.showShop, mapSystem.showRest, mapSystem.showStageComplete]);

  // Start Timer when images loaded
  useEffect(() => {
    const anyModalOpen = mapSystem.showStageComplete || mapSystem.showMap ||
      mapSystem.showShop || mapSystem.showRest;
    if (imagesLoaded.every(Boolean) && !showPrices && !anyModalOpen) {
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
    setComboAnimationDone(true); // Safety: unlock modals when player advances early
    // Flush pending score animation if player skipped the combo reveal
    if (pendingScoreRef.current !== null) {
      animateToScore(pendingScoreRef.current);
      pendingScoreRef.current = null;
    }
    setMessage("");
    setWrongData(null);
    setScoreBreakdown(null);
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    achievements.trackRound(nextRound);

    // Card Counter Relic: alle 10 Runden +1 Leben — Overflow konvertiert Über-Heals zu Score
    const cardCounterInterval = relicSystem.getRelicValue('round_heal');
    if (cardCounterInterval) {
      if (nextRound % cardCounterInterval === 0) {
        const hasAscension = synergyEngine.hasSynergy('ascension');
        const maxLivesCC = relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES;
        if (lives >= maxLivesCC && relicSystem.hasRelic('overflow')) {
          if (hasAscension) {
            const mult = synergyEngine.getSynergyValue('overflow_multiplier') ?? 1.5;
            setScore(prev => Math.floor(prev * mult));
          } else {
            setScore(prev => prev + (relicSystem.getRelicValue('overflow_hp_to_score') ?? 100));
          }
          flashRelic('overflow');
        } else {
          setLives(prev => Math.min(prev + 1, maxLivesCC));
        }
        flashRelic('card_counter');
      } else {
        tickRelic('card_counter');
      }
    }

    // Stage-Advance (ersetzt altes Relic-at-10 System)
    const willCompleteStage = mapSystem.stageRound >= ROUNDS_PER_STAGE;
    if (willCompleteStage) {
      // Stage komplett — StageComplete-Screen zeigen, keine neue Karte laden
      mapSystem.advanceStageRound();
    } else {
      mapSystem.advanceStageRound();
      cardLoader.setNextPair(false, null, null, mapSystem.getCardParams());
    }
  }, [currentRound, achievements, cardLoader, relicSystem, setLives, flashRelic, tickRelic, lives, setScore, synergyEngine, animateToScore, mapSystem]);

  const handlePerkSelect = useCallback(async (perk) => {
    const hasEternalFlame = relicSystem.hasRelic('eternal_flame');
    const hasUpgradeMaster = relicSystem.hasRelic('upgrade_master');
    const hasDoubleDip = relicSystem.hasRelic('double_dip');
    if (hasDoubleDip) flashRelic('double_dip');

    {
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
  const handleLevelUpSelect = useCallback(async (pick) => {
    console.log('[LevelUp]', pick.category.toUpperCase(), pick.name, `(${pick.id})`, pick.tags ?? []);
    const hasEternalFlame = relicSystem.hasRelic('eternal_flame');
    const hasUpgradeMaster = relicSystem.hasRelic('upgrade_master');
    if (pick.category === 'relic') {
      // Soft-Cap: ab 6 Relics kostet jedes weitere Gold (Hoarder: 10 statt 25)
      const RELIC_FREE_CAP = 6;
      if (relicSystem.activeRelics.length >= RELIC_FREE_CAP) {
        const relicCost = relicSystem.hasRelic('hoarder') ? 10 : 25;
        if (!gold.spendGold(relicCost)) return; // nicht genug Gold → abbrechen
      }
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
  }, [relicSystem, perkSystem, level, achievements, setLives, runLogger, currentRound, gold]);


  const handlePerkSkip = useCallback(() => {
    perkSystem.skipPerkSelection();
    cardLoader.setNextPair();
  }, [perkSystem, cardLoader]);

  const handlePerkReroll = useCallback(() => {
    if (!gold.spendGold(10)) return;
    perkSystem.rerollPerks();
  }, [gold, perkSystem]);

  const handleLevelUpSkip = useCallback(() => {
    level.dismissLevelUp();
  }, [level]);

  const handleLevelUpReroll = useCallback(() => {
    if (!gold.spendGold(15)) return;
    setLevelUpRerollKey(k => k + 1);
  }, [gold]);


  // ── Shop callbacks ──────────────────────────────────────────
  const handleShopBuyRelic = useCallback((relic, price) => {
    if (!gold.spendGold(price)) return;
    const RELIC_FREE_CAP = 6;
    if (relicSystem.activeRelics.length >= RELIC_FREE_CAP) {
      const discount = relicSystem.hasRelic('hoarder') ? 10 : 25;
      if (!gold.spendGold(discount)) return;
    }
    if (relic.effect === 'blueprint_copy') {
      const others = relicSystem.activeRelics.filter(r => r.id !== 'blueprint');
      if (others.length > 0) {
        const src = others[Math.floor(Math.random() * others.length)];
        relicSystem.addRelic({ ...src, id: `blueprint_copy_${Date.now()}`, name: `Blueprint (${src.name})`, icon: '📋', description: `Kopie: ${src.description}` });
      } else {
        relicSystem.addRelic(relic);
      }
    } else {
      relicSystem.addRelic(relic);
    }
    if (relic.effect === 'glass_cannon') setLives(1);
    achievements.trackRelicCollected();
  }, [gold, relicSystem, achievements, setLives]);

  const handleShopBuyPerk = useCallback((perk, price) => {
    if (!gold.spendGold(price)) return;
    const hasEternalFlame = relicSystem.hasRelic('eternal_flame');
    const hasUpgradeMaster = relicSystem.hasRelic('upgrade_master');
    perkSystem.selectPerk(perk, { keepOpen: true, hasEternalFlame, hasUpgradeMaster });
    achievements.trackPerkCollected();
  }, [gold, perkSystem, relicSystem, achievements]);

  const handleShopHeal = useCallback(() => {
    const healCost = 30;
    if (!gold.spendGold(healCost)) return;
    const maxLives = relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES;
    setLives(prev => Math.min(prev + 1, maxLives));
  }, [gold, relicSystem, setLives]);

  const handleShopUpgradePerk = useCallback((perkOrOpen) => {
    // Called from Healer: costs gold, extends a perk's duration
    if (!gold.canAfford(25)) return;
    // If called without a specific perk, noop (UI flow handles perk selection inside ShopScreen)
    if (perkOrOpen && perkOrOpen.id) {
      if (!gold.spendGold(25)) return;
      perkSystem.selectPerk({ ...perkOrOpen, bonusDuration: 3 }, { keepOpen: true });
    }
  }, [gold, perkSystem]);

  const handleShopBuySynergySlot = useCallback(() => {
    const cost = 80;
    if (!gold.spendGold(cost)) return;
    relicSystem.addRelic(RELICS.SYNERGY_EXPANDER);
  }, [gold, relicSystem]);

  const handleShopComplete = useCallback(() => {
    mapSystem.completeShop();
  }, [mapSystem]);

  // ── Rest callbacks ──────────────────────────────────────────
  const handleRest = useCallback(() => {
    const maxLives = relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES;
    setLives(prev => Math.min(prev + 2, maxLives));
    mapSystem.completeRest();
  }, [relicSystem, setLives, mapSystem]);

  const handleRestUpgradePerk = useCallback((perk) => {
    // Extend perk duration for free at rest site
    if (!perk?.id) return;
    perkSystem.selectPerk({ ...perk, bonusDuration: 3 }, { keepOpen: true });
    mapSystem.completeRest();
  }, [perkSystem, mapSystem]);

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
    setWrongData(null);
    setScoreBreakdown(null);
    setComboAnimationDone(true);
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
    gold.reset();
    setSynergyConflictQueue([]);
    setComboMultiplier(1);
    setIronWillActive(false);
    setNextRoundDouble(false);
    setMasochistMult(0);
    setFortressRegenCount(0);
    bestComboMultiplierRef.current = 1;
    stageScoreRef.current = {};
    stageCorrectRef.current = 0;
    achievements.resetGameStats();
    runLogger.reset();
    mapSystem.reset();

    await cardLoader.preloadCards();
    await cardLoader.setNextPair();
    mapSystem.generateMap();
  }, [setScore, streak, timer, cardLoader, perkSystem, level, relicSystem, synergyEngine, gold, achievements, runLogger, saveCurrentRun, mapSystem]);

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
          <div className="bg-[#111827] rounded-sm px-2 py-1 border-2 border-[#2d3a5c] shrink-0">
            <span className="text-amber-300 text-xs font-semibold">🎯 R{currentRound}</span>
          </div>
          <div className="relative min-w-0">
            <span className="font-bold text-lg text-gray-900">Pts: {displayScore.toLocaleString()}</span>
            <AnimatePresence>
              {scoreGain && (
                <motion.span
                  key={score}
                  initial={{ opacity: 1, y: 0, scale: 1.3 }}
                  animate={{ opacity: 0, y: -22, scale: 1 }}
                  exit={{}}
                  transition={{ duration: 1.3, delay: 0.2, ease: 'easeOut' }}
                  className="absolute left-0 top-full text-green-300 text-sm font-bold pointer-events-none whitespace-nowrap"
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
            <div className="bg-[#111827] sm:mb-auto rounded-sm px-4 py-2 border-2 border-[#2d3a5c]">
              <span className="text-amber-300 text-sm font-semibold">🎯 Round {currentRound}</span>
            </div>
          </div>
          <div className="flex flex-col sm:ml-3">
            <p className="mb-2 text-lg text-gray-800">Your Highscore: {user.highscore}</p>
            <div className="relative mb-2">
              <p className="font-bold text-2xl text-gray-900">Points: {displayScore.toLocaleString()}</p>
              <AnimatePresence>
                {scoreGain && (
                  <motion.span
                    key={score}
                    initial={{ opacity: 1, y: 0, scale: 1.4 }}
                    animate={{ opacity: 0, y: -24, scale: 1 }}
                    exit={{}}
                    transition={{ duration: 1.3, delay: 0.2, ease: 'easeOut' }}
                    className="absolute left-0 top-full text-green-300 text-base font-bold pointer-events-none"
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
              className="bg-[#111827] border-2 border-amber-600 rounded-sm px-3 py-1 shrink-0"
            >
              <span className="text-amber-300 text-sm font-bold">⭐ Level {level.level}</span>
            </motion.div>
          </AnimatePresence>

          {/* XP-Fortschrittsbalken */}
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold tracking-wide text-amber-400/70">XP</span>
              <span className="text-gray-500">{level.xp} / {level.xpToNextLevel}</span>
            </div>
            <div
              className="w-full h-3 bg-[#0f1724] border border-[#2d3a5c] relative overflow-hidden"
              style={xpBling ? { boxShadow: '0 0 10px 3px #fbbf24bb' } : undefined}
            >
              {/* Fill */}
              <motion.div
                className="absolute left-0 top-0 h-full"
                initial={false}
                animate={{ width: xpBling ? '100%' : `${(level.xp / level.xpToNextLevel) * 100}%` }}
                transition={{ duration: xpBling ? 0.12 : 0.4, ease: "easeOut" }}
                style={{
                  background: 'linear-gradient(90deg, #b45309 0%, #f59e0b 60%, #fde68a 100%)',
                  boxShadow: '0 0 5px 1px #f59e0b55',
                }}
              />
              {/* Segment-Trennlinien (10 Segmente) */}
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full w-px bg-[#1e2d45]"
                  style={{ left: `${(i + 1) * 10}%` }}
                />
              ))}
              {/* Shimmer-Sweep bei Level-Up */}
              <AnimatePresence>
                {xpBling && (
                  <motion.div
                    key="xp-bling"
                    className="absolute inset-0 pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '250%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.75) 50%, transparent 100%)',
                      width: '40%',
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Gold-Anzeige */}
          <AnimatePresence mode="wait">
            <motion.div
              key={gold.gold}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="shrink-0 flex items-center gap-1 bg-[#111827] border-2 border-yellow-700 rounded-sm px-2 py-1"
              title="Gold — earned from correct answers and streaks"
            >
              <GameIcon name="coin" color="amber" size={14} />
              <span className="text-yellow-300 text-xs font-bold">{gold.gold}</span>
            </motion.div>
          </AnimatePresence>

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
          <div className="bg-[#111827] border-2 border-pink-500 rounded-sm px-2 py-1 sm:p-2">
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

      {/* Keyboard Hints — desktop only, centered below cards */}
      {!gameOver && !perkSystem.showPerkSelection && (
        <div className="hidden sm:flex w-full max-w-lg sm:max-w-2xl justify-center mt-2 mb-1">
          {selectedCard === null && !showPrices ? (
            <span className="text-gray-400 text-sm">⌨️ Press <kbd className="bg-[#111827] border border-[#2d3a5c] px-2 py-0.5 rounded-sm mx-1">1</kbd>/<kbd className="bg-[#111827] border border-[#2d3a5c] px-2 py-0.5 rounded-sm mx-1">A</kbd> for left, <kbd className="bg-[#111827] border border-[#2d3a5c] px-2 py-0.5 rounded-sm mx-1">2</kbd>/<kbd className="bg-[#111827] border border-[#2d3a5c] px-2 py-0.5 rounded-sm mx-1">D</kbd> for right</span>
          ) : selectedCard !== null ? (
            <span className="text-gray-400 text-sm">⌨️ Press <kbd className="bg-[#111827] border border-[#2d3a5c] px-2 py-0.5 rounded-sm mx-1">Space</kbd> or <kbd className="bg-[#111827] border border-[#2d3a5c] px-2 py-0.5 rounded-sm mx-1">Enter</kbd> to continue</span>
          ) : null}
        </div>
      )}

      {/* Bottom row: score breakdown left + buttons right (desktop) / buttons only in flow (mobile) */}
      <div className="mt-1 w-full max-w-lg sm:max-w-2xl relative pb-1 sm:pb-2 sm:flex sm:flex-row sm:items-end sm:gap-4">

        {/* Score breakdown / wrong banner — fixed above next button on mobile, flex-1 inline on desktop */}
        <div className="sm:static sm:flex-1 sm:min-w-0 hidden sm:block">
          <ScoreComboReveal
            breakdown={scoreBreakdown}
            visible={selectedCard !== null && !gameOver}
            onComplete={handleComboComplete}
          />
          {/* Wrong answer banner */}
          {wrongData && !gameOver && !scoreBreakdown && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-sm border border-red-400/60 bg-red-100/70">
              <span className="text-red-600 text-lg font-black shrink-0">✗</span>
              <div className="min-w-0">
                <span className="text-red-700 text-xs uppercase tracking-widest font-bold block">Wrong!</span>
                <span className="text-gray-900 text-sm font-semibold block">
                  <span className="text-amber-700">{wrongData.name}</span>
                  <span className="text-gray-600 font-normal"> was more expensive — </span>
                  <span className="text-green-700 font-bold">{wrongData.price}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons — desktop inline */}
        <div className="hidden sm:flex gap-4 items-center sm:shrink-0">
          {perkSystem.hasPerk("skip_card") && selectedCard === null && !gameOver && !showPrices && (
            <button
              onClick={handleSkipCard}
              className="bg-yellow-600 text-lg font-semibold hover:bg-yellow-500 active:scale-95 text-white px-6 py-4 rounded-sm transition shadow-pixel border-2 border-yellow-400"
              title="Press S to skip"
            >
              ⭐ Skip{(() => { const sc = perkSystem.activePerks.find(p => p.id === 'skip_card'); return sc && sc.value > 1 ? ` (×${sc.value})` : ''; })()}
            </button>
          )}
          {selectedCard !== null && !gameOver && (
            <button
              onClick={handleNextPair}
              disabled={perkSystem.showPerkSelection || level.showLevelUp}
              className={`text-2xl min-w-[200px] font-bold text-white px-6 py-6 rounded-sm border-2 transition-all duration-150 active:scale-[0.97]
                ${(perkSystem.showPerkSelection || level.showLevelUp)
                  ? "bg-amber-700/50 border-amber-800 cursor-not-allowed shadow-none"
                  : "bg-amber-600 border-amber-800 hover:bg-amber-500 shadow-pixel"
                }`}
            >
              Next →
            </button>
          )}
        </div>

        {/* Buttons — mobile fixed bottom-right via portal */}
        {createPortal(
          <div className="sm:hidden fixed bottom-4 right-4 flex flex-col gap-2 items-end z-30" style={{bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'}}>
            {perkSystem.hasPerk("skip_card") && selectedCard === null && !gameOver && !showPrices && (
              <button
                onClick={handleSkipCard}
                className="bg-yellow-600 text-base font-semibold hover:bg-yellow-500 active:scale-95 text-white px-5 py-3 rounded-sm transition shadow-pixel border-2 border-yellow-400"
              >
                ⭐ Skip{(() => { const sc = perkSystem.activePerks.find(p => p.id === 'skip_card'); return sc && sc.value > 1 ? ` (×${sc.value})` : ''; })()}
              </button>
            )}
            {selectedCard !== null && !gameOver && (
              <button
                onClick={handleNextPair}
                disabled={perkSystem.showPerkSelection || level.showLevelUp}
                className={`text-xl font-bold text-white px-6 py-4 rounded-sm border-2 transition-all duration-150 active:scale-[0.97]
                  ${(perkSystem.showPerkSelection || level.showLevelUp)
                    ? "bg-amber-700/50 border-amber-800 cursor-not-allowed shadow-none"
                    : "bg-amber-600 border-amber-800 hover:bg-amber-500 shadow-pixel"
                  }`}
              >
                Next →
              </button>
            )}
          </div>,
          document.body
        )}

        {/* Mobile: score breakdown + wrong banner fixed above next button */}
        {createPortal(
          <div className="sm:hidden fixed right-0 left-0 px-4 pointer-events-none z-20" style={{bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)'}}>
            <ScoreComboReveal
              breakdown={scoreBreakdown}
              visible={selectedCard !== null && !gameOver}
              suppressOverlay
            />
            {wrongData && !gameOver && !scoreBreakdown && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-sm border border-red-400/60 bg-red-100/70">
                <span className="text-red-600 text-lg font-black shrink-0">✗</span>
                <div className="min-w-0">
                  <span className="text-red-700 text-xs uppercase tracking-widest font-bold block">Wrong!</span>
                  <span className="text-gray-900 text-sm font-semibold block">
                    <span className="text-amber-700">{wrongData.name}</span>
                    <span className="text-gray-600 font-normal"> was more expensive — </span>
                    <span className="text-green-700 font-bold">{wrongData.price}</span>
                  </span>
                </div>
              </div>
            )}
          </div>,
          document.body
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
        show={level.showLevelUp && !gameOver && comboAnimationDone}
        newLevel={level.level}
        activeRelics={relicSystem.activeRelics}
        activePerks={perkSystem.activePerks}
        activeSynergies={synergyEngine.activeSynergies}
        maxSynergySlots={synergyEngine.maxSynergySlots}
        onSelect={handleLevelUpSelect}
        onSkip={handleLevelUpSkip}
        onReroll={handleLevelUpReroll}
        gold={gold.gold}
        rerollKey={levelUpRerollKey}
      />


      <SynergyConflictModal
        show={synergyConflictQueue.length > 0}
        pendingSynergy={synergyConflictQueue[0] ?? null}
        activeSynergies={synergyEngine.permanentSynergies}
        onResolve={(dropId, pending) => {
          synergyEngine.resolveConflict(dropId, pending);
          setSynergyConflictQueue(prev => prev.slice(1));
        }}
      />

      <PerkSelectionModal
        perks={perkSystem.availablePerks}
        onSelect={handlePerkSelect}
        show={perkSystem.showPerkSelection}
        hasDoubleDip={relicSystem.hasRelic('double_dip')}
        onSkip={handlePerkSkip}
        onReroll={handlePerkReroll}
        lives={lives}
      />

      <SynergyToast synergy={synergyToast} onDismiss={() => setSynergyToast(null)} />

      {/* ── Roguelike Stage Screens ─────────────────────────── */}
      <AnimatePresence>
        {mapSystem.showStageComplete && !gameOver && (
          <StageCompleteScreen
            stage={mapSystem.currentStage}
            totalStages={TOTAL_STAGES}
            stageScore={stageScoreRef.current[mapSystem.currentStage] ?? 0}
            stageCorrect={stageCorrectRef.current}
            level={level.level}
            gold={gold.gold}
            nodeType={mapSystem.map?.currentNodeType}
            onContinue={() => {
              stageCorrectRef.current = 0;
              // Checkpoint speichern
              if (!user?.guest) {
                const runSummary = runLogger.getRunSummary(synergyEngine.activeSynergies);
                saveStageCheckpoint({
                  client_session_id: runSummary.client_session_id,
                  stages_cleared:    mapSystem.currentStage,
                  node_path:         mapSystem.getChosenPathSoFar(),
                  score_per_stage:   stageScoreRef.current,
                  current_score:     score,
                  current_level:     level.level,
                  perks:             runSummary.perks,
                  relics:            runSummary.relics,
                  synergies:         runSummary.synergies,
                });
              }
              mapSystem.dismissStageComplete();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapSystem.showMap && !gameOver && (
          <MapScreen
            map={mapSystem.map}
            currentStage={mapSystem.currentStage}
            gold={gold.gold}
            onChooseNode={(optIdx) => mapSystem.chooseNode(optIdx)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapSystem.showShop && !gameOver && (
          <ShopScreen
            gold={gold.gold}
            lives={lives}
            maxLives={relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES}
            activeRelics={relicSystem.activeRelics}
            activePerks={perkSystem.activePerks}
            onClose={handleShopComplete}
            onBuyRelic={handleShopBuyRelic}
            onBuyPerk={handleShopBuyPerk}
            onHeal={handleShopHeal}
            onUpgradePerk={handleShopUpgradePerk}
            onBuySynergySlot={handleShopBuySynergySlot}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapSystem.showRest && !gameOver && (
          <RestScreen
            lives={lives}
            maxLives={relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES}
            activePerks={perkSystem.activePerks}
            onRest={handleRest}
            onUpgradePerk={handleRestUpgradePerk}
          />
        )}
      </AnimatePresence>

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
          cardLoader={cardLoader}
        />
      )}
    </>
  );
}