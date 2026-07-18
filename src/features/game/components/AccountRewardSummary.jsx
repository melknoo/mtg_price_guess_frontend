import React from 'react';
import { motion } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';
import { ITEM_ICONS } from '../../../shared/constants/itemIconMap';
import { PERKS } from '../constants/perkDefinitions';
import { RELICS } from '../constants/relicDefinitions';

// Löst einen Unlock-Key ('perk:gambler' / 'relic:echo') zu { name, itemId, typeLabel } auf
function resolveUnlockKey(key) {
  const [type, id] = (key ?? '').split(':');
  if (type === 'perk') {
    const perk = Object.values(PERKS).find(p => p.id === id);
    return { name: perk?.name ?? id, itemId: id, typeLabel: 'Perk' };
  }
  if (type === 'relic') {
    const relic = Object.values(RELICS).find(r => r.id === id);
    return { name: relic?.name ?? id, itemId: id, typeLabel: 'Relic' };
  }
  return { name: id ?? key, itemId: null, typeLabel: '' };
}

// Run-Ende-Anzeige: Account-XP-Gewinn, Level-Ups (Crystals) und freigeschaltete Items.
// accountReward: { xpGained, levelUps: [{ level, crystals, unlocks }] } aus grantRunRewards
// accountProgression: Hook-Objekt für aktuellen Level-/XP-Stand nach dem Grant
export default function AccountRewardSummary({ accountReward, accountProgression }) {
  if (!accountReward || !accountProgression) return null;

  const { xpGained, levelUps } = accountReward;
  const { level, xpIntoLevel, xpForLevel } = accountProgression;
  const barPct = Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100));
  const allUnlocks = levelUps.flatMap(lu => lu.unlocks ?? []);

  return (
    <div className="w-full bg-[#111827] border-2 border-[#2d3a5c]/60 rounded-sm p-3 mb-4 text-left">
      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Account Progress</div>

      {/* XP-Gewinn + aktueller Level-Fortschritt */}
      <div className="flex items-center gap-2 mb-1.5">
        <GameIcon name="star" size={14} color="purple" />
        <span className="text-purple-300 font-bold text-sm">+{xpGained} Account XP</span>
        <span className="text-xs text-gray-400 ml-auto">Level {level}</span>
      </div>
      <div className="w-full h-2 bg-[#0a0e1a] border border-[#2d3a5c] rounded-sm overflow-hidden mb-1">
        <motion.div
          className="h-full bg-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="text-[10px] text-gray-500 mb-1">{xpIntoLevel} / {xpForLevel} XP</div>

      {/* Level-Up-Burst */}
      {levelUps.length > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.4 }}
          className="mt-2 bg-amber-500/15 border-2 border-amber-400/50 rounded-sm px-3 py-2"
        >
          <div className="text-amber-300 font-bold text-sm inline-flex items-center gap-1.5">
            <GameIcon name="star" size={15} color="amber" />
            Account Level {levelUps[levelUps.length - 1].level}!
          </div>
          {levelUps.some(lu => lu.crystals > 0) && (
            <div className="text-purple-200 text-xs mt-1 inline-flex items-center gap-1">
              <GameIcon name="crystal" size={13} color="purple" />
              +{levelUps.reduce((sum, lu) => sum + (lu.crystals ?? 0), 0)} Crystals
            </div>
          )}
        </motion.div>
      )}

      {/* Unlock-Reveals */}
      {allUnlocks.length > 0 && (
        <div className="mt-2 space-y-1">
          {allUnlocks.map((key, i) => {
            const { name, itemId, typeLabel } = resolveUnlockKey(key);
            const iconDef = itemId ? ITEM_ICONS[itemId] : null;
            return (
              <motion.div
                key={key}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.15 }}
                className="flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/40 rounded-sm px-2 py-1"
              >
                {iconDef
                  ? <GameIcon name={iconDef.icon} color={iconDef.color} size={14} />
                  : <GameIcon name="unlock" size={14} color="amber" />}
                <span className="text-indigo-200 text-xs">
                  New {typeLabel} unlocked: <span className="font-semibold text-white">{name}</span>
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
