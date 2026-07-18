import React, { useState, useEffect, useCallback } from 'react';
import { RELICS } from '../constants/relicDefinitions';
import { PERKS, PERK_TYPES } from '../constants/perkDefinitions';

const ALL_RELICS = Object.values(RELICS);
const ALL_PERKS = Object.values(PERKS).filter(p => p.type !== PERK_TYPES.FILTER);
const ALL_FOCUS_PERKS = Object.values(PERKS).filter(p => p.type === PERK_TYPES.FILTER && p.isBoost);

export default function DebugPanel({
  relicSystem,
  perkSystem,
  synergyEngine,
  level,
  lives,
  setLives,
  streak,
  score,
  setScore,
  currentRound,
  setCurrentRound,
  applyPerkEffects,
  timer,
  cardLoader,
  onCurseTake,
  accountProgression,
}) {
  const [open, setOpen] = useState(false);
  const [selectedRelic, setSelectedRelic] = useState(ALL_RELICS[0]?.id ?? '');
  const [selectedPerk, setSelectedPerk] = useState(ALL_PERKS[0]?.id ?? '');
  const [selectedFocus, setSelectedFocus] = useState(ALL_FOCUS_PERKS[0]?.id ?? '');
  const [levelInput, setLevelInput] = useState('');
  const [scoreInput, setScoreInput] = useState('');
  const [breakdownPreview, setBreakdownPreview] = useState(null);

  // Ctrl+Shift+D toggles panel
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAddRelic = () => {
    const relic = ALL_RELICS.find(r => r.id === selectedRelic);
    if (relic) relicSystem.addRelic(relic);
  };

  const handleAddPerk = () => {
    const perk = ALL_PERKS.find(p => p.id === selectedPerk);
    if (!perk) return;
    if (perk.isCurse && onCurseTake) {
      onCurseTake(perk);
    } else {
      perkSystem.selectPerk(perk);
    }
  };

  const handleAddFocus = () => {
    const perk = ALL_FOCUS_PERKS.find(p => p.id === selectedFocus);
    if (perk) perkSystem.selectPerk(perk);
  };

  const handleReloadCards = async () => {
    if (!cardLoader) return;
    const newCards = await cardLoader.preloadCards();
    const boosts = cardLoader.activeBoosts;
    await cardLoader.setNextPair(false, newCards, boosts.length > 0 ? boosts : null);
  };

  const handleSetLevel = () => {
    const n = parseInt(levelInput, 10);
    if (!isNaN(n) && n >= 1) { level.setLevelDirect(n); setLevelInput(''); }
  };

  const handleSetScore = () => {
    const n = parseInt(scoreInput, 10);
    if (!isNaN(n)) { setScore(n); setScoreInput(''); }
  };

  const handlePreviewBreakdown = useCallback(() => {
    if (!applyPerkEffects || !timer) return;
    const result = applyPerkEffects(10, timer.timeLeft ?? 10);
    setBreakdownPreview(result);
  }, [applyPerkEffects, timer]);

  const s = { // inline styles to avoid Tailwind purge issues with dynamic z-index
    panel: {
      position: 'fixed', bottom: 0, right: 0, zIndex: 9999,
      width: open ? 320 : 'auto',
      fontFamily: 'monospace', fontSize: 11,
    },
  };

  return (
    <div style={s.panel}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'absolute', bottom: open ? 'auto' : 0, top: open ? 0 : 'auto',
          right: 0, background: '#1a1a2e', color: '#f0c040',
          border: '1px solid #444', borderRadius: open ? '0 0 0 6px' : '6px 0 0 0',
          padding: '4px 8px', cursor: 'pointer', zIndex: 10000, fontSize: 14,
        }}
        title="Ctrl+Shift+D"
      >
        🐛
      </button>

      {open && (
        <div style={{
          background: 'rgba(10,10,20,0.95)', border: '1px solid #444',
          borderRadius: '6px 0 0 0', padding: 10, color: '#ccc',
          maxHeight: '90vh', overflowY: 'auto', paddingTop: 28,
        }}>
          <div style={{ color: '#f0c040', fontWeight: 'bold', marginBottom: 8, fontSize: 13 }}>
            🐛 Debug Panel
          </div>

          {/* ── State Info ── */}
          <Section title="State">
            <Row label="Lives">{lives} / 5</Row>
            <Row label="Streak">{streak.streak} (best: {streak.bestStreak})</Row>
            <Row label="Score">{score}</Row>
            <Row label="Round">{currentRound}</Row>
            <Row label="Level">{level.level} ({level.xp}/{level.xpToNextLevel} XP)</Row>
            <Row label="Relics">{relicSystem.activeRelics.map(r => r.id).join(', ') || '—'}</Row>
            <Row label="Perks">{perkSystem.activePerks.map(p => `${p.id}(${p.remainingDuration ?? '∞'})`).join(', ') || '—'}</Row>
            <Row label="Synergies">{synergyEngine.activeSynergies.map(s => s.id).join(', ') || '—'}</Row>
          </Section>

          {/* ── Focus / Boost Debug ── */}
          {cardLoader && (
            <Section title="Focus / Boost Debug">
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: '#888' }}>Active boosts: </span>
                {cardLoader.activeBoosts.length === 0 ? (
                  <span style={{ color: '#555' }}>none</span>
                ) : (
                  cardLoader.activeBoosts.map(b => (
                    <span key={b.id} style={{ color: '#f0c040', marginRight: 6 }}>
                      {b.icon} {b.id} +{b.boostPercent ?? 40}%
                    </span>
                  ))
                )}
              </div>
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: '#888' }}>Current pair: </span>
                {cardLoader.currentPair.map((card, i) => (
                  <span key={i} style={{ color: '#8cf', marginRight: 8 }}>
                    [{card.color || 'colorless'}]
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <select
                  value={selectedFocus}
                  onChange={e => setSelectedFocus(e.target.value)}
                  style={selectStyle}
                >
                  {ALL_FOCUS_PERKS.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                </select>
                <Btn onClick={handleAddFocus}>Add</Btn>
              </div>
              <div style={{ marginBottom: 6 }}>
                <Btn onClick={handleReloadCards}>⟳ Reload Cards (apply boosts)</Btn>
              </div>
              <div style={{ marginBottom: 2, color: '#888', fontSize: 10 }}>Quick-Add ×1:</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                {['red_focus','green_focus','blue_focus','black_focus','white_focus'].map(id => {
                  const p = ALL_FOCUS_PERKS.find(f => f.id === id);
                  if (!p) return null;
                  return (
                    <Btn key={id} onClick={() => perkSystem.selectPerk(p)}>
                      {p.icon}
                    </Btn>
                  );
                })}
              </div>
              <div style={{ marginBottom: 2, color: '#888', fontSize: 10 }}>Stack ×5 (≈200% boost):</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['red_focus','green_focus','blue_focus','black_focus','white_focus'].map(id => {
                  const p = ALL_FOCUS_PERKS.find(f => f.id === id);
                  if (!p) return null;
                  return (
                    <Btn key={id} onClick={() => { for (let i = 0; i < 5; i++) perkSystem.selectPerk(p); }}>
                      {p.icon}×5
                    </Btn>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── Relics ── */}
          <Section title="Relics">
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <select
                value={selectedRelic}
                onChange={e => setSelectedRelic(e.target.value)}
                style={selectStyle}
              >
                {ALL_RELICS.map(r => (
                  <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                ))}
              </select>
              <Btn onClick={handleAddRelic}>Add</Btn>
            </div>
            <Btn onClick={() => relicSystem.reset()} danger>Clear Relics</Btn>
          </Section>

          {/* ── Perks ── */}
          <Section title="Perks">
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <select
                value={selectedPerk}
                onChange={e => setSelectedPerk(e.target.value)}
                style={selectStyle}
              >
                {ALL_PERKS.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
              <Btn onClick={handleAddPerk}>Add</Btn>
            </div>
            <Btn onClick={() => perkSystem.clearPerks()} danger>Clear Perks</Btn>
          </Section>

          {/* ── Quick Actions ── */}
          <Section title="Quick Actions">
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
              <Btn onClick={() => setLives(1)}>Lives → 1</Btn>
              <Btn onClick={() => setLives(5)}>Lives → 5</Btn>
              <Btn onClick={() => streak.setStreakValue(10)}>Streak → 10</Btn>
              <Btn onClick={() => streak.reset()}>Streak → 0</Btn>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
              <Btn onClick={() => level.addXP(1000)}>+1000 XP</Btn>
              <Btn onClick={() => perkSystem.triggerPerkSelection()}>Perk Pick</Btn>
              <Btn onClick={() => setCurrentRound(r => r + 10)}>+10 Rounds</Btn>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
              <input
                type="number" placeholder="Level" value={levelInput}
                onChange={e => setLevelInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetLevel()}
                style={inputStyle}
              />
              <Btn onClick={handleSetLevel}>Set Level</Btn>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="number" placeholder="Score" value={scoreInput}
                onChange={e => setScoreInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetScore()}
                style={inputStyle}
              />
              <Btn onClick={handleSetScore}>Set Score</Btn>
            </div>
          </Section>

          {/* ── Account Progression ── */}
          {accountProgression && (
            <Section title="Account">
              <Row label="Level">{accountProgression.level} ({accountProgression.xpIntoLevel}/{accountProgression.xpForLevel} XP)</Row>
              <Row label="Total XP">{accountProgression.totalXp}</Row>
              <Row label="Stats">
                runs {accountProgression.stats.runsPlayed} / boss {accountProgression.stats.bossWins} / stages {accountProgression.stats.totalStagesCleared}
              </Row>
              <Row label="Daily">
                login {accountProgression.dailyLogin.lastClaimDate ?? '—'} (streak {accountProgression.dailyLogin.streak}) / challenge {accountProgression.dailyChallenge.lastRewardDate ?? '—'}
              </Row>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                <Btn onClick={() => accountProgression.debugAddXp(100)}>+100 Acc XP</Btn>
                <Btn onClick={() => accountProgression.debugAddXp(1000)}>+1000 Acc XP</Btn>
                <Btn onClick={() => accountProgression.debugResetDaily()}>Reset Daily</Btn>
                <Btn onClick={() => { localStorage.removeItem('mtg_account_progression'); window.location.reload(); }} danger>Wipe Account</Btn>
              </div>
            </Section>
          )}

          {/* ── Score Breakdown Preview ── */}
          <Section title="Breakdown (base=10)">
            <Btn onClick={handlePreviewBreakdown}>Recalculate</Btn>
            {breakdownPreview && (
              <div style={{ marginTop: 6 }}>
                <div style={{ color: '#f0c040' }}>Total: {breakdownPreview.total}</div>
                {(breakdownPreview.breakdown || []).map((b, i) => (
                  <div key={i} style={{ color: b.delta >= 0 ? '#6f6' : '#f66' }}>
                    {b.icon} {b.label}: {b.delta >= 0 ? '+' : ''}{b.delta}
                  </div>
                ))}
                {(!breakdownPreview.breakdown || breakdownPreview.breakdown.length === 0) && (
                  <div style={{ color: '#888' }}>No modifiers active</div>
                )}
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ──

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ color: '#888', borderBottom: '1px solid #333', marginBottom: 4, paddingBottom: 2 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
      <span style={{ color: '#888', minWidth: 64 }}>{label}:</span>
      <span style={{ color: '#eee', wordBreak: 'break-all' }}>{children}</span>
    </div>
  );
}

function Btn({ onClick, children, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: danger ? '#5c1a1a' : '#1e3a5f',
        color: danger ? '#f88' : '#8cf',
        border: `1px solid ${danger ? '#a33' : '#2a6'}`,
        borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: 11,
      }}
    >
      {children}
    </button>
  );
}

const selectStyle = {
  background: '#1a1a2e', color: '#ccc', border: '1px solid #444',
  borderRadius: 4, padding: '2px 4px', fontSize: 11, flex: 1, minWidth: 0,
};

const inputStyle = {
  background: '#1a1a2e', color: '#ccc', border: '1px solid #444',
  borderRadius: 4, padding: '2px 6px', fontSize: 11, width: 70,
};
