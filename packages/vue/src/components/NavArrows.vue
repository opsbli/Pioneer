<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

interface Props {
  /** 父级内容容器 DOM（mousemove 监听挂到它身上） */
  containerRef: HTMLDivElement | null;
  hasPrev: boolean;
  hasNext: boolean;
  /** 用于触发"显示并重置定时器"的外部信号,通常传 currentIndex */
  resetKey: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{ prev: []; next: [] }>();

const NAV_HIDE_DELAY = 2000;
const visible = ref(true);
let hideTimer: number | null = null;

const scheduleHide = () => {
  if (hideTimer !== null) clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    visible.value = false;
  }, NAV_HIDE_DELAY);
};

const show = () => {
  if (!visible.value) visible.value = true;
  scheduleHide();
};

let attached: HTMLDivElement | null = null;
const detach = () => {
  if (attached) {
    attached.removeEventListener('mousemove', show);
    attached = null;
  }
};
const attach = (el: HTMLDivElement | null) => {
  if (attached === el) return;
  detach();
  if (el) {
    el.addEventListener('mousemove', show);
    attached = el;
  }
};

watch(() => props.containerRef, (el) => attach(el), { immediate: true });
watch(() => props.resetKey, () => {
  visible.value = true;
  scheduleHide();
});

onMounted(() => {
  scheduleHide();
});

onBeforeUnmount(() => {
  if (hideTimer !== null) clearTimeout(hideTimer);
  detach();
});
</script>

<template>
  <button
    v-if="hasPrev"
    :style="{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(-50%)' : 'translateY(-50%) translateX(-20px)',
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity 0.2s, transform 0.2s',
    }"
    class="pio-absolute pio-z-20 pio-left-2 md:pio-left-4 pio-top-1/2 pio-w-10 pio-h-10 md:pio-w-12 md:pio-h-12 pio-rounded-full pio-backdrop-blur-xl pio-border pio-flex pio-items-center pio-justify-center pio-transition-colors pio-shadow-2xl pio-bg-surface-nav pio-border-line hover:pio-bg-surface-nav-hover pio-text-fg-primary"
    @click="emit('prev')"
    @mouseenter="show"
  >
    <ChevronLeft class="pio-w-5 pio-h-5 md:pio-w-6 md:pio-h-6" />
  </button>

  <button
    v-if="hasNext"
    :style="{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(-50%)' : 'translateY(-50%) translateX(20px)',
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity 0.2s, transform 0.2s',
    }"
    class="pio-absolute pio-z-20 pio-right-2 md:pio-right-4 pio-top-1/2 pio-w-10 pio-h-10 md:pio-w-12 md:pio-h-12 pio-rounded-full pio-backdrop-blur-xl pio-border pio-flex pio-items-center pio-justify-center pio-transition-colors pio-shadow-2xl pio-bg-surface-nav pio-border-line hover:pio-bg-surface-nav-hover pio-text-fg-primary"
    @click="emit('next')"
    @mouseenter="show"
  >
    <ChevronRight class="pio-w-5 pio-h-5 md:pio-w-6 md:pio-h-6" />
  </button>
</template>
