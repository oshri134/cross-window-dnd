import { getChannel } from './channel';
import type { DragPayload } from './types';

// A single, module-level source of truth for "is another window dragging, and
// what?". Every droppable subscribes to this one store instead of each opening
// its own channel subscription + state — one timer, one listener, shared reads.

/**
 * Safety net: if the window that started a drag is closed or crashes mid-drag,
 * no `dragend`/`item-moved` ever arrives and remote highlights would stay stuck.
 * We auto-clear the session this long after the last `dragstart`.
 */
export const STUCK_DRAG_TIMEOUT_MS = 10_000;

let activeDrag: DragPayload | null = null;
let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const subscribers = new Set<() => void>();

function emit(): void {
  for (const notify of subscribers) notify();
}

function setActiveDrag(next: DragPayload | null): void {
  if (activeDrag === next) return;
  activeDrag = next;
  emit();
}

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function start(): void {
  if (started) return;
  started = true;
  getChannel().subscribe((msg) => {
    switch (msg.kind) {
      case 'dragstart':
        setActiveDrag(msg.payload);
        clearTimer();
        timer = setTimeout(() => setActiveDrag(null), STUCK_DRAG_TIMEOUT_MS);
        break;
      case 'dragend':
      case 'item-moved':
        clearTimer();
        setActiveDrag(null);
        break;
    }
  });
}

/** For `useSyncExternalStore`: subscribe to remote-drag-session changes. */
export function subscribeDragSession(onChange: () => void): () => void {
  start();
  subscribers.add(onChange);
  return () => {
    subscribers.delete(onChange);
  };
}

/** Current remote (or local) drag payload in flight, or null. */
export function getActiveDrag(): DragPayload | null {
  return activeDrag;
}
