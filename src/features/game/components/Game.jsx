import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { useAchievementContext } from "../context/AchievementContext";
import { useGameTimer } from "../hooks/useGameTimer";
import { useStreak } from "../hooks/useStreak";
import { useCardLoader } from "../hooks/useCardLoader";
import { usePerkSystem } from "../hooks/usePerkSystem";
import { usePerkCombos } from "../hooks/usePerkCombos";
import { useAscension } from "../hooks/useAscension";
import { useLevel } from "../hooks/useLevel";
import { useRelicSystem } from "../hooks/useRelicSystem";
import { useSynergyEngine } from "../hooks/useSynergyEngine";
import { useGold } from "../hooks/useGold";
import { useMapSystem } from "../hooks/useMapSystem";
import { useSavedRun } from "../hooks/useSavedRun";
import { ROUNDS_PER_STAGE, TOTAL_STAGES, NODE_TYPES, BOUNTY_GOALS } from "../constants/mapDefinitions";
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
  calculateBaseGold,
  calculateBaseXP,
  calculateStreakGold,
  calculateStreakXP,
  calculateTimeBonusXP,
  calculateHotStreakGoldBonus,
} from "../utils/rewardCalculator";
import { GAME_CONFIG } from "../../../shared/utils/constants";
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
import { ITEM_ICONS } from "../../../shared/constants/itemIconMap";
import ActivePerksDisplay from "./ActivePerksDisplay";
import RegisterWithScore from "../../auth/components/RegisterWithScore";
import DebugPanel from "./DebugPanel";
import RewardComboReveal from "./RewardComboReveal";
import StageCompleteScreen from "./StageCompleteScreen";
import MapScreen from "./MapScreen";
import ShopScreen from "./ShopScreen";
import RestScreen from "./RestScreen";
import ExchangeScreen from "./ExchangeScreen";
import ReplacePerkModal from "./ReplacePerkModal";
import RunCompleteModal from "./RunCompleteModal";
import CurseScreen from "./CurseScreen";
import BountyIndicator from "./BountyIndicator";


// Helper: liefert <GameIcon>-Element für snap()/extraBreakdown icon-Parameter
const gi = (id) => { const m = ITEM_ICONS[id]; return m ? <GameIcon name={m.icon} color={m.color} size={12} /> : null; };
const giPerk = (perk) => { const m = ITEM_ICONS[perk?.id]; return m ? <GameIcon name={m.icon} color={m.color} size={12} /> : null; };

// Prüft ob ein Bounty-Ziel erfüllt wurde
function checkBountyGoalWin(goal, progress) {
  if (!goal) return false;
  switch (goal.id) {
    case 'answer_8_of_10':  return progress.correct >= 8;
    case 'streak_5':        return progress.maxStreak >= 5;
    case 'no_wrong':        return progress.wrong === 0;
    case 'earn_200g':       return progress.stageGold >= 200;
    case 'reach_streak_10': return progress.maxStreak >= 10;
    case 'first_5_perfect': return progress.perfectFirst5 >= 5;
    default: return false;
  }
}

