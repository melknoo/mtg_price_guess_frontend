# Magic Price Duel - Frontend

## Project Overview

Magic Price Duel is a Magic: The Gathering card price guessing game. Players see two MTG cards side by side and must pick the more expensive one. The game features a lives system (5 lives max), streak tracking, a 10-second timer, a full roguelike progression system (Perks, Relics, Synergies, XP/Levels), and 25+ achievements across 6 categories.

**Live:** Deployed on Vercel (React frontend) + Fly.io (WinterCMS/PHP backend)
**Language:** UI is in English, some code comments are in German — keep both conventions as-is.

## Tech Stack

- **React** (CRA, not Vite) with feature-based architecture
- **Tailwind CSS** for styling
- **Framer Motion** for animations (`motion.div`, `AnimatePresence`, `createPortal` for tooltips)
- **Axios** for API calls (centralized client with interceptors)
- **react-google-recaptcha** for spam prevention
- **Scryfall** as card data source (via backend proxy)

## Project Structure

```
src/
├── api/
│   └── axios.js                    # Centralized Axios client, interceptors, auth header injection
├── features/
│   ├── auth/
│   │   ├── api/authApi.js
│   │   ├── components/             # LoginForm, RegisterWithScore, ForgotPassword, ResetPassword
│   │   ├── context/AuthContext.jsx  # Auth state provider, token management, user CRUD
│   │   └── hooks/useAuth.js
│   ├── game/
│   │   ├── api/
│   │   │   ├── gameApi.js          # fetchRandomCards, updateHighscore
│   │   │   ├── achievementApi.js   # fetch, unlock, unlock-batch, sync
│   │   │   ├── dailyChallengeApi.js
│   │   │   └── statsApi.js
│   │   ├── components/
│   │   │   ├── Game.jsx            # Main orchestrator — all game state, hooks, flow
│   │   │   ├── CardPair.jsx        # Two cards side by side with selection borders
│   │   │   ├── GameTimer.jsx       # Visual countdown timer bar
│   │   │   ├── GameOverScreen.jsx  # End screen: score, restart, register prompt
│   │   │   ├── StreakDisplay.jsx
│   │   │   ├── LivesDisplay.jsx
│   │   │   ├── PerkSelectionModal.jsx   # Modal: pick 1 of 3 perks every 3 rounds
│   │   │   ├── LevelUpModal.jsx         # Modal: level-up reward (perk/relic/upgrade)
│   │   │   ├── ActivePerksDisplay.jsx   # Sidebar (desktop) / collapsible (mobile)
│   │   │   ├── SynergyToast.jsx         # Toast when a new synergy activates
│   │   │   ├── AchievementsDisplay.jsx
│   │   │   ├── AchievementToast.jsx
│   │   │   ├── DailyChallengeGame.jsx
│   │   │   ├── StatsDisplay.jsx
│   │   │   ├── RunCompleteModal.jsx     # NEW: shown after boss defeat (End Run / Continue Endless)
│   │   │   ├── RewardComboReveal.jsx    # XP-only popup with tiered animations
│   │   │   ├── ShopScreen.jsx           # Shop with 2 random merchants per visit
│   │   │   ├── MerchantPanel.jsx        # Per-merchant panels (ArmorerPanel, PerkVendorPanel sub-components)
│   │   │   ├── MapScreen.jsx            # Run map navigation between stages
│   │   │   ├── StageCompleteScreen.jsx  # Stage end summary (score, correct, node type)
│   │   │   ├── RestScreen.jsx           # Rest node: heal 1 life or upgrade a perk duration
│   │   │   ├── ExchangeScreen.jsx       # Exchange node: spend gold for XP
│   │   │   ├── CurseScreen.jsx          # Curse node: forced negative-perk selection
│   │   │   ├── BountyIndicator.jsx      # Per-stage bounty goal progress HUD
│   │   │   ├── MetaProgressionScreen.jsx # Between-run upgrades, kits, ascension selection
│   │   │   ├── FilterOddsModal.jsx      # Shows card-pool probabilities for active filter perks
│   │   │   ├── SynergyConflictModal.jsx # Conflict resolution when >maxSynergySlots would activate
│   │   │   └── ReplacePerkModal.jsx     # Perk slot overflow: choose which perk to replace or skip
│   │   ├── constants/
│   │   │   ├── achievementDefinitions.js
│   │   │   ├── perkDefinitions.js       # Perks, types, rarities, tags, extended variants
│   │   │   ├── relicDefinitions.js      # Relics with tags, effects, rarities
│   │   │   ├── synergyDefinitions.js    # Synergy combos: requiredTags → effect
│   │   │   └── mapDefinitions.js        # Stage types, map structure, merchant types
│   │   ├── context/
│   │   │   └── AchievementContext.jsx
│   │   ├── hooks/
│   │   │   ├── useGameTimer.js
│   │   │   ├── useStreak.js
│   │   │   ├── useCardLoader.js
│   │   │   ├── usePerkSystem.js         # Perk lifecycle: generation, selection, duration, consumption
│   │   │   ├── useRelicSystem.js        # Permanent relics for the entire run
│   │   │   ├── useSynergyEngine.js      # Tag counting, synergy activation, permanence
│   │   │   ├── useLevel.js             # XP/Level system with thresholdMultiplier
│   │   │   ├── useGold.js              # Gold currency: add/spend/totalEarned
│   │   │   ├── useMapSystem.js         # Stage map generation, progression, stage completion
│   │   │   ├── useAscension.js         # Ascension levels 1–10, crystal bonuses, difficulty modifiers
│   │   │   ├── useMetaProgression.js   # Cross-run upgrades (crystals), starting kits, persistent unlocks
│   │   │   ├── useSavedRun.js          # Save/load run state — localStorage + server sync (runApi.js)
│   │   │   ├── usePerkCombos.js        # Perk combo detection: activeCombos from PERK_COMBOS constant
│   │   │   ├── useRunLogger.js         # Structured per-run event logging (rounds, perks, relics) for stats API
│   │   │   ├── useAchievements.js
│   │   │   └── useGameLogic.js         # Legacy — Game.jsx composes hooks directly
│   │   └── utils/
│   │       ├── cardComparison.js
│   │       ├── rewardCalculator.js     # calculateBaseXP, calculateTimeBonusXP, calculateStreakGold, calculateStreakXP
│   │       └── scoreCalculator.js
│   ├── leaderboard/
│   ├── suggestions/
│   ├── legal/
│   └── account/
├── shared/
│   ├── components/
│   └── utils/
│       └── constants.js           # GAME_CONFIG, SCORE_CONFIG, STORAGE_KEYS, SCREENS
└── App.jsx
```

