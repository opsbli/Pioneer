<template>
  <div class="pio-flex pio-flex-col pio-w-full pio-h-full pio-overflow-hidden">
    <!-- 加载中 -->
    <div v-if="loading" class="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
      <div class="pio-text-fg-secondary">{{ t('font.loading') }}</div>
    </div>

    <!-- 错误态 -->
    <RendererError v-else-if="error || !metadata" :message="error || t('font.parse_failed')" />

    <!-- 正常渲染 -->
    <template v-else>
      <!-- 元数据区 -->
      <div class="pio-flex-shrink-0 pio-px-6 pio-py-4 pio-bg-surface-1 pio-border-b pio-border-line-weak pio-min-w-0">
        <div class="pio-grid pio-grid-cols-2 pio-gap-x-6 pio-gap-y-2 pio-text-sm pio-min-w-0">
          <div class="pio-flex pio-items-center pio-gap-2 pio-min-w-0">
            <span class="pio-text-fg-tertiary pio-flex-shrink-0">{{ t('font.meta.family') }}:</span>
            <span class="pio-text-fg-primary pio-font-semibold pio-truncate">
              {{ showMetaPlaceholder ? metaPlaceholder : metadata.family }}
            </span>
          </div>
          <div v-if="metadata.subfamily" class="pio-flex pio-items-center pio-gap-2 pio-min-w-0">
            <span class="pio-text-fg-tertiary pio-flex-shrink-0">{{ t('font.meta.subfamily') }}:</span>
            <span class="pio-text-fg-primary pio-truncate">{{ metadata.subfamily }}</span>
          </div>
          <div class="pio-flex pio-items-center pio-gap-2 pio-min-w-0">
            <span class="pio-text-fg-tertiary pio-flex-shrink-0">{{ t('font.meta.format') }}:</span>
            <span class="pio-text-fg-primary pio-truncate">{{ metadata.format }}</span>
          </div>
          <div class="pio-flex pio-items-center pio-gap-2 pio-min-w-0">
            <span class="pio-text-fg-tertiary pio-flex-shrink-0">{{ t('font.meta.glyphs') }}:</span>
            <span class="pio-text-fg-primary pio-truncate">
              {{ showMetaPlaceholder ? metaPlaceholder : metadata.glyphCount }}
            </span>
          </div>
          <div v-if="metadata.designer" class="pio-flex pio-items-center pio-gap-2 pio-min-w-0">
            <span class="pio-text-fg-tertiary pio-flex-shrink-0">{{ t('font.meta.designer') }}:</span>
            <span class="pio-text-fg-primary pio-truncate">{{ metadata.designer }}</span>
          </div>
          <div v-if="metadata.version" class="pio-flex pio-items-center pio-gap-2 pio-min-w-0">
            <span class="pio-text-fg-tertiary pio-flex-shrink-0">{{ t('font.meta.version') }}:</span>
            <span class="pio-text-fg-primary pio-truncate">{{ metadata.version }}</span>
          </div>
        </div>
      </div>

      <!-- 预览区 -->
      <div class="pio-flex-1 pio-overflow-auto pio-min-w-0">
        <div class="pio-px-6 pio-py-6 pio-space-y-8 pio-min-w-0">
          <!-- 自定义输入框 -->
          <div class="pio-min-w-0">
            <label class="pio-block pio-text-xs pio-text-fg-tertiary pio-mb-2">
              {{ t('font.sample_text_placeholder') }}
            </label>
            <textarea
              v-model="customText"
              class="pio-block pio-w-full pio-box-border pio-px-3 pio-py-2.5 pio-bg-surface-2 pio-text-fg-primary pio-text-sm pio-leading-relaxed pio-border pio-border-line pio-rounded-md pio-resize-y focus:pio-outline-none focus:pio-border-line-strong"
              rows="2"
              :placeholder="t('font.sample_text_placeholder')"
              :style="{ minHeight: '64px', maxHeight: '160px' }"
            />
          </div>

          <!-- 多字号展示 -->
          <div class="pio-space-y-6 pio-min-w-0">
            <div v-for="size in SIZES" :key="size" class="pio-space-y-2 pio-min-w-0">
              <div class="pio-text-xs pio-text-fg-tertiary">{{ size }}px</div>
              <FontPreviewLine
                :font="font"
                :text="displayText"
                :font-size="size"
                :render-mode="effectiveRenderMode"
                :theme="resolvedTheme"
              />
            </div>
          </div>

          <!-- 字符集样例 -->
          <div class="pio-space-y-6 pio-pt-6 pio-border-t pio-border-line-weak pio-min-w-0">
            <div class="pio-min-w-0">
              <div class="pio-text-sm pio-text-fg-tertiary pio-mb-3">Latin Alphabet</div>
              <FontPreviewLine
                :font="font"
                :text="DEFAULT_SAMPLES.latin"
                :font-size="24"
                :render-mode="effectiveRenderMode"
                :theme="resolvedTheme"
              />
            </div>

            <div class="pio-min-w-0">
              <div class="pio-text-sm pio-text-fg-tertiary pio-mb-3">Chinese Characters</div>
              <FontPreviewLine
                :font="font"
                :text="DEFAULT_SAMPLES.chinese"
                :font-size="24"
                :render-mode="effectiveRenderMode"
                :theme="resolvedTheme"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { RendererHandle } from '../base.types';
