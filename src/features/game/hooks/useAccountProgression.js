import { useState, useCallback, useRef } from 'react';
import {
  accountLevelFromXp,
  accountXpForRun,
  getRewardForLevel,
  dailyLoginRewardForStreak,
  DAILY_CHALLENGE_CRYSTALS,
  legacySeedXp,
} from '../constants/accountProgressionDefinitions';

const ACCOUNT_KEY = 'mtg_account_progression';
const ASCENSION_KEY = 'mtg_ascension_level';
const ACHIEVEMENTS_KEY = 'magic_price_duel_achievements';

// Lokales Datum als 'YYYY-MM-DD' (en-CA liefert genau dieses Format)
const todayString = () => new Date().toLocaleDateString('en-CA');

const isYesterday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA') === dateStr;
};

function defaultState() {
  return {
    version: 1,
    totalXp: 0,
    lastRewardedLevel: 1,
    stats: { runsPlayed: 0, bossWins: 0, totalStagesCleared: 0, highestAscensionWin: 0 },
    discovered: { synergies: [], combos: [] },
    seenUnlocks: [],
    dailyLogin: { lastClaimDate: null, streak: 0 },
    dailyChallenge: { lastRewardDate: null },
    migratedFrom: null,
  };
}

// Bestandsspieler-Seed: Ascension + Achievements → Start-XP, damit niemand
// bekannten Content neu freispielen muss. Läuft nur wenn der Key fehlt.
function seedFromLegacy(state) {
  let ascensionLevel = 0;
  let achievementCount = 0;
  try {
    ascensionLevel = parseInt(localStorage.getItem(ASCENSION_KEY) ?? '0', 10) || 0;
  } catch { /* ignore */ }
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    achievementCount = Array.isArray(parsed) ? parsed.length : 0;
  } catch { /* ignore */ }

  if (ascensionLevel <= 0 && achievementCount <= 0) return state;

  const totalXp = legacySeedXp(ascensionLevel, achievementCount);
  const { level } = accountLevelFromXp(totalXp);
  return {
    ...state,
    totalXp,
    // Reward-Level mitziehen: geseedete Level zahlen keine rückwirkenden Crystals aus,
    // dafür startet der Track sauber ab dem echten Stand.
    lastRewardedLevel: level,
    stats: { ...state.stats, bossWins: ascensionLevel, highestAscensionWin: Math.max(0, ascensionLevel - 1) },
    migratedFrom: 'legacy',
  };
}

function loadAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Fehlende Felder defensiv auffüllen (ältere Versionen)
      const base = defaultState();
      return {
        ...base,
        ...parsed,
        stats: { ...base.stats, ...(parsed.stats ?? {}) },
        discovered: { ...base.discovered, ...(parsed.discovered ?? {}) },
        dailyLogin: { ...base.dailyLogin, ...(parsed.dailyLogin ?? {}) },
        dailyChallenge: { ...base.dailyChallenge, ...(parsed.dailyChallenge ?? {}) },
      };
    }
    const seeded = seedFromLegacy(defaultState());
    saveAccount(seeded);
    return seeded;
  } catch {
    return defaultState();
  }
}

