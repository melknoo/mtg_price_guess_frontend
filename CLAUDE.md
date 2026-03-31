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

## UI Design System

Einheitliche Klassen definiert in `src/index.css` via `@layer components`.

### Buttons
- `btn-primary` — Amber/Gold, Hauptaktionen (New Game, Restart, Confirm)
- `btn-secondary` — Transparent/White-Border, Nebenaktionen (Back, Settings)
- `btn-danger` — Red, Destruktive Aktionen (Delete, Logout)
- Modifier: `btn-sm` (kompakt), `btn-full` (volle Breite)

### Panels
- `panel` — Standard-Sektion (bg-white/5, border-white/10)
- `panel-highlight` — Amber-Akzent fuer wichtige Infos
- `panel-danger` — Red-Akzent fuer Danger Zones
- `panel-game` — In-Game mit Backdrop-Blur

### Cards & Badges
- `card-selectable` — Basis fuer Perk/Relic-Karten in Modals
- `badge badge-{common|rare|epic|legendary}` — Rarity-Badges

### Dividers
- `divider` — Subtile weisse Trennlinie
- `divider-amber` — Amber-Akzent-Trennlinie

### Regeln
- ALLE neuen Buttons muessen eine der btn-Klassen verwenden
- Keine neuen Inline-Button-Styles mehr — immer die Klassen nutzen
- Perk/Relic-Karten behalten ihre eigenen Rarity-Gradient-Styles

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
- Perk-Trigger alle 5 Runden
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