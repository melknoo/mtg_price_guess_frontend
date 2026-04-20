import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';

function getGoldTier(gold) {
  if (gold >= 50) return {
    textClass: 'text-5xl sm:text-6xl font-black tracking-tight',
    colorClass: 'text-yellow-200',
    glowStyle: { textShadow: '0 0 32px #fde68a, 0 0 64px #fbbf24, 0 0 3px #fff' },
    transition: { type: 'spring', stiffness: 460, damping: 9 },
    initial: { scale: 0.2, opacity: 0, rotate: -5 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    label: 'JACKPOT',
    labelClass: 'text-yellow-300/90 text-xs font-black tracking-widest uppercase mb-1',
  };
  if (gold >= 25) return {
    textClass: 'text-4xl sm:text-5xl font-black',
    colorClass: 'text-amber-300',
    glowStyle: { textShadow: '0 0 24px #fbbf24, 0 0 48px #f59e0b' },
    transition: { type: 'spring', stiffness: 420, damping: 11 },
    initial: { scale: 0.3, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    label: 'RICH COMBO',
    labelClass: 'text-amber-400/80 text-xs font-bold tracking-widest uppercase mb-1',
  };
  if (gold >= 10) return {
    textClass: 'text-3xl sm:text-4xl font-extrabold',
    colorClass: 'text-amber-400',
    glowStyle: { textShadow: '0 0 14px #fbbf24' },
    transition: { type: 'spring', stiffness: 360, damping: 13 },
    initial: { scale: 0.4, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    label: null,
    labelClass: '',
  };
  return {
    textClass: 'text-2xl sm:text-3xl font-bold',
    colorClass: 'text-amber-400',
    glowStyle: {},
    transition: { duration: 0.22, ease: 'easeOut' },
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    label: null,
    labelClass: '',
  };
}

function BreakdownColumn({ items, total, icon, color, label, revealedCount, showTotalLine }) {
  const visibleItems = (items ?? []).slice(0, revealedCount);
  return (
    <div className="flex flex-col gap-px flex-1 min-w-0">
      {/* Column header */}
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

  const allItems = [...(goldData?.items ?? []), ...(xpData?.items ?? [])];

  useEffect(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (!visible || !allItems.length) {
      setRevealedCount(0);
      setShowTotal(false);
      setShowTotalLine(false);
      // Even with no items, signal completion so modals aren't blocked
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

    allItems.forEach((_, i) => {
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
    }, INITIAL_DELAY + allItems.length * STAGGER + 100);
    timeoutsRef.current.push(totalT);

    return () => { timeoutsRef.current.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goldData, xpData, visible]);

  if (!goldData && !xpData) return null;
  if (!visible) return null;

  const goldItems = goldData?.items ?? [];
  const xpItems = xpData?.items ?? [];
  const goldRevealedCount = Math.min(revealedCount, goldItems.length);
  const xpRevealedCount = Math.max(0, revealedCount - goldItems.length);

  const goldTier = getGoldTier(goldData?.total ?? 0);

  const totalOverlay = createPortal(
    <AnimatePresence>
      {showTotal && (
        <motion.div
          initial={goldTier.initial}
          animate={goldTier.animate}
          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
          transition={goldTier.transition}
          className="fixed inset-0 flex flex-col items-center justify-center select-none pointer-events-none z-[55]"
        >
          <div className="flex gap-4 items-center bg-slate-800 border-2 border-[#2d3a5c] rounded-sm px-6 py-3 shadow-pixel">
            {goldTier.label && (
              <span className={goldTier.labelClass + ' absolute -top-5 left-1/2 -translate-x-1/2'}>
                {goldTier.label}
              </span>
            )}
            <div className="flex flex-col items-center">
              <GameIcon name="coin" color="amber" size={20} />
              <span
                className={`${goldTier.textClass} ${goldTier.colorClass}`}
                style={goldTier.glowStyle}
              >
                +{goldData?.total ?? 0}G
              </span>
            </div>
            <div className="w-px h-10 bg-slate-500/60 self-stretch" />
            <div className="flex flex-col items-center">
              <GameIcon name="star" color="purple" size={20} />
              <span className="text-3xl sm:text-4xl font-bold text-purple-300"
                style={{ textShadow: '0 0 12px #a78bfa' }}>
                +{xpData?.total ?? 0}XP
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  const hasBreakdownItems = goldItems.length > 0 || xpItems.length > 0;

  return (
    <>
      {hasBreakdownItems && (
        <div className="w-full flex gap-2">
          {goldItems.length > 0 && (
            <BreakdownColumn
              items={goldItems}
              total={goldData?.total ?? 0}
              icon="coin"
              color="amber"
              label="Gold"
              revealedCount={goldRevealedCount}
              showTotalLine={showTotalLine}
            />
          )}
          {xpItems.length > 0 && (
            <BreakdownColumn
              items={xpItems}
              total={xpData?.total ?? 0}
              icon="star"
              color="purple"
              label="XP"
              revealedCount={xpRevealedCount}
              showTotalLine={showTotalLine}
            />
          )}
        </div>
      )}
      {!suppressOverlay && totalOverlay}
    </>
  );
}
