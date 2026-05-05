import { useState } from 'react';
import { motion } from 'framer-motion';
import { MERCHANT_TYPES, SHOP_PRICES } from '../constants/mapDefinitions';
import { RELICS, RELIC_RARITY } from '../constants/relicDefinitions';
import { PERKS } from '../constants/perkDefinitions';
import GameIcon from '../../../shared/components/GameIcon';
import { ITEM_ICONS } from '../../../shared/constants/itemIconMap';

const RARITY_WEIGHTS = { common: 50, rare: 30, epic: 15, legendary: 5 };

function weightedRandom(items) {
  const total = items.reduce((s, i) => s + (RARITY_WEIGHTS[i.rarity] ?? 10), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= RARITY_WEIGHTS[item.rarity] ?? 10;
    if (r <= 0) return item;
  }
  return items[0];
}

function pickRelics(count, ownedIds) {
  const pool = Object.values(RELICS).filter(r => !ownedIds.has(r.id));
  const picked = [];
  const used = new Set();
  for (let i = 0; i < count && pool.length > used.size; i++) {
    let relic = weightedRandom(pool.filter(r => !used.has(r.id)));
    if (relic) { picked.push(relic); used.add(relic.id); }
  }
  return picked;
}

function pickPerks(count, activePerkIds, canOfferPerk = () => true) {
  const pool = Object.values(PERKS).filter(p => !activePerkIds.has(p.id) && canOfferPerk(p));
  const picked = [];
  const used = new Set();
  for (let i = 0; i < count && pool.length > used.size; i++) {
    let perk = weightedRandom(pool.filter(p => !used.has(p.id)));
    if (perk) { picked.push(perk); used.add(perk.id); }
  }
  return picked;
}

const RARITY_COLOR = {
  [RELIC_RARITY?.COMMON ?? 'common']: 'text-gray-300',
  [RELIC_RARITY?.RARE ?? 'rare']: 'text-blue-300',
  [RELIC_RARITY?.EPIC ?? 'epic']: 'text-purple-300',
  [RELIC_RARITY?.LEGENDARY ?? 'legendary']: 'text-amber-300',
};

