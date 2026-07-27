import type { DragPayload } from '../lib';
import type { CardData } from './Card';
import type { Item } from './seed';

// Pure state transitions for a board. Kept side-effect free so they can be unit
// tested without React, the DOM, or a BroadcastChannel.

/**
 * Apply a drop into `toColumn` of this window's board.
 * - If the item already lives here → it's a same-window move between columns.
 * - Otherwise it arrived from another window → materialise it from the payload.
 */
export function applyDrop(items: Item[], payload: DragPayload, toColumn: string): Item[] {
  const existing = items.find((it) => it.id === payload.id);
  if (existing) {
    return items.map((it) => (it.id === payload.id ? { ...it, columnId: toColumn } : it));
  }
  const data = payload.data as CardData | undefined;
  return [...items, { id: payload.id, title: data?.title ?? payload.id, columnId: toColumn }];
}

/**
 * React to another window's `item-moved` broadcast. Only the window that owns
 * the item (matching `sourceWindowId`) removes it; everyone else ignores it.
 */
export function applyRemoteMove(
  items: Item[],
  msg: { itemId: string; sourceWindowId: string },
  myWindowId: string,
): Item[] {
  if (msg.sourceWindowId !== myWindowId) return items;
  return items.filter((it) => it.id !== msg.itemId);
}
