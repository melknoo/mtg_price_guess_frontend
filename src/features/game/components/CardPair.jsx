import React from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../utils/cardComparison';

export default function CardPair({ 
  cards, 
  selectedCard, 
  correctIndex, 
  showPrices, 
  onChoice,
  onImageLoad 
}) {
  if (!cards || cards.length !== 2) {
    return null;
  }

  const getBorderClass = (index) => {
    if (selectedCard === null) return 'border-4 border-transparent';
    
    if (selectedCard === index) {
      return correctIndex === index 
        ? 'border-4 border-green-500' 
        : 'border-4 border-red-500';
    }
    
    return 'border-4 border-transparent';
  };

  const isClickable = selectedCard === null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:mt-0 mt-auto max-w-lg sm:max-w-2xl w-full">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          whileHover={{ scale: isClickable ? 1.05 : 1 }}
          whileTap={{ scale: isClickable ? 0.95 : 1 }}
          onClick={() => isClickable && onChoice(index)}
          className={`
            transition 
            ${isClickable ? 'cursor-pointer' : 'pointer-events-none'}
            ${getBorderClass(index)}
          `}
        >
          <div className="bg-white text-black rounded-2xl shadow-xl overflow-hidden">
            <div className="p-0">
              {/* Preis anzeigen wenn aufgedeckt */}
              {showPrices && (
                <div className="md:text-2xl text-base p-2 text-gray-700 text-center font-semibold">
                  💵 {formatPrice(card.prices.eur)}
                </div>
              )}
              
              {/* Karten-Bild */}
              <img
                src={card.image_uris.normal}
                alt={card.name}
                className="w-full h-auto sm:max-h-[500px] object-contain"
                onLoad={() => onImageLoad(index)}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}