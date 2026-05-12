import { motion } from 'framer-motion';
import { NODE_TYPES, TOTAL_STAGES } from '../constants/mapDefinitions';
import GameIcon from '../../../shared/components/GameIcon';

const NODE_LABELS = {
  [NODE_TYPES.NORMAL]: 'Normal',
  [NODE_TYPES.ELITE]: 'Elite',
  [NODE_TYPES.SHOP]: 'Shop',
  [NODE_TYPES.REST]: 'Rest',
  [NODE_TYPES.BOSS]: 'Boss',
  [NODE_TYPES.MYSTERY]: 'Mystery',
  [NODE_TYPES.EXCHANGE]: 'Exchange',
  [NODE_TYPES.MINI_BOSS]: 'Mini Boss',
};

export default function StageCompleteScreen({ stage, totalStages = TOTAL_STAGES, stageScore, stageCorrect, level, nodeType, onContinue }) {
  const isBossStage = stage >= totalStages;
  const nodeLabel = NODE_LABELS[nodeType] ?? 'Normal';

  const pipWidth = (totalStages > 6) ? 'w-4' : 'w-8';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-sm mx-4 rounded-none border-4 border-amber-500 bg-[#0d1117] shadow-pixel p-6 text-center"
        initial={{ scale: 0.85, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 40 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* Stage badge */}
        <div className="flex justify-center mb-3">
          {isBossStage
            ? <GameIcon name="trophy" size={40} color="amber" />
            : <GameIcon name="sword"  size={40} color="white"  />}
        </div>

        <h2 className="text-2xl font-black text-amber-300 mb-1 tracking-wide uppercase">
          {isBossStage ? 'Run Complete!' : `Stage ${stage} Clear!`}
        </h2>
        <p className="text-indigo-300 text-sm mb-4">
          {isBossStage
            ? 'You defeated the Boss — incredible run!'
            : `${nodeLabel} stage cleared — choose your next path`}
        </p>

        {/* Stage progress pips */}
        <div className="flex justify-center gap-1 mb-5 flex-wrap">
          {Array.from({ length: totalStages }).map((_, i) => (
            <div
              key={i}
              className={`h-2 ${pipWidth} rounded-none transition-colors ${
                i < stage ? 'bg-amber-400' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white/5 border-2 border-white/20 rounded-none p-3">
            <div className="text-amber-300 font-black text-lg">{stageScore ?? 0}</div>
            <div className="text-indigo-300 text-xs uppercase tracking-wide">Score</div>
          </div>
          <div className="bg-white/5 border-2 border-white/20 rounded-none p-3">
            <div className="text-green-300 font-black text-lg">{stageCorrect ?? 0}</div>
            <div className="text-indigo-300 text-xs uppercase tracking-wide">Correct</div>
          </div>
          <div className="bg-white/5 border-2 border-white/20 rounded-none p-3">
            <div className="text-yellow-300 font-black text-lg">Lv {level ?? 1}</div>
            <div className="text-indigo-300 text-xs uppercase tracking-wide">Level</div>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3 rounded-none font-bold text-base bg-amber-500 hover:bg-amber-400 text-black transition-colors shadow-pixel border-4 border-amber-600 uppercase tracking-wide"
        >
          {isBossStage ? 'Finish Run' : 'Continue →'}
        </button>
      </motion.div>
    </motion.div>
  );
}
