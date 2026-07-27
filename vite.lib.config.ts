import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

// Library build: bundles only src/lib as the published package. React is left
// external (a peer dependency), and .d.ts type declarations are emitted to dist.
// The demo/app build lives in vite.config.ts and is not published.
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/lib'],
      exclude: ['src/**/*.test.ts'],
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/lib/index.ts'),
      name: 'CrossWindowDnd',
      formats: ['es', 'cjs'],
      fileName: (format) => `cross-window-dnd.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
