import { useSyncExternalStore } from 'react';
import { getChannel } from './channel';
import { getActiveDrag, subscribeDragSession } from './dragSession';
import type { DragPayload } from './types';

export interface CrossWindowDragState {
  /** The payload of a drag currently in flight *in another window*, or null. */
  activeDrag: DragPayload | null;
  /** Convenience flag: is some other window mid-drag right now? */
  remoteDragging: boolean;
}

/**
 * Reads the shared remote-drag session (see dragSession.ts). Boards use this to
 * light up their drop zones the instant another frame/tab begins a drag — before
 * any pointer has entered them.
 *
 * Backed by a single module-level store via `useSyncExternalStore`, so every
 * consumer shares one channel subscription and one timer. `getServerSnapshot`
 * returns null, keeping it SSR-safe.
 */
export function useCrossWindowDrag(): CrossWindowDragState {
  const channel = getChannel();
  const activeDrag = useSyncExternalStore(
    subscribeDragSession,
    getActiveDrag,
    () => null,
  );

  return {
    activeDrag,
    // Messages never echo to their sender, so anything we receive is by
    // definition remote — but guard on the id anyway for clarity/safety.
    remoteDragging: activeDrag !== null && activeDrag.sourceWindowId !== channel.windowId,
  };
}
