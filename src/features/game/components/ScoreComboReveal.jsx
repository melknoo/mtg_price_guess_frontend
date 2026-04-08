import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

function getTotalTier(pts) {
  if (pts >= 150) return {
    textClass: 'text-6xl sm:text-7xl font-black tracking-tight',
    colorClass: 'text-yellow-200',
    glowStyle: { textShadow: '0 0 40px #fde68a, 0 0 80px #fbbf24, 0 0 120px #f59e0b, 0 0 4px #fff' },
    transition: { type: 'spring', stiffness: 500, damping: 8 },
    initial: { scale: 0.2, opacity: 0, rotate: -6 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    label: '🔥 INSANE COMBO 🔥',
    labelClass: 'text-yellow-300/90 text-sm font-black tracking-widest uppercase mb-1',
  };
  if (pts >= 100) return {
    textClass: 'text-5xl sm:text-6xl font-black tracking-tight',
    colorClass: 'text-amber-300',
    glowStyle: { textShadow: '0 0 32px #fbbf24, 0 0 64px #f59e0b, 0 0 3px #fff8' },
    transition: { type: 'spring', stiffness: 450, damping: 10 },
    initial: { scale: 0.3, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    label: 'MEGA COMBO',
    labelClass: 'text-amber-400/80 text-sm font-bold tracking-widest uppercase mb-1',
  };
  if (pts >= 60) return {
    textClass: 'text-4xl sm:text-5xl font-extrabold',
    colorClass: 'text-amber-400',
    glowStyle: { textShadow: '0 0 18px #fbbf24, 0 0 36px #f59e0b' },
    transition: { type: 'spring', stiffness: 380, damping: 12 },
    initial: { scale: 0.4, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    label: 'COMBO',
    labelClass: 'text-amber-400/70 text-xs font-bold tracking-widest uppercase mb-1',
  };
  if (pts >= 25) return {
    textClass: 'text-3xl sm:text-4xl font-extrabold',
    colorClass: 'text-green-300',
    glowStyle: { textShadow: '0 0 12px #4ade80' },
    transition: { type: 'spring', stiffness: 320, damping: 15 },
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    label: null,
    labelClass: '',
  };
  return {
    textClass: 'text-2xl sm:text-3xl font-bold',
    colorClass: 'text-green-400',
    glowStyle: {},
    transition: { duration: 0.25, ease: 'easeOut' },
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    label: null,
    labelClass: '',
  };
}

export default function ScoreComboReveal({ breakdown, visible, onComplete, suppressOverlay = false }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showTotal, setShowTotal] = useState(false);   // overlay pop (auto-dismisses)
  const [showTotalLine, setShowTotalLine] = useState(false); // inline total row (stays)
  const timeoutsRef = useRef([]);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (!visible || !breakdown?.items?.length) {
      setRevealedCount(0);
      setShowTotal(false);
      setShowTotalLine(false);
      return;
    }

    setRevealedCount(0);
    setShowTotal(false);
    setShowTotalLine(false);

    const INITIAL_DELAY = 220;
    const STAGGER = 175;

    breakdown.items.forEach((_, i) => {
      const t = setTimeout(() => setRevealedCount(i + 1), INITIAL_DELAY + i * STAGGER);
      timeoutsRef.current.push(t);
    });

    const totalT = setTimeout(() => {
      setShowTotal(true);
      setShowTotalLine(true);
      // Score-Pop kurz sichtbar lassen, dann wegfaden und erst dann Modal freigeben
      const dismissT = setTimeout(() => {
        setShowTotal(false);
        const doneT = setTimeout(() => onCompleteRef.current?.(), 220);
        timeoutsRef.current.push(doneT);
      }, 750);
      timeoutsRef.current.push(dismissT);
    }, INITIAL_DELAY + breakdown.items.length * STAGGER + 120);
    timeoutsRef.current.push(totalT);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [breakdown, visible]);

  if (!breakdown?.items?.length) return null;

  const visibleItems = breakdown.items.slice(0, revealedCount);
  const tier = getTotalTier(breakdown.total);

  // Total score rendered via portal so it floats centered over the cards
  // without adding any height to the document flow
  const totalOverlay = createPortal(
    <AnimatePresence>
      {showTotal && (
        <motion.div
          initial={tier.initial}
          animate={tier.animate}
          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
          transition={tier.transition}
          className="fixed inset-0 flex flex-col items-center justify-center select-none pointer-events-none z-[55]"
        >
          <div className="flex flex-col items-center bg-[#070d1a]/80 border-2 border-[#2d3a5c] rounded-sm px-6 py-3 shadow-pixel backdrop-blur-sm">
            {tier.label && (
              <motion.span
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className={tier.labelClass}
              >
                {tier.label}
              </motion.span>
            )}
            <span
              className={`${tier.textClass} ${tier.colorClass}`}
              style={tier.glowStyle}
            >
              +{breakdown.total} pts
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  const comboItemsJSX = (
    <>
      <div className="flex flex-col gap-px">
        <AnimatePresence initial={false}>
          {visibleItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ x: 28, opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className={`flex items-center justify-between px-2 py-px rounded-sm border text-xs
                ${item.delta === 0 && !item.isMult
                  ? 'bg-[#0d1320]/40 border-[#2d3a5c]/30'
                  : 'bg-[#111827]/70 border-[#2d3a5c]/70'
                }`}
            >
              <span className={item.delta === 0 && !item.isMult ? 'text-gray-600' : 'text-gray-300'}>
                {item.isMult
                  ? <span className="text-blue-400 font-bold mr-0.5">×</span>
                  : <span className="text-green-500/60 mr-0.5">+</span>
                }
                {item.icon} {item.label}
              </span>
              <span className={
                item.delta === 0 ? 'text-gray-600'
                : item.isMult ? 'text-blue-300 font-semibold'
                : 'text-green-400 font-semibold'
              }>
                {item.delta === 0 ? '—' : item.isMult ? `×${item.delta}` : `+${item.delta}`}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Total-Zeile */}
      <AnimatePresence>
        {showTotalLine && (
          <motion.div
            initial={{ x: 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 22 }}
            className="flex items-center justify-between px-2 py-px mt-px rounded-sm border border-amber-600/50 bg-amber-900/20 text-xs"
          >
            <span className="text-amber-300 font-bold">= Total</span>
            <span className="text-amber-300 font-bold">+{breakdown.total}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <>
      <div className="w-full">{comboItemsJSX}</div>
      {!suppressOverlay && totalOverlay}
    </>
  );
}
