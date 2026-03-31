export default function HowToPlayModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#1a2f5e] to-[#0d1b3e] border border-white/20 rounded-2xl shadow-2xl text-white overflow-y-auto max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1a2f5e]/95 backdrop-blur px-6 pt-5 pb-3 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white/90 text-xl leading-none"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold text-amber-200">🧙‍♂️ How to Play</h2>
          <p className="text-purple-300 text-sm mt-0.5">Magic Price Duel — Quick Guide</p>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* The Basics */}
          <section>
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-2">The Basics</h3>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm text-white/85">
              <p>Two <span className="text-amber-300 font-medium">Magic: The Gathering</span> cards appear on screen.</p>
              <p>👉 Tap (or click) the card you think is <span className="text-emerald-400 font-medium">worth more money</span>.</p>
              <p>Prices are based on real market data.</p>
            </div>
          </section>

          {/* Lives & Scoring */}
          <section>
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-2">Lives & Scoring</h3>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm text-white/85">
              <div className="flex items-start gap-2">
                <span className="text-red-400 shrink-0">❤️❤️❤️❤️❤️</span>
                <span>You have <strong>5 lives</strong>. A wrong answer costs one life. Lose all five — run over.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 shrink-0">🔥</span>
                <span><strong>Streak bonus:</strong> consecutive correct answers multiply your score. Don't break the chain!</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 shrink-0">⚡</span>
                <span><strong>Speed bonus:</strong> each round has a 10-second timer. Faster answers earn extra points.</span>
              </div>
            </div>
          </section>

          {/* Roguelike layer */}
          <section>
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-2">Perks & Relics</h3>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm text-white/85">
              <div className="flex items-start gap-2">
                <span className="text-purple-400 shrink-0">✨</span>
                <span>Every <strong>5 rounds</strong> pick one of 3 <span className="text-purple-300">Perks</span> — temporary boosts with unique effects.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 shrink-0">💎</span>
                <span>When you <strong>level up</strong>, choose a permanent <span className="text-amber-300">Relic</span> that lasts the whole run.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 shrink-0">⚙️</span>
                <span>Stack multiple items with matching <strong>tags</strong> to trigger powerful <span className="text-emerald-300">Synergies</span> — some combos are game-breaking on purpose.</span>
              </div>
            </div>
          </section>

          {/* Keyboard shortcuts */}
          <section>
            <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-2">Keyboard Controls</h3>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-white/80">
              <div><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">1</kbd> or <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">A</kbd> — Left card</div>
              <div><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">2</kbd> or <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">D</kbd> — Right card</div>
              <div><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">Space</kbd> — Continue</div>
              <div><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">S</kbd> — Skip card</div>
            </div>
          </section>

          {/* Goal */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200 text-center">
            🏆 Beat your high score. Build broken combos. Climb the leaderboard.
          </div>

        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="btn-primary btn-full"
          >
            Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
}
