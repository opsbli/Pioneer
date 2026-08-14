<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';

interface Props {
  message: string;
  detail?: string;
  showIcon?: boolean;
}

withDefaults(defineProps<Props>(), {
  showIcon: true,
});
</script>

<template>
  <div class="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
    <div class="pio-text-center">
      <div
        v-if="showIcon"
        class="pio-w-12 pio-h-12 pio-mx-auto pio-mb-3 pio-rounded-full pio-bg-red-500/10 pio-flex pio-items-center pio-justify-center"
      >
        <AlertCircle class="pio-w-6 pio-h-6 pio-text-red-400" />
      </div>
      <p class="pio-text-base pio-font-medium pio-text-fg-primary pio-mb-1">
        {{ message }}
      </p>
      <p v-if="detail" class="pio-text-xs pio-text-fg-tertiary">
        {{ detail }}
      </p>
    </div>
  </div>
</template>
