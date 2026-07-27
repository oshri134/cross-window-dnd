import type { DragPayload } from './types';

/** Is `type` allowed by an `accept` spec (single value or list)? */
export function isAccepted(type: string, accept: string | string[]): boolean {
  return (Array.isArray(accept) ? accept : [accept]).includes(type);
}

/**
 * Parse + validate a raw `dataTransfer` string into a DragPayload.
 * Returns null for empty input, malformed JSON, or a shape missing required
 * fields — so a stray drag from another app can never crash a drop handler.
 */
export function parsePayload(raw: string): DragPayload | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as DragPayload).id === 'string' &&
    typeof (value as DragPayload).type === 'string' &&
    typeof (value as DragPayload).sourceWindowId === 'string'
  ) {
    return value as DragPayload;
  }
  return null;
}
