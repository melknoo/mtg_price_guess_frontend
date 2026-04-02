import React from 'react';
import GameIcon from './GameIcon';
import { TAG_ICON_MAP } from '../constants/tagIconMap';

export default function TagIcons({ tags = [], size = 12 }) {
  const known = tags.filter(t => TAG_ICON_MAP[t]);
  if (known.length === 0) return null;
  return (
    <>
      {known.map(tag => (
        <GameIcon key={tag} name={TAG_ICON_MAP[tag].icon} color={TAG_ICON_MAP[tag].color} size={size} />
      ))}
    </>
  );
}
