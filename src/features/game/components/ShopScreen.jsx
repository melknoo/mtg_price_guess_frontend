import { useState } from 'react';
import { motion } from 'framer-motion';
import { MERCHANT_TYPES, SHOP_PRICES } from '../constants/mapDefinitions';
import MerchantPanel, { ItemCard } from './MerchantPanel';
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
  relicSlotsMax = 4,
  canBuyRelicSlot = false,
  discount = 0,
  onClose,
  onBuyRelic,
  onBuyPerk,
  onHeal,
  onUpgradePerk,
  onBuySynergySlot,
  onBuyPerkSlot,
  onBuyUtilitySlot,
  onBuyRelicSlot,
}) {
  const [merchants] = useState(() => pickMerchants());
  const ownedRelicIds = new Set(activeRelics.map(r => r.id));
  const activePerkIds = new Set(activePerks.map(p => p.id));
  const dp = (p) => Math.ceil(p * (1 - discount));
  const canBuyPerkSlot = Boolean(perkSlotInfo && perkSlotInfo.max < 5);
  const canBuyUtilitySlot = Boolean(utilitySlotInfo && utilitySlotInfo.max < 2);
  const perkSlotPrice = dp(SHOP_PRICES.perk_slot);
  const utilitySlotPrice = dp(SHOP_PRICES.utility_slot);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-md mx-4 rounded-none border-4 border-amber-500 bg-[#0d1117] shadow-pixel p-5 max-h-[90vh] flex flex-col"
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
          {/* Slot-Upgrades: immer verfügbar, unabhängig vom gewürfelten Händler */}
          {(canBuyPerkSlot || canBuyUtilitySlot) && (
            <div className="bg-white/5 rounded-none p-4 border-2 border-amber-400/40 shadow-pixel-sm">
              <div className="flex items-center gap-2 mb-3">
                <GameIcon name="grid" size={24} color="amber" />
                <div>
                  <div className="font-black text-white">Slot Upgrades</div>
                  <div className="text-indigo-300/60 text-xs">Expand your build capacity</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {canBuyPerkSlot && (
                  <ItemCard
                    item={{ id: '_perk_slot', name: 'Perk Slot', description: 'Unlock one extra passive perk slot (+1 max)', _gameIcon: { icon: 'grid', color: 'amber' }, rarity: 'epic' }}
                    price={perkSlotPrice}
                    gold={gold}
                    canAfford={gold >= perkSlotPrice}
                    onBuy={onBuyPerkSlot}
                  />
                )}
                {canBuyUtilitySlot && (
                  <ItemCard
                    item={{ id: '_utility_slot', name: 'Utility Slot', description: 'Unlock one extra utility perk slot (+1 max)', _gameIcon: { icon: 'bag', color: 'teal' }, rarity: 'epic' }}
                    price={utilitySlotPrice}
                    gold={gold}
                    canAfford={gold >= utilitySlotPrice}
                    onBuy={onBuyUtilitySlot}
                  />
                )}
              </div>
            </div>
          )}
          {merchants.map((type, i) => (
            <motion.div
              key={type}
              className="bg-white/5 rounded-none p-4 border-2 border-white/20 shadow-pixel-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <MerchantPanel
                type={type}
                gold={gold}
                lives={lives}
                maxLives={maxLives}
                discount={discount}
                ownedRelicIds={ownedRelicIds}
                activePerkIds={activePerkIds}
                canOfferPerk={canOfferPerk}
                canBuyRelicSlot={canBuyRelicSlot}
                relicSlotsMax={relicSlotsMax}
                onBuyRelic={onBuyRelic}
                onBuyPerk={onBuyPerk}
                onHeal={onHeal}
                onUpgradePerk={onUpgradePerk}
                onBuySynergySlot={onBuySynergySlot}
                onBuyRelicSlot={onBuyRelicSlot}
              />
            </motion.div>
          ))}
        </div>

        {/* Leave */}
        <div className="shrink-0 mt-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-none font-bold text-base border-4 border-white/30 bg-white/5 hover:bg-white/10 text-white transition-colors shadow-pixel active:scale-95"
          >
            Leave Shop
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
