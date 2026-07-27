import { beforeEach, describe, expect, it } from 'vitest';
import { getWindowId } from './channel';

describe('getWindowId', () => {
  beforeEach(() => {
    sessionStorage.clear();
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
});
