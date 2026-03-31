import { ITEM_ICONS } from '../constants/itemIconMap';

/**
 * Gibt Icon-Info für ein Perk/Relic/Synergy zurück.
 * @returns {{ type: 'icon', icon: string, color: string } | { type: 'emoji', emoji: string }}
 */
export function getItemIcon(itemId, fallbackEmoji) {
  const mapping = ITEM_ICONS[itemId];
  if (mapping) {
    return { type: 'icon', ...mapping };
  }
  return { type: 'emoji', emoji: fallbackEmoji };
}
