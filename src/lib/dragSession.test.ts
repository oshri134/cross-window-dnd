import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Drive the store through a fake channel so we can invoke messages + timers
// deterministically, with no real BroadcastChannel.
const h = vi.hoisted(() => ({ captured: null as ((msg: unknown) => void) | null }));

vi.mock('./channel', () => ({
  getChannel: () => ({
    windowId: 'w-self',
    subscribe: (fn: (msg: unknown) => void) => {
      h.captured = fn;
      return () => {};
    },
    post: () => {},
  }),
}));

import { getActiveDrag, STUCK_DRAG_TIMEOUT_MS, subscribeDragSession } from './dragSession';

const dragstart = { kind: 'dragstart', payload: { id: 'x', type: 'card', sourceWindowId: 'w-other' }, senderId: 'w-other' };

describe('dragSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    subscribeDragSession(() => {});
    // Ensure a clean slate between tests (store is module-global).
    h.captured?.({ kind: 'dragend', itemId: 'x', senderId: 'w-other' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes the active drag on dragstart and clears it on dragend', () => {
    expect(getActiveDrag()).toBeNull();
    h.captured!(dragstart);
    expect(getActiveDrag()?.id).toBe('x');
    h.captured!({ kind: 'dragend', itemId: 'x', senderId: 'w-other' });
    expect(getActiveDrag()).toBeNull();
  });

  it('clears the active drag on item-moved', () => {
    h.captured!(dragstart);
    h.captured!({ kind: 'item-moved', itemId: 'x', to: 'done', sourceWindowId: 'w-other', senderId: 'w-other' });
    expect(getActiveDrag()).toBeNull();
  });

  it('auto-clears a stuck drag after the safety timeout', () => {
    h.captured!(dragstart);
    expect(getActiveDrag()?.id).toBe('x');
    vi.advanceTimersByTime(STUCK_DRAG_TIMEOUT_MS + 1);
    expect(getActiveDrag()).toBeNull();
  });

  it('resets the safety timer on a fresh dragstart', () => {
    h.captured!(dragstart);
    vi.advanceTimersByTime(STUCK_DRAG_TIMEOUT_MS - 1);
    h.captured!(dragstart); // restarts the countdown
    vi.advanceTimersByTime(2);
    expect(getActiveDrag()?.id).toBe('x'); // not cleared yet
    vi.advanceTimersByTime(STUCK_DRAG_TIMEOUT_MS);
    expect(getActiveDrag()).toBeNull();
  });
});
