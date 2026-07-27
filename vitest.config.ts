import { defineConfig } from 'vitest/config';

// jsdom gives the pure helpers a browser-ish global (sessionStorage) without a
// real browser. The DnD interactions themselves are verified manually — see the
// checklist in the README.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
