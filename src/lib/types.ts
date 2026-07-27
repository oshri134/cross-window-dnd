// ---------------------------------------------------------------------------
// Shared constants + wire types for the cross-window-dnd library.
// ---------------------------------------------------------------------------

/** BroadcastChannel name. Same-origin windows sharing this name talk to each other. */
export const CHANNEL_NAME = 'cross-window-dnd';

/**
 * Custom MIME type stored in the native `dataTransfer`. This is the payload that
 * actually rides the OS/compositor drag between windows — BroadcastChannel only
 * carries coordination hints, never the authoritative drop data.
 */
export const MIME_TYPE = 'application/x-cwdnd';

/** What a draggable puts into `dataTransfer` and what a droppable reads back out. */
export interface DragPayload<T = unknown> {
  /** Stable id of the dragged item. */
  id: string;
  /** Logical kind, matched against a droppable's `accept`. */
  type: string;
  /** Window that started the drag — used by the race guard to decide who removes. */
  sourceWindowId: string;
  /** Free-form consumer data (title, source column, …). Must be JSON-serialisable. */
  data?: T;
}

/** Messages exchanged on the BroadcastChannel. `senderId` is always the poster's window id. */
export type ChannelMessage =
  | { kind: 'dragstart'; payload: DragPayload; senderId: string }
  | { kind: 'dragend'; itemId: string; senderId: string }
  | {
      kind: 'item-moved';
      itemId: string;
      to: string;
      /** Window the item originated from — the only window allowed to remove it. */
      sourceWindowId: string;
      /** Consumer data copied from the drag payload so the receiver can re-create the item. */
      data?: unknown;
      senderId: string;
    };
