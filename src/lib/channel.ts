import { CHANNEL_NAME, type ChannelMessage } from './types';

const WINDOW_ID_KEY = 'cwdnd-window-id';

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `w-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * A stable identity for *this* tab/frame, persisted in sessionStorage so it
 * survives HMR and in-tab reloads but stays unique per window. Iframes and popup
 * tabs each get their own sessionStorage, so each gets a distinct id.
 *
 * SSR-safe: with no sessionStorage (server render) it returns a throwaway id
 * instead of throwing — the real id is established on the client.
 */
export function getWindowId(): string {
  if (typeof sessionStorage === 'undefined') return randomId();
  let id = sessionStorage.getItem(WINDOW_ID_KEY);
  if (!id) {
    id = randomId();
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
 *
 * SSR-safe: where BroadcastChannel is unavailable, this degrades to a no-op
 * (post/subscribe do nothing) so importing hooks never crashes on the server.
 */
export class DragChannel {
  private bc: BroadcastChannel | null = null;
  private listeners = new Set<ChannelListener>();
  readonly windowId = getWindowId();

  constructor(name: string = CHANNEL_NAME) {
    if (typeof BroadcastChannel === 'undefined') return;
    this.bc = new BroadcastChannel(name);
    this.bc.onmessage = (e: MessageEvent<ChannelMessage>) => {
      for (const listener of this.listeners) listener(e.data);
    };
  }

  post(msg: ChannelMessage): void {
    this.bc?.postMessage(msg);
  }

  subscribe(fn: ChannelListener): Unsubscribe {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  close(): void {
    this.bc?.close();
    this.listeners.clear();
  }
}

// One channel per window is plenty; hooks share this singleton.
let shared: DragChannel | null = null;

export function getChannel(): DragChannel {
  if (!shared) shared = new DragChannel();
  return shared;
}
