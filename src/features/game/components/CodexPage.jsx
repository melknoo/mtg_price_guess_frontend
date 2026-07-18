import React, { useState, useMemo, useEffect } from 'react';
import { RELICS } from '../constants/relicDefinitions';
import { PERKS } from '../constants/perkDefinitions';
import { SYNERGIES } from '../constants/synergyDefinitions';
import { computeLockedKeys, getUnlockHint, isGatedContent } from '../constants/unlockDefinitions';
import { useAchievementContext } from '../context/AchievementContext';
import GameIcon from '../../../shared/components/GameIcon';
import { ITEM_ICONS } from '../../../shared/constants/itemIconMap';

// ─── Rarity config ──────────────────────────────────────────────────────────
const RARITY_CFG = {
  common:    { label: 'Common',    border: 'border-gray-500/50',   text: 'text-gray-400',   glow: '', dot: 'bg-gray-400' },
  rare:      { label: 'Rare',      border: 'border-blue-500/60',   text: 'text-blue-300',   glow: 'shadow-blue-500/10', dot: 'bg-blue-400' },
  epic:      { label: 'Epic',      border: 'border-purple-500/60', text: 'text-purple-300', glow: 'shadow-purple-500/15', dot: 'bg-purple-400' },
  legendary: { label: 'Legendary', border: 'border-amber-500/60',  text: 'text-amber-300',  glow: 'shadow-amber-500/20', dot: 'bg-amber-400' },
};

// ─── Tag styles ──────────────────────────────────────────────────────────────
const TAG_CFG = {
  speed:     { bg: 'bg-blue-500/25',   text: 'text-blue-200',   label: 'speed' },
  defense:   { bg: 'bg-green-500/25',  text: 'text-green-200',  label: 'def' },
  score:     { bg: 'bg-yellow-500/25', text: 'text-yellow-200', label: 'score' },
  streak:    { bg: 'bg-orange-500/25', text: 'text-orange-200', label: 'streak' },
  xp:        { bg: 'bg-purple-500/25', text: 'text-purple-200', label: 'xp' },
  luck:      { bg: 'bg-pink-500/25',   text: 'text-pink-200',   label: 'luck' },
  fake:      { bg: 'bg-cyan-500/25',   text: 'text-cyan-200',   label: 'fake' },
  sacrifice: { bg: 'bg-red-500/25',    text: 'text-red-200',    label: 'sacr' },
};

const ALL_TAGS = Object.keys(TAG_CFG);
const ALL_RARITIES = ['common', 'rare', 'epic', 'legendary'];

// ─── Synergy difficulty → rarity ────────────────────────────────────────────
function synergyRarity(synergy) {
  const total = Object.values(synergy.requiredTags).reduce((a, b) => a + b, 0);
  if (total >= 4) return 'legendary';
  if (total >= 3) return 'epic';
  return 'rare';
}

// ─── Small tag chip ──────────────────────────────────────────────────────────
function Tag({ tag, small }) {
  const s = TAG_CFG[tag] ?? { bg: 'bg-gray-500/25', text: 'text-gray-300', label: tag };
  return (
    <span className={`${s.bg} ${s.text} rounded px-1.5 py-0.5 ${small ? 'text-[9px]' : 'text-[10px]'} font-medium leading-none`}>
      {s.label}
    </span>
  );
}

// ─── Rarity badge ────────────────────────────────────────────────────────────
function RarityBadge({ rarity }) {
  const r = RARITY_CFG[rarity] ?? RARITY_CFG.common;
  return (
    <span className={`${r.text} text-[10px] font-bold uppercase tracking-wide`}>
      {r.label}
    </span>
  );
}

// ─── Lock overlay mit Unlock-Hinweis ────────────────────────────────────────
function LockOverlay({ hint }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-sm bg-gray-900/70 z-10 px-3 text-center">
      <GameIcon name="lock" size={20} color="gray" />
      {hint && <span className="text-gray-300 text-[10px] leading-snug">{hint}</span>}
    </div>
  );
}

