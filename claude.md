# Frontend — Magic Price Duel

## Icons & Visuals

**Kein Emoji im UI-Code.** Ausschliesslich Icons aus `/src/assets/icons/` verwenden, eingebunden via `<GameIcon name="..." color="..." size={...} />`.

- Icon-Namen: Keys aus `src/shared/constants/iconMap.js` (z.B. `star`, `human_controller`, `heart`, `shield`, `trophy`)
- Farben: `white`, `amber`, `blue`, `green`, `red`, `purple`, `orange`, `teal`, `gray`
- Emoji-Ersetzungen in CATEGORY_STYLES, Headers, Badges, Labels etc. immer mit `GameIcon`

## Komponenten-Struktur

- Feature-basiert: `src/features/game/`, `src/features/auth/`, `src/features/leaderboard/`
- Shared: `src/shared/components/` (GameIcon, etc.), `src/shared/constants/` (iconMap, perkDefinitions, etc.)

## Stil

- Tailwind CSS + Framer Motion
- Mobile-First: `sm:hidden` / `hidden sm:flex` Dual-Layouts
- Animationen via `motion.div`, Spring-Transitions bevorzugen

## Hooks

- `useStreak`, `usePerkSystem`, `useRelicSystem`, `useSynergyEngine`, `useLevel`, `useGameTimer`, `useCardLoader`
- Bestehende Hooks nur erweitern, nicht umschreiben
- `useCallback` für Props/Dependencies
