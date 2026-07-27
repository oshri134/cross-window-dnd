import { describe, expect, it } from 'vitest';
import { isAccepted, parsePayload } from './protocol';
import type { DragPayload } from './types';

describe('isAccepted', () => {
  it('matches a single accepted type', () => {
    expect(isAccepted('card', 'card')).toBe(true);
    expect(isAccepted('file', 'card')).toBe(false);
  });

  it('matches against a list of accepted types', () => {
    expect(isAccepted('file', ['card', 'file'])).toBe(true);
    expect(isAccepted('other', ['card', 'file'])).toBe(false);
  });
});

describe('parsePayload', () => {
  const valid: DragPayload = { id: 'a-1', type: 'card', sourceWindowId: 'w1', data: { x: 1 } };

  it('parses a well-formed payload', () => {
    expect(parsePayload(JSON.stringify(valid))).toEqual(valid);
  });

  it('returns null for empty input', () => {
    expect(parsePayload('')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parsePayload('{not json')).toBeNull();
  });

  it('returns null when required fields are missing', () => {
    expect(parsePayload(JSON.stringify({ id: 'a-1' }))).toBeNull();
    expect(parsePayload(JSON.stringify({ id: 1, type: 'card', sourceWindowId: 'w1' }))).toBeNull();
  });

  it('returns null for non-object JSON (e.g. a stray string drag)', () => {
    expect(parsePayload('"just text"')).toBeNull();
    expect(parsePayload('42')).toBeNull();
    expect(parsePayload('null')).toBeNull();
  });
});
