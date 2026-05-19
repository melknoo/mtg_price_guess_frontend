import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NODE_TYPES, TOTAL_STAGES } from '../constants/mapDefinitions';
import GameIcon from '../../../shared/components/GameIcon';
import { GAME_CONFIG } from '../../../shared/utils/constants';

const NODE_INFO = {
  [NODE_TYPES.ELITE]: [
    { icon: 'skull', color: 'red',   text: 'Timer −2s' },
    { icon: 'coin',  color: 'amber', text: '+50G bonus' },
    { icon: 'star',  color: 'purple', text: 'Relic drop' },
  ],
  [NODE_TYPES.BOSS]: [
    { icon: 'trophy', color: 'amber', text: 'Legendary relic' },
  ],
  [NODE_TYPES.REST]: [
    { icon: 'heart', color: 'red',   text: 'Heal 2 lives' },
    { icon: 'star',  color: 'blue',  text: 'Or upgrade perk' },
  ],
  [NODE_TYPES.SHOP]: [
    { icon: 'chest', color: 'amber', text: 'Relics & Perks' },
  ],
  [NODE_TYPES.MYSTERY]: [
    { icon: 'interrogation', color: 'purple', text: 'Unknown reward' },
  ],
  [NODE_TYPES.EXCHANGE]: [
    { icon: 'coin', color: 'teal', text: 'Gold → XP' },
  ],
  [NODE_TYPES.MINI_BOSS]: [
    { icon: 'skull', color: 'orange', text: 'Timer −2s' },
    { icon: 'star', color: 'purple', text: 'Relic drop' },
  ],
};

const NODE_ICON = {
  [NODE_TYPES.NORMAL]:   <GameIcon name="sword"    size={20} color="white"  />,
  [NODE_TYPES.ELITE]:    <GameIcon name="skull"    size={20} color="red"    />,
  [NODE_TYPES.SHOP]:     <GameIcon name="chest"    size={20} color="amber"  />,
  [NODE_TYPES.REST]:     <GameIcon name="glow"     size={20} color="orange" />,
  [NODE_TYPES.BOSS]:     <GameIcon name="trophy"   size={20} color="amber"  />,
  [NODE_TYPES.MYSTERY]:  <GameIcon name="interrogation" size={20} color="purple" />,
  [NODE_TYPES.EXCHANGE]: <GameIcon name="coin"     size={20} color="teal"   />,
  [NODE_TYPES.MINI_BOSS]:<GameIcon name="bullet"   size={20} color="orange" />,
};

const NODE_LABEL = {
  [NODE_TYPES.NORMAL]: 'Normal',
  [NODE_TYPES.ELITE]: 'Elite',
  [NODE_TYPES.SHOP]: 'Shop',
  [NODE_TYPES.REST]: 'Rest',
  [NODE_TYPES.BOSS]: 'Boss',
  [NODE_TYPES.MYSTERY]: 'Mystery',
  [NODE_TYPES.EXCHANGE]: 'Exchange',
  [NODE_TYPES.MINI_BOSS]: 'Mini Boss',
};

const NODE_COLOR = {
  [NODE_TYPES.NORMAL]:   'border-blue-400 bg-blue-900/30 hover:bg-blue-800/50',
  [NODE_TYPES.ELITE]:    'border-red-400 bg-red-900/30 hover:bg-red-800/50',
  [NODE_TYPES.SHOP]:     'border-yellow-400 bg-yellow-900/30 hover:bg-yellow-800/50',
  [NODE_TYPES.REST]:     'border-green-400 bg-green-900/30 hover:bg-green-800/50',
  [NODE_TYPES.BOSS]:     'border-purple-400 bg-purple-900/30',
  [NODE_TYPES.MYSTERY]:  'border-purple-400 bg-purple-900/30 hover:bg-purple-800/50',
  [NODE_TYPES.EXCHANGE]: 'border-teal-400 bg-teal-900/30 hover:bg-teal-800/50',
  [NODE_TYPES.MINI_BOSS]:'border-orange-400 bg-orange-900/30 hover:bg-orange-800/50',
};

