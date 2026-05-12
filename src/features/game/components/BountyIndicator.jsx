import { motion } from 'framer-motion';
import GameIcon from '../../../shared/components/GameIcon';

function getProgress(goal, progress) {
  if (!goal) return null;
  switch (goal.id) {
    case 'answer_8_of_10':
      return { current: Math.min(progress.correct, 8), target: 8, label: 'correct' };
    case 'streak_5':
      return { current: Math.min(progress.maxStreak, 5), target: 5, label: 'best streak' };
    case 'no_wrong':
      return { current: progress.wrong, target: 0, label: 'wrong', inverted: true };
    case 'earn_200g':
      return { current: Math.min(progress.stageGold, 200), target: 200, label: 'G earned' };
    case 'reach_streak_10':
      return { current: Math.min(progress.maxStreak, 10), target: 10, label: 'best streak' };
    case 'first_5_perfect':
      return { current: Math.min(progress.perfectFirst5, 5), target: 5, label: 'perfect' };
    default:
      return null;
  }
}

function isWon(goal, progress) {
  if (!goal) return false;
  switch (goal.id) {
    case 'answer_8_of_10': return progress.correct >= 8;
    case 'streak_5':       return progress.maxStreak >= 5;
    case 'no_wrong':       return progress.wrong === 0;
    case 'earn_200g':      return progress.stageGold >= 200;
    case 'reach_streak_10':return progress.maxStreak >= 10;
    case 'first_5_perfect':return progress.perfectFirst5 >= 5;
    default: return false;
  }
}

export default function BountyIndicator({ goal, progress, stageComplete = false }) {
  if (!goal) return null;

  const prog = getProgress(goal, progress);
  const won = isWon(goal, progress);

  return (
    <motion.div
      className={`w-full max-w-2xl mb-1 px-3 py-2 rounded-sm border-2 flex items-center gap-3
        ${won
          ? 'border-teal-400/80 bg-teal-900/20'
          : 'border-teal-600/50 bg-teal-950/30'
        }`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Icon */}
      <div className={`shrink-0 w-7 h-7 rounded-sm flex items-center justify-center border
        ${won ? 'bg-teal-700/40 border-teal-400/60' : 'bg-teal-900/40 border-teal-600/40'}`}>
        <GameIcon name="trophy" size={14} color={won ? 'teal' : 'teal'} />
      </div>

      {/* Goal text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-teal-300/60 text-xs uppercase tracking-widest font-bold">Bounty</span>
          {won && (
            <motion.span
              className="text-teal-300 text-xs font-black uppercase tracking-wide"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              Complete!
            </motion.span>
          )}
        </div>
        <div className="text-white/90 text-xs font-semibold truncate">{goal.label}</div>
      </div>

      {/* Progress */}
      {prog && (
        <div className="shrink-0 text-right">
          {prog.inverted ? (
            // "no_wrong" — show wrong count, want 0
            <span className={`text-sm font-black ${prog.current === 0 ? 'text-teal-300' : 'text-red-400'}`}>
              {prog.current} wrong
            </span>
          ) : (
            <span className={`text-sm font-black ${won ? 'text-teal-300' : 'text-white/80'}`}>
              {prog.current}<span className="text-white/40 font-normal text-xs"> / {prog.target}</span>
            </span>
          )}
        </div>
      )}

      {/* Rewards preview */}
      <div className="shrink-0 flex items-center gap-2 pl-2 border-l border-teal-600/30">
        <div className="flex items-center gap-1">
          <GameIcon name="coin" size={12} color="amber" />
          <span className="text-amber-300 text-xs font-bold">+{goal.goldReward}G</span>
        </div>
        <div className="flex items-center gap-1">
          <GameIcon name="star" size={12} color="purple" />
          <span className="text-purple-300 text-xs font-bold">Perk</span>
        </div>
      </div>
    </motion.div>
  );
}
