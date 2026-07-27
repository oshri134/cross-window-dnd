import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWindowId } from './channel';

describe('getWindowId', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a stable id across calls within a window', () => {
    const first = getWindowId();
    const second = getWindowId();
    expect(first).toBe(second);
  });

  it('persists the id in sessionStorage', () => {
    const id = getWindowId();
    expect(sessionStorage.getItem('cwdnd-window-id')).toBe(id);
  });

  it('returns a throwaway id without crashing when there is no storage (SSR)', () => {
    vi.stubGlobal('sessionStorage', undefined);
    const id = getWindowId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
