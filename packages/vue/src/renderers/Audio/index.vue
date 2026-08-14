<script setup lang="ts">
import type { RendererHandle } from '../base.types';
import type { ToolbarGroup } from '../toolbar.types';

import { ref, computed, onMounted, onBeforeUnmount, toRef } from 'vue';
import { Play, Pause, Volume2, VolumeX, Volume1, SkipBack, SkipForward, Repeat } from 'lucide-vue-next';
import { useAudioPlayer } from '../../composables/useAudioPlayer';
import { useTranslator } from '../../composables/useTranslator';
import RendererError from '../RendererError.vue';

const props = defineProps<{
  url: string;
  fileName: string;
}>();

const urlRef = toRef(props, 'url');

const { t } = useTranslator();

const {
  audioRef,
  isPlaying,
  isLoop,
  currentTime,
  duration,
  volume,
  isMuted,
  error,
  togglePlay,
  seek,
  skip,
  setVolume,
  toggleMute,
  toggleLoop,
  formatTime,
} = useAudioPlayer(urlRef);

const showVolume = ref(false);
const isCompact = ref(false);
const controlScale = ref(1);
const isDragging = ref(false);
const dragTime = ref(0);
const containerRef = ref<HTMLDivElement | null>(null);
let volumeHideTimer: number | null = null;
const volumeRef = ref<HTMLDivElement | null>(null);

const displayTime = computed(() => (isDragging.value ? dragTime.value : currentTime.value));
const progress = computed(() => (duration.value > 0 ? displayTime.value / duration.value : 0));

// 动态计算尺寸
const vinylScale = computed(() => (isCompact.value ? 0.72 : 1));
// 唱片跟随控制面板同步缩放，避免头重脚轻
const finalVinylScale = computed(() => vinylScale.value * controlScale.value);
const vinylBase = 260;
const vinylHeightBase = 240;

const VolumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return VolumeX;
  if (volume.value < 0.5) return Volume1;
  return Volume2;
});

