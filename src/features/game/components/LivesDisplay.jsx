import React from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { GAME_CONFIG } from '../../../shared/utils/constants';

export default function LivesDisplay({ lives }) {
  return (
    <div className="flex items-center sm:w-1/4 justify-end gap-2 mb-4">
      {[...Array(GAME_CONFIG.INITIAL_LIVES)].map((_, i) =>
        i < lives ? (
          <FaHeart key={i} className="text-red-500 text-2xl" />
        ) : (
          <FaRegHeart key={i} className="text-gray-400 text-2xl" />
        )
      )}
    </div>
  );
}