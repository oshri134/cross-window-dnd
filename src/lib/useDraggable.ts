import { useState, type DragEventHandler } from 'react';
import { getChannel } from './channel';
import { MIME_TYPE, type DragPayload } from './types';

export interface UseDraggableArgs<T = unknown> {
  id: string;
  type: string;
  data?: T;
}

export interface UseDraggableResult {
  /** Spread onto the drag source element. */
  attributes: { draggable: true };
  /** Spread onto the drag source element. */
  listeners: {
    onDragStart: DragEventHandler;
    onDragEnd: DragEventHandler;
  };
  /** True between dragstart and dragend for this element. */
  isDragging: boolean;
}

/**
 * Makes an element a native drag source. Two things happen on dragstart:
 *  1. The authoritative payload is written to `dataTransfer` — this crosses the
 *     window boundary via the OS drag, independent of BroadcastChannel.
 *  2. A `dragstart` hint is broadcast so idle windows can highlight drop zones.
 */
export function useDraggable<T = unknown>({ id, type, data }: UseDraggableArgs<T>): UseDraggableResult {
  const channel = getChannel();
  const [isDragging, setIsDragging] = useState(false);

  const onDragStart: DragEventHandler = (e) => {
    const payload: DragPayload<T> = { id, type, data, sourceWindowId: channel.windowId };
    e.dataTransfer.setData(MIME_TYPE, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    channel.post({ kind: 'dragstart', payload: payload as DragPayload, senderId: channel.windowId });
  };

  const onDragEnd: DragEventHandler = () => {
    setIsDragging(false);
    // Clears remote highlights whether the drop succeeded, was cancelled, or
    // landed outside any zone.
    channel.post({ kind: 'dragend', itemId: id, senderId: channel.windowId });
  };

  return {
    attributes: { draggable: true },
    listeners: { onDragStart, onDragEnd },
    isDragging,
  };
}