import type { ToolbarGroup } from '../toolbar.types';

import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { parse } from 'opentype.js';
import type { Font as OpentypeFont } from 'opentype.js';
import { useTranslator } from '../../composables/useTranslator';
import { useFetcher } from '../../composables/useRequest';
import { useResolvedTheme } from '../../composables/useResolvedTheme';
import FontPreviewLine from './FontPreviewLine.vue';
import RendererError from '../RendererError.vue';

interface FontMetadata {
  family: string;
  subfamily: string;
  version: string;
  designer: string;
  glyphCount: number;
  format: string;
}

type RenderMode = 'fontface' | 'canvas';
type MetadataStatus = 'loading' | 'ready' | 'unavailable';

// 字体文件魔数：用首 4 字节判断格式，比扩展名更可靠
const MAGIC_WOFF2 = 0x774f4632; // 'wOF2'
const MAGIC_WOFF = 0x774f4646;  // 'wOFF'
const MAGIC_OTTO = 0x4f54544f;  // 'OTTO'
const MAGIC_TTF1 = 0x00010000;
const MAGIC_TRUE = 0x74727565;  // 'true'

type DetectedFormat = 'woff2' | 'woff' | 'otf' | 'ttf' | 'unknown';

const detectMagic = (buf: ArrayBuffer): DetectedFormat => {
  if (buf.byteLength < 4) return 'unknown';
  const m = new DataView(buf).getUint32(0);
  if (m === MAGIC_WOFF2) return 'woff2';
  if (m === MAGIC_WOFF) return 'woff';
  if (m === MAGIC_OTTO) return 'otf';
  if (m === MAGIC_TTF1 || m === MAGIC_TRUE) return 'ttf';
  return 'unknown';
};

const DEFAULT_SAMPLES = {
  latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 .,;:!?@#$%&*()[]{}',
  chinese: '春夏秋冬东南西北天地人和风雨雷电山水日月',
  mixed: 'The Quick Brown Fox Jumps Over The Lazy Dog\n敏捷的棕色狐狸跳过了懒狗',
};

const SIZES = [72, 48, 36, 24, 18];

const props = defineProps<{
  url: string;
}>();

const { t } = useTranslator();
const fetcher = useFetcher();
const resolvedTheme = useResolvedTheme();

const font = ref<OpentypeFont | null>(null);
const metadata = ref<FontMetadata | null>(null);
const metadataStatus = ref<MetadataStatus>('loading');
const loading = ref(true);
const error = ref<string | null>(null);
const customText = ref('');
const renderMode = ref<RenderMode>('fontface');

let fontFace: FontFace | null = null;

const displayText = computed(() => customText.value || DEFAULT_SAMPLES.mixed);

const showMetaPlaceholder = computed(() => metadataStatus.value !== 'ready');
const metaPlaceholder = computed(() =>
  metadataStatus.value === 'loading' ? t.value('font.metadata_loading') : t.value('font.metadata_unavailable'),
);
// Canvas 模式必须有 font 才能绘制；没有 font（如 WOFF2 跳过解析）只能保留 FontFace 路径
const effectiveRenderMode = computed<RenderMode>(() => (renderMode.value === 'canvas' && font.value ? 'canvas' : 'fontface'));

const detectFormat = (url: string): string => {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  const formatMap: Record<string, string> = {
    ttf: 'TrueType (TTF)',
    otf: 'OpenType (OTF)',
    woff: 'Web Open Font Format (WOFF)',
    woff2: 'Web Open Font Format 2 (WOFF2)',
  };
  return formatMap[ext] || 'TTF';
};