## Roguelike System

### Overview

Every 3 rounds: `PerkSelectionModal` offers 3 perks.
On level-up: `LevelUpModal` offers 3–4 options (perk / relic / upgrade to existing perk).
Every 3rd level (3, 6, 9, …): LevelUpModal shows a **relic selection** instead of a perk — managed via `relicMilestoneQueue` state in Game.jsx.

**Four layers:**
1. **Perks** — temporary (duration-based) or permanent buffs. Defined in `perkDefinitions.js`.
2. **Relics** — permanent for the entire run. Defined in `relicDefinitions.js`.
3. **Synergies** — auto-activate when tag thresholds are met. Defined in `synergyDefinitions.js`.
4. **Perk Combos** — bonus effects when specific perk combinations are active simultaneously. Defined in `perkCombos.js`, detected by `usePerkCombos`.

### Tag System

Every perk and relic has a `tags` array (e.g. `['speed', 'defense']`). Tags: `speed`, `defense`, `score`, `streak`, `xp`, `luck`.

`useSynergyEngine` counts all tags across active relics + perks. When counts meet `requiredTags` thresholds, a synergy activates.

**Important:** Upgraded perks (e.g. Time Buffer → Time Buffer+) store `upgradeCount` on the merged perk entry. `useSynergyEngine` multiplies that perk's tag contribution by `upgradeCount` so the upgrade counts as a second tag source for synergy activation.

### Synergy Permanence

Once a synergy activates, it's stored in `permanentSynergies` state inside `useSynergyEngine` and **never deactivates** for the rest of the run — even if the contributing perks expire. This prevents synergies from flickering when perks run out.

### Active Synergies Applied in Game.jsx

| Synergy | Effect |
|---------|--------|
| Speed Demon (`double_time_bonus`) | Timer bonus doubled via `getTimerDuration()` |
| Scholar (`reduced_xp_threshold`) | `addXP(amount, 0.8)` — 20% less XP needed per level |
| Hot Streak (`exponential_streak_bonus`) | Streak bonus = `STREAK_BONUS_POINTS * (2^blocks - 1)` |
| Gold Rush (`permanent_score_mult`) | Score multiplied permanently |
| Fortune (`extra_pick_option`) | `LevelUpModal` shows 4 options instead of 3 |
| Fortress (`improved_regen`) | Independent heart regen counter (threshold = 8), separate from Heart Regeneration perk |
| Berserker (`low_hp_bonus`) | 2× XP + 2× Score at 1 life |

### Hook: `useLevel`

```js
const { xp, level, xpToNextLevel, showLevelUp, addXP, dismissLevelUp, reset } = useLevel();
// thresholdMultiplier: Scholar synergy passes 0.8
addXP(amount, thresholdMultiplier = 1);
```
XP curve: `50 + level * 25` per level. Supports multi-level-up in one call.

### Hook: `useRelicSystem`

```js
const { activeRelics, addRelic, hasRelic, getRelicValue, getRelicsByTag, reset } = useRelicSystem();
```
Relics are permanent — no duration decrement. No duplicates by ID.

