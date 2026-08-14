import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 演示应用构建配置（用于 GitHub Pages）
// 部署到 /Pioneer/vue/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/Pioneer/vue/' : '/',
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, '../vue/node_modules/pdfjs-dist/build/pdf.worker.min.mjs').replace(/\\/g, '/'),
          dest: './pdfjs',
        },
        {
          src: resolve(__dirname, '../vue/node_modules/pdfjs-dist/cmaps').replace(/\\/g, '/'),
          dest: './pdfjs',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@opsbli/vue/style.css': resolve(__dirname, '../vue/lib/index.css'),
      '@opsbli/vue': resolve(__dirname, '../vue/lib/index.mjs'),
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  worker: {
    format: 'es'
  },
  server: {
    port: 4802,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
});
