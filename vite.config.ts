import { defineConfig } from 'vite';

// Split the Phaser engine into its own long-lived chunk: game code changes
// no longer invalidate the ~1MB engine download in repeat visitors' caches.
export default defineConfig({
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
        },
      },
    },
  },
});