const formatLabel = (magic: DetectedFormat, url: string): string => {
  const labels: Record<DetectedFormat, string | null> = {
    woff2: 'Web Open Font Format 2 (WOFF2)',
    woff: 'Web Open Font Format (WOFF)',
    otf: 'OpenType (OTF)',
    ttf: 'TrueType (TTF)',
    unknown: null,
  };
  return labels[magic] ?? detectFormat(url);
};

// 任务 A：FontFace 原生加载（浏览器对 WOFF2 原生支持，无需 wawoff2 解压）
const loadFontFace = async (faceBuffer: ArrayBuffer): Promise<void> => {
  try {
    fontFace = new FontFace('PreviewFont', faceBuffer);
    await fontFace.load();
    document.fonts.add(fontFace);
    renderMode.value = 'fontface';
  } catch (faceErr) {
    console.warn('[FontRenderer] FontFace API rejected, fallback to Canvas:', faceErr);
    renderMode.value = 'canvas';
    throw faceErr;
  }
};

// 任务 B：opentype 元数据解析。WOFF2 由浏览器原生渲染即可,不解析元数据
// （opentype.js 不支持 Brotli;独立解压链路引入 emscripten wasm 与挂死风险,代价过大)
const loadMetadata = async (arrayBuffer: ArrayBuffer, magic: DetectedFormat): Promise<void> => {
  if (magic === 'woff2') {
    throw new Error('WOFF2 metadata parsing intentionally skipped');
  }

  const fontData = parse(arrayBuffer) as unknown as OpentypeFont;
  if (!fontData) {
    throw new Error('Font data is invalid');
  }

  const rawNames = (fontData.names || {}) as unknown as Record<string, unknown>;
  const platformTables = ['windows', 'macintosh', 'unicode']
    .map((k) => rawNames[k])
    .filter((t): t is Record<string, { en?: string; 'zh-Hans'?: string }> => !!t && typeof t === 'object');
  const pickName = (key: string): string => {
    for (const table of platformTables) {
      const entry = table[key];
      const val = entry?.en || entry?.['zh-Hans'];
      if (val) return val;
    }
    const flat = rawNames[key] as { en?: string; 'zh-Hans'?: string } | undefined;
    return flat?.en || flat?.['zh-Hans'] || '';
  };

  const meta: FontMetadata = {
    family: pickName('fontFamily') || pickName('postScriptName') || 'Unknown',
    subfamily: pickName('fontSubfamily'),
    version: pickName('version'),
    designer: pickName('designer'),
    glyphCount: fontData.numGlyphs || 0,
    format: formatLabel(magic, props.url),
  };

  font.value = fontData;
  metadata.value = meta;
  metadataStatus.value = 'ready';
};

onMounted(async () => {
  if (!props.url) return;

  try {
    loading.value = true;
    error.value = null;
    metadataStatus.value = 'loading';

    const response = await fetcher.value(props.url);
    if (!response.ok) {
      throw new Error('Failed to load font file');
    }
    const arrayBuffer = await response.arrayBuffer();

    const faceBuffer = arrayBuffer.slice(0);
    const magic = detectMagic(arrayBuffer);

    const facePromise = loadFontFace(faceBuffer);
    const metadataPromise = loadMetadata(arrayBuffer, magic);

    await facePromise.catch(() => {
      // FontFace 失败由 metadata 兜底
    });
    loading.value = false;

    try {
      await metadataPromise;
    } catch (metaErr) {
      if (magic !== 'woff2') {
        console.warn(
          '[FontRenderer] Metadata parse failed, font is still rendered via FontFace:',
          metaErr instanceof Error ? metaErr.message : String(metaErr),
        );
      }
      metadataStatus.value = 'unavailable';
      metadata.value = {
        family: 'Unknown',
        subfamily: '',
        version: '',
        designer: '',
        glyphCount: 0,
        format: formatLabel(magic, props.url),
      };
    }
  } catch (err) {
    console.warn(
      '[FontRenderer] Failed to load font:',
      err instanceof Error ? err.message : String(err),
    );
    error.value = t.value('font.load_failed');
    loading.value = false;
    metadataStatus.value = 'unavailable';
  }
});

onBeforeUnmount(() => {
  if (fontFace) {
    document.fonts.delete(fontFace);
    fontFace = null;
  }
});

const getToolbarGroups = (): ToolbarGroup[] => [];

defineExpose<RendererHandle>({
  getToolbarGroups,
});

</script>
