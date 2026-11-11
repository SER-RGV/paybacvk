import { defineConfig } from 'vite';

// The dev server listens on all interfaces so the sandbox preview proxy can reach it.
// allowedHosts is enabled because the preview host name is generated per sandbox.
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
});
