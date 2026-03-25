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
import { saveGameSession } from "../api/statsApi";
import {
  isChoiceCorrect,
  getMoreExpensiveCard,
  createErrorMessage,
  formatPrice,
} from "../utils/cardComparison";
import {
  calculateTimeBonus,
  formatScoreMessage,
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
import SynergyToast from "./SynergyToast";
import ActivePerksDisplay from "./ActivePerksDisplay";
import RegisterWithScore from "../../auth/components/RegisterWithScore";

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
  const [imagesLoaded, setImagesLoaded] = useState([false, false]);
  const [currentRound, setCurrentRound] = useState(1);
  // Roguelike State
  const [comboMultiplier, setComboMultiplier] = useState(1);   // Combo Master Relic
  const [ironWillActive, setIronWillActive] = useState(false); // Iron Will Relic
  const [nextRoundDouble, setNextRoundDouble] = useState(false); // Perfectionist Echo Relic
  const [synergyToast, setSynergyToast] = useState(null);      // aktuelle Synergy-Notification
  const bestComboMultiplierRef = useRef(1);                    // Für Game-Over Summary
  const [flashingRelics, setFlashingRelics] = useState(new Set()); // Relic-Trigger-Animation
  const [tickingRelics, setTickingRelics] = useState(new Set());  // Subtler Tick-Animation
  const [fortressRegenCount, setFortressRegenCount] = useState(0); // Fortress unabhängiger Zähler

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

  const applyPerkEffects = useCallback((basePoints, timeLeft) => {
    let finalPoints = basePoints;

    // --- Perk-Effekte ---
    const multiplier = perkSystem.getPerkValue("point_multiplier");
    if (multiplier) finalPoints *= multiplier;
    const flatBonus = perkSystem.getPerkValue("flat_bonus");
    if (flatBonus) finalPoints += flatBonus;
    const currentDuration = getTimerDuration();
    if (timeLeft >= currentDuration - 1) {
      const perfectBonus = perkSystem.getPerkValue("perfect_bonus");
      if (perfectBonus) finalPoints += perfectBonus;
    }

    // --- Relic-Effekte ---
    if (relicSystem.hasRelic('glass_cannon')) {
      finalPoints *= relicSystem.getRelicValue('glass_cannon');
    }
    if (relicSystem.hasRelic('treasure_hunter')) {
      const perkBonusOnly = finalPoints - basePoints;
      if (perkBonusOnly > 0) {
        finalPoints += perkBonusOnly * (relicSystem.getRelicValue('perk_bonus_amplifier') - 1);
      }
    }
    if (ironWillActive && relicSystem.hasRelic('iron_will')) {
      finalPoints *= relicSystem.getRelicValue('comeback_bonus');
    }
    if (comboMultiplier > 1) {
      finalPoints *= comboMultiplier;
    }

    // --- Synergy-Effekte ---
    if (synergyEngine.hasSynergy('gold_rush')) {
      finalPoints *= synergyEngine.getSynergyValue('permanent_score_mult');
    }
    if (synergyEngine.hasSynergy('berserker') && lives === 1) {
      finalPoints *= synergyEngine.getSynergyValue('low_hp_bonus');
    }

    // Level-Bonus: +1 Punkt pro Level
    finalPoints += level.level;

    // === META-RELIC EFFEKTE ===

    // Amplifier: Relic-Boni 50% stärker (wirkt auf alles was bisher multipliziert wurde)
    if (relicSystem.hasRelic('amplifier')) {
      const amplifiedExtra = (finalPoints - basePoints) * (relicSystem.getRelicValue('mult_amplifier') - 1);
      finalPoints += amplifiedExtra;
    }

    // Alchemist: Flat-Boni → Multiplikator
    if (relicSystem.hasRelic('alchemist')) {
      const totalFlat = flatBonus || 0;
      if (totalFlat > 0) {
        finalPoints *= 1 + (totalFlat * relicSystem.getRelicValue('flat_to_mult'));
      }
    }

    // Risk & Reward: weniger Restzeit = höherer Multiplikator
    if (relicSystem.hasRelic('risk_reward')) {
      const maxTime = currentDuration;
      if (maxTime > 0) {
        const timeUsed = Math.max(0, maxTime - timeLeft);
        const riskFactor = 1 + (timeUsed / maxTime) * (relicSystem.getRelicValue('time_risk_mult') - 1);
        finalPoints *= riskFactor;
      }
    }

    // Snowball: +0.1× pro gespielte Runde (× 3 mit Infinite Engine Synergy)
    if (relicSystem.hasRelic('snowball')) {
      const snowballMult = relicSystem.getRelicValue('round_scaling_mult');
      const finalMult = synergyEngine.hasSynergy('infinite_engine')
        ? snowballMult * (synergyEngine.getSynergyValue('triple_snowball') ?? 3)
        : snowballMult;
      finalPoints *= 1 + (currentRound * finalMult);
    }

    // Collector Bonus: +15 flat pro aktivem Relic
    if (relicSystem.hasRelic('collector_bonus')) {
      finalPoints += relicSystem.activeRelics.length * relicSystem.getRelicValue('per_relic_flat_bonus');
    }

    // Tag Master: +0.1× pro einzigartigen Tag
    if (relicSystem.hasRelic('tag_master')) {
      const uniqueTags = new Set();
      [...relicSystem.activeRelics, ...perkSystem.activePerks].forEach(item => {
        (item.tags || []).forEach(tag => uniqueTags.add(tag));
      });
      finalPoints *= 1 + (uniqueTags.size * relicSystem.getRelicValue('unique_tag_mult'));
    }

    // Synergy Chain: +0.25× pro aktive Synergy
    if (relicSystem.hasRelic('synergy_chain')) {
      finalPoints *= 1 + (synergyEngine.activeSynergies.length * relicSystem.getRelicValue('per_synergy_mult'));
    }

    // Perk Mastery: +0.15× pro aktiven Perk
    if (relicSystem.hasRelic('perk_mastery')) {
      finalPoints *= 1 + (perkSystem.activePerks.length * relicSystem.getRelicValue('per_perk_mult'));
    }

    // Level Power: +2% pro Level
    if (relicSystem.hasRelic('level_power')) {
      finalPoints *= 1 + (level.level * relicSystem.getRelicValue('level_scaling'));
    }

    // Overkill: Score über Threshold → überschüssige Punkte verdoppelt
    if (relicSystem.hasRelic('overkill')) {
      const threshold = relicSystem.getRelicValue('overkill_bonus');
      if (finalPoints > threshold) {
        finalPoints = threshold + (finalPoints - threshold) * 2;
      }
    }

    // Last Stand: Bei 1 Leben alle Multiplikatoren nochmal
    if (relicSystem.hasRelic('last_stand') && lives === 1) {
      finalPoints *= relicSystem.getRelicValue('last_stand_double');
    }

    // Chain Reaction: Iron Will oder Combo aktiv → +50% Bonus
    if (relicSystem.hasRelic('chain_reaction') && (ironWillActive || comboMultiplier > 1.15)) {
      finalPoints *= relicSystem.getRelicValue('chain_reaction');
    }

    // Synergy Amplifier: +10% pro aktive Synergy
    if (relicSystem.hasRelic('synergy_amp') && synergyEngine.activeSynergies.length > 0) {
      finalPoints *= 1 + (synergyEngine.activeSynergies.length * relicSystem.getRelicValue('synergy_multiplier'));
    }

    // Echo: Relic-Boni werden verdoppelt (alles über basePoints nochmal addiert)
    if (relicSystem.hasRelic('echo')) {
      finalPoints += (finalPoints - basePoints);
    }

    return Math.floor(finalPoints);
  }, [perkSystem, getTimerDuration, relicSystem, ironWillActive, comboMultiplier, synergyEngine, lives, level, currentRound]);

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
        const timeBonus = calculateTimeBonus(timer.timeLeft);
        const customThreshold = perkSystem.getPerkValue("streak_threshold");
        let streakBonus = customThreshold
          ? streak.streak >= customThreshold
            ? streak.calculateStreakBonus()
            : 0
          : streak.calculateStreakBonus();

        // Hot Streak Synergy: exponentieller Bonus — jeder 5er-Block verdoppelt den vorherigen
        if (synergyEngine.hasSynergy('hot_streak') && streakBonus > 0) {
          const blocks = Math.floor(streak.streak / SCORE_CONFIG.STREAK_BONUS_DIVISOR);
          streakBonus = SCORE_CONFIG.STREAK_BONUS_POINTS * (Math.pow(2, blocks) - 1);
        }

        const basePoints = timeBonus + streakBonus;
        const hadDoublePoints = !!perkSystem.getPerkValue("point_multiplier");
        let totalPoints = applyPerkEffects(basePoints, timer.timeLeft);

        // Perfectionist Echo: nächste-Runde-Verdopplung anwenden
        if (nextRoundDouble) {
          totalPoints *= relicSystem.getRelicValue('perfect_next_double') ?? 2;
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
        // QUICK_LEARNER Relic: +50% XP für Antworten unter 3 Sekunden
        if (relicSystem.hasRelic('quick_learner') && timer.timeLeft > currentDuration - 3) {
          xpGained = Math.floor(xpGained * relicSystem.getRelicValue('speed_xp_bonus'));
          flashRelic('quick_learner');
        }
        // Berserker Synergy: 2x XP bei 1 Leben
        if (synergyEngine.hasSynergy('berserker') && lives === 1) {
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
            totalPoints += overflow * (relicSystem.getRelicValue('xp_to_score') ?? 2);
            flashRelic('xp_converter');
          }
        }

        // Jackpot Synergy: jede 10. richtige Antwort → ×10 Score
        if (synergyEngine.hasSynergy('jackpot') && correctCountRef.current % 10 === 0) {
          totalPoints *= synergyEngine.getSynergyValue('jackpot') ?? 10;
        }

        // Perfectionist Echo trigger: perfekte Antwort setzt nextRoundDouble
        if (relicSystem.hasRelic('perfectionist_echo') && timer.timeLeft >= getTimerDuration() - 1) {
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
        if (relicSystem.hasRelic('last_stand') && lives === 1) flashRelic('last_stand');
        if (relicSystem.hasRelic('chain_reaction') && (ironWillActive || comboMultiplier > 1.15)) flashRelic('chain_reaction');
        if (relicSystem.hasRelic('synergy_amp') && synergyEngine.activeSynergies.length > 0) tickRelic('synergy_amp');

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

        let scoreMessage = formatScoreMessage(timeBonus, streakBonus);
        if (totalPoints > basePoints) {
          scoreMessage += ` 🎁 Perk Bonus: +${totalPoints - basePoints}`;
        }
        // Heart Regeneration Perk — eigener Zähler in usePerkSystem
        const regenResult = perkSystem.trackCorrectAnswer();
        if (regenResult.shouldRegenerate) {
          setLives(prev => Math.min(prev + 1, GAME_CONFIG.INITIAL_LIVES));
          scoreMessage += ` 💖 Life regenerated!`;
          flashRelic('heart_regeneration');
        } else if (perkSystem.hasPerk('heart_regeneration')) {
          tickRelic('heart_regeneration');
        }

        // Fortress Synergy — unabhängiger Zähler
        if (synergyEngine.hasSynergy('fortress')) {
          const fortressThreshold = synergyEngine.getSynergyValue('improved_regen') ?? 8;
          setFortressRegenCount(prev => {
            const next = prev + 1;
            if (next >= fortressThreshold) {
              setLives(l => Math.min(l + 1, GAME_CONFIG.INITIAL_LIVES));
              scoreMessage += ` 🏰 Fortress Life!`;
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

          const correctCard = getMoreExpensiveCard(card1, card2);
          setMessage(createErrorMessage(correctCard));

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
            }
            if (onGameOver) onGameOver(score);
            return;
          }
        }
      }

      perkSystem.decrementPerkDurations(relicSystem.hasRelic('perk_recycler'));
    },
    [cardLoader.currentPair, timer, streak, score, lives, user, setScore, setUser, refreshUser, perkSystem, achievements, applyPerkEffects, getTimerDuration, onGameOver, currentRound, initialCards, level, relicSystem, synergyEngine, ironWillActive, comboMultiplier, nextRoundDouble, flashRelic, tickRelic]
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
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    achievements.trackRound(nextRound);

    // Card Counter Relic: alle 10 Runden +1 Leben (max 5)
    const cardCounterInterval = relicSystem.getRelicValue('round_heal');
    if (cardCounterInterval) {
      if (nextRound % cardCounterInterval === 0) {
        setLives(prev => Math.min(prev + 1, GAME_CONFIG.INITIAL_LIVES));
        flashRelic('card_counter');
      } else {
        tickRelic('card_counter');
      }
    }

    if (nextRound > 0 && nextRound % 5 === 0) {
      perkSystem.triggerPerkSelection();
    } else {
      cardLoader.setNextPair();
    }
  }, [currentRound, achievements, perkSystem, cardLoader, relicSystem, setLives, flashRelic, tickRelic]);

  const handlePerkSelect = useCallback(async (perk, keepOpen = false) => {
    console.log('[Perk]', perk.name, `(${perk.id})`, perk.tags ?? []);
    const hasEternalFlame = relicSystem.hasRelic('eternal_flame');
    const hasUpgradeMaster = relicSystem.hasRelic('upgrade_master');

    if (perk.type === 'filter') {
      const currentFilterPerks = perkSystem.getActiveFilterPerks();
      const otherFilterPerks = currentFilterPerks.filter(p => p.filterType !== perk.filterType);
      const allFilterPerks = [...otherFilterPerks, perk];
      const filters = {};
      allFilterPerks.forEach(filterPerk => {
        if (filterPerk.filterType === 'color') filters.color = filterPerk.value;
        else if (filterPerk.filterType === 'cmc') filters.cmc = filterPerk.value;
        else if (filterPerk.filterType === 'border_color') filters.border_color = filterPerk.value;
        else if (filterPerk.filterType === 'rarity') filters.rarity = filterPerk.value;
      });
      const newCards = await cardLoader.preloadCards(filters);
      perkSystem.selectPerk(perk, { keepOpen, hasEternalFlame, hasUpgradeMaster });
      achievements.trackPerkCollected();
      await cardLoader.setNextPair(false, newCards);
    } else {
      perkSystem.selectPerk(perk, { keepOpen, hasEternalFlame, hasUpgradeMaster });
      achievements.trackPerkCollected();
      if (!keepOpen) {
        await cardLoader.setNextPair();
      }
    }
  }, [perkSystem, achievements, cardLoader, relicSystem]);

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
      relicSystem.addRelic(pick);
      achievements.trackRelicCollected();
      if (pick.effect === 'glass_cannon') setLives(1);
    } else if (pick.category === 'item') {
      perkSystem.selectPerk(pick, { hasEternalFlame, hasUpgradeMaster });
      achievements.trackPerkCollected();
    } else if (pick.category === 'upgrade') {
      perkSystem.selectPerk(pick, { hasEternalFlame, hasUpgradeMaster });
    }
    level.dismissLevelUp();
  }, [relicSystem, perkSystem, level, achievements, setLives]);

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
    setScore(0);
    setMessage("");
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
    setFortressRegenCount(0);
    bestComboMultiplierRef.current = 1;
    achievements.resetGameStats();

    await cardLoader.preloadCards();
    await cardLoader.setNextPair();
  }, [setScore, streak, timer, cardLoader, perkSystem, level, relicSystem, synergyEngine, achievements]);

  const handleImageLoad = useCallback((index) => {
    setImagesLoaded((prev) => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  }, []);

  const showPriceHint = perkSystem.hasPerk("price_hint");
  const showAverage = perkSystem.hasPerk("statistics");

  const getPriceRange = useCallback(() => {
    if (!showPriceHint || cardLoader.currentPair.length < 2) return null;
    const prices = cardLoader.currentPair.map((c) => parseFloat(c.prices.eur));
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [showPriceHint, cardLoader.currentPair]);

  const getAveragePrice = useCallback(() => {
    if (!showAverage || cardLoader.currentPair.length < 2) return null;
    const prices = cardLoader.currentPair.map((c) => parseFloat(c.prices.eur));
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }, [showAverage, cardLoader.currentPair]);

  // Get active filter info for display
  const getActiveFilterInfo = useCallback(() => {
    const filterPerks = perkSystem.getActiveFilterPerks();
    if (filterPerks.length === 0) return null;

    return filterPerks.map(perk => ({
      name: perk.name,
      icon: perk.icon,
      description: perk.description
    }));
  }, [perkSystem]);

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
      />

      <StreakDisplay
        streak={streak.streak}
        bestStreak={streak.bestStreak}
        color={streak.getStreakColor()}
        streakBonus={streak.calculateStreakBonus()}
      />

      {/* Active Filter Display */}
      {getActiveFilterInfo() && (
        <div className="w-full max-w-xl mb-1 sm:mb-4">
          {getActiveFilterInfo().map((filter, index) => (
            <div key={index} className="bg-indigo-500/20 border border-indigo-400 rounded-lg px-2 py-1 sm:p-2 mb-1 sm:mb-2">
              <span className="text-indigo-200 text-xs sm:text-sm font-semibold">
                {filter.icon} {filter.name}: {filter.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {(showPriceHint || showAverage) && (
        <div className="w-full max-w-xl mb-1 sm:mb-4">
          {showPriceHint && getPriceRange() && (
            <div className="bg-blue-500/20 border border-blue-400 rounded-lg px-2 py-1 sm:p-2 mb-1 sm:mb-2">
              <span className="text-blue-200 text-xs sm:text-sm font-semibold">
                🔮 Price Range: {formatPrice(getPriceRange().min)} - {formatPrice(getPriceRange().max)}
              </span>
            </div>
          )}
          {showAverage && getAveragePrice() && (
            <div className="bg-green-500/20 border border-green-400 rounded-lg px-2 py-1 sm:p-2">
              <span className="text-green-200 text-xs sm:text-sm font-semibold">📊 Average: {formatPrice(getAveragePrice())}</span>
            </div>
          )}
        </div>
      )}

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

      <div className="sm:mt-6 mt-auto flex gap-4 text-lg min-h-[50px] sm:min-h-[80px] items-center pb-1 sm:pb-2">
        {perkSystem.hasPerk("skip_card") && selectedCard === null && !gameOver && !showPrices && (
          <button
            onClick={handleSkipCard}
            className="bg-yellow-500 text-lg font-semibold hover:bg-yellow-600 text-white px-6 py-4 rounded transition shadow-lg hover:shadow-xl"
            title="Press S to skip"
          >
            ⭐ Skip
          </button>
        )}

        {selectedCard !== null && !gameOver && (
          <button
            onClick={handleNextPair}
            disabled={perkSystem.showPerkSelection || level.showLevelUp}
            className={`text-lg sm:text-2xl w-full sm:w-auto sm:min-w-[250px] font-semibold text-white px-4 py-3 sm:px-6 sm:py-6 rounded transition ${(perkSystem.showPerkSelection || level.showLevelUp) ? "bg-amber-600/50 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-500"
              }`}
          >
            Next
          </button>
        )}
      </div>

      <LevelUpModal
        show={level.showLevelUp}
        newLevel={level.level}
        activeRelics={relicSystem.activeRelics}
        activePerks={perkSystem.activePerks}
        activeSynergies={synergyEngine.activeSynergies}
        onSelect={handleLevelUpSelect}
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

      <div className="w-full min-h-[3.5rem] sm:min-h-0 pb-8 sm:pb-0 flex items-start sm:justify-center">
        {message && !gameOver && <p className="text-base sm:text-xl transition-all duration-500 sm:text-center">{message}</p>}
      </div>
    </>
  );
}