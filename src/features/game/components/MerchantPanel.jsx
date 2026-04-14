import { motion } from 'framer-motion';
import { MERCHANT_TYPES, SHOP_PRICES } from '../constants/mapDefinitions';
import { RELICS, RELIC_RARITY } from '../constants/relicDefinitions';
import { PERKS } from '../constants/perkDefinitions';

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

function pickPerks(count, activePerkIds) {
  const pool = Object.values(PERKS).filter(p => !activePerkIds.has(p.id) && p.duration !== -1);
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
      className={`w-full text-left px-3 py-2.5 rounded-sm border-2 transition-all
        ${canAfford
          ? 'border-amber-400/50 bg-amber-900/20 hover:bg-amber-800/30 cursor-pointer shadow-pixel-sm active:scale-95'
          : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'}`}
      whileHover={canAfford ? { scale: 1.02 } : {}}
      whileTap={canAfford ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{item.icon ?? '✨'}</span>
          <div className="min-w-0">
            <div className={`font-bold text-sm truncate ${RARITY_COLOR[item.rarity] ?? 'text-white'}`}>
              {item.name}
            </div>
            <div className="text-indigo-300/70 text-xs line-clamp-1">{item.description}</div>
          </div>
        </div>
        <div className="shrink-0 text-amber-300 font-black text-sm">🪙{price}</div>
      </div>
    </motion.button>
  );
}

export default function MerchantPanel({ type, gold, lives, maxLives, ownedRelicIds = new Set(), activePerkIds = new Set(), onBuyRelic, onBuyPerk, onHeal, onUpgradePerk, onBuySynergySlot }) {
  if (type === MERCHANT_TYPES.ARMORER) {
    const relics = pickRelics(3, ownedRelicIds);
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⚔️</span>
          <div>
            <div className="font-black text-white">Armorer</div>
            <div className="text-indigo-300/60 text-xs">Deals in relics and equipment</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {relics.map(relic => (
            <ItemCard
              key={relic.id}
              item={relic}
              price={SHOP_PRICES.relic[relic.rarity] ?? 45}
              gold={gold}
              canAfford={gold >= (SHOP_PRICES.relic[relic.rarity] ?? 45)}
              onBuy={() => onBuyRelic(relic, SHOP_PRICES.relic[relic.rarity] ?? 45)}
            />
          ))}
          {relics.length === 0 && <div className="text-white/30 text-sm text-center py-2">No relics available</div>}
        </div>
      </div>
    );
  }

  if (type === MERCHANT_TYPES.HEALER) {
    const healCost = SHOP_PRICES.heal;
    const upgradeCost = SHOP_PRICES.perk_upgrade;
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🏥</span>
          <div>
            <div className="font-black text-white">Healer</div>
            <div className="text-indigo-300/60 text-xs">Restoration and perk upgrades</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <ItemCard
            item={{ name: 'Healing Potion', description: `Restore 1 life (max ${maxLives})`, icon: '❤️', rarity: 'common' }}
            price={healCost}
            gold={gold}
            canAfford={gold >= healCost && lives < maxLives}
            onBuy={onHeal}
          />
          <ItemCard
            item={{ name: 'Perk Upgrade', description: 'Extend a perk\'s duration by 3 rounds', icon: '⬆️', rarity: 'rare' }}
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
    const perks = pickPerks(3, activePerkIds);
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🧙</span>
          <div>
            <div className="font-black text-white">Perk Vendor</div>
            <div className="text-indigo-300/60 text-xs">Sells temporary and permanent perks</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {perks.map(perk => (
            <ItemCard
              key={perk.id}
              item={perk}
              price={SHOP_PRICES.perk[perk.rarity] ?? 30}
              gold={gold}
              canAfford={gold >= (SHOP_PRICES.perk[perk.rarity] ?? 30)}
              onBuy={() => onBuyPerk(perk, SHOP_PRICES.perk[perk.rarity] ?? 30)}
            />
          ))}
          {perks.length === 0 && <div className="text-white/30 text-sm text-center py-2">No perks available</div>}
        </div>
      </div>
    );
  }

  if (type === MERCHANT_TYPES.WANDERING_MAGE) {
    const synergySlotCost = SHOP_PRICES.synergy_slot;
    const legendaryRelics = Object.values(RELICS).filter(r => r.rarity === 'legendary' && !ownedRelicIds.has(r.id));
    const legendaryRelic = legendaryRelics[Math.floor(Math.random() * legendaryRelics.length)];
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🔮</span>
          <div>
            <div className="font-black text-white">Wandering Mage</div>
            <div className="text-indigo-300/60 text-xs">Rare artifacts and arcane upgrades</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <ItemCard
            item={{ name: 'Synergy Slot', description: 'Unlock an extra synergy slot (+1 max)', icon: '🔗', rarity: 'epic' }}
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
