import React from 'react';
import { GAME_CONFIG } from '../../../shared/utils/constants';
import GameIcon from '../../../shared/components/GameIcon';

export default function LivesDisplay({ lives }) {
  return (
    <div className="flex items-center sm:w-1/4 justify-end gap-1.5 mb-4">
      {[...Array(GAME_CONFIG.INITIAL_LIVES)].map((_, i) =>
        i < lives ? (
          <GameIcon key={i} name="heart" size={24} color="red" />
        ) : (
          <GameIcon key={i} name="heart" size={24} color="gray" />
        )
      )}
    </div>
  );
}