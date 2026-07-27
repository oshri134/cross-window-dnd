import { CHANNEL_NAME, type ChannelMessage } from './types';

const WINDOW_ID_KEY = 'cwdnd-window-id';

/**
 * A stable identity for *this* tab/frame, persisted in sessionStorage so it
 * survives HMR and in-tab reloads but stays unique per window. Iframes and popup
 * tabs each get their own sessionStorage, so each gets a distinct id.
 */
export function getWindowId(): string {
  let id = sessionStorage.getItem(WINDOW_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(WINDOW_ID_KEY, id);
  }
  return id;
}

export type ChannelListener = (msg: ChannelMessage) => void;
export type Unsubscribe = () => void;

/**
 * Typed pub/sub wrapper over BroadcastChannel.
 *
 * Note: BroadcastChannel does NOT deliver a window's own messages back to itself.
 * The library relies on that — same-window state is handled locally, remote
 * windows react to the broadcast.
 */
export class DragChannel {
  private bc: BroadcastChannel;
  private listeners = new Set<ChannelListener>();
  readonly windowId = getWindowId();

  constructor(name: string = CHANNEL_NAME) {
    this.bc = new BroadcastChannel(name);
    this.bc.onmessage = (e: MessageEvent<ChannelMessage>) => {
      for (const listener of this.listeners) listener(e.data);
    };
  }

  post(msg: ChannelMessage): void {
    this.bc.postMessage(msg);
  }

  subscribe(fn: ChannelListener): Unsubscribe {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  close(): void {
    this.bc.close();
    this.listeners.clear();
  }
}

// One channel per window is plenty; hooks share this singleton.
let shared: DragChannel | null = null;

export function getChannel(): DragChannel {
  if (!shared) shared = new DragChannel();
  return shared;
}