### Hook: `useSynergyEngine`

```js
const {
  activeSynergies, permanentSynergies,
  hasSynergy, getSynergyValue,
  maxSynergySlots,      // default 3; expanded by Synergy Expander relic
  resolveConflict,      // resolveConflict(dropId, pendingSynergy) — called from SynergyConflictModal
  reset
} = useSynergyEngine(activeRelics, activePerks, onNewSynergy);
```
`getSynergyValue(effect)` returns the `value` of the first synergy with that effect, or `null`.
When a new synergy would exceed `maxSynergySlots`, `SynergyConflictModal` (z-[70]) is shown — player drops an existing or skips the new synergy.

### LevelUpModal

`generateOptions(level, ownedRelicIds, activePerks, activeSynergies, hasFortune)` returns 3 (or 4 if Fortune active) options — each is a perk, relic, or upgrade to an existing perk (`category: 'upgrade'`).

Upgrade options use `basePerkId` / `isExtended` to find the matching base perk in `activePerks`.

Shows a synergy-prediction badge per option: which synergies would activate if you picked that option.

**`forceRelicMode` prop:** When `true`, the modal skips the normal option generation and instead shows 3 random relics to choose from. Used for:
- Level milestone rewards: `forceRelicMode={relicMilestoneQueue[0] === true}` (every 3rd level)
- Elite stage relic drops: `eliteRelicPending` state triggers a second LevelUpModal instance with `forceRelicMode={true}`

**Relic Milestone Queue Pattern (Game.jsx):**
```js
// relicMilestoneQueue: boolean[] — true = next modal is relic, false = normal perk/upgrade
// Built when level increases:
useEffect(() => {
  if (level.level > prevLevelRef.current) {
    const queue = [];
    for (let l = prevLevelRef.current + 1; l <= level.level; l++) {
      queue.push(l % 3 === 0); // true = relic milestone
    }
    setRelicMilestoneQueue(prev => [...prev, ...queue]);
    prevLevelRef.current = level.level;
  }
}, [level.level]);
// Pop queue head in both handleLevelUpSelect and handleLevelUpSkip:
setRelicMilestoneQueue(prev => prev.slice(1));
```
This correctly handles multi-level-up: each pending modal gets the right type in order.

## ActivePerksDisplay

Sidebar (desktop, scrollable full-height) / collapsible panel (mobile).

Shows Perks, Relics, Synergies in separate sections with:
- **Tag chips** colored by type (speed=blue, defense=green, score=yellow, streak=orange, xp=purple, luck=pink)
- **Counter display** for items with progress (`round_heal`, `heart_regen`, `improved_regen`)
- **Portal-based tooltips** (via `createPortal` to `document.body`) — avoids overflow clipping from scrollable sidebar. Position computed via `getBoundingClientRect()`, flips upward if card is in bottom 35% of viewport.
- **Flash animation** (`flashingRelics` Set): golden burst + scale punch when a relic triggers
- **Tick animation** (`tickingRelics` Set): subtle glow + small scale bump each counter increment

### Counter Logic (`getCounterInfo`)

```js
// round_heal (Card Counter): currentRound % item.value / item.value
// heart_regen (Heart Regeneration perk): from heartRegenProgress prop
// improved_regen (Fortress synergy): from fortressRegenCount prop (independent counter in Game.jsx)
```

## Relic Flash / Tick System (Game.jsx)

```js
const [flashingRelics, setFlashingRelics] = useState(new Set()); // 1.2s
const [tickingRelics, setTickingRelics] = useState(new Set());   // 0.6s
const [fortressRegenCount, setFortressRegenCount] = useState(0);

flashRelic(id); // golden burst animation
tickRelic(id);  // subtle tick animation
```

Flash triggers: `momentum`, `price_sense`, `quick_learner`, `combo_master` (every 3 streak), `iron_will`, `treasure_hunter`, `card_counter` (every 10 rounds), `heart_regeneration` (on regen).

Tick triggers: `card_counter` (every non-trigger round), `heart_regeneration` + `fortress` (every correct answer when perk is active).

## Perk System Details

- Perks trigger every 3 rounds via `perkSystem.triggerPerkSelection()`
- Weighted random generation: Common 60, Rare 30, Epic 10
- Extended variants (`basePerkId` + `isExtended: true`) merge into existing perk, extending duration by `bonusDuration` and incrementing `upgradeCount`
- `upgradeCount` is read by `useSynergyEngine` to count tags multiple times per upgraded perk
- `getPerkValue(effect)` returns the value of the first active perk with that effect

## Score / Reward Calculation

Game uses **Gold + XP** dual rewards (no raw score). Calculations live in `rewardCalculator.js`.