function ItemCard({ item, price, gold, canAfford, onBuy }) {
  return (
    <motion.button
      onClick={canAfford ? onBuy : undefined}
      disabled={!canAfford}
      className={`w-full text-left px-3 py-2.5 rounded-none border-2 transition-all
        ${canAfford
          ? 'border-amber-400 bg-amber-900/20 hover:bg-amber-800/30 cursor-pointer shadow-pixel-sm active:scale-95'
          : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'}`}
      whileHover={canAfford ? { scale: 1.02 } : {}}
      whileTap={canAfford ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {ITEM_ICONS[item.id]
            ? <GameIcon name={ITEM_ICONS[item.id].icon} color={ITEM_ICONS[item.id].color} size={20} />
            : item._gameIcon
              ? <GameIcon name={item._gameIcon.icon} color={item._gameIcon.color} size={20} />
              : <GameIcon name="star" size={20} color="amber" />}
          <div className="min-w-0">
            <div className={`font-bold text-sm truncate ${RARITY_COLOR[item.rarity] ?? 'text-white'}`}>
              {item.name}
            </div>
            <div className="text-indigo-300/70 text-xs line-clamp-1">{item.description}</div>
          </div>
        </div>
        <div className="shrink-0 text-amber-300 font-black text-sm inline-flex items-center gap-0.5"><GameIcon name="coin" size={13} color="amber" />{price}</div>
      </div>
    </motion.button>
  );
}

// Stabiler Armorer: Relics werden einmal gepickt und bleiben nach Kauf ohne den gekauften
function ArmorerPanel({ gold, ownedRelicIds, onBuyRelic }) {
  const [availableRelics, setAvailableRelics] = useState(() => pickRelics(3, ownedRelicIds));

  const handleBuy = (relic) => {
    const price = SHOP_PRICES.relic[relic.rarity] ?? 45;
    onBuyRelic(relic, price);
    setAvailableRelics(prev => prev.filter(r => r.id !== relic.id));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <GameIcon name="sword" size={24} color="white" />
        <div>
          <div className="font-black text-white">Armorer</div>
          <div className="text-indigo-300/60 text-xs">Deals in relics and equipment</div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {availableRelics.map(relic => (
          <ItemCard
            key={relic.id}
            item={relic}
            price={SHOP_PRICES.relic[relic.rarity] ?? 45}
            gold={gold}
            canAfford={gold >= (SHOP_PRICES.relic[relic.rarity] ?? 45)}
            onBuy={() => handleBuy(relic)}
          />
        ))}
        {availableRelics.length === 0 && <div className="text-white/30 text-sm text-center py-2">No relics available</div>}
      </div>
    </div>
  );
}

// Stabiler Perk Vendor: Perks werden einmal gepickt und bleiben nach Kauf ohne den gekauften
function PerkVendorPanel({ gold, activePerkIds, canOfferPerk, onBuyPerk }) {
  const [availablePerks, setAvailablePerks] = useState(() => pickPerks(3, activePerkIds, canOfferPerk));

  const handleBuy = (perk) => {
    const price = SHOP_PRICES.perk[perk.rarity] ?? 30;
    onBuyPerk(perk, price);
    setAvailablePerks(prev => prev.filter(p => p.id !== perk.id));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <GameIcon name="hat" size={24} color="purple" />
        <div>
          <div className="font-black text-white">Perk Vendor</div>
          <div className="text-indigo-300/60 text-xs">Sells temporary and permanent perks</div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {availablePerks.map(perk => (
          <ItemCard
            key={perk.id}
            item={perk}
            price={SHOP_PRICES.perk[perk.rarity] ?? 30}
            gold={gold}
            canAfford={gold >= (SHOP_PRICES.perk[perk.rarity] ?? 30)}
            onBuy={() => handleBuy(perk)}
          />
        ))}
        {availablePerks.length === 0 && <div className="text-white/30 text-sm text-center py-2">No perks available</div>}
      </div>
    </div>
  );
}

export default function MerchantPanel({ type, gold, lives, maxLives, ownedRelicIds = new Set(), activePerkIds = new Set(), canOfferPerk, canBuyPerkSlot = false, canBuyUtilitySlot = false, onBuyRelic, onBuyPerk, onHeal, onUpgradePerk, onBuySynergySlot, onBuyPerkSlot, onBuyUtilitySlot }) {
  if (type === MERCHANT_TYPES.ARMORER) {
    return <ArmorerPanel gold={gold} ownedRelicIds={ownedRelicIds} onBuyRelic={onBuyRelic} />;
  }

  if (type === MERCHANT_TYPES.HEALER) {
    const healCost = SHOP_PRICES.heal;
    const upgradeCost = SHOP_PRICES.perk_upgrade;
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <GameIcon name="heart" size={24} color="pink" />
          <div>
            <div className="font-black text-white">Healer</div>
            <div className="text-indigo-300/60 text-xs">Restoration and perk upgrades</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <ItemCard
            item={{ id: '_heal', name: 'Healing Potion', description: `Restore 1 life (max ${maxLives})`, _gameIcon: { icon: 'heart', color: 'red' }, rarity: 'common' }}
            price={healCost}
            gold={gold}
            canAfford={gold >= healCost && lives < maxLives}
            onBuy={onHeal}
          />
          <ItemCard
            item={{ id: '_perk_upgrade', name: 'Perk Upgrade', description: 'Extend a perk\'s duration by 3 rounds', _gameIcon: { icon: 'hammer', color: 'amber' }, rarity: 'rare' }}
            price={upgradeCost}
            gold={gold}
            canAfford={gold >= upgradeCost}
            onBuy={onUpgradePerk}
          />
        </div>
      </div>
    );
  }

  if (type === MERCHANT_TYPES.PERK_VENDOR) {
    return <PerkVendorPanel gold={gold} activePerkIds={activePerkIds} canOfferPerk={canOfferPerk} onBuyPerk={onBuyPerk} />;
  }

  if (type === MERCHANT_TYPES.WANDERING_MAGE) {
    const synergySlotCost = SHOP_PRICES.synergy_slot;
    const perkSlotCost = SHOP_PRICES.perk_slot;
    const utilitySlotCost = SHOP_PRICES.utility_slot;
    const legendaryRelics = Object.values(RELICS).filter(r => r.rarity === 'legendary' && !ownedRelicIds.has(r.id));
    const legendaryRelic = legendaryRelics[Math.floor(Math.random() * legendaryRelics.length)];
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <GameIcon name="gem" size={24} color="purple" />
          <div>
            <div className="font-black text-white">Wandering Mage</div>
            <div className="text-indigo-300/60 text-xs">Rare artifacts and arcane upgrades</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <ItemCard
            item={{ id: '_perk_slot', name: 'Perk Slot', description: 'Unlock one extra passive perk slot (+1 max)', _gameIcon: { icon: 'grid', color: 'amber' }, rarity: 'epic' }}
            price={perkSlotCost}
            gold={gold}
            canAfford={canBuyPerkSlot && gold >= perkSlotCost}
            onBuy={onBuyPerkSlot}
          />
          <ItemCard
            item={{ id: '_utility_slot', name: 'Utility Slot', description: 'Unlock one extra utility perk slot (+1 max)', _gameIcon: { icon: 'bag', color: 'teal' }, rarity: 'epic' }}
            price={utilitySlotCost}
            gold={gold}
            canAfford={canBuyUtilitySlot && gold >= utilitySlotCost}
            onBuy={onBuyUtilitySlot}
          />
          <ItemCard
            item={{ id: '_synergy_slot', name: 'Synergy Slot', description: 'Unlock an extra synergy slot (+1 max)', _gameIcon: { icon: 'path_follow', color: 'teal' }, rarity: 'epic' }}
            price={synergySlotCost}
            gold={gold}
            canAfford={gold >= synergySlotCost}
            onBuy={onBuySynergySlot}
          />
          {legendaryRelic && (
            <ItemCard
              item={legendaryRelic}
              price={SHOP_PRICES.relic.legendary}
              gold={gold}
              canAfford={gold >= SHOP_PRICES.relic.legendary}
              onBuy={() => onBuyRelic(legendaryRelic, SHOP_PRICES.relic.legendary)}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
