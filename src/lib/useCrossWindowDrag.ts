import { useEffect, useState } from 'react';
import { getChannel } from './channel';
import type { DragPayload } from './types';

export interface CrossWindowDragState {
  /** The payload of a drag currently in flight *in another window*, or null. */
  activeDrag: DragPayload | null;
  /** Convenience flag: is some other window mid-drag right now? */
  remoteDragging: boolean;
}

/**
 * Subscribes to the shared channel and exposes the current *remote* drag session.
 * Boards use this to light up their drop zones the instant another frame/tab
 * begins a drag — before any pointer has entered them.
 */
export function useCrossWindowDrag(): CrossWindowDragState {
  const channel = getChannel();
  const [activeDrag, setActiveDrag] = useState<DragPayload | null>(null);

  useEffect(() => {
    return channel.subscribe((msg) => {
      switch (msg.kind) {
        case 'dragstart':
          setActiveDrag(msg.payload);
          break;
        case 'dragend':
        case 'item-moved':
          setActiveDrag(null);
          break;
      }
    });
  }, [channel]);

  return {
    activeDrag,
    // Messages never echo to their sender, so anything we receive is by
    // definition remote — but guard on the id anyway for clarity/safety.
    remoteDragging: activeDrag !== null && activeDrag.sourceWindowId !== channel.windowId,
  };
}
