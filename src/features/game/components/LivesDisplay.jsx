import React from 'react';
import { GAME_CONFIG } from '../../../shared/utils/constants';
import GameIcon from '../../../shared/components/GameIcon';

export default function LivesDisplay({ lives, maxLives = GAME_CONFIG.INITIAL_LIVES }) {
  // Mindestens so viele Herzen wie aktuelle Leben anzeigen (z.B. Meta-Bonus-Leben über dem Cap)
  const hearts = Math.max(maxLives, lives, GAME_CONFIG.INITIAL_LIVES);
  return (
    <div className="flex items-center sm:w-1/4 justify-end gap-1.5 mb-4">
      {[...Array(hearts)].map((_, i) =>
        i < lives ? (
          <GameIcon key={i} name="heart" size={24} color="red" />
        ) : (
          <GameIcon key={i} name="heart" size={24} color="gray" />
        )
      )}
    </div>
  );
}