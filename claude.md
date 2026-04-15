# Frontend — Magic Price Duel

## Icons & Visuals

### ⚠️ KEINE EMOJIS IM UI-CODE — STRICT RULE

**Niemals Emojis direkt in JSX oder als icon-Strings.** Ausschließlich Assets aus `src/assets/icons/` verwenden.

```jsx
// ✗ FALSCH — niemals so:
<span>🔥 Streak</span>
snap('Gold Rush', '💎', b)
icon: '❤️'

// ✓ RICHTIG — immer so:
<GameIcon name="signal" size={16} color="orange" /> Streak
snap('Gold Rush', gi('gold_rush'), b)
_gameIcon: { icon: 'heart', color: 'red' }
```

**Vorgehen bei neuen Icons:**
1. Icon-Name aus `src/shared/constants/iconMap.js` wählen (Keys: `star`, `heart`, `shield`, `trophy`, `sword`, `skull`, `coin`, `chest`, `glow`, `gem`, `hat`, `bag`, `time`, `thunder`, `signal`, `drop`, `ring`, `freeze`, `path_follow`, `target`, `target_2`, `sound`, `gear`, `gear_2`, `list`, `scroll`, `stat`, `boots`, `bullet`, `brain`, `magnifier`, `potion`, `duplicate`, `card`, `door`, `clear`, `disable`, `lock`, `map`, `parchment`, …)
2. Farbe: `white`, `amber`, `blue`, `green`, `red`, `purple`, `orange`, `teal`, `gray`, `pink`
3. `<GameIcon name="..." color="..." size={N} />` — Pixelgenau im Stil des `shadow-pixel`-Designs
4. Für Perk/Relic-Icons: Eintrag in `src/shared/constants/itemIconMap.js` anlegen; `gi(id)` / `giPerk(perk)` in snap()-Calls nutzen

**Stil:** Alle neuen UI-Elemente im vorhandenen Pixel-Art-Stil (`shadow-pixel`, `rounded-sm`, `border-2`, dunkle Hintergründe). Keine neuen Rounding-Werte, keine Schatten-Stile die nicht bereits genutzt werden.

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

## Roguelike-System

Alle Definitions-Dateien unter `src/features/game/constants/`:
- `perkDefinitions.js` — 66+ Perks, Helper-Funktionen (`getBasePerkId`, `isFilterPerk`, `getActiveFilters`, etc.)
- `relicDefinitions.js` — 46 Relics
- `synergyDefinitions.js` — 15 Synergien

### usePerkSystem (`src/features/game/hooks/usePerkSystem.js`)
Verwaltet: `activePerks`, `roundsPlayed`, `showPerkSelection`, `availablePerks`

Key-Logik:
- **Gewichtete Perk-Generierung**: Rarity Common 60 / Rare 30 / Epic 10. Schließt permanente bereits gewählte Perks aus, verhindert doppelte Filter-Typen in einer Auswahl.
- **Stacking-Regeln**: `slow_time` multiplikativ, `heart_regen` Threshold –1, `point_multiplier` max-Wert, Boost-Perks additiv, Duration per Stack +`bonusDuration`. Filter-Perks des gleichen Typs ersetzen sich.
- **Relic-Interaktionen**: Eternal Flame (+3 Dauer), Double Dip (Perk 2× anwenden), Upgrade Master (+2 upgradeCount), Perk Recycler (30% Erneuerung bei Ablauf)
- **Consumables**: Multi-Charge dekrementieren `value`, werden bei 0 entfernt

### useRelicSystem (`src/features/game/hooks/useRelicSystem.js`)
Verwaltet: `activeRelics` (permanent für ganzen Run)

Key-Logik:
- **Minimalist-Constraint**: Max 3 Relics wenn Minimalist aktiv (Minimalist selbst immer hinzufügbar)
- **Consumable-Support**: `consumeRelic(id)` entfernt das Relic (z.B. Parasite)

### useSynergyEngine (`src/features/game/hooks/useSynergyEngine.js`)
Verwaltet: `permanentSynergies` (bleiben aktiv auch wenn Tags sinken)

Key-Logik:
- **Tag-Counting**: Zählt Tags über alle aktiven Relics + Perks. Mit PHANTOM_POWER: Fake-Items zählen doppelt.
- **Permanenz**: Neue Synergien lösen `onNewSynergy(synergy)` Callback einmalig aus und werden zu `permanentSynergies` hinzugefügt.
- **`hasSynergy(id)`** / **`getSynergyValue(effect)`** für Condition-Checks in anderen Hooks