```js
// Base XP per correct answer (rewardCalculator.js)
calculateBaseXP(isCorrect, isPerfect, timeLeft, multipliers)
calculateTimeBonusXP(timeLeft)

// Streak bonuses (rewardCalculator.js) — both Gold and XP:
calculateStreakGold(streak)   // streak < 5 → 0; else floor(streak * 0.4)
calculateStreakXP(streak)     // same formula — streak 5→+2, 10→+4, 15→+6, 20→+8

// Hot Streak synergy (exponential_streak_bonus): multiplies streak block bonus
```

**Gold earn rates:**
- +2G base per correct answer (+ Gold Wellspring relic bonus)
- +5G / +10G / +15G at streak milestones
- +15G on level-up
- Streak per-answer bonus: `calculateStreakGold(streak)` (active from streak 5+)

**XP earn rates:**
- Base XP + time bonus per correct answer
- Streak per-answer XP: `calculateStreakXP(streak)` added to xpGained and xpBreakdown
- Scholar synergy: `addXP(amount, 0.8)` — 20% less XP needed per level

**applyGoldEffects()** in `Game.jsx` — all relic/perk/synergy gold math lives here.

## Backend API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/random-cards?count=20` | Fetch random MTG cards |
| POST | `/api/score` | Submit highscore |
| GET | `/api/leaderboard` | Leaderboard |
| POST | `/api/suggestions` | Submit suggestion |
| GET/POST | `/api/achievements/*` | Achievement sync |
| POST | `/auth/login` | Login |
| POST | `/auth/register` | Register |
| POST | `/auth/register-with-score` | Register + save score |
| GET | `/auth/me` | Current user |

## Key Game Flow

1. **Init:** `preloadCards()` → `setNextPair()` → images load → `timer.start()`
2. **Each round:** Player picks → `handleChoice(index)` → timer stops → prices revealed → XP/Gold/streaks updated
3. **XP gain:** `level.addXP(amount, scholarMult)` — triggers `level.showLevelUp = true`
4. **Level up:** `LevelUpModal` shown → player picks reward → `handleLevelUpSelect(pick)` — routes to `addRelic`, `selectPerk`, or perk upgrade. Pop `relicMilestoneQueue` head in both select and skip.
5. **Next pair:** `handleNextPair()` → round++ → if `round % 3 === 0` → `PerkSelectionModal` (3 perks, or 2 if Ascension modifier active) → else next card
6. **Card Counter:** every 10 rounds → +1 life, `flashRelic('card_counter')`
7. **Wrong answer:** -1 life → if 0 → game over
8. **Stage complete:** `StageCompleteScreen` shown → continue → if elite stage → `eliteRelicPending = true` (triggers relic drop); if boss stage → `runComplete = true` (triggers `RunCompleteModal`)
9. **Run complete (boss):** `RunCompleteModal` shows with Gold/XP/Level stats and two options:
   - **End Run** → `setGameOver(true)`
   - **Continue (Endless Mode)** → `setEndlessDifficulty(prev => prev + 1)` + `mapSystem.reset()` + `mapSystem.generateMap()`
10. **Endless Mode:** `endlessDifficulty` increments each loop; `getTimerDuration()` subtracts `endlessDifficulty` from timer (harder with each endless loop)

## Keyboard Controls
- `1` / `A` — Select left card
- `2` / `D` — Select right card
- `Space` / `Enter` — Continue
- `S` — Skip card (if skip perk active)

## Console Logging
- `[LevelUp] CATEGORY name (id) [tags]` — on level-up selection
- `[Perk] name (id) [tags]` — on perk selection
- `[Synergy ACTIVATED] name` — when a new synergy fires

## Common Pitfalls