function saveAccount(data) {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

export function useAccountProgression({ addCrystals } = {}) {
  const [accountState, setAccountState] = useState(() => loadAccount());
  // Ref-Mirror für synchronen Zugriff — Mutationen laufen über commit(),
  // damit Seiteneffekte (addCrystals) nie in einem State-Updater stecken.
  const stateRef = useRef(accountState);

  const commit = useCallback((next) => {
    stateRef.current = next;
    saveAccount(next);
    setAccountState(next);
  }, []);

  const { level, xpIntoLevel, xpForLevel } = accountLevelFromXp(accountState.totalXp);

  // Run-Ende: XP gutschreiben, überschrittene Level belohnen, Stats fortschreiben.
  // Rückgabe: { xpGained, levelUps: [{ level, crystals, unlocks }] } für die UI.
  const grantRunRewards = useCallback(({ inRunXp = 0, stagesCleared = 0, bossWin = false, ascensionLevel = 0 }) => {
    const prev = stateRef.current;
    const xpGained = accountXpForRun({ inRunXp, stagesCleared, bossWin, ascensionLevel });
    const newTotalXp = prev.totalXp + xpGained;
    const newLevel = accountLevelFromXp(newTotalXp).level;

    const levelUps = [];
    let totalCrystals = 0;
    for (let l = prev.lastRewardedLevel + 1; l <= newLevel; l++) {
      const reward = getRewardForLevel(l);
      totalCrystals += reward.crystals;
      levelUps.push({ level: l, crystals: reward.crystals, unlocks: reward.unlocks });
    }
    if (totalCrystals > 0 && addCrystals) addCrystals(totalCrystals);
    if (levelUps.length > 0) {
      console.log(`[Account] +${xpGained} XP (level ${prev.lastRewardedLevel} -> ${newLevel})`);
    }

    commit({
      ...prev,
      totalXp: newTotalXp,
      lastRewardedLevel: Math.max(prev.lastRewardedLevel, newLevel),
      stats: {
        ...prev.stats,
        runsPlayed: prev.stats.runsPlayed + 1,
        bossWins: prev.stats.bossWins + (bossWin ? 1 : 0),
        totalStagesCleared: prev.stats.totalStagesCleared + stagesCleared,
        highestAscensionWin: bossWin
          ? Math.max(prev.stats.highestAscensionWin, ascensionLevel)
          : prev.stats.highestAscensionWin,
      },
    });

    return { xpGained, levelUps };
  }, [addCrystals, commit]);

  // Daily-Login: einmal täglich Crystals; Streak zählt nur bei lückenlosen Tagen weiter.
  // Rückgabe null wenn heute schon geclaimt, sonst { streak, crystals }.
  const claimDailyLogin = useCallback(() => {
    const prev = stateRef.current;
    const today = todayString();
    if (prev.dailyLogin.lastClaimDate === today) return null;
    const streak = isYesterday(prev.dailyLogin.lastClaimDate) ? prev.dailyLogin.streak + 1 : 1;
    const crystals = dailyLoginRewardForStreak(streak);
    if (addCrystals) addCrystals(crystals);
    commit({ ...prev, dailyLogin: { lastClaimDate: today, streak } });
    return { streak, crystals };
  }, [addCrystals, commit]);

  // Daily Challenge: einmal täglich Crystals nach Abschluss.
  const claimDailyChallengeReward = useCallback(() => {
    const prev = stateRef.current;
    const today = todayString();
    if (prev.dailyChallenge.lastRewardDate === today) return null;
    if (addCrystals) addCrystals(DAILY_CHALLENGE_CRYSTALS);
    commit({ ...prev, dailyChallenge: { lastRewardDate: today } });
    return { crystals: DAILY_CHALLENGE_CRYSTALS };
  }, [addCrystals, commit]);

  const markUnlocksSeen = useCallback((keys) => {
    const prev = stateRef.current;
    if (!keys?.length) return;
    const missing = keys.filter(k => !prev.seenUnlocks.includes(k));
    if (missing.length === 0) return;
    commit({ ...prev, seenUnlocks: [...prev.seenUnlocks, ...missing] });
  }, [commit]);

  const markSynergyDiscovered = useCallback((id) => {
    const prev = stateRef.current;
    if (prev.discovered.synergies.includes(id)) return;
    commit({ ...prev, discovered: { ...prev.discovered, synergies: [...prev.discovered.synergies, id] } });
  }, [commit]);

  const markComboDiscovered = useCallback((id) => {
    const prev = stateRef.current;
    if (prev.discovered.combos.includes(id)) return;
    commit({ ...prev, discovered: { ...prev.discovered, combos: [...prev.discovered.combos, id] } });
  }, [commit]);

  // Debug-Helper (DebugPanel): direkter XP-Grant ohne Run-Stats
  const debugAddXp = useCallback((amount) => {
    const prev = stateRef.current;
    commit({ ...prev, totalXp: Math.max(0, prev.totalXp + amount) });
  }, [commit]);

  const debugResetDaily = useCallback(() => {
    const prev = stateRef.current;
    commit({
      ...prev,
      dailyLogin: { ...prev.dailyLogin, lastClaimDate: null },
      dailyChallenge: { lastRewardDate: null },
    });
  }, [commit]);

  return {
    totalXp: accountState.totalXp,
    level,
    xpIntoLevel,
    xpForLevel,
    stats: accountState.stats,
    discovered: accountState.discovered,
    seenUnlocks: accountState.seenUnlocks,
    dailyLogin: accountState.dailyLogin,
    dailyChallenge: accountState.dailyChallenge,
    migratedFrom: accountState.migratedFrom,
    grantRunRewards,
    claimDailyLogin,
    claimDailyChallengeReward,
    markUnlocksSeen,
    markSynergyDiscovered,
    markComboDiscovered,
    debugAddXp,
    debugResetDaily,
  };
}