const handleClickOutside = (e: MouseEvent) => {
  if (volumeRef.value && !volumeRef.value.contains(e.target as Node)) {
    showVolume.value = false;
  }
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  const checkSize = () => {
    if (containerRef.value) {
      isCompact.value = containerRef.value.clientHeight < 580;
      // 控制面板宽度自适应缩放
      // 基础宽度 464px，最小视觉宽度 320px，即最小 scale ≈ 0.714
      const width = containerRef.value.clientWidth;
      const baseWidth = 464;
      const minVisualWidth = 320;
      const minScale = minVisualWidth / baseWidth;
      const scale = width >= baseWidth
        ? 1
        : Math.max(minScale, width / baseWidth);
      controlScale.value = scale;
    }
  };
  checkSize();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(checkSize);
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  if (volumeHideTimer !== null) clearTimeout(volumeHideTimer);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

const handleVolumeEnter = () => {
  if (volumeHideTimer !== null) clearTimeout(volumeHideTimer);
  showVolume.value = true;
};

const handleVolumeLeave = () => {
  volumeHideTimer = window.setTimeout(() => {
    showVolume.value = false;
  }, 300);
};

const getToolbarGroups = (): ToolbarGroup[] => [];

defineExpose<RendererHandle>({
  getToolbarGroups,
});

</script>

<template>
  <RendererError v-if="error" :message="error" />

  <div
    v-else
    ref="containerRef"
    :class="[
      'pio-flex pio-flex-col pio-items-center pio-justify-center pio-w-full pio-h-full pio-select-none pio-overflow-auto',
      isCompact ? 'pio-p-3 pio-gap-3' : 'pio-p-6 pio-gap-6'
    ]"
  >
    <!-- 唱片机 -->
    <div
      class="pio-relative pio-flex-shrink-0"
      :style="{
        width: `${vinylBase}px`,
        height: `${vinylHeightBase}px`,
        transform: `scale(${finalVinylScale})`,
        transformOrigin: 'center center',
        marginTop: isCompact ? `${-(vinylHeightBase * (1 - finalVinylScale)) / 2}px` : 0,
        marginBottom: isCompact ? `${-(vinylHeightBase * (1 - finalVinylScale)) / 2}px` : 0,
      }"
    >
      <!-- 外圈光晕 -->
      <div
        class="pio-absolute pio-rounded-full"
        :style="{
          width: '220px',
          height: '220px',
          top: '18px',
          left: '8px',
          background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)',
          opacity: isPlaying ? 0.7 : 0.2,
          transition: 'opacity 0.5s',
        }"
      />

      <!-- 唱片主体 -->
      <div
        class="pio-absolute pio-rounded-full pio-overflow-hidden"
        :style="{
          width: '200px',
          height: '200px',
          top: '28px',
          left: '18px',
          background: `
            radial-gradient(circle at center, transparent 95%, rgba(30,30,30,0.8) 95.5%, #111 97%),
            radial-gradient(circle at center, transparent 38%, rgba(50,50,50,0.5) 38.15%, transparent 38.4%),
            radial-gradient(circle at center, transparent 45%, rgba(50,50,50,0.3) 45.15%, transparent 45.4%),
            radial-gradient(circle at center, transparent 52%, rgba(50,50,50,0.5) 52.15%, transparent 52.4%),
            radial-gradient(circle at center, transparent 59%, rgba(50,50,50,0.3) 59.15%, transparent 59.4%),
            radial-gradient(circle at center, transparent 66%, rgba(50,50,50,0.5) 66.15%, transparent 66.4%),
            radial-gradient(circle at center, transparent 73%, rgba(50,50,50,0.3) 73.15%, transparent 73.4%),
            radial-gradient(circle at center, transparent 80%, rgba(50,50,50,0.4) 80.15%, transparent 80.4%),
            radial-gradient(circle at center, transparent 87%, rgba(50,50,50,0.3) 87.15%, transparent 87.4%),
            conic-gradient(from 0deg, #1c1c1c, #232323, #1a1a1a, #262626, #1c1c1c, #212121, #1a1a1a, #252525, #1c1c1c, #232323, #1a1a1a, #262626, #1c1c1c)
          `,
          boxShadow: isPlaying
            ? '0 0 36px rgba(129,140,248,0.1), 0 8px 32px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.4)',
          animation: 'pio-vinyl-spin 8s linear infinite',
          animationPlayState: isPlaying ? 'running' : 'paused',
        }"
      >
        <!-- 中心标签 -->
        <div
          class="pio-absolute pio-rounded-full"
          :style="{
            width: '34%',
            height: '34%',
            top: '33%',
            left: '33%',
            background: 'radial-gradient(circle at 40% 38%, #818cf8, #6366f1, #4f46e5, #4338ca)',
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.25), inset 0 -1px 3px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.3)',
          }"
        >
          <div
            class="pio-absolute pio-rounded-full"
            :style="{
              width: '14%',
              height: '14%',
              top: '43%',
              left: '43%',
              background: 'radial-gradient(circle at 40% 40%, #333, #0d0d0d)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.5)',
            }"
          />
        </div>
      </div>

      <!-- 唱臂 -->
      <div
        class="pio-absolute"
        :style="{
          top: '-6px',
          right: '2px',
          width: '100px',
          height: '120px',
          transformOrigin: '76px 16px',
          zIndex: 5,
          transform: isPlaying ? 'rotate(16deg)' : 'rotate(0deg)',
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }"
      >
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="76" cy="16" r="13" fill="rgba(0,0,0,0.3)" />
          <circle cx="76" cy="16" r="11" fill="url(#pio-baseGrad)" />
          <circle cx="76" cy="16" r="6" fill="url(#pio-baseInnerGrad)" />
          <circle cx="76" cy="16" r="2.5" fill="#222" stroke="#555" stroke-width="0.5" />
          <path d="M74 22 L56 88" stroke="url(#pio-armGrad)" stroke-width="3.5" stroke-linecap="round" />
          <rect x="50" y="86" width="12" height="7" rx="1.5" fill="url(#pio-headGrad)" />
          <rect x="52.5" y="92" width="7" height="9" rx="1" fill="url(#pio-cartridgeGrad)" />
          <line x1="56" y1="101" x2="56" y2="105" stroke="#bbb" stroke-width="1.2" stroke-linecap="round" />
          <circle cx="56" cy="105.5" r="0.8" fill="#ddd" />

          <defs>
            <radialGradient id="pio-baseGrad" cx="40%" cy="35%">
              <stop offset="0%" stop-color="#555" />
              <stop offset="100%" stop-color="#1a1a1a" />
            </radialGradient>
            <radialGradient id="pio-baseInnerGrad" cx="40%" cy="35%">
              <stop offset="0%" stop-color="#666" />
              <stop offset="100%" stop-color="#333" />
            </radialGradient>
            <linearGradient id="pio-armGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#555" />
              <stop offset="50%" stop-color="#444" />
              <stop offset="100%" stop-color="#333" />
            </linearGradient>
            <linearGradient id="pio-headGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#555" />
              <stop offset="100%" stop-color="#333" />
            </linearGradient>
            <linearGradient id="pio-cartridgeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#444" />
              <stop offset="100%" stop-color="#222" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>

    <!-- 文件名 -->
    <div :class="['pio-text-center pio-max-w-md pio-flex-shrink-0', isCompact ? 'pio-px-2' : 'pio-px-4']">
      <div
        :class="[
          'pio-font-medium pio-truncate pio-text-fg-primary',
          isCompact ? 'pio-text-sm' : 'pio-text-lg'
        ]"
      >
        {{ fileName }}
      </div>
    </div>

    <!-- 控制面板 wrapper：按容器宽度整体缩放，保底视觉宽度 320px -->
    <div class="pio-w-full pio-flex pio-justify-center pio-flex-shrink-0">
      <div
        :class="[
          'pio-rounded-2xl pio-border pio-bg-surface-1 pio-border-line-weak',
          isCompact ? 'pio-p-3' : 'pio-p-5'
        ]"
        :style="{
          width: '448px',
          backdropFilter: 'blur(16px)',
          transform: controlScale < 1 ? `scale(${controlScale})` : undefined,
          transformOrigin: 'top center',
          marginBottom: controlScale < 1 ? `${-(1 - controlScale) * 100}px` : undefined,
        }"
      >
      <!-- 进度条 -->
      <div :class="isCompact ? 'pio-mb-3' : 'pio-mb-5'">
        <div class="pio-relative pio-h-4 pio-flex pio-items-center">
          <div
            class="pio-absolute pio-w-full pio-h-[5px] pio-rounded-full pio-bg-surface-2"
          />
          <div
            class="pio-absolute pio-h-[5px] pio-rounded-full pio-pointer-events-none"
            :style="{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, var(--pio-accent), var(--pio-accent-hover))',
              boxShadow: isPlaying ? '0 0 8px rgba(129,140,248,0.4)' : 'none',
              transition: isDragging ? 'none' : 'width 0.1s linear',
            }"
          />
          <input
            type="range"
            min="0"
            :max="duration > 0 ? duration : currentTime || 100"
            step="any"
            :value="displayTime"
            :disabled="duration <= 0"
            :aria-label="t('audio.aria.progress')"
            class="audio-slider pio-absolute pio-w-full"
            @pointerdown="() => { dragTime = currentTime; isDragging = true; }"
            @input="(e) => {
              const value = parseFloat((e.target as HTMLInputElement).value);
              if (isDragging) {
                dragTime = value;
              } else {
                seek(value);
              }
            }"
            @pointerup="(e) => {
              const value = parseFloat((e.target as HTMLInputElement).value);
              seek(value);
              isDragging = false;
            }"
            @pointercancel="isDragging = false"
          />
        </div>
        <div
          :class="[
            'pio-flex pio-justify-between pio-text-fg-tertiary',
            isCompact ? 'pio-text-[10px] pio-mt-1.5' : 'pio-text-xs pio-mt-2.5'
          ]"
        >
          <span style="font-variant-numeric: tabular-nums">{{ formatTime(displayTime) }}</span>
          <span style="font-variant-numeric: tabular-nums">{{ duration > 0 ? formatTime(duration) : '--:--' }}</span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div :class="['pio-flex pio-items-center pio-justify-center', isCompact ? 'pio-gap-2' : 'pio-gap-3']">
        <!-- 循环 -->
        <button
          :class="[
            'pio-rounded-full pio-flex pio-items-center pio-justify-center pio-transition-colors audio-ctrl-btn pio-flex-shrink-0',
            isCompact ? 'pio-w-8 pio-h-8' : 'pio-w-9 pio-h-9',
            isLoop ? 'pio-bg-accent-soft pio-text-accent' : 'pio-bg-surface-2 pio-text-fg-tertiary',
          ]"
          :aria-label="isLoop ? t('audio.aria.loop_off') : t('audio.aria.loop_on')"
          @click="toggleLoop"
        >
          <Repeat :class="isCompact ? 'pio-w-3.5 pio-h-3.5' : 'pio-w-4 pio-h-4'" />
        </button>

        <!-- 后退 -->
        <button
          :class="[
            'pio-rounded-full pio-flex pio-items-center pio-justify-center pio-transition-colors audio-ctrl-btn pio-bg-surface-2 pio-text-fg-secondary pio-flex-shrink-0',
            isCompact ? 'pio-w-9 pio-h-9' : 'pio-w-10 pio-h-10'
          ]"
          :aria-label="t('audio.aria.backward_10')"
          @click="skip(-10)"
        >
          <SkipBack :class="isCompact ? 'pio-w-4 pio-h-4' : 'pio-w-[18px] pio-h-[18px]'" />
        </button>

        <!-- 播放/暂停 -->
        <button
          :class="[
            'pio-rounded-full pio-flex pio-items-center pio-justify-center audio-ctrl-btn pio-flex-shrink-0',
            isCompact ? 'pio-w-12 pio-h-12' : 'pio-w-14 pio-h-14'
          ]"
          :style="{
            background: 'linear-gradient(135deg, var(--pio-accent-hover), var(--pio-accent))',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
          }"
          :aria-label="isPlaying ? t('audio.aria.pause') : t('audio.aria.play')"
          @click="togglePlay"
        >
          <Pause v-if="isPlaying" :class="isCompact ? 'pio-w-5 pio-h-5' : 'pio-w-6 pio-h-6'" />
          <Play v-else :class="isCompact ? 'pio-w-5 pio-h-5 pio-ml-0.5' : 'pio-w-6 pio-h-6 pio-ml-0.5'" />
        </button>

        <!-- 前进 -->
        <button
          :class="[
            'pio-rounded-full pio-flex pio-items-center pio-justify-center pio-transition-colors audio-ctrl-btn pio-bg-surface-2 pio-text-fg-secondary pio-flex-shrink-0',
            isCompact ? 'pio-w-9 pio-h-9' : 'pio-w-10 pio-h-10'
          ]"
          :aria-label="t('audio.aria.forward_10')"
          @click="skip(10)"
        >
          <SkipForward :class="isCompact ? 'pio-w-4 pio-h-4' : 'pio-w-[18px] pio-h-[18px]'" />
        </button>

        <!-- 音量 -->
        <div ref="volumeRef" class="pio-relative" @mouseenter="handleVolumeEnter" @mouseleave="handleVolumeLeave">
          <button
            :class="[
              'pio-rounded-full pio-flex pio-items-center pio-justify-center pio-transition-colors audio-ctrl-btn pio-flex-shrink-0',
              isCompact ? 'pio-w-8 pio-h-8' : 'pio-w-9 pio-h-9',
              showVolume ? 'pio-bg-accent-soft pio-text-accent' : 'pio-bg-surface-2 pio-text-fg-secondary',
            ]"
            :aria-label="isMuted ? t('audio.aria.unmute') : t('audio.aria.mute')"
            @click="toggleMute"
          >
            <component :is="VolumeIcon" :class="isCompact ? 'pio-w-3.5 pio-h-3.5' : 'pio-w-4 pio-h-4'" />
          </button>

          <Transition name="pio-fade">
            <div
              v-if="showVolume"
              class="pio-absolute pio-bottom-full pio-mb-2 pio-rounded-xl pio-p-3 pio-border pio-bg-surface-3 pio-border-line"
              :style="{
                left: '50%',
                marginLeft: '-27px',
                backdropFilter: 'blur(16px)',
              }"
              @mouseenter="handleVolumeEnter"
              @mouseleave="handleVolumeLeave"
            >
              <div class="pio-flex pio-flex-col pio-items-center pio-gap-2" style="height: 100px">
                <div
                  class="pio-relative pio-flex pio-items-center pio-justify-center"
                  style="width: 24px; height: 80px"
                >
                  <div
                    class="pio-absolute pio-rounded-full pio-bg-surface-2"
                    style="width: 3px; height: 100%"
                  />
                  <div
                    class="pio-absolute pio-bottom-0 pio-rounded-full pio-pointer-events-none"
                    :style="{
                      width: '3px',
                      height: `${(isMuted ? 0 : volume) * 100}%`,
                      background: 'var(--pio-accent-hover)',
                      transition: 'height 0.1s linear',
                    }"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    :value="isMuted ? 0 : volume"
                    :aria-label="t('audio.aria.volume')"
                    class="volume-slider-vertical pio-absolute"
                    style="width: 80px; height: 24px; transform: rotate(-90deg); transform-origin: center center"
                    @input="(e) => setVolume(parseFloat((e.target as HTMLInputElement).value))"
                  />
                </div>
                <span class="pio-text-[10px] pio-tabular-nums pio-text-fg-tertiary">
                  {{ Math.round((isMuted ? 0 : volume) * 100) }}
                </span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
    <!-- wrapper 闭合 -->
    </div>

    <audio ref="audioRef" :src="url" class="pio-hidden" />
  </div>
</template>

<style scoped>
.audio-ctrl-btn {
  border: 0;
  cursor: pointer;
}
</style>