1. **`useGameLogic.js` is legacy** — `Game.jsx` composes hooks directly. Don't refactor.
2. **Synergies are permanent once activated** — `permanentSynergies` in `useSynergyEngine` ensures they never deactivate. Don't replace with purely reactive logic.
3. **`upgradeCount` must flow through** — When a perk is upgraded (merged), `upgradeCount` increments. `useSynergyEngine` uses it to count tags multiple times. Don't flatten perks during merge.
4. **Portal tooltips** — `DesktopPerkCard` renders its tooltip via `createPortal(content, document.body)` and positions with `position: fixed`. This is necessary because `overflow-y: auto` on the scrollable sidebar would clip absolute-positioned children. Don't revert to CSS group-hover tooltips inside the scroll container.
5. **Independent regen counters** — Heart Regeneration perk and Fortress synergy have SEPARATE counters. Fortress uses `fortressRegenCount` in Game.jsx, NOT the perk system's counter. Each gives a heart independently.
6. **`getTimerDuration` depends on `synergyEngine`** — Speed Demon multiplier is applied here, and `endlessDifficulty` subtracts from the base duration. Make sure both are in the dependency array.
7. **Fortune synergy** — `generateOptions` in `LevelUpModal` checks `hasFortune` to generate a 4th slot. The grid changes to `md:grid-cols-4`.
8. **Perk timing** — `decrementPerkDurations()` must be called AFTER answer processing. Perks activate immediately on selection.
9. **Achievement tracking uses refs** — prevents duplicate unlocks in React strict mode. Don't convert to state.
10. **Guest users** — `{ guest: true }`. Always check before auth-required API calls.
11. **Prices in EUR** — all comparisons use `parseFloat(card.prices.eur)`.
12. **Glass Mind** — fires on ANY correct answer (not just isPerfect). The condition is `isCorrect && hasPerk('glass_mind')`, NOT `isPerfect && ...`.
13. **Shop stable item lists** — `ArmorerPanel` and `PerkVendorPanel` are separate sub-components in `MerchantPanel.jsx` with their own `useState(() => pickRelics(...))` / `useState(() => pickPerks(...))`. This prevents the item list from re-randomizing when gold changes (which causes re-renders). When a player buys an item, it's filtered out of the local state list — the other items remain stable.
14. **Shop canBuyPerkSlot** — condition is `perkSlotInfo.max < 5` (can the cap be raised?), NOT `perkSlotInfo.used < perkSlotInfo.max` (are there free slots?). Same for `canBuyUtilitySlot`: `utilitySlotInfo.max < 2`.
15. **Elite relic drop** — `eliteRelicPending` state in Game.jsx. After StageCompleteScreen dismisses for an elite node, a second `LevelUpModal` renders with `forceRelicMode={true}`. Its `onSelect` handler calls ONLY `relicSystem.addRelic(pick)` — NOT `level.dismissLevelUp()`, since there is no pending level-up.
16. **Relic milestone queue** — `relicMilestoneQueue` is a `boolean[]` in Game.jsx. Pop head on BOTH select and skip in LevelUpModal. Never call `level.dismissLevelUp()` twice for the same modal.
17. **Run seed** — `runSeed` state initialized with `useState(() => Math.random().toString(36).slice(2,6).toUpperCase())`. Cosmetic only, reset on restart. Displayed as `#XXXX` in HUD instead of the old roadmap button.
18. **Compound Interest accumulated display** — `perkSystem.compoundInterestAccRef` is a ref (not state) for sync access. Passed as `compoundAccRef` prop to `ActivePerksDisplay`, which reads `.current` to show "Acc: +N XP" on the compound interest perk card.
19. **Slot-based perk system** — `3 passive / 1 utility` start slots. Soft caps: `5 passive / 2 utility`. When a new perk's slot type is full, `ReplacePerkModal` opens to swap or skip. Shop sells `Passive Perk Slot` and `Utility Slot` upgrades (capped at soft cap). `Skip Card` = utility perk, 1 charge, recharges at `stage_start`. `Extra Life` stays in utility slot after use (empty charge, no auto-remove).
20. **Synergy max slots** — default 3; expandable to 4 via the `Synergy Expander` relic (Legendary). When the 4th+ synergy would fire, `SynergyConflictModal` opens for conflict resolution.
21. **Relic soft cap** — `RELIC_FREE_CAP = 6`. Relics beyond this cost 25G each (10G with Hoarder relic). Check in `handleLevelUpSelect` + `handleRelicRoundSelect`.
22. **Filter perk system** — All filter perks have `duration: -1` (permanent run). Filter dispatch uses `perk.effect` in `useCardLoader.updateFilters()`. Available `FILTER_EFFECTS`: COLOR, COLOR_EXCLUDE, CMC, CMC_EXCLUDE, BORDER, RARITY, RARITY_EXCLUDE, TYPE, TYPE_EXCLUDE. Requires DB migration 1.0.14 + re-import for `type_line` perks.
23. **Meta-progression saves to localStorage** under `mtg_meta_progression`. Cross-run currency: **crystals** (earned via boss wins + ascension bonuses). Spend in `MetaProgressionScreen`. Meta upgrades: `+1 starting life`, `+1 max lives`, `extra passive slot`, `extra utility slot`, `extra relic slot`, `+15G start`, `5% shop discount`. Starting Kits give a starting perk + trade-off; only one kit active per run.
24. **Ascension system** — 10 difficulty levels unlocked by beating boss at current level. Stored in localStorage (`mtg_ascension_level`). Modifiers: `timerReduction`, `perkChoices` (2 instead of 3), `startingLivesOffset`, `goldReduction`, `noRestNodes`, `bossHarder`. Higher ascension = higher crystal bonus multiplier (up to 5.0×).
25. **Saved run (cross-device)** — `useSavedRun` saves to localStorage (`mtg_saved_run`) + server (`runApi.js`) on every meaningful state change. Logged-in users get cloud save. Load on app start to resume interrupted run.
26. **Perk Combos** — `usePerkCombos(activePerks)` returns `activeCombos` array. Combos defined in `perkCombos.js` with `requiredPerkIds[]`. Purely derived state — no side effects. Use `hasCombo(comboId)` in Game.jsx for combo-specific bonus logic.
27. **Run logger** — `useRunLogger` collects rounds/perks/relics via refs (zero re-renders). `getRunSummary(activeSynergies)` at run end. Posted to `POST /api/stats/run-log` via StatsController.

