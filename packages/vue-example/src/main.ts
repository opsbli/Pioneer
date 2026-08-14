import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { configurePdfWorker } from '@pioneer/vue';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// 配置 PDF.js
if (import.meta.env.PROD) {
  configurePdfWorker(pdfjsLib, {
    workerSrc: '/Pioneer/vue/pdfjs/pdf.worker.min.mjs',
    cMapUrl: '/Pioneer/vue/pdfjs/cmaps/',
    cMapPacked: true,
  });
} else {
  configurePdfWorker(pdfjsLib);
}

createApp(App).mount('#app');