// ─── "NEW" badge für frisch freigeschaltete Items ───────────────────────────
function NewBadge() {
  return (
    <span className="absolute -top-1.5 -right-1.5 z-20 bg-amber-500 text-gray-900 text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-pixel-sm">
      NEW
    </span>
  );
}

// ─── Relic card ──────────────────────────────────────────────────────────────
function RelicCard({ relic, locked, hint, isNew }) {
  const r = RARITY_CFG[relic.rarity] ?? RARITY_CFG.common;
  return (
    <div className={`relative bg-gray-800/70 border ${r.border} rounded-sm p-3 flex flex-col gap-1.5 shadow-pixel-sm ${r.glow} ${locked ? 'opacity-40' : ''}`}>
      {locked && <LockOverlay hint={hint} />}
      {!locked && isNew && <NewBadge />}
      <div className="flex items-start gap-2">
        <span className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
          {ITEM_ICONS[relic.id]
            ? <GameIcon name={ITEM_ICONS[relic.id].icon} color={ITEM_ICONS[relic.id].color} size={28} />
            : <span className="text-2xl">{relic.icon}</span>}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-white text-sm font-semibold leading-tight truncate">{relic.name}</span>
            <RarityBadge rarity={relic.rarity} />
          </div>
          <p className="text-gray-400 text-[11px] leading-snug mt-0.5">{relic.description}</p>
        </div>
      </div>
      {relic.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {relic.tags.map(tag => <Tag key={tag} tag={tag} small />)}
        </div>
      )}
    </div>
  );
}

// ─── Perk card ───────────────────────────────────────────────────────────────
const PERK_RARITY_MAP = { common: 'common', rare: 'rare', epic: 'epic' };