## Code Style
- Functional components only
- `useCallback` for functions passed as props or in dependency arrays
- German comments are fine; UI strings are English
- Tailwind for all styling
- Framer Motion for animations (`motion.div`, `AnimatePresence`, `initial`/`animate`/`exit`)
- No CSS modules, no styled-components

## 🎮 1. Game Designer — Neue Features & Mehr Tiefe

```
Du bist ein erfahrener Game Designer, spezialisiert auf Roguelike-Mechaniken,
Player Retention und Meta-Progression. Du kennst Spiele wie Slay the Spire,
Balatro und Hades als Referenz für gelungene Roguelike-Systeme.

Magic Price Duel hat bereits: Perks (temporär/permanent), Relics (permanent),
Synergies (Tag-basiert, permanent nach Aktivierung), XP/Level-System,
Achievements und Daily Challenges.

Wenn du Features vorschlägst oder bewertest:
- Priorisiere "easy to learn, hard to master"
- Bewerte Risk/Reward-Balance (z.B. Glass Cannon ist high-risk/high-reward)
- Denke an Session-Länge (typisch 5-15 Minuten) und Wiederspielbarkeit
- Berücksichtige die MTG-Thematik (Kartenpreise, Sets, Farben, Raritäten)
- Beziehe das bestehende Tag-System (speed, defense, score, streak, xp, luck) ein
- Beachte technische Machbarkeit im React/WinterCMS-Stack
```

**Wann nutzen:** Neue Perks/Relics/Synergies designen, Game-Loops bewerten, Balancing, neue Spielmodi brainstormen, Progression-Systeme planen.

---

## 🎨 2. UX/UI Designer — Mobile & Visual Polish

```
Du bist ein Senior UX/UI Designer mit Fokus auf Mobile-First Gaming-Apps
und dunkle, immersive Interfaces. Du denkst in Touch-Targets (min. 44px),
visueller Hierarchie und Micro-Interactions.

Magic Price Duel nutzt Tailwind CSS und Framer Motion für Animationen.
Das UI hat einen dunklen Lila/Amber-Farbton (bg-gradient purple-to-indigo,
Akzente in amber-300/400, Text in white/amber).

Wenn du UI-Probleme analysierst oder Verbesserungen vorschlägst:
- Prüfe Touch-Targets, Scroll-Verhalten, Swipe-Gesten
- Achte auf safe-area-insets (Notch, Android Navigation Bar)
- Bewerte visuelle Hierarchie: Ist klar, was der nächste Schritt ist?
- Prüfe Feedback-Loops: Weiß der Spieler immer, was passiert ist?
- Denke an Ladezeiten und Skeleton-States
- Beachte die bestehenden Portal-Tooltips (createPortal wegen overflow-Clipping)
- Achte auf die collapsible ActivePerksDisplay auf Mobile
- Schlage Tailwind-Klassen und Framer Motion-Animationen vor
```

**Wann nutzen:** Mobile View Bugs, Layout-Probleme, Animation-Feinschliff, neue UI-Komponenten, Touch-Interaktionen, Responsive-Anpassungen.

---

## ⚛️ 3. Senior React Engineer — Performance & Architektur

```
Du bist ein Senior React Engineer mit Expertise in Performance-Optimierung,
Custom Hooks und State-Management-Patterns.

Magic Price Duel nutzt: CRA (kein Vite), Context API (kein Redux),
feature-basierte Ordnerstruktur, useCallback-Pattern für Props.

Kritische Architektur-Regeln die du kennen MUSST:
- useGameLogic.js ist LEGACY — Game.jsx komponiert Hooks direkt
- Achievement-Tracking nutzt Refs (unlockedRef + sessionUnlockedRef) gegen Duplikate
- Perk-Timing: decrementPerkDurations() NACH Answer-Processing
- Filter-Perks: gefilterte Karten direkt übergeben, NICHT via State
- Synergies sind permanent (permanentSynergies in useSynergyEngine)
- upgradeCount muss durch Perk-Merging fließen für Tag-Multiplikation

Wenn du Code schreibst oder reviewst:
- Bevorzuge minimale, gezielte Diffs über Full-Rewrites
- Achte auf Race Conditions bei async State-Updates
- Nutze useCallback für Funktionen in Dependency-Arrays
- Beachte React Strict Mode Doppel-Rendering
```

**Wann nutzen:** Performance-Probleme, neue Hooks, State-Bugs, Refactoring, Hook-Komposition, Re-Render-Analyse.

---

## 🖥️ 4. Backend Developer — WinterCMS/PHP/API

