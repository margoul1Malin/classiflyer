import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['better-sqlite3', 'sqlite3']
    }
  },
  optimizeDeps: {
    exclude: ['better-sqlite3', 'sqlite3']
  }
});
