# Magic Price Duel - Frontend

## Project Overview

Magic Price Duel is a Magic: The Gathering card price guessing game. Players see two MTG cards side by side and must pick the more expensive one. The game features a lives system (3 lives), streak tracking, a 10-second timer, a roguelike perk system (every 5 rounds), and 25+ achievements across 6 categories.

**Live:** Deployed on Vercel (React frontend) + Fly.io (WinterCMS/PHP backend)
**Language:** UI is in English, some code comments are in German — keep both conventions as-is.

## Tech Stack

- **React** (CRA, not Vite) with feature-based architecture
- **Tailwind CSS** for styling
- **Framer Motion** for animations
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
│   │   ├── api/authApi.js          # Login, register, register-with-score, forgot/reset password
│   │   ├── components/             # LoginForm, RegisterWithScore, ForgotPassword, ResetPassword
│   │   ├── context/AuthContext.jsx  # Auth state provider, token management, user CRUD
│   │   └── hooks/useAuth.js        # Re-export convenience hook
│   ├── game/
│   │   ├── api/
│   │   │   ├── gameApi.js          # fetchRandomCards (GET /api/random-cards), updateHighscore (POST /api/score)
│   │   │   └── achievementApi.js   # CRUD for achievements: fetch, unlock, unlock-batch, sync
│   │   ├── components/
│   │   │   ├── Game.jsx            # Main game orchestrator — owns all game state, hooks, and flow
│   │   │   ├── CardPair.jsx        # Renders two cards side by side with selection borders
│   │   │   ├── GameTimer.jsx       # Visual countdown timer bar
│   │   │   ├── GameOverScreen.jsx  # End screen with score, restart, register prompt
│   │   │   ├── StreakDisplay.jsx    # Current streak indicator
│   │   │   ├── LivesDisplay.jsx    # Hearts/lives display
│   │   │   ├── PerkSelectionModal.jsx  # Modal to pick 1 of 3 perks every 5 rounds
│   │   │   ├── ActivePerksDisplay.jsx  # Sidebar (desktop) / collapsible (mobile) active perks
│   │   │   ├── AchievementsDisplay.jsx # Full achievement gallery with category filters
│   │   │   └── AchievementToast.jsx    # Toast notification for unlocked achievements
│   │   ├── constants/
│   │   │   ├── achievementDefinitions.js  # All achievements with conditions, progress functions, rarity
│   │   │   └── perkDefinitions.js         # All perks, types, rarities, effects, extended variants
│   │   ├── context/
│   │   │   └── AchievementContext.jsx  # Global achievement provider with toast system
│   │   ├── hooks/
│   │   │   ├── useGameTimer.js     # Timer with configurable duration and speed (for slow-time perk)
│   │   │   ├── useStreak.js        # Streak counter with bonus calculation
│   │   │   ├── useCardLoader.js    # Card cache management, preloading 20 cards, pair dispensing
│   │   │   ├── usePerkSystem.js    # Perk state machine: generation, selection, activation, duration, consumption
│   │   │   ├── useAchievements.js  # Achievement tracking, unlock logic, cloud sync
│   │   │   └── useGameLogic.js     # (Legacy) Combined game hook — Game.jsx uses individual hooks directly
│   │   └── utils/
│   │       ├── cardComparison.js   # isChoiceCorrect, getMoreExpensiveCard, formatPrice, createErrorMessage
│   │       └── scoreCalculator.js  # calculateTimeBonus, calculateStreakBonus, formatScoreMessage
│   ├── leaderboard/
│   │   ├── api/leaderboardApi.js
│   │   └── components/Leaderboard.jsx
│   ├── suggestions/
│   │   ├── api/suggestionApi.js
│   │   └── components/SuggestionModal.jsx
│   ├── legal/
│   │   └── components/            # PrivacyPolicy, Impressum, Terms, CookieConsent
│   └── account/
│       └── components/AccountSettings.jsx
├── shared/
│   ├── components/
│   │   ├── Button.jsx
│   │   └── Footer.jsx
│   └── utils/
│       └── constants.js           # GAME_CONFIG, SCORE_CONFIG, STORAGE_KEYS, SCREENS
└── App.jsx                        # Root: screen routing (hash-based), AchievementProvider wrapper
```

## Architecture & Patterns

### State Management
- **No Redux/Zustand** — pure React hooks + Context API
- `AuthContext` handles user state, tokens (localStorage), and auth API calls
- `AchievementContext` wraps the app for global achievement tracking and toasts
- Game state lives in `Game.jsx` using individual custom hooks
- **Use refs for immediate state reads** (e.g., achievement tracking to prevent duplicates)

### Custom Hooks — Core Game Loop
The game flow is orchestrated through 4 primary hooks composed in `Game.jsx`:

1. **`useCardLoader`** — Preloads 20 cards, dispenses pairs, auto-refills cache when < 2 cards remain
2. **`useGameTimer`** — Tick-based (100ms interval), supports `duration` override (time_bonus perk) and `speed` multiplier (slow_time perk)
3. **`useStreak`** — Tracks current streak, calculates bonus (every 5 streak = +5 points)
4. **`usePerkSystem`** — Full perk lifecycle: weighted random generation → modal selection → activation → duration tracking → consumption/expiry

### Perk System Details
- Perks trigger every 5 rounds via `perkSystem.triggerPerkSelection()`
- 3 random perks offered, weighted by rarity (Common: 60, Rare: 30, Epic: 10)
- Perk types: `OFFENSIVE` (points/multipliers), `DEFENSIVE` (shields/lives), `UTILITY` (hints/skip/slow)
- Extended variants (`+` suffix) exist with bonus duration
- Permanent perks have `duration: -1`, consumable perks have `consumable: true`
- `hasPerk(id)` checks base AND extended variants
- `getPerkValue(effect)` returns the value of the first active perk with that effect
- Durations decrement in `handleChoice` after each answer via `decrementPerkDurations()`

### Card Data Format
Cards from the backend arrive as:
```js
{ id, name, set, price, image }
```
Transformed in `gameApi.js` to:
```js
{ id, name, set, prices: { eur: number }, image_uris: { normal: string } }
```
All price comparisons use `parseFloat(card.prices.eur)`.

### Score Calculation
```
timeBonus = Math.ceil(timeLeft * 1)       // 0-10 points based on speed
streakBonus = floor(streak / 5) * 5       // +5 per 5-streak
finalPoints = applyPerkEffects(timeBonus + streakBonus)
```
Perk effects applied: `point_multiplier` (×2), `flat_bonus` (+20), `perfect_bonus` (+50 if answered within 1s).

## Backend API Endpoints

All requests go through `apiClient` (Axios) to `REACT_APP_API_URL`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/random-cards?count=20` | Fetch random MTG cards with prices |
| POST | `/api/score` | Submit highscore `{ score }` |
| GET | `/api/leaderboard` | Get leaderboard data |
| POST | `/api/suggestions` | Submit suggestion `{ text }` |
| GET | `/api/achievements` | Get user's unlocked achievements |
| POST | `/api/achievements/unlock` | Unlock single achievement `{ achievement_id }` |
| POST | `/api/achievements/unlock-batch` | Unlock multiple `{ achievement_ids }` |
| POST | `/api/achievements/sync` | Sync local achievements after registration |
| POST | `/auth/login` | Login `{ username, password, recaptchaToken? }` |
| POST | `/auth/register` | Register `{ username, email, password, recaptchaToken }` |
| POST | `/auth/register-with-score` | Register + save score `{ username, email, password, score, recaptchaToken }` |
| GET | `/auth/me` | Get current user |
| POST | `/auth/logout` | Logout |
| POST | `/auth/forgot-password` | Request reset `{ email }` |
| POST | `/auth/reset-password` | Reset password `{ token, password }` |

