import react from '@vitejs/plugin-react'
import path from 'path';
import { createRequire } from 'module';

import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const require = createRequire(import.meta.url);

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/'));
const cMapsDir = normalizePath(path.join(pdfjsDistPath, 'cmaps'));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  viteStaticCopy({
    targets: [
      {
        src: cMapsDir,
        dest: '',
      },
    ],
  })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your gateway service address
        changeOrigin: true,
        // Remove rewrite to keep the /api prefix
      }
    }
  }
});
