<script setup lang="ts">
import { useTranslator } from '../composables/useTranslator';
const { t } = useTranslator();
</script>

<template>
  <div class="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full pio-text-fg-muted">
    <div class="pio-flex pio-flex-col pio-items-center pio-gap-3">
      <div class="pio-w-8 pio-h-8 pio-rounded-full pio-border-2 pio-border-fg-muted pio-border-t-transparent pio-animate-spin" />
      <span class="pio-text-sm">{{ t('common.loading') || 'Loading...' }}</span>
    </div>
  </div>
</template>