function PerkCard({ perk, locked, hint, isNew }) {
  const rarity = PERK_RARITY_MAP[perk.rarity] ?? 'common';
  const r = RARITY_CFG[rarity];
  const durationLabel = perk.duration === -1 ? 'permanent' : perk.duration > 0 ? `${perk.duration} rounds` : null;
  return (
    <div className={`relative bg-gray-800/70 border ${r.border} rounded-sm p-3 flex flex-col gap-1.5 shadow-pixel-sm ${r.glow} ${locked ? 'opacity-40' : ''}`}>
      {locked && <LockOverlay hint={hint} />}
      {!locked && isNew && <NewBadge />}
      <div className="flex items-start gap-2">
        <span className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
          {ITEM_ICONS[perk.id]
            ? <GameIcon name={ITEM_ICONS[perk.id].icon} color={ITEM_ICONS[perk.id].color} size={28} />
            : <span className="text-2xl">{perk.icon}</span>}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-white text-sm font-semibold leading-tight truncate">{perk.name}</span>
            <RarityBadge rarity={rarity} />
          </div>
          <p className="text-gray-400 text-[11px] leading-snug mt-0.5">{perk.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-0.5 items-center">
        {perk.tags?.map(tag => <Tag key={tag} tag={tag} small />)}
        {durationLabel && (
          <span className="flex items-center gap-1 text-gray-500 text-[9px] ml-auto">
            <GameIcon name="time" size={10} color="gray" />
            <span>{durationLabel}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Synergy card ────────────────────────────────────────────────────────────
// Synergien sind nie gesperrt (sie feuern automatisch), aber undiscovered bis
// zur ersten Aktivierung: Name/Beschreibung verborgen, Required-Tags sichtbar.
function SynergyCard({ synergy, undiscovered }) {
  const rarity = synergyRarity(synergy);
  const r = RARITY_CFG[rarity];
  return (
    <div className={`relative bg-gray-800/70 border ${r.border} rounded-sm p-3 flex flex-col gap-1.5 shadow-pixel-sm ${r.glow} ${undiscovered ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-2">
        <span className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
          {undiscovered
            ? <GameIcon name="lock" size={22} color="gray" />
            : ITEM_ICONS[synergy.id]
              ? <GameIcon name={ITEM_ICONS[synergy.id].icon} color={ITEM_ICONS[synergy.id].color} size={28} />
              : <span className="text-2xl">{synergy.icon}</span>}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-white text-sm font-semibold leading-tight truncate">{undiscovered ? '???' : synergy.name}</span>
            <RarityBadge rarity={rarity} />
          </div>
          <p className="text-gray-400 text-[11px] leading-snug mt-0.5">
            {undiscovered ? 'Undiscovered — activate this synergy in a run to reveal it.' : synergy.description}
          </p>
        </div>
      </div>
      {/* Required tags */}
      <div className="flex flex-wrap gap-1 mt-0.5 items-center">
        <span className="text-gray-500 text-[9px] mr-0.5">needs:</span>
        {Object.entries(synergy.requiredTags).map(([tag, count]) => (
          <div key={tag} className="flex items-center gap-0.5">
            {Array.from({ length: count }).map((_, i) => <Tag key={i} tag={tag} small />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-0.5">
      <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">{label}</span>
      <span className="text-gray-600 text-xs">({count})</span>
      <div className="flex-1 h-px bg-gray-700/50" />
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'relics', label: 'Relics', icon: 'trophy', color: 'amber' },
  { id: 'perks', label: 'Perks', icon: 'potion', color: 'purple' },
  { id: 'synergies', label: 'Synergies', icon: 'thunder', color: 'yellow' },
];

export default function CodexPage({ onBack, accountProgression = null }) {
  const [activeTab, setActiveTab] = useState('relics');
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const achievements = useAchievementContext();

  // ── Data preparation ──
  const allRelics = useMemo(() => Object.values(RELICS), []);
  const allPerks = useMemo(() => Object.values(PERKS).filter(p => p.type !== 'filter'), []);
  const allFilterPerks = useMemo(() => Object.values(PERKS).filter(p => p.type === 'filter'), []);
  const allSynergies = useMemo(() => Object.values(SYNERGIES), []);

  // ── Unlock state ──
  const lockedKeys = useMemo(() => {
    if (!accountProgression) return new Set();
    return computeLockedKeys({
      accountLevel: accountProgression.level,
      stats: accountProgression.stats,
      unlockedAchievementIds: new Set(achievements.unlockedAchievements),
    });
  }, [accountProgression, achievements.unlockedAchievements]);

  const isLocked = (type, id) => lockedKeys.has(`${type}:${id}`);
  const discoveredSynergies = accountProgression?.discovered?.synergies ?? null;

  // "NEW"-Badges: beim Mount einfrieren welche gated Items frisch freigeschaltet
  // (unlocked aber noch nicht gesehen) sind, dann als gesehen markieren —
  // so bleibt das Badge für diesen Besuch sichtbar und verschwindet beim nächsten.
  const [newKeysAtMount] = useState(() => {
    if (!accountProgression) return new Set();
    const seen = new Set(accountProgression.seenUnlocks ?? []);
    const fresh = new Set();
    Object.values(RELICS).forEach(r => {
      const key = `relic:${r.id}`;
      if (isGatedContent('relic', r.id) && !seen.has(key)) fresh.add(key);
    });
    Object.values(PERKS).forEach(p => {
      const key = `perk:${p.id}`;
      if (isGatedContent('perk', p.id) && !seen.has(key)) fresh.add(key);
    });
    return fresh;
  });

  useEffect(() => {
    if (!accountProgression) return;
    // Nur tatsächlich freigeschaltete Keys als gesehen markieren
    const toMark = [...newKeysAtMount].filter(k => !lockedKeys.has(k));
    if (toMark.length > 0) accountProgression.markUnlocksSeen(toMark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNew = (type, id) => {
    const key = `${type}:${id}`;
    return newKeysAtMount.has(key) && !lockedKeys.has(key);
  };

  // ── Filter logic ──
  const filterItem = (item, rarityKey) => {
    const rarity = rarityKey ?? item.rarity;
    if (rarityFilter !== 'all' && rarity !== rarityFilter) return false;
    if (tagFilter !== 'all') {
      const tags = item.tags || Object.keys(item.requiredTags || {});
      if (!tags.includes(tagFilter)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return false;
    }
    return true;
  };

  const filtered = useMemo(() => {
    if (activeTab === 'relics') return allRelics.filter(r => filterItem(r));
    if (activeTab === 'perks') return [...allPerks, ...allFilterPerks].filter(p => filterItem(p));
    return allSynergies.filter(s => filterItem(s, synergyRarity(s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, rarityFilter, tagFilter, allRelics, allPerks, allFilterPerks, allSynergies]);

  // ── Group relics into sections ──
  const relicSections = useMemo(() => {
    if (activeTab !== 'relics') return null;
    const original = [], meta = [], cheat = [];
    filtered.forEach(r => {
      if ((r.tags || []).some(t => t === 'fake' || t === 'sacrifice')) cheat.push(r);
      else if (['relic_retrigger', 'mult_amplifier', 'per_relic_flat_bonus', 'synergy_multiplier',
        'flat_to_mult', 'time_risk_mult', 'round_scaling_mult', 'overkill_bonus',
        'unique_tag_mult', 'per_synergy_mult', 'per_perk_mult', 'level_scaling',
        'chain_reaction', 'perfect_next_double', 'streak_preservation', 'last_stand_double',
        'xp_to_score', 'perk_duration_extend', 'double_perk_pick', 'double_upgrade', 'perk_recycle_chance',
      ].includes(r.effect)) meta.push(r);
      else original.push(r);
    });
    return [
      { id: 'original', label: 'Relics', items: original },
      { id: 'meta', label: 'Meta-Relics', items: meta },
      { id: 'cheat', label: 'Cheat the System', items: cheat },
    ].filter(s => s.items.length > 0);
  }, [activeTab, filtered]);

  const perkSections = useMemo(() => {
    if (activeTab !== 'perks') return null;
    const offensive = [], defensive = [], utility = [], filters = [];
    filtered.forEach(p => {
      if (p.type === 'offensive') offensive.push(p);
      else if (p.type === 'defensive') defensive.push(p);
      else if (p.type === 'filter') filters.push(p);
      else utility.push(p);
    });
    return [
      { id: 'offensive', label: 'Offensive', items: offensive },
      { id: 'defensive', label: 'Defensive', items: defensive },
      { id: 'utility', label: 'Utility', items: utility },
      { id: 'filter', label: 'Filter', items: filters },
    ].filter(s => s.items.length > 0);
  }, [activeTab, filtered]);

  const counts = useMemo(() => {
    const lockedRelics = allRelics.filter(r => lockedKeys.has(`relic:${r.id}`)).length;
    const lockedPerks = [...allPerks, ...allFilterPerks].filter(p => lockedKeys.has(`perk:${p.id}`)).length;
    const totalPerks = allPerks.length + allFilterPerks.length;
    return {
      relics: lockedRelics > 0 ? `${allRelics.length - lockedRelics}/${allRelics.length}` : allRelics.length,
      perks: lockedPerks > 0 ? `${totalPerks - lockedPerks}/${totalPerks}` : totalPerks,
      synergies: allSynergies.length,
    };
  }, [allRelics, allPerks, allFilterPerks, allSynergies, lockedKeys]);

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-full min-h-0" style={{ height: '100%' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button
          onClick={onBack}
          className="bg-[#111827] hover:bg-[#1e293b] border-2 border-[#2d3a5c] px-3 py-1.5 rounded-sm text-sm text-white/80 transition shadow-pixel-sm"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-xl font-bold text-amber-200 leading-tight flex items-center gap-2">
            <GameIcon name="scroll" size={20} color="amber" />
            <span>Codex</span>
          </h2>
          <p className="text-gray-400 text-xs">All Relics, Perks & Synergies</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 shrink-0 bg-[#111827] border-2 border-[#2d3a5c] rounded-sm p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm text-sm font-semibold transition-all
              ${activeTab === tab.id
                ? 'bg-gray-700 text-white shadow-pixel-sm'
                : 'text-gray-400 hover:text-gray-200'}`}
          >
            <GameIcon name={tab.icon} size={16} color={activeTab === tab.id ? tab.color : 'gray'} />
            <span>{tab.label}</span>
            <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold
              ${activeTab === tab.id ? 'bg-amber-500/30 text-amber-300' : 'bg-gray-700 text-gray-500'} rounded-sm`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-2 mb-3 shrink-0">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or description…"
          className="w-full bg-[#111827] border-2 border-[#2d3a5c] rounded-sm px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
        />

        {/* Rarity pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => setRarityFilter('all')}
            className={`shrink-0 px-2.5 py-1 rounded-sm text-xs font-medium transition
              ${rarityFilter === 'all' ? 'bg-gray-500 text-white' : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'}`}
          >
            All
          </button>
          {(activeTab !== 'synergies' ? ALL_RARITIES : ['rare', 'epic', 'legendary']).map(r => {
            const cfg = RARITY_CFG[r];
            return (
              <button
                key={r}
                onClick={() => setRarityFilter(r === rarityFilter ? 'all' : r)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium border transition
                  ${rarityFilter === r
                    ? `${cfg.border} ${cfg.text} bg-gray-700`
                    : 'border-transparent bg-gray-800/60 text-gray-400 hover:text-gray-200'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Tag pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => setTagFilter('all')}
            className={`shrink-0 px-2.5 py-1 rounded-sm text-xs font-medium transition
              ${tagFilter === 'all' ? 'bg-gray-500 text-white' : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'}`}
          >
            All tags
          </button>
          {ALL_TAGS.map(tag => {
            const s = TAG_CFG[tag];
            return (
              <button
                key={tag}
                onClick={() => setTagFilter(tag === tagFilter ? 'all' : tag)}
                className={`shrink-0 px-2.5 py-1 rounded-sm text-xs font-medium transition
                  ${tagFilter === tag
                    ? `${s.bg} ${s.text}`
                    : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result count */}
      <div className="text-xs text-gray-500 mb-2 shrink-0">
        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        {(search || rarityFilter !== 'all' || tagFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setRarityFilter('all'); setTagFilter('all'); }}
            className="ml-2 text-amber-400/70 hover:text-amber-400"
          >
            × clear filters
          </button>
        )}
      </div>

      {/* Scrollable card grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-0.5">
        {activeTab === 'relics' && relicSections && (
          <div className="space-y-4 pb-4">
            {relicSections.map(section => (
              <div key={section.id}>
                <SectionHeader label={section.label} count={section.items.length} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {section.items.map(r => (
                    <RelicCard
                      key={r.id}
                      relic={r}
                      locked={isLocked('relic', r.id)}
                      hint={getUnlockHint('relic', r.id)}
                      isNew={isNew('relic', r.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <EmptyState />}
          </div>
        )}

        {activeTab === 'perks' && perkSections && (
          <div className="space-y-4 pb-4">
            {perkSections.map(section => (
              <div key={section.id}>
                <SectionHeader label={section.label} count={section.items.length} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {section.items.map(p => (
                    <PerkCard
                      key={p.id}
                      perk={p}
                      locked={isLocked('perk', p.id)}
                      hint={getUnlockHint('perk', p.id)}
                      isNew={isNew('perk', p.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <EmptyState />}
          </div>
        )}

        {activeTab === 'synergies' && (
          <div className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map(s => (
                <SynergyCard
                  key={s.id}
                  synergy={s}
                  undiscovered={discoveredSynergies ? !discoveredSynergies.includes(s.id) : false}
                />
              ))}
            </div>
            {filtered.length === 0 && <EmptyState />}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-500">
      <div className="mb-2 flex justify-center">
        <GameIcon name="search" size={24} color="gray" />
      </div>
      <p className="text-sm">No results</p>
    </div>
  );
}
