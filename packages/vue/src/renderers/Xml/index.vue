<script setup lang="ts">
import type { RendererHandle } from '../base.types';
import type { ToolbarGroup } from '../toolbar.types';

import { ref, computed, watch } from 'vue';
import { fetchTextUtf8 } from '@pioneer/core';
import { useTranslator } from '../../composables/useTranslator';
import { useFetcher } from '../../composables/useRequest';
import { useShikiHighlight } from '../../composables/useShikiHighlight';
import RendererError from '../RendererError.vue';

const props = defineProps<{
  url: string;
  fileName: string;
}>();

const { t } = useTranslator();
const fetcher = useFetcher();

const content = ref<string>('');
const loading = ref(true);
const error = ref<string | null>(null);
const xmlLang = ref('xml');

const { lineHtmls } = useShikiHighlight(content, xmlLang);

const indentXml = (xml: string): string => {
  const PADDING = '  ';
  const reg = /(>)(<)(\/*)/g;
  const formatted = xml.replace(reg, '$1\n$2$3');
  let pad = 0;
  return formatted
    .split('\n')
    .map((line) => {
      let indent = 0;
      if (/^<\/\w/.test(line)) {
        pad = Math.max(pad - 1, 0);
      } else if (/^<\w[^>]*[^/]>.*$/.test(line) && !/<.+<\/.+>$/.test(line)) {
        indent = 1;
      }
      const padded = PADDING.repeat(pad) + line;
      pad += indent;
      return padded;
    })
    .join('\n');
};

const prettyPrintXml = (xml: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) return xml;
    const serializer = new XMLSerializer();
    const serialized = serializer.serializeToString(doc);
    return indentXml(serialized);
  } catch {
    return xml;
  }
};

const load = async () => {
  loading.value = true;
  error.value = null;
  try {
    const raw = await fetchTextUtf8(props.url, { fetcher: fetcher.value });
    content.value = prettyPrintXml(raw);
  } catch (err) {
    console.error(err);
    error.value = t.value('xml.load_failed');
  } finally {
    loading.value = false;
  }
};

watch(() => props.url, load, { immediate: true });

const lines = computed(() => content.value.split('\n'));

const getToolbarGroups = (): ToolbarGroup[] => [];

defineExpose<RendererHandle>({
  getToolbarGroups,
});

</script>

<template>
  <div v-if="loading" class="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
    <div
      class="pio-w-12 pio-h-12 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin"
    />
  </div>

  <RendererError v-else-if="error" :message="error" />

  <div v-else-if="lineHtmls.length === 0" class="pio-w-full pio-h-full pio-overflow-auto" style="background: var(--pio-code-bg);">
    <pre
      class="pio-py-6 pio-px-4 pio-text-fg-primary pio-font-mono pio-text-sm pio-whitespace-pre-wrap pio-break-words"
      >{{ content }}</pre
    >
  </div>

  <div v-else class="pio-w-full pio-h-full pio-overflow-auto" style="background: var(--pio-code-bg);">
    <div class="pio-code-block with-line-numbers pio-w-full" :style="{ gridTemplateRows: `repeat(${lines.length}, auto) minmax(1.5rem, 1fr)` }">
      <template v-for="(_, i) in lines" :key="i">
        <span class="pio-code-gutter">{{ i + 1 }}</span>
        <span class="pio-code-line" v-html="lineHtmls[i] ?? ''" />
      </template>
      <!-- 占位行：撑满剩余高度，让 gutter border 延伸到底部 -->
      <span class="pio-code-gutter-filler" />
      <span class="pio-code-line-filler" />
    </div>
  </div>
</template>