## Key Game Flow

1. **Init:** `preloadCards()` → `setNextPair()` → wait for both images to load → `timer.start()`
2. **Each round:** Player picks a card (click/keyboard) → `handleChoice(index)` → timer stops → prices revealed → score updated → show result message
3. **Next pair:** `handleNextPair()` → increment round → if round % 5 === 0, show perk selection → else `setNextPair()`
4. **Wrong answer:** Lose 1 life (unless `second_chance` perk active) → reset streak → if 0 lives → game over
5. **Game over:** Show `GameOverScreen` → offer restart or register-with-score (for guests)
6. **Achievements:** Tracked via `useAchievementContext()` calls throughout game flow (trackCorrectAnswer, trackScore, trackRound, etc.)

## Keyboard Controls
- `1` / `A` — Select left card
- `2` / `D` — Select right card
- `Space` / `Enter` — Continue to next pair (after answer)
- `S` — Skip card (if skip perk available)

## Routing
- Hash-based: `#/privacy`, `#/impressum`, `#/terms`
- Screen state managed via `useState("menu")` in `AppContent`
- Reset password via query param: `?token=xxx`

## Environment Variables
- `REACT_APP_API_URL` — Backend URL (default: `http://localhost:3001`)
- `REACT_APP_RECAPTCHA_SITE_KEY` — Google reCAPTCHA v2 site key

## Common Pitfalls & Important Notes

1. **`useGameLogic.js` is legacy** — `Game.jsx` composes hooks directly. Don't refactor Game.jsx to use useGameLogic without updating perk system integration.
2. **Perk timing is critical** — `decrementPerkDurations()` must be called AFTER the answer is processed, not before. Perks must activate immediately when selected (not next round).
3. **Achievement tracking uses refs internally** to prevent duplicate unlocks in React strict mode. Don't convert these to state.
4. **Card cache exhaustion** — `useCardLoader.setNextPair()` auto-refetches when < 2 cards remain. Don't manually manage cache outside this hook.
5. **Timer dependency on perks** — `getTimerDuration()` and `getTimerSpeed()` are recalculated each render. The timer hook receives these as props and updates dynamically.
6. **Guest users** exist with `{ username: "Gast", highscore: 0, guest: true }`. Always check `user?.guest` before making auth-required API calls.
7. **Auth interceptor** — 401 responses automatically clear token and redirect to `/`. Don't add redundant auth error handling.
8. **Mobile responsiveness** — `ActivePerksDisplay` has separate desktop (sidebar) and mobile (collapsible) layouts. `AchievementsDisplay` uses dropdown on mobile, button bar on desktop. Always test both.
9. **Prices are in EUR** — All card prices use `prices.eur`. `formatPrice()` from `cardComparison.js` handles display formatting.
10. **Impressum.jsx exports as `PrivacyPolicy`** — This is a known bug in the export name. Don't rename without updating all imports.

## Code Style
- Functional components only, no class components
- `useCallback` for functions passed as props or used in dependency arrays
- German comments are fine, keep them — UI strings are English
- Tailwind for all styling, no CSS modules or styled-components
- Framer Motion for animations — use `motion.div` with `initial`/`animate`/`exit`
- Error boundaries: not yet implemented — errors in hooks will crash the app

## Testing
- No test suite currently. When adding tests:
  - Unit test utility functions (`cardComparison.js`, `scoreCalculator.js`) first
  - Mock `apiClient` for hook tests
  - Use React Testing Library for component tests