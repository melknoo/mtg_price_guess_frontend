import GameIcon from '../../../shared/components/GameIcon';

export default function HowToPlayModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0a0e1a] border-2 border-[#2d3a5c] rounded-sm shadow-pixel text-white overflow-y-auto max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#111827] px-6 pt-5 pb-3 border-b-2 border-[#2d3a5c]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-[#111827] border-2 border-[#2d3a5c] rounded-sm shadow-pixel-sm hover:bg-[#1e293b] transition text-white/70 text-sm font-bold"
          >
            X
          </button>
          <h2 className="text-2xl font-bold text-amber-200 flex items-center gap-2">
            <GameIcon name="scroll" color="amber" size={20} />
            How to Play
          </h2>
          <p className="text-purple-300 text-sm mt-0.5">Magic Price Duel — Quick Guide</p>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* The Basics */}
          <section>
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-2">The Basics</h3>
            <div className="bg-[#111827] border-2 border-[#2d3a5c] rounded-sm p-4 space-y-2 text-sm text-white/85">
              <p>Two <span className="text-amber-300 font-medium">Magic: The Gathering</span> cards appear on screen.</p>
              <p className="flex items-center gap-2">
                <GameIcon name="next" color="amber" size={16} />
                <span>Tap (or click) the card you think is <span className="text-emerald-400 font-medium">worth more money</span>.</span>
              </p>
              <p>Prices are based on real market data.</p>
            </div>
          </section>

          {/* Lives & Rewards */}
          <section>
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-2">Lives & Rewards</h3>
            <div className="bg-[#111827] border-2 border-[#2d3a5c] rounded-sm p-4 space-y-2 text-sm text-white/85">
              <div className="flex items-start gap-2">
                <div className="flex gap-0.5 shrink-0 mt-0.5">
                  {[0,1,2,3,4].map(i => <GameIcon key={i} name="heart" color="red" size={14} />)}
                </div>
                <span>You have <strong>5 lives</strong>. A wrong answer costs one life. Lose all five — run over.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5"><GameIcon name="thunder" color="orange" size={16} /></span>
                <span><strong>Streak bonus:</strong> consecutive correct answers multiply your XP & Gold. Don't break the chain!</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5"><GameIcon name="wind" color="blue" size={16} /></span>
                <span><strong>Speed bonus:</strong> each round has a timer. Faster answers earn extra XP.</span>
              </div>
            </div>
          </section>

          {/* Roguelike layer */}
          <section>
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-2">Perks & Relics</h3>
            <div className="bg-[#111827] border-2 border-[#2d3a5c] rounded-sm p-4 space-y-2 text-sm text-white/85">
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5"><GameIcon name="potion" color="purple" size={16} /></span>
                <span>Every <strong>3 rounds</strong> pick one of 3 <span className="text-purple-300">Perks</span> — permanent bonuses with unique effects.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5"><GameIcon name="gem" color="amber" size={16} /></span>
                <span>When you <strong>level up</strong>, choose a permanent <span className="text-amber-300">Relic</span> that lasts the whole run.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5"><GameIcon name="follow" color="teal" size={16} /></span>
                <span>Stack multiple items with matching <strong>tags</strong> to trigger powerful <span className="text-emerald-300">Synergies</span> — some combos are game-breaking on purpose.</span>
              </div>
            </div>
          </section>

          {/* Keyboard shortcuts */}
          <section>
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-2">Keyboard Controls</h3>
            <div className="bg-[#111827] border-2 border-[#2d3a5c] rounded-sm p-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-white/80">
              <div><kbd className="bg-[#1e293b] border border-[#2d3a5c] px-1.5 py-0.5 rounded-sm text-xs font-mono">1</kbd> or <kbd className="bg-[#1e293b] border border-[#2d3a5c] px-1.5 py-0.5 rounded-sm text-xs font-mono">A</kbd> — Left card</div>
              <div><kbd className="bg-[#1e293b] border border-[#2d3a5c] px-1.5 py-0.5 rounded-sm text-xs font-mono">2</kbd> or <kbd className="bg-[#1e293b] border border-[#2d3a5c] px-1.5 py-0.5 rounded-sm text-xs font-mono">D</kbd> — Right card</div>
              <div><kbd className="bg-[#1e293b] border border-[#2d3a5c] px-1.5 py-0.5 rounded-sm text-xs font-mono">Space</kbd> — Continue</div>
              <div><kbd className="bg-[#1e293b] border border-[#2d3a5c] px-1.5 py-0.5 rounded-sm text-xs font-mono">S</kbd> — Skip card</div>
            </div>
          </section>

          {/* Goal */}
          <div className="bg-[#111827] border-2 border-amber-600/50 rounded-sm p-4 text-sm text-amber-200 text-center flex items-center justify-center gap-2">
            <GameIcon name="trophy" color="amber" size={16} />
            <span>Survive the run. Build broken combos. Climb the leaderboard.</span>
          </div>

        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full bg-emerald-700 hover:bg-emerald-600 border-2 border-emerald-500 rounded-sm py-3 font-semibold transition-all shadow-pixel-sm active:scale-95"
          >
            Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
}
