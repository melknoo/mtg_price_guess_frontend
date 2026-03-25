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
│   │   │   ├── PerkSelectionModal.jsx   # Modal: pick 1 of 3 perks every 5 rounds
│   │   │   ├── LevelUpModal.jsx         # Modal: level-up reward (perk/relic/upgrade)
│   │   │   ├── ActivePerksDisplay.jsx   # Sidebar (desktop) / collapsible (mobile)
│   │   │   ├── SynergyToast.jsx         # Toast when a new synergy activates
│   │   │   ├── AchievementsDisplay.jsx
│   │   │   ├── AchievementToast.jsx
│   │   │   ├── DailyChallengeGame.jsx
│   │   │   └── StatsDisplay.jsx
│   │   ├── constants/
│   │   │   ├── achievementDefinitions.js
│   │   │   ├── perkDefinitions.js       # Perks, types, rarities, tags, extended variants
│   │   │   ├── relicDefinitions.js      # Relics with tags, effects, rarities
│   │   │   └── synergyDefinitions.js    # Synergy combos: requiredTags → effect
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
│   │   │   ├── useAchievements.js
│   │   │   └── useGameLogic.js         # Legacy — Game.jsx composes hooks directly
│   │   └── utils/
│   │       ├── cardComparison.js
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

Every 5 rounds: `PerkSelectionModal` offers 3 perks.
On level-up: `LevelUpModal` offers 3–4 options (perk / relic / upgrade to existing perk).

**Three layers:**
1. **Perks** — temporary (duration-based) or permanent buffs. Defined in `perkDefinitions.js`.
2. **Relics** — permanent for the entire run. Defined in `relicDefinitions.js`.
3. **Synergies** — auto-activate when tag thresholds are met. Defined in `synergyDefinitions.js`.

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
const { activeSynergies, hasSynergy, getSynergyValue, reset } = useSynergyEngine(activeRelics, activePerks, onNewSynergy);
```
`getSynergyValue(effect)` returns the `value` of the first synergy with that effect, or `null`.

### LevelUpModal

`generateOptions(level, ownedRelicIds, activePerks, activeSynergies, hasFortune)` returns 3 (or 4 if Fortune active) options — each is a perk, relic, or upgrade to an existing perk (`category: 'upgrade'`).

Upgrade options use `basePerkId` / `isExtended` to find the matching base perk in `activePerks`.

Shows a synergy-prediction badge per option: which synergies would activate if you picked that option.

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

- Perks trigger every 5 rounds via `perkSystem.triggerPerkSelection()`
- Weighted random generation: Common 60, Rare 30, Epic 10
- Extended variants (`basePerkId` + `isExtended: true`) merge into existing perk, extending duration by `bonusDuration` and incrementing `upgradeCount`
- `upgradeCount` is read by `useSynergyEngine` to count tags multiple times per upgraded perk
- `getPerkValue(effect)` returns the value of the first active perk with that effect

## Score Calculation

```
timeBonus     = ceil(timeLeft * 1)                        // 0–10 pts
streakBonus   = floor(streak / STREAK_BONUS_DIVISOR) * STREAK_BONUS_POINTS
// Hot Streak: STREAK_BONUS_POINTS * (2^blocks - 1) — exponential
finalPoints   = applyPerkEffects(base + timeBonus + streakBonus)
// Gold Rush multiplies final score
// Berserker doubles XP + Score at 1 life
```

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
2. **Each round:** Player picks → `handleChoice(index)` → timer stops → prices revealed → score/XP/streaks updated
3. **XP gain:** `level.addXP(amount, scholarMult)` — triggers `level.showLevelUp = true`
4. **Level up:** `LevelUpModal` shown → player picks reward → `handleLevelUpSelect(pick)` — routes to `addRelic`, `selectPerk`, or perk upgrade
5. **Next pair:** `handleNextPair()` → round++ → if round % 5 === 0 → `PerkSelectionModal` → else next card
6. **Card Counter:** every 10 rounds → +1 life, `flashRelic('card_counter')`
7. **Wrong answer:** -1 life → if 0 → game over

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
6. **`getTimerDuration` depends on `synergyEngine`** — Speed Demon multiplier is applied here. Make sure `synergyEngine` is in the dependency array.
7. **Fortune synergy** — `generateOptions` in `LevelUpModal` checks `hasFortune` to generate a 4th slot. The grid changes to `md:grid-cols-4`.
8. **Perk timing** — `decrementPerkDurations()` must be called AFTER answer processing. Perks activate immediately on selection.
9. **Achievement tracking uses refs** — prevents duplicate unlocks in React strict mode. Don't convert to state.
10. **Guest users** — `{ guest: true }`. Always check before auth-required API calls.
11. **Prices in EUR** — all comparisons use `parseFloat(card.prices.eur)`.

## Code Style
- Functional components only
- `useCallback` for functions passed as props or in dependency arrays
- German comments are fine; UI strings are English
- Tailwind for all styling
- Framer Motion for animations (`motion.div`, `AnimatePresence`, `initial`/`animate`/`exit`)
- No CSS modules, no styled-components
