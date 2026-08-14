<script setup lang="ts">
import type { RendererHandle } from '../base.types';
import type { ToolbarGroup } from '../toolbar.types';

import { FileQuestion, Download } from 'lucide-vue-next';
import { useTranslator } from '../../composables/useTranslator';

defineProps<{
  fileName: string;
  fileType: string;
}>();

const { t } = useTranslator();

const emit = defineEmits<{
  (e: 'download'): void;
}>();

const getToolbarGroups = (): ToolbarGroup[] => [];

defineExpose<RendererHandle>({
  getToolbarGroups,
});

</script>

<template>
  <div
    class="pio-flex pio-flex-col pio-items-center pio-justify-center pio-w-full pio-h-full pio-p-6 pio-gap-4"
  >
    <div
      class="pio-w-20 pio-h-20 pio-rounded-full pio-bg-surface-2 pio-flex pio-items-center pio-justify-center"
    >
      <FileQuestion class="pio-w-10 pio-h-10 pio-text-fg-secondary" />
    </div>

    <div class="pio-text-fg-primary pio-text-center">
      <p class="pio-text-lg pio-font-medium pio-mb-2">{{ fileName }}</p>
      <p class="pio-text-fg-secondary">{{ t('common.unsupported_preview', { type: fileType }) }}</p>
    </div>

    <button
      class="pio-flex pio-items-center pio-gap-2 pio-px-4 pio-py-2 pio-bg-surface-2 hover:pio-bg-surface-3 pio-backdrop-blur-sm pio-rounded-lg pio-text-fg-primary pio-font-medium pio-transition-all"
      @click="emit('download')"
    >
      <Download class="pio-w-5 pio-h-5" />
      {{ t('common.download') }}
    </button>
  </div>
</template>
