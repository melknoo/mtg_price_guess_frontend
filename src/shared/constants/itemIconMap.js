// Mappt Perk/Relic/Synergy-IDs auf { icon, color } aus iconMap.js
// null = kein passendes Icon → Emoji-Fallback bleibt aktiv
// Farb-Konvention: defense=green, score=amber, speed=blue, streak=orange,
//                  xp=purple, luck=pink, fake/cheat=teal, sacrifice=red, meta=purple

export const ITEM_ICONS = {

  // ─── PERKS ───────────────────────────────────────────────────────────────

  heart_regeneration:        { icon: 'heart',      color: 'pink' },
  second_chance:             { icon: 'shield',     color: 'green' },
  time_buffer:               { icon: 'time',       color: 'blue' },
  time_buffer_extended:      { icon: 'time',       color: 'blue' },
  double_points:             { icon: 'thunder',    color: 'amber' },
  double_points_extended:    { icon: 'thunder',    color: 'amber' },
  streak_booster:            { icon: 'signal',     color: 'orange' },    // signal = aufsteigende Balken → Streak
  perfectionist:             { icon: 'target',     color: 'amber' },
  perfectionist_extended:    { icon: 'target',     color: 'amber' },
  point_boost:               { icon: 'gem',        color: 'amber' },
  point_boost_extended:      { icon: 'gem',        color: 'amber' },
  price_hint:                { icon: 'magnifier',  color: 'blue' },
  slow_time:                 { icon: 'time',       color: 'teal' },
  slow_time_extended:        { icon: 'time',       color: 'teal' },
  set_reveal:                { icon: 'scroll',     color: 'purple' },
  skip_card:                 { icon: 'next',       color: 'amber' },

  // ─── Balatro-Style Perks (17 neue) ────────────────────────────────────────
  gambler:                   { icon: 'dice',       color: 'orange' },
  chain_lightning:           { icon: 'thunder',    color: 'amber' },
  time_bomb:                 { icon: 'time',       color: 'red' },
  dead_mans_hand:            { icon: 'skull',      color: 'red' },
  mirror_image:              { icon: 'duplicate',  color: 'teal' },
  overclock:                 { icon: 'gear',       color: 'amber' },
  sacrifice_ritual:          { icon: 'potion',     color: 'red' },
  adrenaline:                { icon: 'boots',      color: 'orange' },
  wildcard:                  { icon: 'card',       color: 'pink' },
  compound_interest:         { icon: 'coin',       color: 'green' },
  echo_chamber:              { icon: 'sound',      color: 'blue' },
  bloodlust:                 { icon: 'drop',       color: 'red' },
  roulette:                  { icon: 'ring',       color: 'orange' },
  glass_mind:                { icon: 'magnifier',  color: 'teal' },
  momentum_perk:             { icon: 'signal',     color: 'amber' },
  treasure_map_perk:         { icon: 'map',        color: 'amber' },
  overcautious:              { icon: 'shield',     color: 'teal' },

  // ─── CASCADE PERKS ───────────────────────────────────────────────────────
  ripple_effect:             { icon: 'signal',     color: 'teal' },       // ripple = aufsteigende Wellen
  resonance_xp:              { icon: 'sound',      color: 'purple' },     // resonance = Schallwelle
  first_spark:               { icon: 'thunder',    color: 'orange' },     // spark = Blitz
  echo_prime:                { icon: 'duplicate',  color: 'orange' },     // echo prime = Duplikat vom Besten
  chain_reaction_perk:       { icon: 'path_follow',color: 'red' },        // chain reaction = Pfad/Kette
  catalyst:                  { icon: 'particle',   color: 'amber' },      // catalyst = Partikelreaktion

  // ─── RELICS ──────────────────────────────────────────────────────────────

  combo_master:              { icon: 'ring',       color: 'amber' },      // combo = verkettete Ringe
  momentum:                  { icon: 'boots',      color: 'amber' },      // speed/momentum
  price_sense:               { icon: 'money_bag',  color: 'amber' },
  lucky_charm:               { icon: 'dice',       color: 'green' },
  glass_cannon:              { icon: 'bullet',     color: 'red' },        // hoher Angriff, fragil
  quick_learner:             { icon: 'brain',      color: 'blue' },
  iron_will:                 { icon: 'shield',     color: 'blue' },
  card_counter:              { icon: 'card',       color: 'amber' },
  treasure_hunter:           { icon: 'chest',      color: 'amber' },
  meditation:                { icon: 'brain',      color: 'teal' },       // kein Meditationsicon → brain passt gut

  // Meta-Relics: Retrigger/Amplifier
  echo:                      { icon: 'duplicate',  color: 'blue' },       // echo = verdoppeln/duplizieren
  amplifier:                 { icon: 'sound',      color: 'blue' },       // amplifier = Verstärker
  collector_bonus:           { icon: 'bag',        color: 'amber' },
  synergy_amp:               { icon: 'gear_2',     color: 'purple' },

  // Converter
  alchemist:                 { icon: 'potion',     color: 'green' },
  risk_reward:               { icon: 'dice',       color: 'orange' },
  snowball:                  { icon: 'freeze',     color: 'blue' },
  overkill:                  { icon: 'skull',      color: 'red' },

  // Meta-Scaling
  tag_master:                { icon: 'list',       color: 'purple' },
  synergy_chain:             { icon: 'path_follow',color: 'purple' },
  perk_mastery:              { icon: 'scroll',     color: 'purple' },
  level_power:               { icon: 'stat',       color: 'amber' },

  // Conditional
  chain_reaction:            { icon: 'thunder',    color: 'orange' },
  perfectionist_echo:        { icon: 'target_2',   color: 'amber' },
  streak_shield:             { icon: 'shield',     color: 'orange' },
  last_stand:                { icon: 'sword',      color: 'red' },
  xp_converter:              { icon: 'gear',       color: 'purple' },

  // Perk Enhancers
  eternal_flame:             { icon: 'glow',       color: 'orange' },     // ewige Flamme = Leuchten
  double_dip:                { icon: 'duplicate',  color: 'amber' },
  upgrade_master:            { icon: 'hammer',     color: 'amber' },
  perk_recycler:             { icon: 'reset',      color: 'green' },

  // Cheat-the-System
  deaths_mask:               { icon: 'skull',      color: 'teal' },       // teal = fake/cheat
  phantom_streak:            { icon: 'visibility_off', color: 'teal' },   // phantom = unsichtbar
  timeless:                  { icon: 'time',       color: 'gray' },

  // Regeln-Umdrehen
  reverse_timer:             { icon: 'reset_2',    color: 'blue' },       // reverse = rückwärts reset
  pain_is_gain:              { icon: 'drop',       color: 'red' },        // drop = Blut
  overflow:                  { icon: 'liquid',     color: 'red' },

  // Item-Hacker
  blueprint:                 { icon: 'parchment',  color: 'blue' },
  parasite:                  { icon: 'bug',        color: 'red' },
  mirror:                    { icon: 'mirror',     color: 'teal' },
  copycat:                   { icon: 'duplicate',  color: 'teal' },

  // Gold/Slot-System Relics
  synergy_expander:          { icon: 'unlock',     color: 'purple' },     // unlock = Slot freischalten
  gold_wellspring:           { icon: 'coin',       color: 'amber' },      // coin = Gold pro Antwort
  hoarder:                   { icon: 'crate',      color: 'amber' },      // crate = Sammeln/Lagern

  // Anti-Synergien
  hermit:                    { icon: 'door',       color: 'gray' },       // door = verschlossen/isoliert
  minimalist:                { icon: 'clear',      color: 'gray' },
  no_perks:                  { icon: 'disable',    color: 'gray' },

  // ─── SYNERGIES ───────────────────────────────────────────────────────────

  speed_demon_combo:         { icon: 'boots',      color: 'blue' },
  fortress:                  { icon: 'tower',      color: 'green' },
  gold_rush:                 { icon: 'coin',       color: 'amber' },
  scholar:                   { icon: 'brain',      color: 'purple' },
  hot_streak:                { icon: 'thunder',    color: 'orange' },
  fortune:                   { icon: 'dice',       color: 'amber' },
  berserker:                 { icon: 'sword',      color: 'red' },
  infinite_engine:           { icon: 'gear',       color: 'purple' },     // gear = Mechanismus, Loop
  jackpot:                   { icon: 'trophy',     color: 'amber' },
  unstoppable:               { icon: 'shield',     color: 'orange' },
  cheater:                   { icon: 'card',       color: 'teal' },
  masochist:                 { icon: 'drop',       color: 'red' },
  ascension:                 { icon: 'star',       color: 'purple' },
  phantom_power:             { icon: 'visibility_off', color: 'purple' },
  sacrifice_reward:          { icon: 'skull',      color: 'amber' },
};
