// src/features/game/components/ActivePerksDisplay.jsx

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Findet alle Relics + Perks die mindestens einen der required Tags einer Synergy haben
function getContributors(synergy, relics, perks) {
  const requiredTagSet = new Set(Object.keys(synergy.requiredTags));
  return [...relics, ...perks].filter(item =>
    (item.tags || []).some(tag => requiredTagSet.has(tag))
  );
}

const TAG_STYLES = {
  speed:   { bg: 'bg-blue-500/40',   text: 'text-blue-200',   label: 'speed' },
  defense: { bg: 'bg-green-500/40',  text: 'text-green-200',  label: 'def' },
  score:   { bg: 'bg-yellow-500/40', text: 'text-yellow-200', label: 'score' },
  streak:  { bg: 'bg-orange-500/40', text: 'text-orange-200', label: 'streak' },
  xp:      { bg: 'bg-purple-500/40', text: 'text-purple-200', label: 'xp' },
  luck:    { bg: 'bg-pink-500/40',   text: 'text-pink-200',   label: 'luck' },
};

function TagChips({ tags, small = false }) {
  if (!tags?.length) return null;
  return (
    <div className={`flex flex-wrap gap-0.5 ${small ? 'mt-0.5' : 'mt-1'}`}>
      {tags.map(tag => {
        const s = TAG_STYLES[tag] ?? { bg: 'bg-gray-500/40', text: 'text-gray-200', label: tag };
        return (
          <span key={tag} className={`${s.bg} ${s.text} rounded px-1 ${small ? 'text-[9px]' : 'text-[10px]'} font-medium leading-tight`}>
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

function getCounterInfo(item, currentRound, heartRegenProgress, fortressRegenCount) {
  if (item.effect === 'round_heal') {
    return { current: currentRound % item.value, max: item.value };
  }
  if (item.effect === 'heart_regen' && heartRegenProgress) {
    return { current: heartRegenProgress.current, max: heartRegenProgress.threshold };
  }
  if (item.effect === 'improved_regen') {
    return { current: fortressRegenCount, max: item.value ?? 8 };
  }
  return null;
}

export default function ActivePerksDisplay({ perks, relics = [], synergies = [], flashingRelics = new Set(), tickingRelics = new Set(), currentRound = 0, heartRegenProgress = null, fortressRegenCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSynergyId, setExpandedSynergyId] = useState(null);

  const totalCount = (perks?.length ?? 0) + relics.length + synergies.length;
  if (totalCount === 0) return null;

  return (
    <>
      {/* Desktop: Fixed Sidebar (scrollable, full height) */}
      <div className="hidden md:flex fixed left-0 top-4 bottom-4 z-40 flex-col">
        <div className="bg-white/10 backdrop-blur-sm rounded-r-lg p-3 shadow-2xl border-r-4 border-purple-500 flex flex-col h-full">
          <h3 className="text-xs font-semibold text-gray-300 mb-3 text-center whitespace-nowrap shrink-0">
            🎮 Boni
          </h3>
          <div className="flex flex-col gap-3 overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
            <AnimatePresence>
              {perks.map((perk) => (
                <DesktopPerkCard key={perk.id} item={perk} borderColor="border-purple-400" gradientColor="from-purple-600 to-indigo-600" ticking={tickingRelics.has(perk.id)} counterInfo={getCounterInfo(perk, currentRound, heartRegenProgress, fortressRegenCount)} />
              ))}
              {relics.map((relic) => (
                <DesktopPerkCard key={relic.id} item={relic} borderColor="border-amber-400" gradientColor="from-amber-600 to-yellow-700" badge="⭐" triggered={flashingRelics.has(relic.id)} ticking={tickingRelics.has(relic.id)} counterInfo={getCounterInfo(relic, currentRound, heartRegenProgress, fortressRegenCount)} />
              ))}
              {synergies.map((syn) => (
                <DesktopPerkCard
                  key={syn.id}
                  item={syn}
                  borderColor="border-teal-400"
                  gradientColor="from-teal-600 to-cyan-700"
                  badge="🔗"
                  contributors={getContributors(syn, relics, perks)}
                  ticking={tickingRelics.has(syn.id)}
                  counterInfo={getCounterInfo(syn, currentRound, heartRegenProgress, fortressRegenCount)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile: Collapsible Top-Left Corner */}
      <div className="md:hidden fixed top-8 left-4 z-40">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              className="absolute top-5 left-5 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-2xl border-2 border-purple-500 mb-2 min-w-[300px]"
            >
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                🎮 Aktive Boni
              </h3>
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                {perks.map((perk) => (
                  <MobilePerkCard key={perk.id} item={perk} ticking={tickingRelics.has(perk.id)} counterInfo={getCounterInfo(perk, currentRound, heartRegenProgress, fortressRegenCount)} />
                ))}
                {relics.length > 0 && (
                  <div className="text-xs text-amber-300 font-bold mt-1 mb-0.5">⭐ Relics</div>
                )}
                {relics.map((relic) => (
                  <MobilePerkCard key={relic.id} item={relic} borderColor="border-amber-400" gradientColor="from-amber-600 to-yellow-700" triggered={flashingRelics.has(relic.id)} ticking={tickingRelics.has(relic.id)} counterInfo={getCounterInfo(relic, currentRound, heartRegenProgress, fortressRegenCount)} />
                ))}
                {synergies.length > 0 && (
                  <div className="text-xs text-teal-300 font-bold mt-1 mb-0.5">🔗 Synergies</div>
                )}
                {synergies.map((syn) => {
                  const contributors = getContributors(syn, relics, perks);
                  const isExpanded = expandedSynergyId === syn.id;
                  return (
                    <div key={syn.id}>
                      <MobilePerkCard
                        item={syn}
                        borderColor="border-teal-400"
                        gradientColor="from-teal-600 to-cyan-700"
                        onTap={contributors.length > 0 ? () => setExpandedSynergyId(isExpanded ? null : syn.id) : undefined}
                        tapHint={contributors.length > 0}
                        ticking={tickingRelics.has(syn.id)}
                        counterInfo={getCounterInfo(syn, currentRound, heartRegenProgress, fortressRegenCount)}
                      />
                      <AnimatePresence>
                        {isExpanded && contributors.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-teal-900/60 rounded-b-lg px-2 pb-2 border-x-2 border-b-2 border-teal-400 -mt-0.5">
                              <div className="text-xs text-teal-300 font-semibold pt-1.5 mb-1">Aktiviert durch:</div>
                              {contributors.map(c => (
                                <div key={c.id} className="flex items-center gap-1.5 text-xs text-gray-200 py-0.5">
                                  <span>{c.icon}</span>
                                  <span>{c.name}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full p-3 shadow-lg border-2 border-purple-400 relative"
        >
          <span className="text-2xl">🎮</span>
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalCount}
            </span>
          )}
        </motion.button>
      </div>
    </>
  );
}

function DesktopPerkCard({ item, borderColor = "border-purple-400", gradientColor = "from-purple-600 to-indigo-600", badge, contributors, triggered, ticking, counterInfo }) {
  const cardRef = useRef(null);
  const [tooltipStyle, setTooltipStyle] = useState(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const nearBottom = rect.bottom > window.innerHeight * 0.65;
      setTooltipStyle({
        position: 'fixed',
        left: rect.right + 8,
        zIndex: 9999,
        ...(nearBottom
          ? { bottom: window.innerHeight - rect.bottom }
          : { top: rect.top + rect.height / 2, transform: 'translateY(-50%)' }
        ),
      });
    }
  };

  const handleMouseLeave = () => setTooltipStyle(null);

  return (
    <motion.div
      ref={cardRef}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      whileHover={{ x: 10, scale: 1.05 }}
      onHoverStart={handleMouseEnter}
      onHoverEnd={handleMouseLeave}
      className="relative"
    >
      {/* Expandierender Glow-Ring (Trigger) */}
      <AnimatePresence>
        {triggered && (
          <motion.div
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 2.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
            className="absolute inset-0 rounded-lg bg-amber-400/50 pointer-events-none z-20"
            style={{ filter: 'blur(6px)' }}
          />
        )}
      </AnimatePresence>
      {/* Subtiler Tick-Glow */}
      <AnimatePresence>
        {ticking && (
          <motion.div
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 rounded-lg bg-amber-300/30 pointer-events-none z-20"
            style={{ filter: 'blur(3px)' }}
          />
        )}
      </AnimatePresence>
      <motion.div
        animate={triggered ? { scale: [1, 1.18, 0.96, 1] } : ticking ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: triggered ? 0.4 : 0.25, ease: 'easeInOut' }}
        className={`relative bg-gradient-to-br ${gradientColor} rounded-lg p-2 border-2 ${borderColor} shadow-lg min-w-[80px] overflow-hidden`}
      >
        {/* Heller Inner-Flash */}
        <AnimatePresence>
          {triggered && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 rounded-lg bg-amber-200 pointer-events-none z-10"
            />
          )}
        </AnimatePresence>
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl">{item.icon}</span>
          <div className="text-center">
            <div className="text-white font-semibold text-xs leading-tight">{item.name}</div>
            {item.remainingDuration > 0 && (
              <div className="text-yellow-300 text-xs font-bold mt-1">{item.remainingDuration}x</div>
            )}
            {item.duration === -1 && <div className="text-green-300 text-xs mt-1">♾️</div>}
            {item.duration === undefined && <div className="text-amber-300 text-xs mt-1">♾️</div>}
            {counterInfo && (
              <div className="text-amber-200 text-[10px] mt-1 font-mono">{counterInfo.current}/{counterInfo.max}</div>
            )}
          </div>
          <TagChips tags={item.tags} small />
        </div>
      </motion.div>

      {/* Tooltip via Portal — nicht vom overflow-y:auto der Sidebar abgeschnitten */}
      {tooltipStyle && createPortal(
        <div style={tooltipStyle} className="pointer-events-none">
          <div className={`bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-2xl border-2 ${borderColor} w-52 relative`}>
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-8 border-transparent border-r-gray-900" />
            {badge && <div className="text-xs font-bold mb-1 opacity-70">{badge}</div>}
            <div className="font-bold mb-1">{item.name}</div>
            <div className="text-gray-300 text-xs">{item.description}</div>
            {item.remainingDuration > 0 && (
              <div className="text-yellow-300 text-xs mt-2">
                ⏱️ {item.remainingDuration} {item.remainingDuration === 1 ? 'Runde' : 'Runden'}
              </div>
            )}
            {(item.duration === -1 || item.duration === undefined) && (
              <div className="text-green-300 text-xs mt-2">♾️ Permanent aktiv</div>
            )}
            {counterInfo && (
              <div className="text-amber-300 text-xs mt-2">
                🔢 Zähler: {counterInfo.current} / {counterInfo.max}
              </div>
            )}
            {item.tags?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <TagChips tags={item.tags} />
              </div>
            )}
            {contributors?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="text-teal-300 text-xs font-semibold mb-1">Aktiviert durch:</div>
                {contributors.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs text-gray-200 py-0.5">
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}

function MobilePerkCard({ item, borderColor = "border-purple-400", gradientColor = "from-purple-600 to-indigo-600", onTap, tapHint, triggered, ticking, counterInfo }) {

  return (
    <div className="relative">
      {/* Expandierender Glow-Ring (Trigger) */}
      <AnimatePresence>
        {triggered && (
          <motion.div
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 2.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
            className="absolute inset-0 rounded-lg bg-amber-400/50 pointer-events-none z-20"
            style={{ filter: 'blur(5px)' }}
          />
        )}
      </AnimatePresence>
      {/* Subtiler Tick-Glow */}
      <AnimatePresence>
        {ticking && (
          <motion.div
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 rounded-lg bg-amber-300/30 pointer-events-none z-20"
            style={{ filter: 'blur(3px)' }}
          />
        )}
      </AnimatePresence>
      <motion.div
        animate={triggered ? { scale: [1, 1.12, 0.97, 1] } : ticking ? { scale: [1, 1.04, 1] } : {}}
        transition={{ duration: triggered ? 0.35 : 0.2, ease: 'easeInOut' }}
        className={`relative bg-gradient-to-br ${gradientColor} rounded-lg p-2 border-2 ${borderColor} shadow-md overflow-hidden ${onTap ? 'cursor-pointer active:opacity-80' : ''}`}
        onClick={onTap}
      >
        <AnimatePresence>
          {triggered && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-0 rounded-lg bg-amber-200 pointer-events-none z-10"
            />
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{item.icon}</span>
          <div className="flex-1">
            <div className="text-white font-semibold text-sm leading-tight flex items-center gap-1">
              {item.name}
              {tapHint && <span className="text-teal-300 text-xs opacity-70">▼</span>}
            </div>
            <div className="text-gray-200 text-xs mt-0.5">{item.description}</div>
            {item.remainingDuration > 0 && (
              <div className="text-yellow-300 text-xs font-bold mt-1">
                ⏱️ {item.remainingDuration} {item.remainingDuration === 1 ? 'Runde' : 'Runden'}
              </div>
            )}
            {(item.duration === -1 || item.duration === undefined) && (
              <div className="text-green-300 text-xs mt-1">♾️ Permanent aktiv</div>
            )}
            {counterInfo && (
              <div className="text-amber-200 text-xs mt-1 font-mono">🔢 {counterInfo.current}/{counterInfo.max}</div>
            )}
            <TagChips tags={item.tags} small />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