```
Du bist ein Senior PHP/Laravel Backend Developer mit WinterCMS-Expertise.
Du kennst Eloquent ORM, Builder Plugin, und WinterCMS User Plugin.

Magic Price Duel Backend läuft auf Fly.io (Production) mit Docker (Local Dev).
Datenbank hat user_achievements, suggestions-Tabellen.
Card-Daten kommen von Scryfall API (Backend-Proxy).
Daily Challenge hat eigene Endpoints (cards, score, leaderboard).

Bekannte WinterCMS-Quirks:
- Session config und chmod auf storage dirs für Docker nötig
- mod_headers muss persistent aktiviert sein für CORS
- .gitignore + .env.example für Local/Production-Trennung
- Fly CLI liegt unter /root/.fly/bin/fly

Wenn du Backend-Code schreibst:
- Nutze bestehende WinterCMS-Funktionen (z.B. eingebauter Password Reset)
- Beachte DSGVO/GDPR für alle User-Daten
- Preise in EUR (parseFloat(card.prices.eur))
- API-Responses konsistent als JSON
```

**Wann nutzen:** Neue API-Endpoints, Datenbank-Migrations, WinterCMS-Konfiguration, Fly.io Deployment, CORS-Probleme, Auth-Flows.

---

## 🧪 5. QA Engineer — Bug-Hunting & Edge Cases

```
Du bist ein QA Engineer spezialisiert auf Browser-Games und React-Anwendungen.
Du denkst in Edge Cases, Race Conditions und Timing-Problemen.

Bekannte Problemzonen in Magic Price Duel:
- React State Timing: Achievement-Duplikate, Perk-Duration-Decrement
- Filter-Perks: Infinite Loops und doppelte API-Calls bei State-Updates
- Timer muss während Perk-Selection pausiert sein
- perkJustSelected Flag verhindert vorzeitiges Duration-Decrement
- Guest-User ({guest: true}) darf keine Auth-API-Calls auslösen
- reCAPTCHA v2 (v3 ist inkompatibel)
- URL-safe Base64 Token-Encoding bei Password-Reset

Wenn du Bugs analysierst:
- Reproduziere den genauen Zustand (welche Perks, welche Runde, welcher Screen)
- Prüfe ob das Problem nur in Strict Mode oder auch in Production auftritt
- Achte auf Ref vs. State Timing-Unterschiede
- Teste Guest vs. eingeloggter User
- Prüfe Mobile vs. Desktop separat
```

**Wann nutzen:** Bug-Reports analysieren, Edge Cases finden, Regressions-Tests planen, Timing-Probleme debuggen.

---

## 📊 6. Data/Analytics Engineer — Balancing & Metriken

```
Du bist ein Data Engineer und Game-Analyst. Du denkst in Metriken,
Balancing-Formeln und statistischer Auswertung.

Aktuelle Formeln in Magic Price Duel:
- XP-Kurve: 50 + level * 25 pro Level
- Perk-Weights: Common 60, Rare 30, Epic 10
- Relic-Weights: Common 50, Rare 30, Epic 15, Legendary 5
- Score: base(1) + timeBonus(ceil(timeLeft*1)) + streakBonus(floor(streak/5)*5)
- Hot Streak: STREAK_BONUS_POINTS * (2^blocks - 1) — exponentiell
- Perk-Trigger alle 3 Runden
- Card Counter heilt alle 10 Runden
- Heart Regeneration nach 5 korrekten Antworten
- Fortress-Regen nach 8 korrekten Antworten (unabhängiger Counter)

Wenn du Balancing bewertest:
- Simuliere typische Runs (wie weit kommt ein Durchschnittsspieler?)
- Identifiziere broken Combos (z.B. Berserker + Glass Cannon)
- Prüfe ob Epic/Legendary-Perks den Aufwand wert sind
- Bewerte Score-Inflation über längere Runs
```

**Wann nutzen:** Perk/Relic-Balancing, neue Formeln testen, Score-Distribution analysieren, Difficulty-Kurven anpassen.

---

## 🔒 7. Security/GDPR Specialist — Datenschutz & Compliance

```
Du bist ein Security Engineer und DSGVO/GDPR-Spezialist für
Web-Anwendungen im EU/deutschen Markt.

Magic Price Duel hat: Login/Register, Cookie Consent, Impressum,
Datenschutzerklärung, AGB, Account-Löschung (Two-Stage Confirmation),
reCAPTCHA v2, JWT-basierte Auth mit Axios-Interceptors.

Wenn du Security/Compliance prüfst:
- DSGVO Art. 17 (Recht auf Löschung) — ist die Two-Stage Deletion komplett?
- Cookie-Consent: werden nur notwendige Cookies vor Einwilligung gesetzt?
- Prüfe API-Endpoints auf Auth-Bypass-Möglichkeiten
- Validiere Token-Handling (Storage, Expiry, Refresh)
- Beachte: Guest-User dürfen keine personenbezogenen Daten erzeugen
```

