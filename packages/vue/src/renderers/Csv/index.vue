<script setup lang="ts">
import type { RendererHandle } from '../base.types';
import type { ToolbarGroup } from '../toolbar.types';

import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import Spreadsheet from 'x-data-spreadsheet';
import {
  parseCsv,
  guessCsvDelimiter,
  fetchTextUtf8,
  convertCsvToSpreadsheetData,
} from '@pioneer/core';
import { useTranslator } from '../../composables/useTranslator';
import { useFetcher } from '../../composables/useRequest';
import RendererError from '../RendererError.vue';

const props = defineProps<{
  url: string;
  fileName: string;
}>();

const { t } = useTranslator();
const fetcher = useFetcher();

const loading = ref(true);
const error = ref<string | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
let sheetData: Record<string, unknown>[] | null = null;
let resizeObserver: ResizeObserver | null = null;
let resizeTimeout: number | null = null;
let lastDimensions = { width: 0, height: 0 };

const calculateDimensions = () => {
  if (!containerRef.value) return { width: 800, height: 600 };
  const rawWidth = containerRef.value.clientWidth;
  const rawHeight = containerRef.value.clientHeight;
  const width = rawWidth > 100 ? rawWidth : 800;
  const height = rawHeight > 100 ? rawHeight : 600;
  return { width, height };
};

const mountSpreadsheet = () => {
  if (!containerRef.value || !sheetData) return;

  containerRef.value.innerHTML = '';

  const { width, height } = calculateDimensions();
  const isMobile = width < 640;

  const s = new Spreadsheet(containerRef.value, {
    mode: 'read',
    showToolbar: false,
    showContextmenu: false,
    showGrid: true,
    row: {
      len: 100,
      height: 25,
    },
    col: {
      len: 26,
      width: isMobile ? 80 : 100,
      indexWidth: isMobile ? 40 : 60,
      minWidth: isMobile ? 40 : 60,
    },
    view: {
      height: () => height,
      width: () => width,
    },
  });

  s.loadData(sheetData as unknown as Record<string, unknown>);
};

const loadCsv = async () => {
  if (!containerRef.value) return;

  loading.value = true;
  error.value = null;

  try {
    const text = await fetchTextUtf8(props.url, { fetcher: fetcher.value });
    const parsed = parseCsv(text, { delimiter: guessCsvDelimiter(props.fileName) });
    const data = convertCsvToSpreadsheetData(parsed.header, parsed.rows, props.fileName);

    sheetData = data as unknown as Record<string, unknown>[];
    mountSpreadsheet();
    loading.value = false;
  } catch (err) {
    console.error('CSV 解析错误:', err);
    error.value = t.value('csv.load_failed');
    loading.value = false;
  }
};

onMounted(() => {
  if (!containerRef.value) return;

  let isInitialRender = true;

  resizeObserver = new ResizeObserver(() => {
    if (isInitialRender) {
      isInitialRender = false;
      lastDimensions = calculateDimensions();
      return;
    }

    const newDimensions = calculateDimensions();
    const widthDiff = Math.abs(lastDimensions.width - newDimensions.width);
    const heightDiff = Math.abs(lastDimensions.height - newDimensions.height);

    if (widthDiff < 10 && heightDiff < 10) return;

    lastDimensions = newDimensions;

    if (resizeTimeout !== null) clearTimeout(resizeTimeout);

    resizeTimeout = window.setTimeout(() => {
      if (sheetData) mountSpreadsheet();
    }, 500);
  });

  resizeObserver.observe(containerRef.value);

  setTimeout(() => {
    requestAnimationFrame(() => loadCsv());
  }, 100);
});

watch(
  () => props.url,
  () => {
    loadCsv();
  }
);

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (resizeTimeout !== null) clearTimeout(resizeTimeout);
  sheetData = null;
  if (containerRef.value) containerRef.value.innerHTML = '';
});

const getToolbarGroups = (): ToolbarGroup[] => [];

defineExpose<RendererHandle>({
  getToolbarGroups,
});

</script>

<template>
  <div class="pio-relative pio-flex pio-flex-col pio-items-center pio-w-full pio-h-full">
    <div
      v-if="loading"
      class="pio-absolute pio-inset-0 pio-flex pio-items-center pio-justify-center pio-bg-surface-toolbar pio-backdrop-blur-sm pio-z-10"
    >
      <div class="pio-text-center">
        <div
          class="pio-w-10 pio-h-10 md:pio-w-12 md:pio-h-12 pio-mx-auto pio-mb-3 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin"
        />
        <p class="pio-text-xs md:pio-text-sm pio-text-fg-secondary pio-font-medium">{{ t('csv.loading') }}</p>
      </div>
    </div>

    <RendererError
      v-if="error && !loading"
      :message="error"
      class="pio-absolute pio-inset-0 pio-bg-surface-toolbar pio-backdrop-blur-sm pio-z-10"
    />

    <div
      v-if="!error"
      ref="containerRef"
      class="xlsx-spreadsheet-container pio-w-full pio-h-full"
      :style="{ opacity: loading ? 0 : 1 }"
    />
  </div>
</template>
