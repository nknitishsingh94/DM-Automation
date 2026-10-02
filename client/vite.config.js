import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    })
  ],
  server: {
    port: 5174,
    strictPort: true
  },
  build: {
    chunkSizeWarningLimit: 1500
  }
});
