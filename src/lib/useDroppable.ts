import { useRef, useState, type DragEventHandler } from 'react';
import { getChannel } from './channel';
import { useCrossWindowDrag } from './useCrossWindowDrag';
import { isAccepted, parsePayload } from './protocol';
import { MIME_TYPE, type DragPayload } from './types';

export interface UseDroppableArgs {
  /** Droppable id — becomes the `to` field of the emitted item-moved message. */
  id: string;
  /** Accepted drag `type`(s). */
  accept: string | string[];
  /** Called when an accepted item is dropped here (local or from another window). */
  onDrop: (payload: DragPayload) => void;
}

export interface UseDroppableResult {
  /** Spread onto the drop-zone element. */
  listeners: {
    onDragEnter: DragEventHandler;
    onDragOver: DragEventHandler;
    onDragLeave: DragEventHandler;
    onDrop: DragEventHandler;
  };
  /** Pointer is over this zone with an accepted item. */
  isOver: boolean;
  /** Another window is dragging an accepted item right now (highlight cue). */
  isRemoteDragActive: boolean;
}

export function useDroppable({ id, accept, onDrop }: UseDroppableArgs): UseDroppableResult {
  const channel = getChannel();
  const [isOver, setIsOver] = useState(false);
  const { activeDrag, remoteDragging } = useCrossWindowDrag();

  // dragenter/dragleave fire for every nested child (the cards inside a column),
  // so a naive dragleave handler flickers `isOver` off mid-hover. We count
  // enters minus leaves and treat the zone as "over" while the depth is > 0.
  const enterDepth = useRef(0);

  // During `dragover`/`dragenter` the browser protects the payload contents for
  // security — we can see the *types* but not read the data. So we gate on the
  // MIME type here and do the authoritative `accept` check on drop, where the
  // data is finally readable.
  const carriesOurPayload = (e: React.DragEvent) => e.dataTransfer.types.includes(MIME_TYPE);

  const onDragEnter: DragEventHandler = (e) => {
    if (!carriesOurPayload(e)) return;
    e.preventDefault();
    enterDepth.current += 1;
    if (!isOver) setIsOver(true);
  };

  const onDragOver: DragEventHandler = (e) => {
    if (!carriesOurPayload(e)) return;
    e.preventDefault(); // required to become a valid drop target
    e.dataTransfer.dropEffect = 'move';
  };

  const onDragLeave: DragEventHandler = () => {
    enterDepth.current = Math.max(0, enterDepth.current - 1);
    if (enterDepth.current === 0 && isOver) setIsOver(false);
  };

  const handleDrop: DragEventHandler = (e) => {
    e.preventDefault();
    enterDepth.current = 0;
    setIsOver(false);

    const payload = parsePayload(e.dataTransfer.getData(MIME_TYPE));
    if (!payload || !isAccepted(payload.type, accept)) return;

    // 1. Local effect (this window owns the drop target).
    onDrop(payload);

    // 2. Tell every other window. The source window uses `sourceWindowId` to
    //    remove the item; idle windows clear their highlight.
    channel.post({
      kind: 'item-moved',
      itemId: payload.id,
      to: id,
      sourceWindowId: payload.sourceWindowId,
      data: payload.data,
      senderId: channel.windowId,
    });
  };

  return {
    listeners: { onDragEnter, onDragOver, onDragLeave, onDrop: handleDrop },
    isOver,
    isRemoteDragActive:
      remoteDragging && activeDrag !== null && isAccepted(activeDrag.type, accept),
  };
}
