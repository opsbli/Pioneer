<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue';

interface Props {
  /** 左侧初始宽度（px）；传入 storageKey 时会从 localStorage 读取 */
  initialLeftWidth?: number;
  /** 左侧最小宽度（px） */
  minLeftWidth?: number;
  /** 左侧最大宽度（px） */
  maxLeftWidth?: number;
  /** 右侧至少保留的宽度（px） */
  minRightWidth?: number;
  /** localStorage 持久化 key */
  storageKey?: string;
  /** 启用横向拖动的媒体查询 */
  desktopMedia?: string;
  /** 移动端使用 Tab 切换而非上下堆叠 */
  mobileTabMode?: boolean;
  /** Tab 模式下左侧标题 */
  leftTabLabel?: string;
  /** Tab 模式下右侧标题 */
  rightTabLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialLeftWidth: 280,
  minLeftWidth: 160,
  maxLeftWidth: 640,
  minRightWidth: 200,
  desktopMedia: '(min-width: 768px)',
  mobileTabMode: false,
  leftTabLabel: '文件树',
  rightTabLabel: '预览',
});

defineOptions({ name: 'ResizableSplit' });

const containerRef = ref<HTMLDivElement | null>(null);
const leftWidth = ref<number>(
  (() => {
    if (props.storageKey && typeof window !== 'undefined') {
      const saved = Number(window.localStorage.getItem(props.storageKey));
      if (!isNaN(saved) && saved > 0) return saved;
    }
    return props.initialLeftWidth;
  })()
);
const dragging = ref(false);
const isDesktop = ref(false);
const activeTab = ref<'left' | 'right'>('left');

let mq: MediaQueryList | null = null;
const mqHandler = () => {
  if (mq) isDesktop.value = mq.matches;
};

const leftStyle = computed(() =>
  isDesktop.value ? { width: `${leftWidth.value}px` } : undefined
);

const onMove = (e: MouseEvent) => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const cap = rect.width - props.minRightWidth - 6;
  const effectiveMax = Math.min(props.maxLeftWidth, cap);
  leftWidth.value = Math.max(
    props.minLeftWidth,
    Math.min(effectiveMax, x)
  );
};

const onUp = () => {
  if (!dragging.value) return;
  dragging.value = false;
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', onUp);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  if (props.storageKey) {
    try {
      window.localStorage.setItem(props.storageKey, String(leftWidth.value));
    } catch {
      // ignore
    }
  }
};

const onDividerDown = (e: MouseEvent) => {
  e.preventDefault();
  dragging.value = true;
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    mq = window.matchMedia(props.desktopMedia);
    mqHandler();
    mq.addEventListener('change', mqHandler);
  }
});

onBeforeUnmount(() => {
  if (mq) mq.removeEventListener('change', mqHandler);
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', onUp);
  if (dragging.value) {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

watch(
  () => props.initialLeftWidth,
  (w) => {
    if (!props.storageKey) leftWidth.value = w;
  }
);

const switchTab = (tab: 'left' | 'right') => {
  activeTab.value = tab;
};

defineExpose({ switchTab });
</script>

<template>
  <div
    ref="containerRef"
    class="pio-w-full pio-h-full pio-flex pio-flex-col md:pio-flex-row pio-min-h-0 pio-min-w-0"
  >
    <!-- 移动端 Tab 模式 -->
    <template v-if="mobileTabMode && !isDesktop">
      <div class="pio-flex pio-flex-shrink-0 pio-border-b pio-border-line-weak pio-bg-surface-toolbar">
        <button
          type="button"
          class="pio-flex-1 pio-py-2.5 pio-text-sm pio-transition-colors"
          :class="activeTab === 'left'
            ? 'pio-text-fg-primary pio-border-b-2 pio-border-fg-primary -pio-mb-px'
            : 'pio-text-fg-secondary'"
          @click="switchTab('left')"
        >
          {{ leftTabLabel }}
        </button>
        <button
          type="button"
          class="pio-flex-1 pio-py-2.5 pio-text-sm pio-transition-colors"
          :class="activeTab === 'right'
            ? 'pio-text-fg-primary pio-border-b-2 pio-border-fg-primary -pio-mb-px'
            : 'pio-text-fg-secondary'"
          @click="switchTab('right')"
        >
          {{ rightTabLabel }}
        </button>
      </div>
      <div v-show="activeTab === 'left'" class="pio-flex-1 pio-min-h-0 pio-min-w-0 pio-w-full pio-overflow-hidden">
        <slot name="left" />
      </div>
      <div v-show="activeTab === 'right'" class="pio-flex-1 pio-min-h-0 pio-min-w-0 pio-w-full pio-overflow-hidden">
        <slot name="right" />
      </div>
    </template>

    <!-- 桌面端 / 移动端默认堆叠模式 -->
    <template v-else>
      <div
        class="pio-min-h-0 pio-min-w-0 pio-flex-shrink-0 pio-w-full pio-max-h-60 md:pio-h-full md:pio-max-h-none"
        :style="leftStyle"
      >
        <slot name="left" />
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        class="split-divider pio-hidden md:pio-block pio-relative pio-w-1.5 pio-flex-shrink-0 pio-cursor-col-resize pio-transition-colors"
        :class="dragging ? 'dragging' : ''"
        @mousedown="onDividerDown"
      >
        <span class="pio-absolute pio-inset-y-0 hit-area" />
      </div>
      <div class="pio-flex-1 pio-min-w-0 pio-min-h-0 pio-overflow-hidden">
        <slot name="right" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.split-divider {
  background: rgba(255, 255, 255, 0.1);
}
.split-divider:hover {
  background: rgba(255, 255, 255, 0.3);
}
.split-divider.dragging {
  background: rgba(255, 255, 255, 0.4);
}
.hit-area {
  left: -4px;
  right: -4px;
}
</style>
