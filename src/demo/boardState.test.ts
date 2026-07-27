import { describe, expect, it } from 'vitest';
import type { DragPayload } from '../lib';
import { applyDrop, applyRemoteMove } from './boardState';
import type { Item } from './seed';

const items: Item[] = [
  { id: 'a-1', title: 'Design API', columnId: 'todo' },
  { id: 'a-2', title: 'Wire channel', columnId: 'todo' },
];

function payload(over: Partial<DragPayload> = {}): DragPayload {
  return { id: 'a-1', type: 'card', sourceWindowId: 'w-self', ...over };
}

describe('applyDrop', () => {
  it('moves an existing item between columns (same-window)', () => {
    const next = applyDrop(items, payload(), 'done');
    expect(next.find((it) => it.id === 'a-1')?.columnId).toBe('done');
    expect(next).toHaveLength(2); // no duplicate
  });

  it('materialises an item arriving from another window using payload data', () => {
    const next = applyDrop(items, payload({ id: 'b-9', data: { title: 'From B', fromColumnId: 'todo' } }), 'done');
    expect(next).toHaveLength(3);
    expect(next.at(-1)).toEqual({ id: 'b-9', title: 'From B', columnId: 'done' });
  });

  it('falls back to the id as title when payload has no data', () => {
    const next = applyDrop(items, payload({ id: 'b-9', data: undefined }), 'todo');
    expect(next.at(-1)?.title).toBe('b-9');
  });

  it('does not mutate the input array', () => {
    const snapshot = structuredClone(items);
    applyDrop(items, payload(), 'done');
    expect(items).toEqual(snapshot);
  });
});

describe('applyRemoteMove', () => {
  it('removes the item when this window is the source', () => {
    const next = applyRemoteMove(items, { itemId: 'a-1', sourceWindowId: 'w-self' }, 'w-self');
    expect(next.map((it) => it.id)).toEqual(['a-2']);
  });

  it('ignores the message when another window is the source', () => {
    const next = applyRemoteMove(items, { itemId: 'a-1', sourceWindowId: 'w-other' }, 'w-self');
    expect(next).toBe(items); // untouched reference
  });
});