export default function MapScreen({ map, currentStage, gold, level = 1, xp = 0, xpToNextLevel = 50, lives = 0, maxLives = GAME_CONFIG.INITIAL_LIVES, onChooseNode, onExchange, onClose }) {
  const activeStageRef = useRef(null);

  // Scrollt beim Öffnen automatisch zum aktiven Stage (flex-col-reverse zeigt Boss oben,
  // aktiver Stage ist unten — ohne Scroll sieht man erst den Boss/Future-Bereich)
  useEffect(() => {
    if (!activeStageRef.current) return;
    const t = setTimeout(() => {
      activeStageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 180);
    return () => clearTimeout(t);
  }, []);

  if (!map) return null;

  // currentStage ist 1-indexed; Stage 1 wird immer auto-gespielt (kein Map-Choice).
  // Nach Stage N complete (currentStage=N) wählt der Spieler Stage N+1 (stageIdx=N).
  const chooseStageIdx = currentStage; // stageIdx des nächsten zu wählenden Stages

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-sm mx-4 rounded-none border-4 border-purple-500 bg-[#0d1117] shadow-pixel flex flex-col max-h-[90dvh]"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      >
        {/* Header — immer sichtbar */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b-2 border-purple-500/30">
          <h2 className="text-xl font-black text-amber-300 tracking-wide">
            {onClose ? 'YOUR RUN' : 'CHOOSE YOUR PATH'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold text-sm border border-red-500/40 rounded-sm px-2 py-0.5 inline-flex items-center gap-1">
              {[...Array(maxLives)].map((_, i) => (
                <GameIcon key={i} name="heart" size={12} color={i < lives ? 'red' : 'gray'} />
              ))}
            </span>
            <span className="text-amber-300 font-bold text-sm border border-amber-500/40 rounded-sm px-2 py-0.5 inline-flex items-center gap-1"><GameIcon name="coin" size={14} color="amber" /> {gold}g</span>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-[#111827] border-2 border-[#2d3a5c] rounded-sm shadow-pixel-sm hover:bg-[#1e293b] transition text-white/60 font-black text-sm"
                title="Close"
              >
                X
              </button>
            )}
          </div>
        </div>

        {/* Scrollbarer Inhalt */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Render stages bottom-to-top (boss at top, stage 1 at bottom) */}
        <div className="flex flex-col-reverse gap-3">
          {map.stages.map((stageNodes, stageIdx) => {
            const stageNum = stageIdx + 1; // 1-indexed
            // Stage 1 (stageIdx=0) ist immer completed (auto-gespielt)
            const isCompleted = stageIdx < chooseStageIdx;
            const isActive = stageIdx === chooseStageIdx;
            const isFuture = stageIdx > chooseStageIdx;
            // chosenPath[i] = Wahl für den (i+1)-ten Map-Choice = stageIdx i+1
            const chosenOptionIdx = map.chosenPath[stageIdx - 1];

            return (
              <div key={stageIdx} ref={isActive ? activeStageRef : null} className="flex items-center gap-2">
                {/* Stage label */}
                <div className={`text-xs font-bold w-12 text-right shrink-0 ${isCompleted ? 'text-white/40' : isActive ? 'text-amber-300' : 'text-white/20'}`}>
                  S{stageNum}
                </div>

                {/* Nodes */}
                <div className="flex gap-2 flex-1 justify-center">
                  {stageNodes.map((node, optIdx) => {
                    const isChosen = chosenOptionIdx === optIdx;
                    const isPast = isCompleted && isChosen;
                    const isUnchosen = isCompleted && !isChosen;

                    if (isUnchosen) return null; // unchosen past options ausblenden

                    return (
                      <motion.button
                        key={optIdx}
                        disabled={!isActive || !!onClose}
                        onClick={() => isActive && !onClose && onChooseNode(optIdx)}
                        className={`flex-1 max-w-[100px] rounded-none border-4 px-2 py-2 text-center transition-all
                          ${isActive ? `cursor-pointer ${NODE_COLOR[node.type]}` : ''}
                          ${isPast ? 'border-white/20 bg-white/5 opacity-60 cursor-default' : ''}
                          ${isFuture ? 'border-white/10 bg-white/5 opacity-30 cursor-default' : ''}
                        `}
                        whileHover={isActive ? { scale: 1.04 } : {}}
                        whileTap={isActive ? { scale: 0.96 } : {}}
                      >
                        <div className="text-xl">{isFuture ? <GameIcon name="interrogation" size={20} color="gray" /> : NODE_ICON[node.type]}</div>
                        <div className={`text-xs font-bold mt-0.5 ${isActive ? 'text-white' : 'text-white/50'}`}>
                          {isFuture ? '???' : NODE_LABEL[node.type]}
                        </div>
                        {isActive && NODE_INFO[node.type] && (
                          <div className="flex flex-col gap-0.5 mt-1">
                            {NODE_INFO[node.type].map((row, i) => (
                              <div key={i} className="flex items-center justify-center gap-1">
                                <GameIcon name={row.icon} size={10} color={row.color} />
                                <span className="text-white/70 text-[9px] leading-none">{row.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-indigo-300/60 text-xs uppercase tracking-widest">
          Stage {currentStage} / {TOTAL_STAGES} complete
        </p>

        {/* Level + XP bar */}
        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-amber-300 font-black text-sm">Lv {level}</span>
            <span className="text-indigo-300 text-xs">{xp} / {xpToNextLevel} XP</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-none overflow-hidden mb-3">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((xp / xpToNextLevel) * 100))}%` }}
            />
          </div>

          {/* XP+ exchange — 10G → 25XP */}
          {(() => {
            const canAfford = gold >= 10;
            return (
              <div>
                <motion.button
                  onClick={() => canAfford && onExchange(10, 25)}
                  disabled={!canAfford}
                  className={`w-full py-2 border rounded-none text-center transition-all flex items-center justify-center gap-1.5
                    ${canAfford
                      ? 'border-teal-400/60 bg-teal-900/30 hover:bg-teal-800/50 cursor-pointer'
                      : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'}`}
                  whileHover={canAfford ? { scale: 1.02 } : {}}
                  whileTap={canAfford ? { scale: 0.97 } : {}}
                >
                  <GameIcon name="star" size={14} color={canAfford ? 'purple' : 'gray'} />
                  <span className={`font-black text-sm ${canAfford ? 'text-purple-300' : 'text-white/40'}`}>+25 XP</span>
                </motion.button>
                <div className={`text-center text-xs mt-1 inline-flex items-center justify-center w-full gap-0.5 ${canAfford ? 'text-amber-400/60' : 'text-white/20'}`}>
                  <GameIcon name="coin" size={10} color={canAfford ? 'amber' : 'gray'} />
                  <span>10G</span>
                </div>
              </div>
            );
          })()}
        </div>{/* end XP section */}
        </div>{/* end scrollable wrapper */}
      </motion.div>
    </motion.div>
  );
}
