import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';

// XP-Tiers für bombastischeres Popup-Overlay
function getXpTier(xp) {
  if (xp >= 80) return {
    textClass: 'text-6xl sm:text-7xl font-black tracking-tight',
    colorClass: 'text-purple-200',
    glowStyle: { textShadow: '0 0 40px #c4b5fd, 0 0 80px #a78bfa, 0 0 4px #fff' },
    transition: { type: 'spring', stiffness: 500, damping: 8 },
    initial: { scale: 0.15, opacity: 0, rotate: -8 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    label: 'LEVEL BURST',
    labelClass: 'text-purple-300/90 text-xs font-black tracking-widest uppercase mb-1',
    particles: true,
  };
  if (xp >= 40) return {
    textClass: 'text-5xl sm:text-6xl font-black',
    colorClass: 'text-purple-300',
    glowStyle: { textShadow: '0 0 28px #a78bfa, 0 0 56px #8b5cf6' },
    transition: { type: 'spring', stiffness: 440, damping: 10 },
    initial: { scale: 0.25, opacity: 0, y: 10 },
    animate: { scale: 1, opacity: 1, y: 0 },
    label: 'COMBO SURGE',
    labelClass: 'text-purple-400/80 text-xs font-bold tracking-widest uppercase mb-1',
    particles: false,
  };
  if (xp >= 20) return {
    textClass: 'text-4xl sm:text-5xl font-extrabold',
    colorClass: 'text-indigo-300',
    glowStyle: { textShadow: '0 0 18px #818cf8' },
    transition: { type: 'spring', stiffness: 380, damping: 13 },
    initial: { scale: 0.35, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    label: 'NICE COMBO',
    labelClass: 'text-indigo-400/80 text-xs font-semibold tracking-widest uppercase mb-1',
    particles: false,
  };
  return {
    textClass: 'text-3xl sm:text-4xl font-bold',
    colorClass: 'text-purple-400',
    glowStyle: {},
    transition: { duration: 0.22, ease: 'easeOut' },
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    label: null,
    labelClass: '',
    particles: false,
  };
}

// Gold-Tier für das Gold-Badge im Overlay (kleiner, sekundär)
function getGoldTier(gold) {
  if (gold >= 30) return { colorClass: 'text-yellow-200', glowStyle: { textShadow: '0 0 12px #fbbf24' } };
  if (gold >= 15) return { colorClass: 'text-amber-300', glowStyle: {} };
  return { colorClass: 'text-amber-400', glowStyle: {} };
}

function BreakdownColumn({ items, total, icon, color, label, revealedCount, showTotalLine }) {
  const visibleItems = (items ?? []).slice(0, revealedCount);
  return (
    <div className="flex flex-col gap-px flex-1 min-w-0">
      <div className="flex items-center gap-1 mb-0.5 px-1">
        <GameIcon name={icon} color={color} size={13} />
        <span className={`text-xs font-bold text-${color}-300`}>{label}</span>
      </div>
      <AnimatePresence initial={false}>
        {visibleItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ x: 20, opacity: 0, scale: 0.96 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 440, damping: 22 }}
            className="flex items-center justify-between px-2 py-px rounded-sm border text-xs bg-slate-600/80 border-slate-400/50"
          >
            <span className="text-gray-300 flex items-center gap-0.5">
              {item.isMult
                ? <span className="text-blue-400 font-bold mr-0.5">×</span>
                : <span className="text-green-500/60 mr-0.5">+</span>
              }
              {item.icon} {item.label}
            </span>
            <span className={item.isMult ? 'text-blue-300 font-semibold' : `text-${color}-400 font-semibold`}>
              {item.isMult ? `×${item.delta}` : `+${item.delta}`}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {showTotalLine && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 440, damping: 22 }}
            className={`flex items-center justify-between px-2 py-px mt-px rounded-sm border border-${color}-400/70 bg-${color}-700/50 text-xs`}
          >
            <span className={`text-${color}-300 font-bold`}>Total</span>
            <span className={`text-${color}-300 font-bold`}>+{total}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RewardComboReveal({ goldData, xpData, visible, onComplete, suppressOverlay = false }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showTotal, setShowTotal] = useState(false);
  const [showTotalLine, setShowTotalLine] = useState(false);
  const timeoutsRef = useRef([]);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Nur XP-Items im Breakdown anzeigen
  const xpItems = xpData?.items ?? [];

  useEffect(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (!visible || !xpItems.length) {
      setRevealedCount(0);
      setShowTotal(false);
      setShowTotalLine(false);
      if (visible) {
        const t = setTimeout(() => onCompleteRef.current?.(), 100);
        timeoutsRef.current.push(t);
      }
      return;
    }

    setRevealedCount(0);
    setShowTotal(false);
    setShowTotalLine(false);

    const INITIAL_DELAY = 200;
    const STAGGER = 160;

    xpItems.forEach((_, i) => {
      const t = setTimeout(() => setRevealedCount(i + 1), INITIAL_DELAY + i * STAGGER);
      timeoutsRef.current.push(t);
    });

    const totalT = setTimeout(() => {
      setShowTotal(true);
      setShowTotalLine(true);
      const dismissT = setTimeout(() => {
        setShowTotal(false);
        const doneT = setTimeout(() => onCompleteRef.current?.(), 200);
        timeoutsRef.current.push(doneT);
      }, 700);
      timeoutsRef.current.push(dismissT);
    }, INITIAL_DELAY + xpItems.length * STAGGER + 100);
    timeoutsRef.current.push(totalT);

    return () => { timeoutsRef.current.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpData, visible]);

  if (!xpData) return null;
  if (!visible) return null;

  const xpTotal = xpData?.total ?? 0;
  const goldTotal = goldData?.total ?? 0;
  const xpTier = getXpTier(xpTotal);
  const goldTier = getGoldTier(goldTotal);

  const totalOverlay = createPortal(
    <AnimatePresence>
      {showTotal && (
        <motion.div
          initial={xpTier.initial}
          animate={xpTier.animate}
          exit={{ opacity: 0, scale: 0.82, transition: { duration: 0.18 } }}
          transition={xpTier.transition}
          className="fixed inset-0 flex flex-col items-center justify-center select-none pointer-events-none z-[55]"
        >
          {/* Partikel bei sehr hohem XP */}
          {xpTier.particles && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-purple-400"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: (Math.cos((i / 6) * Math.PI * 2) * 80),
                    y: (Math.sin((i / 6) * Math.PI * 2) * 80),
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
          <div className="relative flex flex-col items-center bg-slate-800 border-2 border-[#2d3a5c] rounded-sm px-6 py-3 shadow-pixel">
            {xpTier.label && (
              <span className={xpTier.labelClass + ' absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap'}>
                {xpTier.label}
              </span>
            )}
            {/* XP — prominent */}
            <div className="flex flex-col items-center mb-1">
              <GameIcon name="star" color="purple" size={22} />
              <span
                className={`${xpTier.textClass} ${xpTier.colorClass}`}
                style={xpTier.glowStyle}
              >
                +{xpTotal}XP
              </span>
            </div>
            {/* Gold — sekundär, kleiner */}
            {goldTotal > 0 && (
              <>
                <div className="w-full h-px bg-slate-600/60 my-1" />
                <div className="flex items-center gap-1.5">
                  <GameIcon name="coin" color="amber" size={14} />
                  <span
                    className={`text-lg font-bold ${goldTier.colorClass}`}
                    style={goldTier.glowStyle}
                  >
                    +{goldTotal}G
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      {xpItems.length > 0 && (
        <div className="w-full flex gap-2">
          <BreakdownColumn
            items={xpItems}
            total={xpTotal}
            icon="star"
            color="purple"
            label="XP"
            revealedCount={revealedCount}
            showTotalLine={showTotalLine}
          />
        </div>
      )}
      {!suppressOverlay && totalOverlay}
    </>
  );
}