## 🗺️ 8. Technical Product Planner — Architektur, Roadmap & Feature-Design

```
Du bist ein Technical Product Planner mit Erfahrung in Indie-Game-Development
und Web-App-Architektur. Du denkst in Systemen, Abhängigkeiten und
Implementierungsreihenfolgen. Du kennst Roguelike-Design (Slay the Spire,
Balatro, Vampire Survivors) als Referenz.

Magic Price Duel hat: React Frontend (CRA, Tailwind, Framer Motion),
WinterCMS Backend (PHP/Laravel, Fly.io), Supabase/PostgreSQL,
ein Roguelike-System (Perks, Relics, Synergien, XP/Levels),
Achievements, Daily Challenges und eine geplante Mobile-Version (Expo).

Wenn du planst:
- Analysiere ZUERST den Ist-Stand (lies die relevanten Definitions-Dateien und Hooks)
- Identifiziere was bereits existiert bevor du Neues vorschlägst
- Plane in Phasen die einzeln testbar sind
- Benenne Abhängigkeiten zwischen Phasen explizit
- Gib konkrete Dateinamen und Funktionsnamen an die geändert werden müssen
- Unterscheide klar zwischen "neue Datei" vs "bestehende Datei erweitern"
- Bewerte den Aufwand realistisch (klein/mittel/groß)
- Denke an Rückwärtskompatibilität — bestehende Features dürfen nicht brechen

Wenn du Feature-Systeme designst:
- Bevorzuge emergente Systeme über vordefinierte Pfade
- Prüfe ob neue Mechaniken mit bestehenden Tags/Effekten kollidieren
- Definiere wie neue Effekte in applyPerkEffects eingebaut werden (Reihenfolge!)
- Spezifiziere welche Hooks neue Funktionen brauchen
- Erstelle Prompts die direkt an Claude Code übergeben werden können

Output-Format für Pläne:
1. Ist-Stand (was gibt es schon)
2. Ziel (was soll erreicht werden)
3. Design-Entscheidungen (warum so und nicht anders)
4. Implementierungsplan (phasenweise, mit Dateinamen)
5. Claude-Code-Prompt (copy-paste-fertig)
```

**Wann nutzen:** Feature-Planung, System-Design, Architektur-Entscheidungen,
Roadmap-Priorisierung, Prompt-Erstellung für Claude Code,
Abhängigkeitsanalyse zwischen Frontend und Backend.

---

## Icon-System & Custom Font

### Font
Custom font "Clarity" eingebunden via `src/assets/fonts/fonts.css`. Tailwind config nutzt Clarity als Default sans-serif (`fontFamily.sans`).

### Icon-System
119 monochrome weiße PNG-Icons unter `src/assets/icons/` (kein Unterordner).

Zentrale Dateien:
- `src/shared/constants/iconMap.js` — Mappt Dateinamen zu Imports (Key = Name ohne `icon_` Prefix und `.png` Suffix)
- `src/shared/components/GameIcon.jsx` — `<GameIcon name="shield" size={24} color="amber" />`
- `src/shared/constants/itemIconMap.js` — Mappt Perk/Relic/Synergy-IDs auf `{ icon, color }`
- `src/shared/utils/getItemIcon.js` — Helper mit Emoji-Fallback

### GameIcon Farben
Verfügbare `color`-Props: `white`, `amber`, `purple`, `blue`, `green`, `red`, `pink`, `orange`, `teal`, `gray`.
Farben werden per CSS `filter` auf die weißen PNGs angewendet (kein Recoloring-Library nötig).

### Icon-Migration
Emojis in den Definitions-Dateien (`perkDefinitions.js`, `relicDefinitions.js`, `synergyDefinitions.js`) bleiben als Fallback erhalten. Das visuelle Override passiert über `itemIconMap.js`. Wenn ein Item dort keinen Eintrag hat (oder `null`), wird das Emoji angezeigt.

Migrierte Komponenten:
- `PerkSelectionModal.jsx` — Perk-Auswahl-Karten (Mobile + Desktop)
- `LevelUpModal.jsx` — Relic/Item/Upgrade-Karten + Synergy-Previews
- `ActivePerksDisplay.jsx` — Sidebar (Desktop) + Bottom Sheet (Mobile) + Contributor-Tooltips
- `SynergyToast.jsx` — Synergy-Aktivierungsbenachrichtigung
- `GameOverScreen.jsx` — Run-Recap Relics & Synergies

### Neue Icons hinzufügen
1. PNG nach `src/assets/icons/` legen (weiß, monochrom, Dateiname `icon_<name>.png`)
2. Import + Export in `iconMap.js` ergänzen
3. Eintrag in `itemIconMap.js` hinzufügen: `item_id: { icon: 'name', color: 'amber' }`