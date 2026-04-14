import { motion } from 'framer-motion';
import { NODE_TYPES, TOTAL_STAGES } from '../constants/mapDefinitions';

const NODE_ICON = {
  [NODE_TYPES.NORMAL]: '⚔️',
  [NODE_TYPES.ELITE]: '💀',
  [NODE_TYPES.SHOP]: '🛒',
  [NODE_TYPES.REST]: '🔥',
  [NODE_TYPES.BOSS]: '👑',
};

const NODE_LABEL = {
  [NODE_TYPES.NORMAL]: 'Normal',
  [NODE_TYPES.ELITE]: 'Elite',
  [NODE_TYPES.SHOP]: 'Shop',
  [NODE_TYPES.REST]: 'Rest',
  [NODE_TYPES.BOSS]: 'Boss',
};

const NODE_COLOR = {
  [NODE_TYPES.NORMAL]: 'border-blue-400/60 bg-blue-900/30 hover:bg-blue-800/50',
  [NODE_TYPES.ELITE]: 'border-red-400/60 bg-red-900/30 hover:bg-red-800/50',
  [NODE_TYPES.SHOP]: 'border-yellow-400/60 bg-yellow-900/30 hover:bg-yellow-800/50',
  [NODE_TYPES.REST]: 'border-green-400/60 bg-green-900/30 hover:bg-green-800/50',
  [NODE_TYPES.BOSS]: 'border-purple-400/60 bg-purple-900/30',
};

export default function MapScreen({ map, currentStage, gold, onChooseNode }) {
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
        className="relative w-full max-w-sm mx-4 rounded-sm border-2 border-purple-500/60 bg-[#0d1117] shadow-pixel p-5"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-amber-300 tracking-wide">CHOOSE YOUR PATH</h2>
          <span className="text-amber-300 font-bold text-sm border border-amber-500/40 rounded-sm px-2 py-0.5">🪙 {gold}g</span>
        </div>

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
              <div key={stageIdx} className="flex items-center gap-2">
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
                        disabled={!isActive}
                        onClick={() => isActive && onChooseNode(optIdx)}
                        className={`flex-1 max-w-[120px] rounded-sm border-2 px-3 py-2 text-center transition-all
                          ${isActive ? `cursor-pointer ${NODE_COLOR[node.type]}` : ''}
                          ${isPast ? 'border-white/20 bg-white/5 opacity-60 cursor-default' : ''}
                          ${isFuture ? 'border-white/10 bg-white/5 opacity-30 cursor-default' : ''}
                        `}
                        whileHover={isActive ? { scale: 1.04 } : {}}
                        whileTap={isActive ? { scale: 0.96 } : {}}
                      >
                        <div className="text-xl">{isFuture ? '?' : NODE_ICON[node.type]}</div>
                        <div className={`text-xs font-bold mt-0.5 ${isActive ? 'text-white' : 'text-white/50'}`}>
                          {isFuture ? '???' : NODE_LABEL[node.type]}
                        </div>
                        {node.type === NODE_TYPES.ELITE && isActive && (
                          <div className="text-red-300 text-[10px] mt-0.5">+Rewards</div>
                        )}
                        {node.type === NODE_TYPES.BOSS && isActive && (
                          <div className="text-purple-300 text-[10px] mt-0.5">Final Stage</div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-indigo-300/60 text-xs mt-4 uppercase tracking-widest">
          Stage {currentStage} / {TOTAL_STAGES} complete
        </p>
      </motion.div>
    </motion.div>
  );
}
