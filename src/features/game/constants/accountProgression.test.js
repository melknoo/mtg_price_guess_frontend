import {
  accountLevelFromXp,
  xpToNextAccountLevel,
  accountXpForRun,
  getRewardForLevel,
  ACCOUNT_LEVEL_REWARDS,
  dailyLoginRewardForStreak,
  DAILY_LOGIN_REWARDS,
  legacySeedXp,
} from './accountProgressionDefinitions';
import { isConditionMet, computeLockedKeys, UNLOCKS } from './unlockDefinitions';
import { PERKS } from './perkDefinitions';
import { RELICS } from './relicDefinitions';
import { getAllAchievements } from './achievementDefinitions';

describe('accountLevelFromXp', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(accountLevelFromXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForLevel: 100 });
  });

  it('levels up exactly at the threshold', () => {
    expect(accountLevelFromXp(99).level).toBe(1);
    expect(accountLevelFromXp(100).level).toBe(2);
    expect(accountLevelFromXp(100).xpIntoLevel).toBe(0);
  });

  it('handles multi-level jumps', () => {
    // Level 1→2: 100, 2→3: 125, 3→4: 150 → 375 gesamt für Level 4
    const r = accountLevelFromXp(375);
    expect(r.level).toBe(4);
    expect(r.xpIntoLevel).toBe(0);
    expect(r.xpForLevel).toBe(xpToNextAccountLevel(4));
  });

  it('is defensive against negative/undefined input', () => {
    expect(accountLevelFromXp(-50).level).toBe(1);
    expect(accountLevelFromXp(undefined).level).toBe(1);
  });
});

describe('accountXpForRun', () => {
  it('gives XP even for a stage-1 death', () => {
    expect(accountXpForRun({ inRunXp: 100, stagesCleared: 0, bossWin: false })).toBe(10);
  });

  it('adds stage and boss bonuses', () => {
    // 10% von 2000 + 8*10 + (100 + 3*15) = 200 + 80 + 145 = 425
    expect(accountXpForRun({ inRunXp: 2000, stagesCleared: 8, bossWin: true, ascensionLevel: 3 })).toBe(425);
  });

  it('gives no boss bonus without bossWin', () => {
    expect(accountXpForRun({ inRunXp: 0, stagesCleared: 4, bossWin: false, ascensionLevel: 5 })).toBe(40);
  });
});

describe('getRewardForLevel', () => {
  it('uses the explicit reward table where defined', () => {
    expect(getRewardForLevel(2)).toEqual({ crystals: 5, unlocks: ['perk:gambler'] });
  });

  it('falls back to the default formula, capped at 15', () => {
    expect(getRewardForLevel(17)).toEqual({ crystals: 3 + Math.floor(17 / 2), unlocks: [] });
    expect(getRewardForLevel(99).crystals).toBe(15);
  });

  it('every unlock key in the reward track exists in UNLOCKS', () => {
    Object.values(ACCOUNT_LEVEL_REWARDS).forEach(({ unlocks = [] }) => {
      unlocks.forEach(key => expect(UNLOCKS[key]).toBeDefined());
    });
  });
});

describe('dailyLoginRewardForStreak', () => {
  it('escalates and caps', () => {
    expect(dailyLoginRewardForStreak(1)).toBe(DAILY_LOGIN_REWARDS[0]);
    expect(dailyLoginRewardForStreak(7)).toBe(DAILY_LOGIN_REWARDS[6]);
    expect(dailyLoginRewardForStreak(30)).toBe(DAILY_LOGIN_REWARDS[6]);
  });
});

describe('legacySeedXp', () => {
  it('seeds veterans into the early track', () => {
    // Ascension 4 + 20 Achievements = 800 + 500 = 1300 XP
    const xp = legacySeedXp(4, 20);
    expect(xp).toBe(1300);
    expect(accountLevelFromXp(xp).level).toBeGreaterThanOrEqual(8);
  });
});

describe('isConditionMet', () => {
  const ctx = {
    accountLevel: 5,
    stats: { bossWins: 2, highestAscensionWin: 1, totalStagesCleared: 12, runsPlayed: 9 },
    unlockedAchievementIds: new Set(['streak_10']),
  };

  it('evaluates account_level', () => {
    expect(isConditionMet({ type: 'account_level', level: 5 }, ctx)).toBe(true);
    expect(isConditionMet({ type: 'account_level', level: 6 }, ctx)).toBe(false);
  });

  it('evaluates achievement', () => {
    expect(isConditionMet({ type: 'achievement', id: 'streak_10' }, ctx)).toBe(true);
    expect(isConditionMet({ type: 'achievement', id: 'streak_20' }, ctx)).toBe(false);
  });

  it('evaluates stat thresholds', () => {
    expect(isConditionMet({ type: 'stat', stat: 'bossWins', value: 2 }, ctx)).toBe(true);
    expect(isConditionMet({ type: 'stat', stat: 'bossWins', value: 3 }, ctx)).toBe(false);
  });

  it('treats missing/unknown conditions as met (failsafe)', () => {
    expect(isConditionMet(null, ctx)).toBe(true);
    expect(isConditionMet({ type: 'unknown_type' }, ctx)).toBe(true);
  });
});

describe('computeLockedKeys', () => {
  it('locks everything gated for a fresh account', () => {
    const locked = computeLockedKeys({ accountLevel: 1, stats: {}, unlockedAchievementIds: new Set() });
    expect(locked.size).toBe(Object.keys(UNLOCKS).length);
  });

  it('unlocks everything for a maxed account', () => {
    const locked = computeLockedKeys({
      accountLevel: 99,
      stats: { bossWins: 99, highestAscensionWin: 10, totalStagesCleared: 999, runsPlayed: 999 },
      unlockedAchievementIds: new Set(getAllAchievements().map(a => a.id)),
    });
    expect(locked.size).toBe(0);
  });
});

describe('UNLOCKS table integrity', () => {
  const perkIds = new Set(Object.values(PERKS).map(p => p.id));
  const relicIds = new Set(Object.values(RELICS).map(r => r.id));
  const achievementIds = new Set(getAllAchievements().map(a => a.id));

  it('every key references an existing perk/relic', () => {
    Object.keys(UNLOCKS).forEach(key => {
      const [type, id] = key.split(':');
      if (type === 'perk') expect(perkIds.has(id)).toBe(true);
      else if (type === 'relic') expect(relicIds.has(id)).toBe(true);
      else throw new Error(`Unknown unlock type in key: ${key}`);
    });
  });

  it('every achievement condition references an existing achievement', () => {
    Object.values(UNLOCKS).forEach(({ condition }) => {
      if (condition.type === 'achievement') {
        expect(achievementIds.has(condition.id)).toBe(true);
      }
    });
  });

  it('kit starting perks are never gated', () => {
    ['slow_time', 'point_boost_extended', 'dead_mans_hand'].forEach(id => {
      expect(UNLOCKS[`perk:${id}`]).toBeUndefined();
    });
  });

  it('curse perks are never gated', () => {
    Object.values(PERKS).filter(p => p.isCurse).forEach(p => {
      expect(UNLOCKS[`perk:${p.id}`]).toBeUndefined();
    });
  });
});
