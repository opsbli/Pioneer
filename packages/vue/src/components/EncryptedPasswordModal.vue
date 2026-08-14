<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { Lock, X } from 'lucide-vue-next';
import { useTranslator } from '../composables/useTranslator';

interface Props {
  maxRetries?: number;
  retriesLeft: number;
  errorMessage: string;
  autoFocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxRetries: 3,
  autoFocus: true,
});

const emit = defineEmits<{
  (e: 'submit', password: string): void;
  (e: 'close'): void;
}>();

const { t } = useTranslator();

const password = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.errorMessage,
  () => {
    password.value = '';
  }
);

watch(
  () => props.retriesLeft,
  () => {
    password.value = '';
  }
);

nextTick(() => {
  if (props.autoFocus && inputRef.value) {
    inputRef.value.focus();
  }
});

function handleSubmit() {
  if (!password.value.trim()) return;
  emit('submit', password.value);
  password.value = '';
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleSubmit();
  } else if (e.key === 'Escape') {
    emit('close');
  }
}

const isMaxReached = computed(() => props.retriesLeft <= 0);
</script>

<template>
  <div
    class="pio-absolute pio-inset-0 pio-flex pio-items-center pio-justify-center pio-z-[20] pio-bg-black/40 pio-backdrop-blur-sm"
    @click="emit('close')"
  >
    <div
      class="pio-relative pio-w-80 pio-max-w-[90%] pio-bg-surface-panel pio-rounded-lg pio-shadow-2xl pio-border pio-border-line pio-p-5 pio-flex pio-flex-col pio-gap-4"
      @click.stop
    >
      <button
        class="pio-absolute pio-top-3 pio-right-3 pio-p-1 pio-text-fg-muted hover:pio-text-fg-primary pio-transition-colors"
        @click="emit('close')"
        :title="t('common.close')"
      >
        <X class="pio-w-4 pio-h-4" />
      </button>

      <div class="pio-flex pio-items-center pio-gap-3">
        <div class="pio-p-2 pio-rounded-lg pio-bg-surface-2">
          <Lock class="pio-w-5 pio-h-5 pio-text-fg-primary" />
        </div>
        <h3 class="pio-font-medium pio-text-sm pio-text-fg-primary">
          {{ t('encrypted.title') }}
        </h3>
      </div>

      <div class="pio-flex pio-flex-col pio-gap-2">
        <input
          ref="inputRef"
          type="password"
          v-model="password"
          @keydown="handleKeyDown"
          :placeholder="t('encrypted.password_placeholder')"
          :disabled="isMaxReached"
          class="pio-w-full pio-px-3 pio-py-2 pio-text-sm pio-rounded-md pio-border pio-border-line pio-bg-surface-input pio-text-fg-primary pio-outline-none focus:pio-border-fg-primary focus:pio-ring-1 focus:pio-ring-fg-primary/30 pio-placeholder:text-fg-muted disabled:pio-opacity-50 disabled:pio-cursor-not-allowed"
        />

        <p v-if="errorMessage" class="pio-text-xs pio-text-red-500">
          {{ errorMessage }}
        </p>

        <p v-else-if="!isMaxReached" class="pio-text-xs pio-text-fg-muted">
          {{ t('encrypted.retries_left', { count: retriesLeft }) }}
        </p>
      </div>

      <button
        @click="handleSubmit"
        :disabled="isMaxReached || !password.trim()"
        class="pio-w-full pio-py-2 pio-text-sm pio-font-medium pio-rounded-md pio-bg-fg-primary pio-text-fg-inverse pio-transition-colors hover:pio-opacity-90 disabled:pio-opacity-40 disabled:pio-cursor-not-allowed"
      >
        {{ isMaxReached ? t('encrypted.max_attempts') : t('encrypted.confirm') }}
      </button>
    </div>
  </div>
</template>