export default function Game({
  onBack,
  showRegister,
  setShowRegister,
  initialCards = null,
  onGameOver = null,
  continueMode = false,
  metaProgression = null,
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
  const [rewardBreakdown, setRewardBreakdown] = useState(null); // { goldData, xpData }
  const [imagesLoaded, setImagesLoaded] = useState([false, false]);
  const [currentRound, setCurrentRound] = useState(1);
  // Roguelike State
  const [comboMultiplier, setComboMultiplier] = useState(1);   // Combo Master Relic
  const [ironWillActive, setIronWillActive] = useState(false); // Iron Will Relic
  const [nextRoundDouble, setNextRoundDouble] = useState(false); // Perfectionist Echo Relic
  const [sacrificeRitualActive, setSacrificeRitualActive] = useState(false); // Sacrifice Ritual Perk
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
  // Relic-Milestone-Queue: true = Relic-Modal, false = Normal-Modal (für je gewonnenes Level)
  const [relicMilestoneQueue, setRelicMilestoneQueue] = useState([]);
  const prevLevelRef = useRef(1);
  // Run-Seed für Anzeige (rein kosmetisch)
  const [runSeed] = useState(() => Math.random().toString(36).slice(2, 6).toUpperCase());
  // Stage/Map System
  const mapSystem = useMapSystem();
  const stageScoreRef = useRef({}); // { stageIndex: score } — für Backend + StageCompleteScreen
  const stageCorrectRef = useRef(0); // richtige Antworten in dieser Stage
  const [synergyConflictQueue, setSynergyConflictQueue] = useState([]); // Queue wartender Synergy-Konflikte
  const [eliteRelicPending, setEliteRelicPending] = useState(false); // Relic-Drop nach Elite-Stage
  const [xpBling, setXpBling] = useState(false); // XP-Bar Bling bei Level-Up
  const [runComplete, setRunComplete] = useState(false); // Boss besiegt — End/Continue Wahl
  const [endlessDifficulty, setEndlessDifficulty] = useState(0); // +1 pro Endless-Runde
  const [perkReplacementState, setPerkReplacementState] = useState(null);
  const [relicSlotsMax, setRelicSlotsMax] = useState(4);
  const [bossDefeated, setBossDefeated] = useState(false);
  const xpBlingLevelRef = useRef(1); // Track letztes Level für Bling-Trigger

  // Combo-Animation: blockiert Level-Up/Relic-Modals bis die Combo-Sequenz fertig ist
  const [comboAnimationDone, setComboAnimationDone] = useState(true);

  // Called when combo popup fully disappears
  const handleComboComplete = useCallback(() => {
    setComboAnimationDone(true);
  }, []);

  // Custom Hooks
  const cardLoader = useCardLoader();
  const streak = useStreak();
  const perkSystem = usePerkSystem();
  const perkCombos = usePerkCombos(perkSystem.activePerks);
  const ascension = useAscension();
  const level = useLevel();
  const relicSystem = useRelicSystem();
  const runLogger = useRunLogger();
  const gold = useGold();
  const savedRun = useSavedRun();

  const queuePerkReplacement = useCallback((perk, onConfirm) => {
    setPerkReplacementState({
      perk,
      replaceablePerks: perkSystem.getReplaceablePerks(perk),
      onConfirm,
    });
  }, [perkSystem]);

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

  // Relic-Milestone-Queue: jedes 3. Level → Relic-Modal
  useEffect(() => {
    if (level.level > prevLevelRef.current) {
      const queue = [];
      for (let l = prevLevelRef.current + 1; l <= level.level; l++) {
        queue.push(l % 3 === 0);
      }
      setRelicMilestoneQueue(prev => [...prev, ...queue]);
      prevLevelRef.current = level.level;
    }
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
    // Endless Mode: jede Difficulty-Stufe -1s extra
    if (endlessDifficulty > 0) duration -= endlessDifficulty;
    // Ascension: Timer-Reduktion je nach Stufe
    const ascensionMods = ascension.getModifiers();
    if (ascensionMods.timerReduction) duration -= ascensionMods.timerReduction;
    // Speedrunner Kit: +2s Timer-Bonus
    if (activeKitRef.current === 'kit_speedrunner') duration += 2;
    return Math.max(3, duration); // nie unter 3s
  }, [perkSystem, relicSystem, synergyEngine, mapSystem, endlessDifficulty, ascension]);

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
  // Starting Kit Nachteile (Refs für sync-Zugriff in applyGoldEffects)
  const kitGoldPenaltyRef = useRef(0);   // Flat-Gold-Nachteil pro korrekter Antwort (Arcanist: -1G)
  const kitGoldMultRef = useRef(1.0);    // Gold-Multiplikator (z.B. ×1.25 für Berserker)
  const activeKitRef = useRef(null);     // Aktives Kit-ID für handleChoice-Logik

  // Bounty Node State + Tracking-Refs
  const [activeBounty, setActiveBounty] = useState(null);
  const [bountyProgress, setBountyProgress] = useState({ correct: 0, wrong: 0, maxStreak: 0, stageGold: 0, perfectFirst5: 0 });
  const activeBountyRef = useRef(null);          // sync-Zugriff in Callbacks
  const bountyCorrectRef = useRef(0);
  const bountyWrongRef = useRef(0);
  const bountyMaxStreakRef = useRef(0);
  const bountyStageGoldRef = useRef(0);
  const bountyPerfectFirst5Ref = useRef(0);

  const timer = useGameTimer({
    onTimeUp: () => handleChoiceRef.current?.(-1),
    // Timer pausiert bei Perk-Auswahl, Level-Up und Synergy-Konflikt-Modal
    enabled: !showPrices && selectedCard === null && !level.showLevelUp && synergyConflictQueue.length === 0 && !perkReplacementState,
    duration: getTimerDuration(),
    speed: getTimerSpeed(),
  });

  // Berechnet Gold-Rewards mit allen Perk/Relic/Synergy-Effekten
  // XP-Scaling-Relics (Snowball, Tag Master, etc.) werden separat in handleChoice berechnet
  const applyGoldEffects = useCallback((baseGold, timeLeft, winnerCard = null, isPerfect = false) => {
    let finalGold = baseGold;
    const breakdown = [];
    let fakeBonus = 0; // Tracking für Cheater

    // Cascade-Kontext: zählt was in dieser Antwort gefeuert hat (für Cascade-Perks)
    const cascadeContext = {
      flatsFired: 0,           // Anzahl Phase-A Effekte die > 0 Gold gaben
      multsFired: 0,           // Anzahl Phase-B Multiplikatoren die feuerten
      effectsFired: new Set(), // distinct Perk-Effekt-IDs
      bestFlatDelta: 0,        // größtes Einzel-Flat-Gold in Phase A
      firstMultApplied: false, // für First Spark
      chainBonus: 0,           // akkumulierter Bonus von Chain Reaction Perk
    };

    const snap = (label, icon, before, isMult = false) => {
      const delta = Math.round(finalGold - before);
      if (Math.abs(delta) >= 1) breakdown.push({ label, icon, delta, isMult });
    };

    // Setup: gemeinsame Hilfswerte
    const hermitActive = relicSystem.hasRelic('hermit');
    const currentDuration = getTimerDuration();
    const effectiveLives = relicSystem.hasRelic('deaths_mask') ? 1 : lives;
    const multiplierPerk = perkSystem.activePerks.find(p => p.effect === 'point_multiplier');

    // ═══════════════════════════════════════════════════════
    // PHASE A — PERK-FLATS (Gold-Flat-Boni)
    // ═══════════════════════════════════════════════════════
    let flatGoldBonus = 0; // Summe der rohen Perk-Flats — für Alchemist & Treasure Hunter

    // Starting Kit Nachteil: Flat-Gold-Abzug pro Antwort
    if (kitGoldPenaltyRef.current !== 0) {
      const penalty = kitGoldPenaltyRef.current;
      const b = finalGold;
      finalGold = Math.max(0, finalGold + penalty);
      if (finalGold !== b) snap(penalty < 0 ? `Kit Penalty (${penalty}G)` : `Kit Bonus (+${penalty}G)`, null, b);
    }

    // Color Mastery Perks: +N Gold wenn die korrekte Karte die passende Farbe hat
    if (winnerCard) {
      const cardColor = winnerCard.color || '';
      perkSystem.activePerks.filter(p => p.effect === 'color_bonus').forEach(cbp => {
        const matches = cbp.colorValue === 'colorless'
          ? (!cardColor || cardColor === 'colorless')
          : cardColor.includes(cbp.colorValue);
        if (matches) {
          const b = finalGold; finalGold += cbp.value; flatGoldBonus += cbp.value;
          cascadeContext.flatsFired++; cascadeContext.effectsFired.add('color_bonus');
          cascadeContext.bestFlatDelta = Math.max(cascadeContext.bestFlatDelta, cbp.value);
          snap(cbp.name, giPerk(cbp), b);
        }
      });
    }

    // Momentum: stacking +N Gold flat per correct (reset on wrong)
    // LIGHTNING MOMENTUM Combo: Momentum-Stack × Chain Lightning counter statt additiv
    if (perkSystem.activePerks.some(p => p.effect === 'momentum_flat')) {
      const momentumPerk = perkSystem.activePerks.find(p => p.effect === 'momentum_flat');
      perkSystem.momentumFlatStackRef.current += momentumPerk?.value ?? 5;
      let bonus = perkSystem.momentumFlatStackRef.current;
      if (perkCombos.hasCombo('lightning_momentum') && perkSystem.chainLightningCounterRef.current > 1) {
        bonus = Math.floor(bonus * perkSystem.chainLightningCounterRef.current);
      }
      const b = finalGold; finalGold += bonus; flatGoldBonus += bonus;
      cascadeContext.flatsFired++; cascadeContext.effectsFired.add('momentum_flat');
      cascadeContext.bestFlatDelta = Math.max(cascadeContext.bestFlatDelta, bonus);
      snap('Momentum', giPerk(momentumPerk), b);
    }

    // Compound Interest & Time Bomb: nur Counter erhöhen, Payout als XP on expiry
    if (perkSystem.activePerks.some(p => p.effect === 'compound_interest')) {
      perkSystem.compoundInterestAccRef.current += 10;
    }
    if (perkSystem.activePerks.some(p => p.effect === 'time_bomb_counter')) {
      perkSystem.timeBombCounterRef.current += 1;
    }

    // Chain Lightning: consecutive correct streak → +Gold flat bonus
    if (perkSystem.activePerks.some(p => p.effect === 'chain_lightning_counter')) {
      perkSystem.chainLightningCounterRef.current += 1;
      const chainCount = perkSystem.chainLightningCounterRef.current;
      if (chainCount > 1) {
        const chainStep = perkSystem.getPerkValue('chain_lightning_counter') ?? 0.25;
        const bonus = Math.floor(finalGold * (chainCount - 1) * chainStep);
        if (bonus > 0) {
          const b = finalGold; finalGold += bonus; flatGoldBonus += bonus;
          cascadeContext.flatsFired++; cascadeContext.effectsFired.add('chain_lightning_counter');
          cascadeContext.bestFlatDelta = Math.max(cascadeContext.bestFlatDelta, bonus);
          snap(`Chain Lightning ×${chainCount}`, gi('chain_lightning'), b);
        }
      }
    }

    // Bloodlust: cashout accumulated Gold charges on correct answer
    if (perkSystem.bloodlustChargesRef.current > 0 && perkSystem.activePerks.some(p => p.effect === 'bloodlust_charges')) {
      const charges = perkSystem.bloodlustChargesRef.current;
      perkSystem.bloodlustChargesRef.current = 0;
      const b = finalGold; finalGold += charges; flatGoldBonus += charges;
      cascadeContext.flatsFired++; cascadeContext.effectsFired.add('bloodlust_charges');
      cascadeContext.bestFlatDelta = Math.max(cascadeContext.bestFlatDelta, charges);
      snap('Bloodlust', gi('bloodlust'), b);
    }

    // Echo Chamber: repeat last answer's Gold bonus delta
    // BLOOD ECHO Combo: Echo-Bonus ×1.5 wenn Bloodlust ebenfalls aktiv
    if (perkSystem.activePerks.some(p => p.effect === 'echo_chamber') && perkSystem.echoLastBonusRef.current > 0) {
      let echo = perkSystem.echoLastBonusRef.current;
      if (perkCombos.hasCombo('blood_echo')) echo = Math.floor(echo * 1.5);
      const b = finalGold; finalGold += echo; flatGoldBonus += echo;
      cascadeContext.flatsFired++; cascadeContext.effectsFired.add('echo_chamber');
      cascadeContext.bestFlatDelta = Math.max(cascadeContext.bestFlatDelta, echo);
      snap(perkCombos.hasCombo('blood_echo') ? 'Blood Echo' : 'Echo Chamber', gi('echo_chamber'), b);
    }

    // ════════════════════════════════════════════════════════════
    // PHASE B — PERK-MULTIPLIKATOREN (Gold-Mults)
    // Reihenfolge ist deterministisch (synchron) — Chain Reaction und First Spark
    // reagieren auf diese Reihenfolge.
    // ════════════════════════════════════════════════════════════

    const _applyMult = (multValue, label, icon) => {
      // First Spark: verdoppelt den ersten Multiplikator der feuert
      if (!cascadeContext.firstMultApplied && perkSystem.activePerks.some(p => p.effect === 'first_spark')) {
        multValue *= 2;
        cascadeContext.firstMultApplied = true;
      }
      // Chain Reaction Perk: jeder Multiplikator akkumuliert einen Bonus auf folgende
      multValue += cascadeContext.chainBonus;
      const chainReactionVal = perkSystem.getPerkValue('chain_reaction_perk');
      if (chainReactionVal != null) cascadeContext.chainBonus += chainReactionVal;
      return multValue;
    };

    // Double Gold: ×1.5/×2
    if (multiplierPerk?.value) {
      const mv = _applyMult(multiplierPerk.value, multiplierPerk.name, giPerk(multiplierPerk));
      const b = finalGold; finalGold *= mv;
      cascadeContext.multsFired++; cascadeContext.effectsFired.add('point_multiplier');
      snap(`${multiplierPerk.name}${mv !== multiplierPerk.value ? ' (Spark)' : ''}`, giPerk(multiplierPerk), b, true);
    }

    // Glass Mind: ×3 Gold on all correct answers (risk: -2 lives on wrong)
    // DEATH SPIRAL Combo: bei 1 Leben wird Glass Mind zu ×7 (statt ×3)
    if (perkSystem.activePerks.some(p => p.effect === 'glass_mind')) {
      const baseGlassMult = (perkCombos.hasCombo('death_spiral') && effectiveLives === 1) ? 7 : 3;
      const mv = _applyMult(baseGlassMult, 'Glass Mind', gi('glass_mind'));
      const b = finalGold; finalGold *= mv;
      cascadeContext.multsFired++; cascadeContext.effectsFired.add('glass_mind');
      snap(perkCombos.hasCombo('death_spiral') && effectiveLives === 1 ? 'Death Spiral' : 'Glass Mind', gi('glass_mind'), b, true);
    }

    // Dead Man's Hand: ×5 Gold at 1 life
    if (effectiveLives === 1 && perkSystem.activePerks.some(p => p.effect === 'dead_mans_hand')) {
      const mv = _applyMult(5, "Dead Man's Hand", gi('dead_mans_hand'));
      const b = finalGold; finalGold *= mv;
      cascadeContext.multsFired++; cascadeContext.effectsFired.add('dead_mans_hand');
      snap("Dead Man's Hand", gi('dead_mans_hand'), b, true);
      if (lives !== 1) fakeBonus += finalGold - b;
    }

    // Overclock: ×2 Gold (timer also runs at 2× speed)
    // OVERCAUTIOUS OVERCLOCKER Combo: nur ×1.5 Gold (Cap wird separat in Phase E erhöht)
    if (perkSystem.activePerks.some(p => p.effect === 'overclock')) {
      const overclockMult = perkCombos.hasCombo('overcautious_overclocker') ? 1.5 : 2;
      const mv = _applyMult(overclockMult, 'Overclock', gi('overclock'));
      const b = finalGold; finalGold *= mv;
      cascadeContext.multsFired++; cascadeContext.effectsFired.add('overclock');
      snap('Overclock', gi('overclock'), b, true);
    }

    // Sacrifice Ritual: ×3 Gold wenn manuell aktiviert
    if (sacrificeRitualActive) {
      const mv = _applyMult(3, 'Sacrifice Ritual', gi('sacrifice_ritual'));
      const b = finalGold; finalGold *= mv;
      cascadeContext.multsFired++; cascadeContext.effectsFired.add('sacrifice_ritual');
      snap('Sacrifice Ritual', gi('sacrifice_ritual'), b, true);
      setSacrificeRitualActive(false);
    }

    // Gambler: 60% ×2 Gold, 40% ×0
    // GLASS GAMBLER Combo: Win-Rate auf 75%
    // WILDCARD GAMBLER Combo: bestimmt Wildcard-Outcome
    if (perkSystem.activePerks.some(p => p.effect === 'gambler_roll')) {
      const gamblerWinRate = perkCombos.hasCombo('glass_gambler') ? 0.75 : 0.6;
      const b = finalGold;
      const roll = Math.random();
      let gamblerWon = false;
      if (roll < gamblerWinRate) {
        const mv = _applyMult(2, 'Gambler Win', gi('gambler'));
        finalGold *= mv; snap('Gambler Win', gi('gambler'), b, true);
        gamblerWon = true;
      } else {
        finalGold = 0; snap('Gambler Loss', gi('gambler'), b, true);
      }
      cascadeContext.multsFired++; cascadeContext.effectsFired.add('gambler_roll');
      // Wildcard Gambler: merke Ergebnis für Wildcard-Block
      cascadeContext._gamblerWon = gamblerWon;
      cascadeContext._gamblerRolled = true;
    }

    // Roulette: ×(1–8) random Gold
    // DEAD MAN'S ROULETTE Combo: Minimum ×4 bei 1 Leben
    if (perkSystem.activePerks.some(p => p.effect === 'roulette')) {
      const b = finalGold;
      let roll = Math.floor(Math.random() * 8) + 1;
      if (perkCombos.hasCombo('dead_mans_roulette') && effectiveLives === 1) roll = Math.max(roll, 4);
      const mv = _applyMult(roll, `Roulette ×${roll}`, gi('roulette'));
      finalGold *= mv;
      cascadeContext.multsFired++; cascadeContext.effectsFired.add('roulette');
      snap(`Roulette ×${roll}`, gi('roulette'), b, true);
    }

    // Wildcard: random Gold bonus
    // WILDCARD GAMBLER Combo: bei Gambler-Win immer Topwert, bei Gambler-Loss kein Roll
    if (perkSystem.activePerks.some(p => p.effect === 'wildcard')) {
      if (cascadeContext._gamblerRolled && !cascadeContext._gamblerWon) {
        // Wildcard Gambler: Gambler verloren → Wildcard feuert nicht
      } else {
        const wildcardRoll = (cascadeContext._gamblerRolled && cascadeContext._gamblerWon) ? 0 : Math.random(); // 0 = immer Top
        const b = finalGold;
        if (wildcardRoll < 0.25) { const mv = _applyMult(2, 'Wildcard ×2', gi('wildcard')); finalGold *= mv; snap('Wildcard ×2', gi('wildcard'), b, true); cascadeContext.multsFired++; }
        else if (wildcardRoll < 0.45) { const mv = _applyMult(3, 'Wildcard ×3', gi('wildcard')); finalGold *= mv; snap('Wildcard ×3', gi('wildcard'), b, true); cascadeContext.multsFired++; }
        else if (wildcardRoll < 0.65) { finalGold += 10; snap('Wildcard +10G', gi('wildcard'), b); cascadeContext.flatsFired++; }
        else if (wildcardRoll < 0.85) { finalGold += 25; snap('Wildcard +25G', gi('wildcard'), b); cascadeContext.flatsFired++; }
        // else: nothing (~15%)
        cascadeContext.effectsFired.add('wildcard');
      }
    }

    // Referenzpunkt für Hermit/Minimalist: alles ab hier ist Relic-Anteil
    const afterPerks = finalGold;

    // ════════════════════════════════════════════════════════════
    // PHASE C — RELIC-FLATS (vor den Multiplikatoren)
    // ════════════════════════════════════════════════════════════

    // Collector Bonus: +5G flat pro aktivem Relic
    if (relicSystem.hasRelic('collector_bonus')) {
      const b = finalGold;
      finalGold += relicSystem.activeRelics.length * relicSystem.getRelicValue('per_relic_flat_bonus');
      snap('Collector Bonus', gi('collector_bonus'), b);
    }

    // Treasure Hunter: Perk-Flat-Gold-Boni +25% stärker
    if (relicSystem.hasRelic('treasure_hunter') && flatGoldBonus > 0) {
      const b = finalGold;
      finalGold += flatGoldBonus * (relicSystem.getRelicValue('perk_bonus_amplifier') - 1);
      snap('Treasure Hunter', gi('treasure_hunter'), b);
    }

    // ════════════════════════════════════════════════════════════
    // PHASE D — RELIC & SYNERGY MULTIPLIKATOREN (Gold)
    // ════════════════════════════════════════════════════════════

    if (relicSystem.hasRelic('glass_cannon')) {
      const b = finalGold; finalGold *= relicSystem.getRelicValue('glass_cannon'); snap('Glass Cannon', gi('glass_cannon'), b, true);
    }
    if (ironWillActive && relicSystem.hasRelic('iron_will')) {
      const b = finalGold; finalGold *= relicSystem.getRelicValue('comeback_bonus'); snap('Iron Will', gi('iron_will'), b, true);
    }
    if (comboMultiplier > 1) {
      const b = finalGold; finalGold *= comboMultiplier; snap(`Combo ×${comboMultiplier.toFixed(2)}`, gi('combo_master'), b, true);
    }

    // Gold Rush Synergy: permanenter ×1.5 Gold Multiplikator
    if (!hermitActive && synergyEngine.hasSynergy('gold_rush')) {
      const b = finalGold; finalGold *= synergyEngine.getSynergyValue('permanent_gold_mult') ?? 1.5; snap('Gold Rush', gi('gold_rush'), b, true);
    }
    // Berserker: 2× Gold at 1 life (effectiveLives für Deaths Mask)
    if (!hermitActive && synergyEngine.hasSynergy('berserker') && effectiveLives === 1) {
      const b = finalGold; finalGold *= synergyEngine.getSynergyValue('low_hp_bonus') ?? 2; snap('Berserker', gi('berserker'), b, true);
      if (lives !== 1) fakeBonus += finalGold - b;
    }

    // Alchemist: Flat-Gold-Boni → Multiplikator
    if (relicSystem.hasRelic('alchemist') && flatGoldBonus > 0) {
      const b = finalGold; finalGold *= 1 + (flatGoldBonus * relicSystem.getRelicValue('flat_to_mult')); snap('Alchemist', gi('alchemist'), b, true);
    }

    // Risk & Reward: weniger Restzeit = höherer Gold-Multiplikator (nutzt echte Zeit)
    if (relicSystem.hasRelic('risk_reward')) {
      const maxTime = currentDuration;
      if (maxTime > 0) {
        const b = finalGold;
        const timeUsed = Math.max(0, maxTime - timeLeft);
        const riskFactor = 1 + (timeUsed / maxTime) * (relicSystem.getRelicValue('time_risk_mult') - 1);
        finalGold *= riskFactor;
        snap('Risk & Reward', gi('risk_reward'), b, true);
      }
    }

    // Last Stand: ×2 Gold at 1 life
    if (relicSystem.hasRelic('last_stand') && effectiveLives === 1) {
      const b = finalGold; finalGold *= relicSystem.getRelicValue('last_stand_double'); snap('Last Stand', gi('last_stand'), b, true);
      if (lives !== 1) fakeBonus += finalGold - b;
    }

    // Chain Reaction: +50% Gold wenn Iron Will oder Combo aktiv
    if (relicSystem.hasRelic('chain_reaction') && (ironWillActive || comboMultiplier > 1.15)) {
      const b = finalGold; finalGold *= relicSystem.getRelicValue('chain_reaction'); snap('Chain Reaction', gi('chain_reaction'), b, true);
    }

    // Synergy Amplifier: +10% Gold pro aktive Synergy
    if (relicSystem.hasRelic('synergy_amp') && !hermitActive && synergyEngine.activeSynergies.length > 0) {
      const b = finalGold;
      finalGold *= 1 + (synergyEngine.activeSynergies.length * relicSystem.getRelicValue('synergy_multiplier'));
      snap('Synergy Amp', gi('synergy_amp'), b, true);
    }

    // Mirror: Bei mind. 2 Multiplikatoren → +30% Gold
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
        const b = finalGold; finalGold *= relicSystem.getRelicValue('equalize_multipliers'); snap('Mirror', gi('mirror'), b, true);
      }
    }

    // Masochist Synergy: permanenter Gold-Multiplikator pro Lebensverlust
    if (masochistMult > 0) {
      const b = finalGold; finalGold *= 1 + masochistMult; snap('Masochist', gi('masochist'), b, true);
    }

    // Sacrifice Reward Synergy: +50% Gold pro Sacrifice-Relic
    if (!hermitActive && synergyEngine.hasSynergy('sacrifice_reward')) {
      const sacrificeRelics = relicSystem.activeRelics.filter(r => (r.tags || []).includes('sacrifice')).length;
      if (sacrificeRelics > 0) {
        const b = finalGold;
        finalGold *= 1 + (sacrificeRelics * (synergyEngine.getSynergyValue('per_sacrifice_mult') ?? 0.5));
        snap('Sacrifice Reward', gi('sacrifice_reward'), b, true);
      }
    }

    // ════════════════════════════════════════════════════════════
    // PHASE E — META / SPECIAL
    // ════════════════════════════════════════════════════════════

    // Overkill: Gold über Threshold → überschüssiges Gold verdoppelt (threshold: 20G)
    if (relicSystem.hasRelic('overkill')) {
      const threshold = relicSystem.getRelicValue('overkill_bonus');
      if (finalGold > threshold) {
        const b = finalGold;
        finalGold = threshold + (finalGold - threshold) * 2;
        snap('Overkill', gi('overkill'), b);
      }
    }

    // Amplifier: Gesamt-Gold-Gain 50% stärker
    if (relicSystem.hasRelic('amplifier')) {
      const b = finalGold;
      finalGold += (finalGold - baseGold) * (relicSystem.getRelicValue('mult_amplifier') - 1);
      snap('Amplifier', gi('amplifier'), b);
    }

    // Echo: Gesamt-Gold-Gain verdoppeln
    if (relicSystem.hasRelic('echo')) {
      const b = finalGold; finalGold += (finalGold - baseGold); snap('Echo', gi('echo'), b);
    }

    // Hermit: Relic-Anteil (alles über afterPerks) verdoppeln
    if (hermitActive) {
      const relicBonus = finalGold - afterPerks;
      if (relicBonus > 0) { const b = finalGold; finalGold += relicBonus; snap('Hermit', gi('hermit'), b); }
    }

    // Minimalist: Relic-Anteil verdreifachen (×3 total → add 2× extra)
    if (relicSystem.hasRelic('minimalist')) {
      const relicBonus = finalGold - afterPerks;
      if (relicBonus > 0) { const b = finalGold; finalGold += relicBonus * 2; snap('Minimalist', gi('minimalist'), b); }
    }

    // Cheater Synergy: Fake-getriggerte Gold-Boni verdoppeln
    if (!hermitActive && synergyEngine.hasSynergy('cheater') && fakeBonus > 0) {
      const b = finalGold; finalGold += fakeBonus; snap('Cheater', gi('cheater'), b);
    }

    // Overcautious: Gold-Cap per answer
    // OVERCAUTIOUS OVERCLOCKER Combo: Cap erhöht auf 120
    if (perkSystem.activePerks.some(p => p.effect === 'overcautious')) {
      const baseCap = perkSystem.activePerks.find(p => p.effect === 'overcautious')?.value ?? 50;
      const cap = perkCombos.hasCombo('overcautious_overclocker') ? 120 : baseCap;
      if (finalGold > cap) {
        const b = finalGold; finalGold = cap; snap('Overcautious', gi('overcautious'), b);
      }
    }

    // ════════════════════════════════════════════════════════════
    // PHASE E.5 — CASCADE PERKS (reagieren auf was oben gefeuert hat)
    // ════════════════════════════════════════════════════════════

    // Echo Prime: besten Flat-Gold-Bonus der Vorrunde zu 50% wiederholen
    if (perkSystem.activePerks.some(p => p.effect === 'echo_prime')) {
      const prevBest = perkSystem.echoPrimeBestRef.current;
      // Ref jetzt für nächste Runde aktualisieren
      perkSystem.echoPrimeBestRef.current = cascadeContext.bestFlatDelta;
      if (prevBest > 0) {
        const echoPrimeBonus = Math.floor(prevBest * (perkSystem.getPerkValue('echo_prime') ?? 0.5));
        if (echoPrimeBonus >= 1) {
          const b = finalGold; finalGold += echoPrimeBonus;
          snap('Echo Prime', gi('echo_prime'), b);
        }
      } else {
        // Erste Runde: nur speichern, kein Bonus
        perkSystem.echoPrimeBestRef.current = cascadeContext.bestFlatDelta;
      }
    }

    // Ripple Effect: +4G pro Phase-A Perk der Gold gab
    if (perkSystem.activePerks.some(p => p.effect === 'ripple_effect') && cascadeContext.flatsFired > 0) {
      const rippleBonus = cascadeContext.flatsFired * (perkSystem.getPerkValue('ripple_effect') ?? 4);
      const b = finalGold; finalGold += rippleBonus;
      snap(`Ripple (${cascadeContext.flatsFired}×)`, gi('ripple_effect'), b);
    }

    // Catalyst: wenn 4+ distinct Perk-Effekte gefeuert haben, +30% aufs gesamte Gold
    if (perkSystem.activePerks.some(p => p.effect === 'catalyst') && cascadeContext.effectsFired.size >= 4) {
      const catalystMult = 1 + (perkSystem.getPerkValue('catalyst') ?? 0.3);
      const b = finalGold; finalGold *= catalystMult;
      snap(`Catalyst (${cascadeContext.effectsFired.size} effects)`, gi('catalyst'), b, true);
    }

    // Echo Chamber: speichere aktuellen Gold-Bonus-Delta für nächste Runde
    if (perkSystem.activePerks.some(p => p.effect === 'echo_chamber')) {
      perkSystem.echoLastBonusRef.current = Math.max(0, finalGold - baseGold);
    }

    // Starting Kit Gold-Multiplikator (z.B. Berserker ×1.25)
    if (kitGoldMultRef.current !== 1.0) {
      const b = finalGold; finalGold = Math.floor(finalGold * kitGoldMultRef.current);
      if (finalGold !== b) snap('Kit Bonus', null, b, true);
    }

    // Ascension Gold-Reduktion
    const _ascMods = ascension.getModifiers();
    if (_ascMods.goldReduction) {
      const b = finalGold; finalGold = Math.floor(finalGold * (1 - _ascMods.goldReduction));
      if (finalGold !== b) snap(`Ascension (−${Math.round(_ascMods.goldReduction * 100)}%)`, null, b);
    }

    return { gold: Math.floor(finalGold), goldBreakdown: breakdown, cascadeContext };
  }, [perkSystem, perkCombos, getTimerDuration, relicSystem, ironWillActive, comboMultiplier, sacrificeRitualActive, synergyEngine, lives, masochistMult, ascension]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCurrentRun = useCallback(() => {
    if (user?.guest || currentRound <= 1 || runLoggedRef.current) return;
    runLoggedRef.current = true;
    const runSummary = runLogger.getRunSummary(synergyEngine.activeSynergies);
    saveRunLog({
      run_mode:          initialCards ? 'daily' : 'roguelike',
      final_score:       gold.totalEarnedGoldRef.current,
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
  }, [user, currentRound, gold.totalEarnedGoldRef, level.level, streak.bestStreak, initialCards, runLogger, synergyEngine, mapSystem]);

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
        const relicEventQueue = [];
        // Reverse Timer: invertiert Timer-XP-Bonus (wenig Restzeit → hoher XP-Bonus)
        let timeBonusXP;
        if (relicSystem.hasRelic('reverse_timer')) {
          timeBonusXP = calculateTimeBonusXP(getTimerDuration() - timer.timeLeft);
          relicEventQueue.push({ id: 'reverse_timer', type: 'flash' });
        } else {
          timeBonusXP = calculateTimeBonusXP(timer.timeLeft);
        }

        // Phantom Streak: faked Mindest-Streak für Gold-Bonus-Berechnung
        const effectiveStreakForBonus = getEffectiveStreak();
        // Streak-Gold mit optionalem custom threshold (Perk)
        const customThreshold = perkSystem.getPerkValue("streak_threshold");
        let streakGold = customThreshold
          ? effectiveStreakForBonus >= customThreshold ? calculateStreakGold(effectiveStreakForBonus) : 0
          : calculateStreakGold(effectiveStreakForBonus);

        // Hot Streak Synergy: exponentieller Gold-Bonus
        if (synergyEngine.hasSynergy('hot_streak') && streakGold > 0) {
          streakGold = calculateHotStreakGoldBonus(effectiveStreakForBonus);
        }

        // Base Gold = 2G + Wellspring-Bonus + Streak-Gold
        const wellspringBonus = relicSystem.getRelicValue('bonus_gold_per_answer') ?? 0;
        const baseGold = calculateBaseGold() + wellspringBonus + streakGold;
        const winnerCard = cardLoader.currentPair[correctCardIndex];
        const _currentDuration = getTimerDuration();
        // SLOW PERFECTIONIST Combo: Perfectionist aktiviert ab 4s Rest (statt voller Timer)
        const isPerfect = (perkCombos.hasCombo('slow_perfectionist'))
          ? timer.timeLeft >= 4
          : timer.timeLeft >= _currentDuration - 1;
        const { gold: goldEarned, goldBreakdown: perkGoldBreakdown, cascadeContext } = applyGoldEffects(baseGold, timer.timeLeft, winnerCard, isPerfect);
        let totalGold = goldEarned;
        const extraGoldBreakdown = [];

        // Perfectionist Echo: nächste-Runde-Gold-Verdopplung anwenden
        if (nextRoundDouble) {
          const _nrd = totalGold;
          totalGold = Math.floor(totalGold * (relicSystem.getRelicValue('perfect_next_double') ?? 2));
          extraGoldBreakdown.push({ label: 'Perfectionist Echo', icon: gi('perfectionist_echo'), delta: Math.round(totalGold - _nrd) });
          setNextRoundDouble(false);
          relicEventQueue.push({ id: 'perfectionist_echo', type: 'flash' });
        }

        streak.incrementStreak();
        const newStreakValue = streak.streak + 1;

        // --- XP-Vergabe ---
        const currentDuration = getTimerDuration();
        let xpGained = calculateBaseXP() + timeBonusXP; // 10 base + 0-10 timer bonus
        if (newStreakValue % 5 === 0 && newStreakValue > 0) xpGained += 15; // Streak-Milestone
        // Exponentieller Streak-XP-Bonus ab Streak 5 (pro Antwort)
        const streakXPBonus = calculateStreakXP(effectiveStreakForBonus);

        // XP Boost / XP Boost+: flat XP-Bonus pro korrekter Antwort
        const flatBonusXP = perkSystem.getPerkValue('flat_bonus') ?? 0;
        if (flatBonusXP > 0) xpGained += flatBonusXP;

        // Perfectionist Perk: ×2/×3 XP auf perfekte Antwort
        if (isPerfect && perkSystem.activePerks.some(p => p.effect === 'perfect_multiplier')) {
          xpGained = Math.floor(xpGained * (perkSystem.getPerkValue('perfect_multiplier') ?? 2));
        }

        // Adrenaline Perk: +10% XP pro aktivem Perk
        // OVERCLOCK ADRENALINE Combo: +15% statt +10% während Overclock aktiv
        let adrenalineXPBonus = 0;
        if (perkSystem.activePerks.some(p => p.effect === 'adrenaline_mult')) {
          const adrenalineTick = (perkCombos.hasCombo('overclock_adrenaline') && perkSystem.activePerks.some(p => p.effect === 'overclock'))
            ? 0.15
            : (perkSystem.getPerkValue('adrenaline_mult') ?? 0.1);
          const xpBeforeAdrenaline = xpGained;
          xpGained = Math.floor(xpGained * (1 + perkSystem.activePerks.length * adrenalineTick));
          adrenalineXPBonus = xpGained - xpBeforeAdrenaline;
        }

        // SCHOLAR RUSH Combo: XP Boost flat verdoppelt wenn Adrenaline aktiv
        if (perkCombos.hasCombo('scholar_rush') && flatBonusXP > 0) {
          xpGained += flatBonusXP; // Verdopplung: flat_bonus wurde oben einmal addiert, hier nochmal
        }

        // Resonance Perk: +6 XP pro distinct Perk-Effekt der gefeuert hat
        if (perkSystem.activePerks.some(p => p.effect === 'resonance_xp') && cascadeContext.effectsFired.size > 0) {
          xpGained += cascadeContext.effectsFired.size * (perkSystem.getPerkValue('resonance_xp') ?? 6);
        }

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
          xpGained = Math.floor(xpGained * (synergyEngine.getSynergyValue('low_hp_bonus') ?? 2));
        }

        // XP-Scaling Relics (Snowball, Tag Master, Perk Mastery, Level Power, Synergy Chain)
        if (relicSystem.hasRelic('snowball')) {
          xpGained = Math.floor(xpGained * (1 + currentRound * (relicSystem.getRelicValue('round_scaling_mult') ?? 0.1)));
        }
        if (relicSystem.hasRelic('tag_master')) {
          const allTags = [...relicSystem.activeRelics, ...perkSystem.activePerks].flatMap(i => i.tags || []);
          xpGained = Math.floor(xpGained * (1 + new Set(allTags).size * (relicSystem.getRelicValue('unique_tag_mult') ?? 0.1)));
        }
        if (relicSystem.hasRelic('perk_mastery') && perkSystem.activePerks.length > 0) {
          xpGained = Math.floor(xpGained * (1 + perkSystem.activePerks.length * (relicSystem.getRelicValue('per_perk_mult') ?? 0.15)));
        }
        if (relicSystem.hasRelic('level_power')) {
          xpGained = Math.floor(xpGained * (1 + level.level * (relicSystem.getRelicValue('level_scaling') ?? 0.02)));
        }
        if (relicSystem.hasRelic('synergy_chain') && synergyEngine.activeSynergies.length > 0) {
          xpGained = Math.floor(xpGained * (1 + synergyEngine.activeSynergies.length * (relicSystem.getRelicValue('per_synergy_mult') ?? 0.25)));
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

        // Treasure Hunter: flashen wenn Gold-Boni vorhanden
        if (relicSystem.hasRelic('treasure_hunter') && totalGold > baseGold) {
          relicEventQueue.push({ id: 'treasure_hunter', type: 'flash' });
        }

        // XP Converter: überschüssige XP nach Level-Up → Gold (2G pro overflow XP)
        if (relicSystem.hasRelic('xp_converter')) {
          const scholarMult = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
          const effectiveThreshold = Math.floor(level.xpToNextLevel * scholarMult);
          const xpOverflow = Math.max(0, level.xp + xpGained - effectiveThreshold);
          if (xpOverflow > 0) {
            const goldBonus = xpOverflow * (relicSystem.getRelicValue('xp_to_gold') ?? 2);
            totalGold += goldBonus;
            extraGoldBreakdown.push({ label: 'XP Converter', icon: gi('xp_converter'), delta: goldBonus });
            relicEventQueue.push({ id: 'xp_converter', type: 'flash' });
          }
        }

        // Jackpot Synergy: jede 10. richtige Antwort → ×10 Gold
        if (synergyEngine.hasSynergy('jackpot') && correctCountRef.current % 10 === 0) {
          const _jp = totalGold;
          totalGold = Math.floor(totalGold * (synergyEngine.getSynergyValue('jackpot') ?? 10));
          extraGoldBreakdown.push({ label: 'Jackpot!', icon: gi('jackpot'), delta: Math.round(totalGold - _jp) });
        }

        // Mirror Image Perk: XP-Gain adds 35% as Gold
        // MIRROR PERFECTIONIST Combo: 100% Konversion auf perfekte Antwort
        // MIDAS TOUCH Combo: 60% Konversion immer
        if (perkSystem.activePerks.some(p => p.effect === 'mirror_image')) {
          let mirrorRate = perkSystem.getPerkValue('mirror_image') ?? 0.35;
          if (perkCombos.hasCombo('mirror_perfectionist') && isPerfect) mirrorRate = 1.0;
          else if (perkCombos.hasCombo('midas_touch')) mirrorRate = 0.6;
          const mirrorGold = Math.floor(xpGained * mirrorRate);
          totalGold += mirrorGold;
          const mirrorLabel = perkCombos.hasCombo('mirror_perfectionist') && isPerfect ? 'Mirror Perfectionist' :
                              perkCombos.hasCombo('midas_touch') ? 'Midas Touch' : 'Mirror Image';
          extraGoldBreakdown.push({ label: mirrorLabel, icon: gi('mirror_image'), delta: mirrorGold });
        }

        // Treasure Map Perk: flat Gold, but reduced XP this round
        // MIDAS TOUCH Combo: kein XP-Penalty
        if (perkSystem.activePerks.some(p => p.effect === 'treasure_map_gold')) {
          const treasureMapPerk = perkSystem.activePerks.find(p => p.effect === 'treasure_map_gold');
          const tmBonus = treasureMapPerk?.value ?? 12;
          totalGold += tmBonus;
          extraGoldBreakdown.push({ label: 'Treasure Map', icon: gi('treasure_map_perk'), delta: tmBonus });
          if (!perkCombos.hasCombo('midas_touch')) {
            xpGained = Math.floor(xpGained * (treasureMapPerk?.xpMultiplier ?? 0.5));
          }
        }

        // Heart Regeneration Overflow — vor level.addXP damit Ascension korrekt rechnet
        const regenResult = perkSystem.trackCorrectAnswer();
        const _overflowMaxLives = relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES;
        if (regenResult.shouldRegenerate && lives >= _overflowMaxLives && relicSystem.hasRelic('overflow')) {
          if (synergyEngine.hasSynergy('ascension')) {
            // Ascension: Overflow-Heilung → ×1.5 XP statt flat Gold
            xpGained = Math.floor(xpGained * (synergyEngine.getSynergyValue('overflow_multiplier') ?? 1.5));
          } else {
            const overflowVal = relicSystem.getRelicValue('overflow_hp_to_gold') ?? 10;
            totalGold += overflowVal;
            extraGoldBreakdown.push({ label: 'Overflow', icon: gi('overflow'), delta: overflowVal });
          }
        }

        // Perfectionist Echo trigger: effectiveTime für Timeless
        if (relicSystem.hasRelic('perfectionist_echo') && effectiveAnswerTimeLeft >= getTimerDuration() - 1) {
          setNextRoundDouble(true);
          relicEventQueue.push({ id: 'perfectionist_echo', type: 'tick' });
        }

        // Meta-Relic visual flashes — in queue for sequential combo effect
        if (relicSystem.hasRelic('snowball')) relicEventQueue.push({ id: 'snowball', type: 'flash' });
        if (relicSystem.hasRelic('risk_reward')) relicEventQueue.push({ id: 'risk_reward', type: 'tick' });
        if (relicSystem.hasRelic('echo') && totalGold > baseGold) relicEventQueue.push({ id: 'echo', type: 'flash' });
        if (relicSystem.hasRelic('amplifier') && totalGold > baseGold) relicEventQueue.push({ id: 'amplifier', type: 'tick' });
        if (relicSystem.hasRelic('collector_bonus')) relicEventQueue.push({ id: 'collector_bonus', type: 'tick' });
        if (relicSystem.hasRelic('synergy_chain') && synergyEngine.activeSynergies.length > 0) relicEventQueue.push({ id: 'synergy_chain', type: 'flash' });
        if (relicSystem.hasRelic('perk_mastery') && perkSystem.activePerks.length > 0) relicEventQueue.push({ id: 'perk_mastery', type: 'tick' });
        if (relicSystem.hasRelic('tag_master')) relicEventQueue.push({ id: 'tag_master', type: 'tick' });
        if (relicSystem.hasRelic('level_power')) relicEventQueue.push({ id: 'level_power', type: 'tick' });
        if (relicSystem.hasRelic('overkill') && totalGold > (relicSystem.getRelicValue('overkill_bonus') ?? 8)) relicEventQueue.push({ id: 'overkill', type: 'flash' });
        if (relicSystem.hasRelic('last_stand') && getEffectiveLives() === 1) relicEventQueue.push({ id: 'last_stand', type: 'flash' });
        if (relicSystem.hasRelic('chain_reaction') && (ironWillActive || comboMultiplier > 1.15)) relicEventQueue.push({ id: 'chain_reaction', type: 'flash' });
        if (relicSystem.hasRelic('synergy_amp') && synergyEngine.activeSynergies.length > 0) relicEventQueue.push({ id: 'synergy_amp', type: 'tick' });
        // Neue Relic-Flashes
        if (relicSystem.hasRelic('deaths_mask')) relicEventQueue.push({ id: 'deaths_mask', type: 'tick' });
        if (relicSystem.hasRelic('phantom_streak') && effectiveStreakForBonus > streak.streak) relicEventQueue.push({ id: 'phantom_streak', type: 'flash' });
        if (relicSystem.hasRelic('mirror') && totalGold > baseGold) relicEventQueue.push({ id: 'mirror', type: 'tick' });
        if (relicSystem.hasRelic('hermit')) relicEventQueue.push({ id: 'hermit', type: 'tick' });
        if (relicSystem.hasRelic('minimalist') && totalGold > baseGold) relicEventQueue.push({ id: 'minimalist', type: 'tick' });
        if (synergyEngine.hasSynergy('masochist') && masochistMult > 0) relicEventQueue.push({ id: 'masochist', type: 'tick' });
        if (synergyEngine.hasSynergy('sacrifice_reward')) relicEventQueue.push({ id: 'sacrifice_reward', type: 'tick' });
        if (synergyEngine.hasSynergy('cheater')) relicEventQueue.push({ id: 'cheater', type: 'tick' });

        // Staggered combo flash — jedes Relic feuert 180ms nach dem vorherigen
        relicEventQueue.forEach(({ id, type }, i) => {
          setTimeout(() => type === 'flash' ? flashRelic(id) : tickRelic(id), i * 180);
        });

        // Scholar-Synergy: XP-Schwelle 20% niedriger; XP addieren
        const scholarMult = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
        // Arcanist Kit: +20% XP
        if (activeKitRef.current === 'kit_arcanist') xpGained = Math.floor(xpGained * 1.2);
        level.addXP(xpGained, scholarMult);
        achievements.trackLevel(level.level);

        // Gold verdienen (nach allen Multiplikatoren)
        gold.addGold(Math.floor(totalGold));

        // Stage-Gold tracken für Backend-Persistenz
        stageScoreRef.current[mapSystem.currentStage] =
          (stageScoreRef.current[mapSystem.currentStage] ?? 0) + Math.floor(totalGold);
        stageCorrectRef.current += 1;

        // Bounty-Fortschritt tracken
        if (activeBountyRef.current) {
          bountyCorrectRef.current++;
          bountyMaxStreakRef.current = Math.max(bountyMaxStreakRef.current, newStreakValue);
          bountyStageGoldRef.current += Math.floor(totalGold);
          if (activeBountyRef.current.id === 'first_5_perfect' && mapSystem.stageRound <= 5 && isPerfect) {
            bountyPerfectFirst5Ref.current++;
          }
          setBountyProgress({
            correct: bountyCorrectRef.current,
            wrong: bountyWrongRef.current,
            maxStreak: bountyMaxStreakRef.current,
            stageGold: bountyStageGoldRef.current,
            perfectFirst5: bountyPerfectFirst5Ref.current,
          });
        }

        achievements.trackCorrectAnswer(timer.timeLeft, getTimerDuration(), false, totalGold);
        achievements.trackScore(gold.totalEarnedGoldRef.current);
        if (relicSystem.hasRelic('glass_cannon')) achievements.trackGlassCannonScore(gold.totalEarnedGoldRef.current);

        // Build and store reward breakdown for combo popup
        xpGained += streakXPBonus;
        const goldBaseBreakdown = [];
        if (streakGold > 0) goldBaseBreakdown.push({ label: `Streak ${effectiveStreakForBonus}x`, icon: <GameIcon name='signal' size={12} color='orange' />, delta: streakGold });
        const xpBaseBreakdown = [];
        if (timeBonusXP > 0) xpBaseBreakdown.push({ label: 'Timer Bonus', icon: <GameIcon name='time' size={12} color='blue' />, delta: timeBonusXP });
        if (streakXPBonus > 0) xpBaseBreakdown.push({ label: `Streak ${effectiveStreakForBonus}x`, icon: <GameIcon name='signal' size={12} color='orange' />, delta: streakXPBonus });
        if (flatBonusXP > 0) {
          const xpBoostPerk = perkSystem.activePerks.find(p => p.effect === 'flat_bonus');
          xpBaseBreakdown.push({ label: xpBoostPerk?.name ?? 'XP Boost', icon: <GameIcon name='gem' size={12} color='amber' />, delta: flatBonusXP });
        }
        if (adrenalineXPBonus > 0) {
          xpBaseBreakdown.push({ label: 'Adrenaline', icon: <GameIcon name='boots' size={12} color='orange' />, delta: adrenalineXPBonus });
        }
        setComboAnimationDone(false);
        setRewardBreakdown({
          goldData: { total: Math.floor(totalGold), items: [...goldBaseBreakdown, ...perkGoldBreakdown, ...extraGoldBreakdown] },
          xpData: { total: xpGained, items: xpBaseBreakdown },
        });

        runLogger.logRound({
          n: currentRound,
          card_left:  { id: card1.id, name: card1.name, price: parseFloat(card1.prices?.eur) || 0 },
          card_right: { id: card2.id, name: card2.name, price: parseFloat(card2.prices?.eur) || 0 },
          chosen: chosenIndex,
          correct: true,
          score: Math.floor(totalGold),
          time: timer.timeLeft,
          streak: newStreakValue,
          breakdown: [...goldBaseBreakdown, ...perkGoldBreakdown, ...extraGoldBreakdown].map(b => ({ label: b.label, delta: b.delta, mult: !!b.isMult })),
        });

        let scoreMessage = `+${Math.floor(totalGold)}G +${xpGained}XP`;
        // Heart Regeneration Perk
        if (regenResult.shouldRegenerate) {
          const maxLives = relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES;
          if (lives >= maxLives && relicSystem.hasRelic('overflow')) {
            // Ascension bereits oben in xpGained verrechnet; non-ascension bereits in totalGold
            flashRelic('overflow');
          } else {
            setLives(prev => Math.min(prev + 1, maxLives));
            scoreMessage += ' +1 Life';
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
                if (synergyEngine.hasSynergy('ascension')) {
                  // Ascension: bonus XP (separate addXP call)
                  const mult = synergyEngine.getSynergyValue('overflow_multiplier') ?? 1.5;
                  level.addXP(Math.floor(xpGained * (mult - 1)), scholarMult);
                } else {
                  gold.addGold(relicSystem.getRelicValue('overflow_hp_to_gold') ?? 10);
                }
                flashRelic('overflow');
              } else {
                setLives(l => Math.min(l + 1, maxLivesFortress));
              }
              scoreMessage += ' +1 Life';
              flashRelic('fortress');
              return 0;
            }
            tickRelic('fortress');
            return next;
          });
        }
        setMessage(scoreMessage);

        const totalEarned = gold.totalEarnedGoldRef.current;
        if (totalEarned > (user?.highscore ?? 0)) {
          if (user?.guest) {
            setUser({ ...user, highscore: totalEarned });
          } else {
            try {
              await updateHighscore(totalEarned);
              await refreshUser();
            } catch (error) {
              console.error("Highscore update failed:", error);
            }
          }
        }
      } else {
        setRewardBreakdown(null);
        if (perkSystem.hasPerk("second_chance")) {
          perkSystem.consumePerk("second_chance");
          setMessage("Second Chance activated! Life saved!");
          achievements.trackShieldSave();
        } else {
          wrongCountRef.current++;
          // Bounty: falsche Antwort tracken
          if (activeBountyRef.current) {
            bountyWrongRef.current++;
            setBountyProgress(prev => ({ ...prev, wrong: bountyWrongRef.current }));
          }
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
          // Iron Will: nächste richtige Antwort gibt 3x Gold
          if (relicSystem.hasRelic('iron_will')) setIronWillActive(true);
          // Combo Master Reset bei Fehler (außer Unstoppable)
          if (relicSystem.hasRelic('combo_master') && !synergyEngine.hasSynergy('unstoppable')) setComboMultiplier(1);

          // ── Speedrunner Kit: -5G pro falscher Antwort ─────────
          if (activeKitRef.current === 'kit_speedrunner') {
            gold.spendGold(5);
          }

          // ── Curse Effects ─────────────────────────────────────
          // curse_gold_debt: -15G pro falscher Antwort
          if (perkSystem.activePerks.some(p => p.effect === 'curse_gold_debt')) {
            gold.spendGold(perkSystem.getPerkValue('curse_gold_debt') ?? 15);
          }
          // curse_fragile_mind: -1 extra Leben
          if (perkSystem.activePerks.some(p => p.effect === 'curse_fragile_mind')) {
            setLives(prev => Math.max(0, prev - 1));
          }

          // ── Balatro Wrong-Answer Effects ──────────────────────
          // Chain Lightning: reset consecutive counter
          perkSystem.chainLightningCounterRef.current = 0;
          // Momentum: reset stacking flat
          perkSystem.momentumFlatStackRef.current = 0;
          // Bloodlust: add charges (10G payout)
          if (perkSystem.activePerks.some(p => p.effect === 'bloodlust_charges')) {
            perkSystem.bloodlustChargesRef.current += 10;
          }
          // Echo Chamber: reset last bonus (wrong = no echo next round)
          perkSystem.echoLastBonusRef.current = 0;
          // Echo Prime: reset best flat delta on wrong answer
          perkSystem.echoPrimeBestRef.current = 0;

          // Glass Mind: extra -1 life on wrong
          // GLASS GAMBLER Combo: Glass Mind Penalty nur -1 Leben statt -2
          const hasGlassMind = perkSystem.activePerks.some(p => p.effect === 'glass_mind');
          const glassMindExtraLives = (hasGlassMind && perkCombos.hasCombo('glass_gambler')) ? 0 : (hasGlassMind ? 1 : 0);
          // Dead Man's Hand: instant death on wrong at 1 life
          const hasDeadMansHand = perkSystem.activePerks.some(p => p.effect === 'dead_mans_hand');
          const livesLost = 1 + glassMindExtraLives;
          const remainingLives = hasDeadMansHand ? 0 : lives - livesLost;
          setLives(Math.max(0, remainingLives));

          // Pain is Gain: Lebensverlust → +50 XP (kein Score mehr)
          if (relicSystem.hasRelic('pain_is_gain')) {
            const painXP = relicSystem.activeRelics.find(r => r.id === 'pain_is_gain')?.xpValue ?? 50;
            const scholarMult2 = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
            level.addXP(painXP, scholarMult2);
            flashRelic('pain_is_gain');
          }
          // Masochist Synergy: permanenter +0.2× Gold-Multiplikator pro Lebensverlust
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
          const wrongXP = Math.round(calculateBaseXP() * 0.25);
          const scholarMultWrong = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
          level.addXP(wrongXP, scholarMultWrong);

          if (remainingLives <= 0) {
            // Crystals für Game Over: mind. 1 Stage abgeschlossen → Math.ceil(stagesCleared / 2)
            // (Stage 1 = 1 Crystal, Stage 8 = 4 Crystals; Boss-Kill bleibt bei 5 base)
            if (metaProgression && mapSystem.currentStage > 1) {
              const stagesCleared = mapSystem.currentStage - 1;
              const baseCrystals = Math.ceil(stagesCleared / 2);
              metaProgression.addCrystals(ascension.getAscensionCrystalBonus(baseCrystals));
            }
            setGameOver(true);
            level.dismissLevelUp();
            savedRun.clearRun(); // Tod = kein Continue mehr möglich
            if (!user?.guest) {
              saveGameSession({
                score: gold.totalEarnedGoldRef.current,
                rounds_played: currentRound,
                correct_answers: correctCountRef.current,
                wrong_answers: wrongCountRef.current,
                best_streak: streak.bestStreak,
                mode: initialCards ? 'daily' : 'normal',
              });
              saveCurrentRun();
            }
            if (onGameOver) onGameOver(gold.totalEarnedGoldRef.current);
            return;
          }
        }
      }

      // NUCLEAR OPTION Combo: Time Bomb + Compound Interest — beide Payouts ×1.5 wenn gleichzeitig ablaufen
      const _nuclearActive = perkCombos.hasCombo('nuclear_option');
      let _nuclearTimeBombPayout = 0;
      let _nuclearCompoundPayout = 0;
      perkSystem.decrementPerkDurations(relicSystem.hasRelic('perk_recycler'), (expiredPerk) => {
        // Perk-Payout bei Ablauf (Time Bomb → XP, Compound Interest → XP)
        if (expiredPerk.effect === 'time_bomb_counter') {
          _nuclearTimeBombPayout = perkSystem.timeBombCounterRef.current * 15;
          if (!_nuclearActive && _nuclearTimeBombPayout > 0) {
            level.addXP(_nuclearTimeBombPayout, synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1);
          }
        }
        if (expiredPerk.effect === 'compound_interest') {
          _nuclearCompoundPayout = perkSystem.compoundInterestAccRef.current;
          if (!_nuclearActive && _nuclearCompoundPayout > 0) {
            level.addXP(_nuclearCompoundPayout, synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1);
          }
        }
      });
      // Nuclear Option: kombinierter Payout ×1.5
      if (_nuclearActive && (_nuclearTimeBombPayout + _nuclearCompoundPayout) > 0) {
        const combined = Math.floor((_nuclearTimeBombPayout + _nuclearCompoundPayout) * 1.5);
        level.addXP(combined, synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1);
      }
    },
    [cardLoader.currentPair, timer, streak, lives, user, setUser, refreshUser, perkSystem, perkCombos, achievements, applyGoldEffects, getTimerDuration, onGameOver, currentRound, initialCards, level, relicSystem, synergyEngine, ironWillActive, comboMultiplier, nextRoundDouble, flashRelic, tickRelic, getEffectiveLives, getEffectiveStreak, getEffectiveAnswerTime, masochistMult, runLogger, saveCurrentRun, gold, mapSystem, metaProgression, ascension] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Update handleChoiceRef when handleChoice changes
  useEffect(() => {
    handleChoiceRef.current = handleChoice;
  }, [handleChoice]);

  const initGame = useCallback(async () => {
    achievements.resetGameStats();
    correctCountRef.current = 0;
    wrongCountRef.current = 0;

    // Continue Mode: restore from saved run
    if (continueMode) {
      const saved = savedRun.loadRun();
      if (saved) {
        gold.restore({ gold: saved.gold ?? 0, totalEarnedGold: saved.totalEarnedGold ?? 0 });
        level.restoreLevel(saved.level, saved.xp);
        if (saved.lives != null) setLives(saved.lives);
        relicSystem.restoreRelics(saved.relics);
        perkSystem.restorePerks(saved.perks, saved.passiveSlotMax, saved.utilitySlotMax);
        synergyEngine.restoreSynergies(saved.synergies);
        if (saved.map) mapSystem.restoreMap(saved.map, saved.stageRound);
        if (saved.relicSlotsMax) setRelicSlotsMax(saved.relicSlotsMax);
        if (saved.currentRound) setCurrentRound(saved.currentRound);
        if (initialCards && initialCards.length >= 2) {
          cardLoader.initWithCards(initialCards);
        } else {
          await cardLoader.preloadCards();
          await cardLoader.setNextPair(false, null, null, mapSystem.getCardParams());
        }
        return;
      }
    }

    // Normal init with optional meta progression bonuses
    if (metaProgression && !continueMode) {
      const bonuses = metaProgression.getStartingBonuses();
      if (bonuses.extraGold > 0) gold.addGold(bonuses.extraGold);
      if (bonuses.extraRelicSlot > 0) setRelicSlotsMax(4 + bonuses.extraRelicSlot);

      // Starting Kit: Startperk equip + Nachteil-Refs setzen
      activeKitRef.current = bonuses.activeKit ?? null;
      if (bonuses.activeKit) {
        const { PERKS } = await import('../constants/perkDefinitions');
        if (bonuses.activeKit === 'kit_speedrunner' && PERKS.SLOW_TIME) perkSystem.selectPerk(PERKS.SLOW_TIME, { hasEternalFlame: false });
        if (bonuses.activeKit === 'kit_arcanist' && PERKS.POINT_BOOST_EXTENDED) perkSystem.selectPerk(PERKS.POINT_BOOST_EXTENDED, { hasEternalFlame: false });
        if (bonuses.activeKit === 'kit_berserker' && PERKS.DEAD_MANS_HAND) perkSystem.selectPerk(PERKS.DEAD_MANS_HAND, { hasEternalFlame: false });
        // Arcanist: -1G pro korrekter Antwort (in applyGoldEffects Phase A)
        kitGoldPenaltyRef.current = bonuses.activeKit === 'kit_arcanist' ? -1 : 0;
        // Berserker: ×1.25 Gold; max 3 Leben
        kitGoldMultRef.current = bonuses.activeKit === 'kit_berserker' ? 1.25 : 1.0;
        if (bonuses.activeKit === 'kit_berserker') setLives(prev => Math.min(prev, 3));
      } else {
        kitGoldPenaltyRef.current = 0;
        kitGoldMultRef.current = 1.0;
      }
    }

    // Ascension-Modifier: startingLivesOffset
    if (!continueMode) {
      const ascMods = ascension.getModifiers();
      if (ascMods.startingLivesOffset) {
        setLives(prev => Math.max(1, prev + ascMods.startingLivesOffset));
      }
    }

    if (initialCards && initialCards.length >= 2) {
      cardLoader.initWithCards(initialCards);
    } else {
      const cards = await cardLoader.preloadCards();
      if (cards && cards.length >= 2) {
        await cardLoader.setNextPair();
      }
    }
    mapSystem.generateMap(ascension.getModifiers());
  }, [achievements, cardLoader, initialCards, mapSystem, continueMode, savedRun, gold, level, relicSystem, perkSystem, synergyEngine, metaProgression, ascension]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Map-Transition: Nach Shop/Rest/Curse/Map-Screen → neue Karte laden
  useEffect(() => {
    if (
      !mapSystem.showMap &&
      !mapSystem.showShop &&
      !mapSystem.showRest &&
      !mapSystem.showExchange &&
      !mapSystem.showCurse &&
      !mapSystem.showStageComplete &&
      mapSystem.map &&
      mapSystem.currentStage > 1 &&
      !gameOver
    ) {
      cardLoader.setNextPair(false, null, null, mapSystem.getCardParams());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapSystem.showMap, mapSystem.showShop, mapSystem.showRest, mapSystem.showExchange, mapSystem.showCurse, mapSystem.showStageComplete]);

  const previousStageRef = useRef(mapSystem.currentStage);
  useEffect(() => {
    if (mapSystem.currentStage > previousStageRef.current) {
      perkSystem.rechargeStageStartUtilities();
      // Curse: Slow Bleed — -1 Leben zu Stage-Beginn
      if (perkSystem.activePerks.some(p => p.effect === 'curse_slow_bleed')) {
        setLives(prev => Math.max(0, prev - 1));
      }
      // Bounty Node: zufälliges Ziel zuweisen
      if (mapSystem.currentNodeType === NODE_TYPES.BOUNTY) {
        const goal = BOUNTY_GOALS[Math.floor(Math.random() * BOUNTY_GOALS.length)];
        activeBountyRef.current = goal;
        setActiveBounty(goal);
        bountyCorrectRef.current = 0;
        bountyWrongRef.current = 0;
        bountyMaxStreakRef.current = 0;
        bountyStageGoldRef.current = 0;
        bountyPerfectFirst5Ref.current = 0;
        setBountyProgress({ correct: 0, wrong: 0, maxStreak: 0, stageGold: 0, perfectFirst5: 0 });
      } else {
        activeBountyRef.current = null;
        setActiveBounty(null);
      }
    }
    previousStageRef.current = mapSystem.currentStage;
  }, [mapSystem.currentStage, perkSystem]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start Timer when images loaded
  useEffect(() => {
    const anyModalOpen = mapSystem.showStageComplete || mapSystem.showMap ||
      mapSystem.showShop || mapSystem.showRest || mapSystem.showExchange || mapSystem.showCurse || Boolean(perkReplacementState) ||
      level.showLevelUp || eliteRelicPending;
    if (imagesLoaded.every(Boolean) && !showPrices && !anyModalOpen) {
      timer.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesLoaded, showPrices, perkReplacementState, level.showLevelUp, eliteRelicPending]);

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
    setMessage("");
    setWrongData(null);
    setRewardBreakdown(null);
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    achievements.trackRound(nextRound);

    // Curse: Amnesia — Streak alle 5 Runden resetten
    if (perkSystem.activePerks.some(p => p.effect === 'curse_amnesia')) {
      const amnesiaInterval = perkSystem.getPerkValue('curse_amnesia') ?? 5;
      if (mapSystem.stageRound % amnesiaInterval === 0) {
        streak.resetStreak();
      }
    }

    // Card Counter Relic: alle 10 Runden +1 Leben — Overflow → Gold oder XP
    const cardCounterInterval = relicSystem.getRelicValue('round_heal');
    if (cardCounterInterval) {
      if (nextRound % cardCounterInterval === 0) {
        const maxLivesCC = relicSystem.hasRelic('glass_cannon') ? 1 : GAME_CONFIG.INITIAL_LIVES;
        if (lives >= maxLivesCC && relicSystem.hasRelic('overflow')) {
          if (synergyEngine.hasSynergy('ascension')) {
            // Ascension: Overflow-Heilung → Bonus-XP
            level.addXP(Math.floor(calculateBaseXP() * ((synergyEngine.getSynergyValue('overflow_multiplier') ?? 1.5) - 1)));
          } else {
            gold.addGold(relicSystem.getRelicValue('overflow_hp_to_gold') ?? 10);
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
      // Perk-Auswahl alle ROUNDS_BETWEEN_PERKS Runden (5) innerhalb einer Stage
      if (mapSystem.stageRound % 5 === 0) {
        const ascMods = ascension.getModifiers();
        perkSystem.triggerPerkSelection(ascMods.perkChoices ?? 3);
      } else {
        cardLoader.setNextPair(false, null, null, mapSystem.getCardParams());
      }
    }
  }, [currentRound, achievements, cardLoader, relicSystem, setLives, flashRelic, tickRelic, lives, gold, level, synergyEngine, mapSystem, perkSystem, ascension, streak]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const finishPerkSelect = async (replaceTargetId = null) => {
        if (replaceTargetId) {
          perkSystem.replacePerk(replaceTargetId, finalPerk, { hasEternalFlame, hasUpgradeMaster, doubleDip: hasDoubleDip });
        } else {
          const selected = perkSystem.selectPerk(finalPerk, { hasEternalFlame, hasUpgradeMaster, doubleDip: hasDoubleDip });
          if (!selected) return false;
        }

        achievements.trackPerkCollected();

        if (relicSystem.hasRelic('copycat')) {
          const isPermPerk = perk.duration === -1;
          const copyPerk = {
            ...perk,
            id: perk.id + '_copy',
            name: perk.name + ' (Copy)',
            value: typeof perk.value === 'number' ? Math.max(1, Math.floor(perk.value * 0.5)) : perk.value,
            // Permanente Perks bleiben permanent (Hälfte von ∞ = ∞), Timed-Perks bekommen halbe Duration
            duration: isPermPerk ? -1 : Math.max(1, Math.ceil(perk.duration * 0.5)),
            _slotless: true, // Copies belegen keinen Perk-Slot
          };
          perkSystem.selectPerk(copyPerk, { hasEternalFlame, hasUpgradeMaster });
          flashRelic('copycat');
        }

        await cardLoader.setNextPair();
        runLogger.logPerkSelected({
          round: currentRound,
          perk_id: perk.id,
          perk_name: perk.name,
          offered_ids: perkSystem.availablePerks.map(p => p.id),
        });
        return true;
      };

      if (!perkSystem.hasCapacityForPerk(finalPerk)) {
        queuePerkReplacement(finalPerk, finishPerkSelect);
        return;
      }

      await finishPerkSelect();
    }
  }, [perkSystem, achievements, cardLoader, relicSystem, flashRelic, runLogger, currentRound, queuePerkReplacement]);

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
      // Soft-Cap: ab relicSlotsMax Relics kostet jedes weitere Gold (Hoarder: 10 statt 25)
      if (relicSystem.activeRelics.length >= relicSlotsMax) {
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
      const finishLevelPerk = (replaceTargetId = null) => {
        if (replaceTargetId) {
          perkSystem.replacePerk(replaceTargetId, pick, { hasEternalFlame, hasUpgradeMaster });
        } else {
          const selected = perkSystem.selectPerk(pick, { hasEternalFlame, hasUpgradeMaster });
          if (!selected) return false;
        }
        achievements.trackPerkCollected();
        // Copycat: auch bei Level-Up-Perks eine Kopie erstellen
        if (relicSystem.hasRelic('copycat')) {
          const isPermPerk = pick.duration === -1;
          const copyPerk = {
            ...pick,
            id: pick.id + '_copy',
            name: pick.name + ' (Copy)',
            value: typeof pick.value === 'number' ? Math.max(1, Math.floor(pick.value * 0.5)) : pick.value,
            duration: isPermPerk ? -1 : Math.max(1, Math.ceil(pick.duration * 0.5)),
            _slotless: true,
          };
          perkSystem.selectPerk(copyPerk, { hasEternalFlame, hasUpgradeMaster });
          flashRelic('copycat');
        }
        runLogger.logPerkSelected({ round: currentRound, perk_id: pick.id, perk_name: pick.name, source: 'level_up', offered_ids: [] });
        level.dismissLevelUp();
        return true;
      };

      if (!perkSystem.hasCapacityForPerk(pick)) {
        queuePerkReplacement(pick, finishLevelPerk);
        return;
      }

      finishLevelPerk();
    } else if (pick.category === 'upgrade') {
      perkSystem.selectPerk(pick, { hasEternalFlame, hasUpgradeMaster });
      runLogger.logPerkSelected({ round: currentRound, perk_id: pick.id, perk_name: pick.name, source: 'upgrade', offered_ids: [] });
    }
    level.dismissLevelUp();
    setRelicMilestoneQueue(prev => prev.slice(1));
  }, [relicSystem, perkSystem, level, achievements, setLives, runLogger, currentRound, gold, queuePerkReplacement, relicSlotsMax, flashRelic]);


  const handlePerkSkip = useCallback(() => {
    perkSystem.skipPerkSelection();
    cardLoader.setNextPair();
  }, [perkSystem, cardLoader]);

  const handlePerkReroll = useCallback(() => {
    if (!gold.spendGold(10)) return;
    const ascMods = ascension.getModifiers();
    perkSystem.rerollPerks(ascMods.perkChoices ?? 3);
  }, [gold, perkSystem, ascension]);

  const handleLevelUpSkip = useCallback(() => {
    level.dismissLevelUp();
    setRelicMilestoneQueue(prev => prev.slice(1));
  }, [level]);

  const handleLevelUpReroll = useCallback(() => {
    if (!gold.spendGold(15)) return;
    setLevelUpRerollKey(k => k + 1);
  }, [gold]);


  // ── Shop callbacks ──────────────────────────────────────────
  const handleShopBuyRelic = useCallback((relic, price) => {
    if (!gold.spendGold(price)) return;
    if (relicSystem.activeRelics.length >= relicSlotsMax) {
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
  }, [gold, relicSystem, achievements, setLives, relicSlotsMax]);

  const handleShopBuyPerk = useCallback((perk, price) => {
    const hasEternalFlame = relicSystem.hasRelic('eternal_flame');
    const hasUpgradeMaster = relicSystem.hasRelic('upgrade_master');
    const finishShopPerk = (replaceTargetId = null) => {
      if (!gold.spendGold(price)) return false;
      if (replaceTargetId) {
        perkSystem.replacePerk(replaceTargetId, perk, { keepOpen: true, hasEternalFlame, hasUpgradeMaster });
      } else {
        const selected = perkSystem.selectPerk(perk, { keepOpen: true, hasEternalFlame, hasUpgradeMaster });
        if (!selected) {
          gold.addGold(price);
          return false;
        }
      }
      achievements.trackPerkCollected();
      return true;
    };

    if (!perkSystem.hasCapacityForPerk(perk)) {
      queuePerkReplacement(perk, finishShopPerk);
      return;
    }

    finishShopPerk();
  }, [gold, perkSystem, relicSystem, achievements, queuePerkReplacement]);

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

  const handleShopBuyPerkSlot = useCallback(() => {
    const cost = 90;
    if (!gold.spendGold(cost)) return;
    const purchased = perkSystem.buyPassiveSlot();
    if (!purchased) {
      gold.addGold(cost);
    }
  }, [gold, perkSystem]);

  const handleShopBuyUtilitySlot = useCallback(() => {
    const cost = 110;
    if (!gold.spendGold(cost)) return;
    const purchased = perkSystem.buyUtilitySlot();
    if (!purchased) {
      gold.addGold(cost);
    }
  }, [gold, perkSystem]);

  const handleBuyRelicSlot = useCallback(() => {
    if (relicSlotsMax >= 7) return;
    if (!gold.spendGold(30)) return;
    setRelicSlotsMax(prev => prev + 1);
  }, [gold, relicSlotsMax]);

  const handleExchangeComplete = useCallback((goldSpent, xpGained) => {
    if (goldSpent && xpGained) {
      gold.spendGold(goldSpent);
      const scholarMult = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
      level.addXP(xpGained, scholarMult);
    }
  }, [gold, level, synergyEngine]);

  // Curse Node callbacks
  const handleCurseTake = useCallback((cursePerk) => {
    if (!cursePerk) return;
    // Apply curse perk (bypasses slot limits — no slotType)
    perkSystem.selectPerk({ ...cursePerk, duration: -1, _slotless: true }, { hasEternalFlame: false });
    // Reward: instant gold + relic pick (elite relic pending)
    gold.addGold(cursePerk.curseRewardGold ?? 40);
    setEliteRelicPending(true);
    mapSystem.completeCurse();
  }, [perkSystem, gold, mapSystem]);

  const handleCurseSkip = useCallback(() => {
    mapSystem.completeCurse();
  }, [mapSystem]);

  const buildSavePayload = useCallback(() => ({
    gold: gold.gold,
    totalEarnedGold: gold.totalEarnedGoldRef.current,
    level: level.level,
    xp: level.xp,
    lives,
    relics: relicSystem.activeRelics,
    perks: perkSystem.activePerks,
    passiveSlotMax: perkSystem.passiveSlotInfo.max,
    utilitySlotMax: perkSystem.utilitySlotInfo.max,
    synergies: synergyEngine.permanentSynergies,
    map: mapSystem.map,
    stageRound: 1, // Save passiert immer an Stage-Grenzen — neue Stage beginnt bei Runde 1
    relicSlotsMax,
    currentRound,
    streak: streak.streak,
    bestStreak: streak.bestStreak,
  }), [gold, level, lives, relicSystem, perkSystem, synergyEngine, mapSystem, relicSlotsMax, currentRound, streak]);

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
      setMessage("Card skipped!");
      cardLoader.setNextPair();
      timer.reset();
      setCurrentRound((prev) => prev + 1);
    }
  }, [perkSystem, cardLoader, timer]);

  const handleSacrificeRitual = useCallback(() => {
    if (!perkSystem.hasPerk("sacrifice_ritual")) return;
    if (lives <= 1) return; // kein Selbstmord
    setLives(prev => prev - 1);
    setSacrificeRitualActive(true);
    perkSystem.consumePerk("sacrifice_ritual");
    setMessage("Sacrifice activated! Next answer x3!");
  }, [perkSystem, lives]);

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

      if (key === "r" && perkSystem.hasPerk("sacrifice_ritual") && selectedCard === null && !showPrices && lives > 1) {
        e.preventDefault();
        handleSacrificeRitual();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCard, showPrices, gameOver, perkSystem.showPerkSelection, perkSystem, handleChoice, handleNextPair, handleSkipCard, handleSacrificeRitual, level.showLevelUp, lives]);

  const handleRestart = useCallback(async () => {
    saveCurrentRun();
    runLoggedRef.current = false;
    setMessage("");
    setWrongData(null);
    setRewardBreakdown(null);
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
    setRelicMilestoneQueue([]);
    prevLevelRef.current = 1;
    setRunComplete(false);
    setEndlessDifficulty(0);
    setEliteRelicPending(false);
    setRelicSlotsMax(4);
    setBossDefeated(false);
    savedRun.clearRun();
    setComboMultiplier(1);
    setIronWillActive(false);
    setNextRoundDouble(false);
    setMasochistMult(0);
    setFortressRegenCount(0);
    bestComboMultiplierRef.current = 1;
    stageScoreRef.current = {};
    stageCorrectRef.current = 0;
    kitGoldPenaltyRef.current = 0;
    kitGoldMultRef.current = 1.0;
    activeKitRef.current = null;
    activeBountyRef.current = null;
    setActiveBounty(null);
    bountyCorrectRef.current = 0;
    bountyWrongRef.current = 0;
    bountyMaxStreakRef.current = 0;
    bountyStageGoldRef.current = 0;
    bountyPerfectFirst5Ref.current = 0;
    setBountyProgress({ correct: 0, wrong: 0, maxStreak: 0, stageGold: 0, perfectFirst5: 0 });
    achievements.resetGameStats();
    runLogger.reset();
    mapSystem.reset();

    await cardLoader.preloadCards();
    await cardLoader.setNextPair();
    mapSystem.generateMap(ascension.getModifiers());
  }, [streak, timer, cardLoader, perkSystem, level, relicSystem, synergyEngine, gold, achievements, runLogger, saveCurrentRun, mapSystem, savedRun, ascension]);

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
        <p className='flex items-center gap-2'><GameIcon name='clear' size={18} color='red' /> {cardLoader.error}</p>
        <button onClick={initGame} className="mt-4 bg-amber-600 px-6 py-3 rounded hover:bg-amber-500">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header: Round + Lives */}
      {/* Mobile */}
      <div className="flex sm:hidden flex-row w-full justify-between items-center mb-1 gap-2">
        <div className="bg-[#111827] rounded-sm px-2 py-1 border-2 border-[#2d3a5c] shrink-0">
          <span className="text-amber-300 text-xs font-semibold flex items-center gap-1"><GameIcon name='target' size={13} color='amber' /> R{currentRound}</span>
        </div>
        <LivesDisplay lives={lives} />
      </div>
      {/* Desktop */}
      <div className="hidden sm:flex sm:mb-1 flex-row w-full max-w-2xl justify-between items-center">
        <div className="bg-[#111827] rounded-sm px-4 py-2 border-2 border-[#2d3a5c]">
          <span className="text-amber-300 text-sm font-semibold flex items-center gap-1"><GameIcon name='target' size={14} color='amber' /> Round {currentRound}</span>
        </div>
        <LivesDisplay lives={lives} />
      </div>

      {/* XP / Level-Display */}
      <div className="w-full max-w-2xl mb-1 sm:mb-2">
        {/* Mobile: zwei Zeilen. sm+: eine Zeile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">

          {/* Zeile 1 (mobile): Level + Gold + Seed — sm: inline mit XP-Bar */}
          <div className="flex items-center gap-2 sm:contents">
            {/* Level-Badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={level.level}
                initial={{ scale: 1.4, boxShadow: "0 0 16px #fbbf24" }}
                animate={{ scale: 1, boxShadow: "0 0 0px transparent" }}
                transition={{ duration: 0.6 }}
                className="bg-[#111827] border-2 border-amber-600 rounded-sm px-3 py-1 shrink-0"
              >
                <span className="text-amber-300 text-sm font-bold flex items-center gap-1"><GameIcon name='star' size={13} color='amber' /> Level {level.level}</span>
              </motion.div>
            </AnimatePresence>

            {/* Spacer (mobile only) */}
            <div className="flex-1 sm:hidden" />

            {/* Gold-Anzeige */}
            <AnimatePresence mode="wait">
              <motion.div
                key={gold.gold}
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="shrink-0 flex items-center gap-1.5 bg-[#111827] border-2 border-yellow-500 rounded-sm px-3 py-1.5 shadow-pixel-sm"
                title="Gold — earned from correct answers and streaks"
              >
                <GameIcon name="coin" color="amber" size={16} />
                <span className="text-yellow-300 text-sm font-black">{gold.gold}</span>
              </motion.div>
            </AnimatePresence>

            {/* Run-Seed Badge — opens map */}
            <button
              className="shrink-0 text-[9px] font-bold text-white/30 tracking-widest hover:text-white/60 transition-colors"
              title="View Map"
              onClick={() => mapSystem.openMap()}
            >
              #{runSeed}
            </button>
          </div>

          {/* Zeile 2 (mobile) / Mitte (sm+): XP-Bar volle Breite */}
          <div className="flex-1 sm:order-none">
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

        </div>
      </div>

      <ActivePerksDisplay
        perks={perkSystem.activePerks}
        relics={relicSystem.activeRelics}
        synergies={synergyEngine.activeSynergies}
        activeCombos={perkCombos.activeCombos}
        flashingRelics={flashingRelics}
        tickingRelics={tickingRelics}
        currentRound={currentRound}
        heartRegenProgress={perkSystem.getHeartRegenProgress()}
        fortressRegenCount={fortressRegenCount}
        level={level.level}
        showPerkSelection={perkSystem.showPerkSelection}
        passiveSlotInfo={perkSystem.passiveSlotInfo}
        utilitySlotInfo={perkSystem.utilitySlotInfo}
        compoundAccRef={perkSystem.compoundInterestAccRef}
        relicSlotsMax={relicSlotsMax}
      />

      <StreakDisplay
        streak={streak.streak}
        bestStreak={streak.bestStreak}
        color={streak.getStreakColor()}
        streakBonus={streak.calculateStreakBonus()}
      />

      {/* Bounty Node Indicator */}
      <AnimatePresence>
        {activeBounty && mapSystem.currentNodeType === NODE_TYPES.BOUNTY && !gameOver && (
          <BountyIndicator
            key={activeBounty.id}
            goal={activeBounty}
            progress={bountyProgress}
          />
        )}
      </AnimatePresence>

      {/* Heart Regen Progress */}
      {perkSystem.getHeartRegenProgress() && (
        <div className="w-full max-w-xl mb-1 sm:mb-4">
          <div className="bg-[#111827] border-2 border-pink-500 rounded-sm px-2 py-1 sm:p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-pink-200 text-xs sm:text-sm font-semibold">
                <span className='flex items-center gap-1'><GameIcon name='heart' size={13} color='pink' /> Heart Regen: {perkSystem.getHeartRegenProgress().current}/{perkSystem.getHeartRegenProgress().threshold}</span>
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

      {!perkSystem.activePerks.some(p => p.effect === 'curse_foggy') && (
        <GameTimer timeLeft={timer.timeLeft} possiblePoints={calculateTimeBonusXP(timer.timeLeft)} progress={timer.progress} />
      )}

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

        {/* Reward breakdown / wrong banner — fixed above next button on mobile, flex-1 inline on desktop */}
        <div className="sm:static sm:flex-1 sm:min-w-0 hidden sm:block">
          <RewardComboReveal
            goldData={rewardBreakdown?.goldData}
            xpData={rewardBreakdown?.xpData}
            visible={selectedCard !== null && !gameOver}
            onComplete={handleComboComplete}
          />
          {/* Wrong answer banner */}
          {wrongData && !gameOver && !rewardBreakdown && (
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
              <span className='flex items-center gap-1'><GameIcon name='star' size={18} color='amber' /> Skip{(() => { const sc = perkSystem.activePerks.find(p => p.id === 'skip_card'); return sc && sc.value > 1 ? ` (×${sc.value})` : ''; })()}</span>
            </button>
          )}
          {perkSystem.hasPerk("sacrifice_ritual") && selectedCard === null && !gameOver && !showPrices && (
            <button
              onClick={handleSacrificeRitual}
              disabled={lives <= 1}
              className={`text-lg font-semibold text-white px-6 py-4 rounded-sm transition shadow-pixel border-2 active:scale-95
                ${lives <= 1
                  ? "bg-red-900/50 border-red-900 cursor-not-allowed opacity-50"
                  : "bg-red-700 border-red-500 hover:bg-red-600"
                }`}
              title="Press R to sacrifice (costs 1 life)"
            >
              <span className='flex items-center gap-1'><GameIcon name='drop' size={18} color='red' /> Sacrifice{sacrificeRitualActive ? ' ✓' : ''}</span>
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
                <span className='flex items-center gap-1'><GameIcon name='star' size={16} color='amber' /> Skip{(() => { const sc = perkSystem.activePerks.find(p => p.id === 'skip_card'); return sc && sc.value > 1 ? ` (×${sc.value})` : ''; })()}</span>
              </button>
            )}
            {perkSystem.hasPerk("sacrifice_ritual") && selectedCard === null && !gameOver && !showPrices && (
              <button
                onClick={handleSacrificeRitual}
                disabled={lives <= 1}
                className={`text-base font-semibold text-white px-5 py-3 rounded-sm transition shadow-pixel border-2 active:scale-95
                  ${lives <= 1
                    ? "bg-red-900/50 border-red-900 cursor-not-allowed opacity-50"
                    : "bg-red-700 border-red-500 hover:bg-red-600"
                  }`}
              >
                <span className='flex items-center gap-1'><GameIcon name='drop' size={16} color='red' /> Sacrifice{sacrificeRitualActive ? ' ✓' : ''}</span>
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

        {/* Mobile: reward breakdown + wrong banner fixed above next button */}
        {createPortal(
          <div className="sm:hidden fixed right-0 left-0 px-4 pointer-events-none z-20" style={{bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)'}}>
            <RewardComboReveal
              goldData={rewardBreakdown?.goldData}
              xpData={rewardBreakdown?.xpData}
              visible={selectedCard !== null && !gameOver}
              suppressOverlay
            />
            {wrongData && !gameOver && !rewardBreakdown && (
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
        forceRelicMode={relicMilestoneQueue[0] === true}
        relicSlotsMax={relicSlotsMax}
      />

      {/* Elite Stage Relic Drop — zeigt nach Elite-Stage-Completion */}
      <LevelUpModal
        show={eliteRelicPending && !gameOver && !level.showLevelUp}
        newLevel={level.level}
        activeRelics={relicSystem.activeRelics}
        activePerks={perkSystem.activePerks}
        activeSynergies={synergyEngine.activeSynergies}
        maxSynergySlots={synergyEngine.maxSynergySlots}
        onSelect={(pick) => {
          // Nur Relic-Auswahl — kein dismissLevelUp (kein pending level-up)
          if (pick.category === 'relic') {
            if (relicSystem.activeRelics.length >= relicSlotsMax) {
              const relicCost = relicSystem.hasRelic('hoarder') ? 10 : 25;
              if (!gold.spendGold(relicCost)) return;
            }
            relicSystem.addRelic(pick);
            achievements.trackRelicCollected();
          }
          setEliteRelicPending(false);
        }}
        onSkip={() => setEliteRelicPending(false)}
        gold={gold.gold}
        rerollKey={0}
        forceRelicMode={true}
        relicSlotsMax={relicSlotsMax}
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

      <AnimatePresence>
        {runComplete && !gameOver && (
          <RunCompleteModal
            gold={gold.gold}
            xp={level.xp}
            level={level.level}
            onEndRun={() => {
              setRunComplete(false);
              setGameOver(true);
              setMessage('Run Complete! You defeated the Boss!');
              savedRun.clearRun();
              if (bossDefeated && metaProgression) {
                const crystalsEarned = ascension.getAscensionCrystalBonus(5);
                metaProgression.addCrystals(crystalsEarned);
                // Nächste Ascension-Stufe freischalten
                ascension.unlockNextLevel();
              }
            }}
            onContinue={() => {
              setRunComplete(false);
              setEndlessDifficulty(prev => prev + 1);
              mapSystem.reset();
              mapSystem.generateMap(ascension.getModifiers());
            }}
          />
        )}
      </AnimatePresence>

      <ReplacePerkModal
        show={Boolean(perkReplacementState)}
        pendingPerk={perkReplacementState?.perk ?? null}
        replaceablePerks={perkReplacementState?.replaceablePerks ?? []}
        onReplace={(targetId) => {
          perkReplacementState?.onConfirm?.(targetId);
          setPerkReplacementState(null);
        }}
        onCancel={() => setPerkReplacementState(null)}
      />

      <PerkSelectionModal
        perks={perkSystem.availablePerks}
        onSelect={handlePerkSelect}
        show={perkSystem.showPerkSelection}
        hasDoubleDip={relicSystem.hasRelic('double_dip')}
        onSkip={handlePerkSkip}
        onReroll={handlePerkReroll}
        lives={lives}
        passiveSlotInfo={perkSystem.passiveSlotInfo}
        utilitySlotInfo={perkSystem.utilitySlotInfo}
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
            nodeType={mapSystem.map?.currentNodeType}
            onContinue={() => {
              stageCorrectRef.current = 0;
              // Auto-save before dismissing
              savedRun.saveRun(buildSavePayload());
              // Checkpoint speichern
              if (!user?.guest) {
                const runSummary = runLogger.getRunSummary(synergyEngine.activeSynergies);
                saveStageCheckpoint({
                  client_session_id: runSummary.client_session_id,
                  stages_cleared:    mapSystem.currentStage,
                  node_path:         mapSystem.getChosenPathSoFar(),
                  score_per_stage:   stageScoreRef.current,
                  current_score:     gold.totalEarnedGoldRef.current,
                  current_level:     level.level,
                  perks:             runSummary.perks,
                  relics:            runSummary.relics,
                  synergies:         runSummary.synergies,
                });
              }
              // Elite/MiniBoss Stage Relic-Drop: vor dismissStageComplete setzen
              if (mapSystem.map?.currentNodeType === NODE_TYPES.ELITE ||
                  mapSystem.map?.currentNodeType === NODE_TYPES.MINI_BOSS) {
                setEliteRelicPending(true);
              }
              // Bounty Node: Ziel prüfen und Belohnung vergeben
              if (activeBountyRef.current) {
                const bountyWon = checkBountyGoalWin(activeBountyRef.current, {
                  correct: bountyCorrectRef.current,
                  wrong: bountyWrongRef.current,
                  maxStreak: bountyMaxStreakRef.current,
                  stageGold: bountyStageGoldRef.current,
                  perfectFirst5: bountyPerfectFirst5Ref.current,
                });
                if (bountyWon) {
                  gold.addGold(activeBountyRef.current.goldReward);
                  const scholarMult = synergyEngine.getSynergyValue('reduced_xp_threshold') ?? 1;
                  level.addXP(activeBountyRef.current.xpReward, scholarMult);
                  // Freier Perk nach dismissStageComplete (perkSystem.showPerkSelection zeigt Modal)
                  // Handled after dismiss below
                }
                const _bountyWonForPerk = bountyWon;
                activeBountyRef.current = null;
                setActiveBounty(null);
                setBountyProgress({ correct: 0, wrong: 0, maxStreak: 0, stageGold: 0, perfectFirst5: 0 });
                // Boss defeated
                if (mapSystem.currentStage >= TOTAL_STAGES) {
                  setBossDefeated(true);
                }
                mapSystem.dismissStageComplete();
                if (_bountyWonForPerk) {
                  const ascMods = ascension.getModifiers();
                  perkSystem.triggerPerkSelection(ascMods.perkChoices ?? 3);
                }
                // Nach Boss-Stage: Run-Complete-Modal anzeigen statt Map
                if (mapSystem.currentStage >= TOTAL_STAGES) {
                  setRunComplete(true);
                }
                return;
              }
              // Boss defeated
              if (mapSystem.currentStage >= TOTAL_STAGES) {
                setBossDefeated(true);
              }
              mapSystem.dismissStageComplete();
              // Nach Boss-Stage: Run-Complete-Modal anzeigen statt Map
              if (mapSystem.currentStage >= TOTAL_STAGES) {
                setRunComplete(true);
              }
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
            level={level.level}
            xp={level.xp}
            xpToNextLevel={level.xpToNextLevel}
            lives={lives}
            onChooseNode={(optIdx) => mapSystem.chooseNode(optIdx)}
            onExchange={handleExchangeComplete}
            onClose={mapSystem.mapViewOnly ? mapSystem.closeMap : undefined}
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
            perkSlotInfo={perkSystem.passiveSlotInfo}
            utilitySlotInfo={perkSystem.utilitySlotInfo}
            canOfferPerk={() => true}
            relicSlotsMax={relicSlotsMax}
            canBuyRelicSlot={relicSlotsMax < 7}
            onClose={handleShopComplete}
            onBuyRelic={handleShopBuyRelic}
            onBuyPerk={handleShopBuyPerk}
            onHeal={handleShopHeal}
            onUpgradePerk={handleShopUpgradePerk}
            onBuySynergySlot={handleShopBuySynergySlot}
            onBuyPerkSlot={handleShopBuyPerkSlot}
            onBuyUtilitySlot={handleShopBuyUtilitySlot}
            onBuyRelicSlot={handleBuyRelicSlot}
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
            onSkip={mapSystem.completeRest}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapSystem.showCurse && !gameOver && (
          <CurseScreen
            gold={gold.gold}
            onTake={handleCurseTake}
            onSkip={handleCurseSkip}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapSystem.showExchange && !gameOver && (
          <ExchangeScreen
            gold={gold.gold}
            level={level.level}
            xp={level.xp}
            xpToNextLevel={level.xpToNextLevel}
            onExchange={handleExchangeComplete}
            onComplete={mapSystem.completeExchange}
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
          score={gold.totalEarnedGold}
          level={level.level}
          relics={relicSystem.activeRelics}
          synergies={synergyEngine.activeSynergies}
          bestComboMultiplier={bestComboMultiplierRef.current}
        >
          {user?.guest && showRegister && (
            <RegisterWithScore
              score={user?.highscore ?? gold.totalEarnedGold}
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
          score={gold.totalEarnedGold}
          currentRound={currentRound}
          setCurrentRound={setCurrentRound}
          applyPerkEffects={applyGoldEffects}
          timer={timer}
          cardLoader={cardLoader}
          onCurseTake={handleCurseTake}
        />
      )}
    </>
  );
}
