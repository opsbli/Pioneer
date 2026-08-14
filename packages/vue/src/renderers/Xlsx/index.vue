<script setup lang="ts">
import type { RendererHandle } from '../base.types';
import type { ToolbarGroup } from '../toolbar.types';

import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import ExcelJS from 'exceljs';
import Spreadsheet from 'x-data-spreadsheet';
import {
  convertWorkbookToSpreadsheetData,
  loadOfficeFile,
  withConversionCache,
  DEFAULT_CONVERSION_TTL_MS,
} from '@pioneer/core';
import { useTranslator } from '../../composables/useTranslator';
import { useFetcher } from '../../composables/useRequest';
import RendererError from '../RendererError.vue';

const props = defineProps<{
  url: string;
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

const loadExcel = async () => {
  if (!containerRef.value) return;

  loading.value = true;
  error.value = null;

  try {
    // 转换缓存优先：命中则跳过网络下载与 exceljs 解析（xlsx 转换是预览瓶颈）
    const { value } = await withConversionCache('xlsx:data', props.url, async () => {
      const { arrayBuffer } = await loadOfficeFile(props.url, {
        fetcher: fetcher.value,
        init: {
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
        },
      });

      if (arrayBuffer.byteLength === 0) {
        throw new Error('文件为空');
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      return convertWorkbookToSpreadsheetData(workbook);
    }, { ttlMs: DEFAULT_CONVERSION_TTL_MS });

    sheetData = value as unknown as Record<string, unknown>[];
    mountSpreadsheet();
    loading.value = false;
  } catch (err) {
    console.error('Excel 解析错误:', err);
    const statusMatch = err instanceof Error ? /请求失败: (\d+)/.exec(err.message) : null;
    let errorMsg = t.value('xlsx.parse_failed');
    if (statusMatch) {
      const status = Number(statusMatch[1]);
      if (status === 404) errorMsg = t.value('xlsx.not_found');
      else if (status === 403) errorMsg = '无权限访问此文件';
      else errorMsg = `文件加载失败 (${status})`;
    } else if (err instanceof Error) {
      errorMsg = err.message;
    }
    error.value = errorMsg;
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
    requestAnimationFrame(() => loadExcel());
  }, 100);
});

watch(
  () => props.url,
  (newUrl) => {
    // 只有 URL 有效时才加载（避免空字符串或已 revoke 的 blob URL）
    if (newUrl) loadExcel();
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
        <p class="pio-text-xs md:pio-text-sm pio-text-fg-secondary pio-font-medium">{{ t('xlsx.loading') }}</p>
      </div>
    </div>

    <RendererError
      v-if="error && !loading"
      :message="t('xlsx.load_failed')"
      :detail="error"
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
