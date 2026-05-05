import { useState } from 'react';
import { motion } from 'framer-motion';
import { MERCHANT_TYPES } from '../constants/mapDefinitions';
import MerchantPanel from './MerchantPanel';
import GameIcon from '../../../shared/components/GameIcon';

const ALL_MERCHANT_TYPES = [
  MERCHANT_TYPES.ARMORER,
  MERCHANT_TYPES.HEALER,
  MERCHANT_TYPES.PERK_VENDOR,
  MERCHANT_TYPES.WANDERING_MAGE,
];

function pickMerchants() {
  const shuffled = [...ALL_MERCHANT_TYPES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

export default function ShopScreen({
  gold,
  lives,
  maxLives,
  activeRelics = [],
  activePerks = [],
  perkSlotInfo = null,
  utilitySlotInfo = null,
  canOfferPerk = null,
  onClose,
  onBuyRelic,
  onBuyPerk,
  onHeal,
  onUpgradePerk,
  onBuySynergySlot,
  onBuyPerkSlot,
  onBuyUtilitySlot,
}) {
  const [merchants] = useState(() => pickMerchants());
  const ownedRelicIds = new Set(activeRelics.map(r => r.id));
  const activePerkIds = new Set(activePerks.map(p => p.id));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-md mx-4 rounded-sm border-2 border-amber-500/60 bg-[#0d1117] shadow-pixel p-5 max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-xl font-black text-amber-300">Shop</h2>
            <p className="text-indigo-300/60 text-xs">Spend your gold wisely</p>
          </div>
          <span className="text-amber-300 font-black text-lg inline-flex items-center gap-1"><GameIcon name="coin" size={16} color="amber" /> {gold}</span>
        </div>

        {/* Merchants */}
        <div className="flex flex-col gap-5 overflow-y-auto flex-1 pr-1">
          {merchants.map((type, i) => (
            <motion.div
              key={type}
              className="bg-white/5 rounded-sm p-4 border-2 border-white/10 shadow-pixel-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <MerchantPanel
                type={type}
                gold={gold}
                lives={lives}
                maxLives={maxLives}
                ownedRelicIds={ownedRelicIds}
                activePerkIds={activePerkIds}
                canOfferPerk={canOfferPerk}
                canBuyPerkSlot={Boolean(perkSlotInfo && perkSlotInfo.used < perkSlotInfo.max)}
                canBuyUtilitySlot={Boolean(utilitySlotInfo && utilitySlotInfo.used < utilitySlotInfo.max)}
                onBuyRelic={onBuyRelic}
                onBuyPerk={onBuyPerk}
                onHeal={onHeal}
                onUpgradePerk={onUpgradePerk}
                onBuySynergySlot={onBuySynergySlot}
                onBuyPerkSlot={onBuyPerkSlot}
                onBuyUtilitySlot={onBuyUtilitySlot}
              />
            </motion.div>
          ))}
        </div>

        {/* Leave */}
        <div className="shrink-0 mt-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-sm font-bold text-base border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white transition-colors shadow-pixel-sm active:scale-95"
          >
            Leave Shop
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
