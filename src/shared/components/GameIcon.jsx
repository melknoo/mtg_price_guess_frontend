import React from 'react';
import { ICONS } from '../constants/iconMap';

const COLOR_PRESETS = {
  white:  'brightness(0) invert(1)',
  amber:  'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(15deg)',
  purple: 'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(240deg)',
  blue:   'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(200deg)',
  green:  'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(90deg)',
  red:    'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(340deg)',
  pink:   'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(300deg)',
  orange: 'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(30deg)',
  teal:   'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(160deg)',
  gray:   'brightness(0) invert(1) opacity(0.5)',
  // MTG Black mana: dunkles Blau-Lila (Swamp-Ästhetik, sichtbar auf dunklem Hintergrund)
  dark:   'brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(250deg) brightness(0.6)',
};

export default function GameIcon({ name, size = 20, color = 'white', className = '' }) {
  const src = ICONS[name];

  if (!src) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[GameIcon] Unknown icon: "${name}"`);
    }
    return <span style={{ fontSize: size }}>{name}</span>;
  }

  const filter = COLOR_PRESETS[color] ?? COLOR_PRESETS.white;

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`inline-block shrink-0 ${className}`}
      style={{ filter }}
      draggable={false}
    />
  );
}
