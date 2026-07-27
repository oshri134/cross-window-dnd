import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single-page app. The demo picks its "route" from the query string
// (?view=board&pane=a|b|tab) so iframes and popup tabs share one bundle
// and, crucially, the same origin — a hard requirement for BroadcastChannel.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
