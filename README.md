# Magic Price Duel — Frontend

A Magic: The Gathering card price guessing game with a roguelike progression system. Players see two MTG cards and pick the more expensive one. Built on top of a Slay the Spire / Balatro-inspired run system with Perks, Relics, Synergies, Meta-Progression, and more.

**Live:** Deployed on Vercel — React frontend connecting to a WinterCMS/PHP backend on Fly.io.

## Tech Stack

| | |
|---|---|
| Framework | React 18 (CRA) + Tailwind CSS 3 |
| Animations | Framer Motion |
| HTTP | Axios (centralized client with JWT interceptors) |
| Auth | JWT Bearer Token via `AuthContext` |
| Spam prevention | react-google-recaptcha v2 |
| Card data | Scryfall API (via backend proxy) |

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm start
# → http://localhost:3000

# Production build (ESLint warnings are treated as errors on Vercel CI)
npm run build
```

Set the backend URL in a `.env` file:

```
REACT_APP_API_URL=https://your-backend.fly.dev
```

## Project Structure

```
src/
├── api/
│   └── axios.js                    # Centralized Axios client, auth header injection
├── features/
│   ├── auth/                       # Login, Register, ForgotPassword, AuthContext
│   ├── game/
│   │   ├── api/                    # gameApi, achievementApi, dailyChallengeApi, statsApi
│   │   ├── components/             # Game.jsx (main orchestrator) + all modals/screens
│   │   ├── constants/              # perkDefinitions, relicDefinitions, synergyDefinitions, mapDefinitions
│   │   ├── context/                # AchievementContext
│   │   ├── hooks/                  # All custom game hooks (see below)
│   │   └── utils/                  # cardComparison, rewardCalculator, scoreCalculator
│   ├── leaderboard/
│   ├── account/
│   ├── suggestions/
│   └── legal/
├── shared/
│   ├── components/                 # GameIcon and other shared UI components
│   └── constants/
│       ├── itemIconMap.js          # Maps perk/relic/synergy IDs to icon + color
│       └── iconMap.js              # Maps icon names to PNG imports
└── App.jsx
```

## Game Systems

### Dual Reward System

Every correct answer earns **Gold** (in-run currency) and **XP** (level progression). There is no score.

- Gold: base +2G/answer, streak milestones (+5G/+10G/+15G), level-up +15G
- XP: base + time bonus per answer, streak XP bonus from streak 5+
- Calculations live in `rewardCalculator.js`

### Roguelike Layers

1. **Perks** — chosen every 3 rounds via `PerkSelectionModal`. Permanent or charge-based. Defined in `perkDefinitions.js`.
2. **Relics** — permanent for the entire run. Chosen at level-up milestones (every 3rd level) via `LevelUpModal`. Defined in `relicDefinitions.js`.
3. **Synergies** — auto-activate when tag thresholds are met. Once active, permanent for the run. Defined in `synergyDefinitions.js`.
4. **Perk Combos** — bonus effects when specific perk combinations are active simultaneously. Defined in `perkCombos.js`.

### Tag System

Every perk and relic has a `tags` array. Available tags: `speed`, `defense`, `score`, `streak`, `xp`, `luck`, `fake`, `sacrifice`.

`useSynergyEngine` counts tags across all active relics + perks. When counts meet a synergy's `requiredTags` threshold, that synergy activates permanently.

### Perk Slot System

- Start: 3 passive slots / 1 utility slot
- Soft caps: 5 passive / 2 utility (expandable via shop upgrades)
- When slots are full, `ReplacePerkModal` opens to swap or skip
- `Skip Card` — utility perk, 1 charge, recharges at stage start
- `Extra Life` — utility perk, stays in slot after use (empty charge)

### Run Map

`useMapSystem` generates a multi-stage map with node types: `Normal`, `Elite`, `Boss`, `Shop`, `Rest`, `Exchange`, `Mystery`, `Mini Boss`, `Curse`.

After defeating the boss, `RunCompleteModal` offers: **End Run** or **Continue (Endless Mode)**. Endless mode increments difficulty each loop.

### Meta-Progression

`useMetaProgression` — cross-run upgrades purchased with **crystals** (earned via boss wins). Spend in `MetaProgressionScreen`. Upgrades include starting life bonuses, extra perk/relic slots, starting gold, and shop discounts.

### Ascension System

10 difficulty levels (stored in localStorage). Higher ascension = harder modifiers (timer reduction, fewer perk choices, less gold) + higher crystal multiplier.

### Saved Runs

`useSavedRun` persists interrupted runs to localStorage + server (for logged-in users), enabling cross-device resume.

## Key Custom Hooks

| Hook | Purpose |
|------|---------|
| `useGold` | Gold currency: add/spend/totalEarned |
| `useLevel` | XP/Level system, `addXP(amount, multiplier)` |
| `usePerkSystem` | Perk lifecycle: generation, selection, slots, charges |
| `useRelicSystem` | Permanent relics, tag helpers |
| `useSynergyEngine` | Tag counting, synergy activation, conflict resolution |
| `useGameTimer` | Countdown timer with pause/resume |
| `useStreak` | Streak tracking with Phantom Streak / Streak Shield support |
| `useCardLoader` | Card fetching + filter dispatch |
| `useMapSystem` | Stage map generation and progression |
| `useAscension` | Ascension level, difficulty modifiers |
| `useMetaProgression` | Cross-run upgrades, starting kits |
| `useSavedRun` | Save/load run state (localStorage + server) |
| `usePerkCombos` | Combo detection from active perk sets |
| `useRunLogger` | Structured run event logging for stats API |
| `useAchievements` | Achievement unlock and sync |

## Icon System

119 monochrome white PNG icons under `src/assets/icons/`.

- `GameIcon` component: `<GameIcon name="shield" size={24} color="amber" />`
- Colors applied via CSS `filter` on white PNGs: `white`, `amber`, `purple`, `blue`, `green`, `red`, `pink`, `orange`, `teal`, `gray`
- `itemIconMap.js` maps perk/relic/synergy IDs to `{ icon, color }`

**No emojis in JSX or item definitions** — always use `GameIcon` + `itemIconMap`.

## Keyboard Controls

| Key | Action |
|-----|--------|
| `1` / `A` | Select left card |
| `2` / `D` | Select right card |
| `Space` / `Enter` | Continue |
| `S` | Skip card (if skip perk active) |

## Backend API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/random-cards?count=20` | Fetch random MTG cards (supports filter params) |
| POST | `/api/score` | Submit highscore |
| GET | `/api/leaderboard` | Top 10 leaderboard |
| GET/POST | `/api/achievements/*` | Achievement sync |
| POST/GET/DELETE | `/api/runs/current` | Saved run (cross-device) |
| GET/POST | `/api/daily-challenge/*` | Daily challenge |
| POST | `/api/stats/run-log` | Full run event log |
| POST | `/api/client-error` | Frontend error logging |
| POST | `/auth/login` | Login |
| POST | `/auth/register` | Register |
| GET | `/auth/me` | Current user |

## Deployment

Auto-deploys to Vercel on push to `main`. Set `REACT_APP_API_URL` in Vercel environment variables.

Vercel CI treats all ESLint warnings as errors — always verify `npm run build` passes locally before pushing.
