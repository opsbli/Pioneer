<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-vue-next';
import { useTranslator } from '../composables/useTranslator';

interface Props {
  onClose: () => void;
  onSearch: (query: string, options: { caseSensitive: boolean }) => void;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  matchCount: number;
  totalCount: number;
}

const props = defineProps<Props>();

const { t } = useTranslator();

const query = ref('');
const caseSensitive = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

nextTick(() => {
  if (inputRef.value) {
    inputRef.value.focus();
  }
});

function handleChange(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  query.value = val;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    props.onSearch(val, { caseSensitive: caseSensitive.value });
  }, 300);
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    props.onSearch(query.value, { caseSensitive: caseSensitive.value });
  } else if (e.key === 'Escape') {
    props.onClose();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    props.onPrevMatch();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    props.onNextMatch();
  }
}

function toggleCaseSensitive() {
  caseSensitive.value = !caseSensitive.value;
  if (query.value) {
    props.onSearch(query.value, { caseSensitive: caseSensitive.value });
  }
}

const displayCount = computed(() =>
  props.totalCount > 0 ? `${props.matchCount + 1} / ${props.totalCount}` : t.value('search.no_results')
);

defineExpose({
  query,
  caseSensitive,
});
</script>

<template>
  <div class="pio-flex pio-items-center pio-gap-2 pio-px-3 md:pio-px-5 pio-py-1.5 pio-border-b pio-border-line-weak pio-bg-surface-toolbar">
    <div class="pio-flex pio-items-center pio-gap-1 pio-flex-1 pio-min-w-0 pio-max-w-sm pio-px-2 pio-py-1 pio-rounded-md pio-border pio-border-line pio-bg-surface-input focus-within:pio-border-fg-primary">
      <Search class="pio-w-3.5 pio-h-3.5 pio-text-fg-muted pio-shrink-0" />
      <input
        ref="inputRef"
        type="text"
        :value="query"
        @input="handleChange"
        @keydown="handleKeyDown"
        :placeholder="t('search.placeholder')"
        class="pio-flex-1 pio-min-w-0 pio-text-xs pio-bg-transparent pio-text-fg-primary pio-outline-none pio-placeholder:text-fg-muted"
      />
    </div>

    <span class="pio-text-xs pio-text-fg-muted pio-tabular-nums pio-shrink-0">
      {{ displayCount }}
    </span>

    <button
      @click="props.onPrevMatch"
      :disabled="props.totalCount === 0"
      :title="t('search.prev_match')"
      class="pio-p-1 pio-text-fg-muted hover:pio-text-fg-primary pio-transition-colors pio-disabled:text-fg-disabled pio-disabled:cursor-not-allowed"
    >
      <ChevronUp class="pio-w-4 pio-h-4" />
    </button>
    <button
      @click="props.onNextMatch"
      :disabled="props.totalCount === 0"
      :title="t('search.next_match')"
      class="pio-p-1 pio-text-fg-muted hover:pio-text-fg-primary pio-transition-colors pio-disabled:text-fg-disabled pio-disabled:cursor-not-allowed"
    >
      <ChevronDown class="pio-w-4 pio-h-4" />
    </button>

    <button
      @click="toggleCaseSensitive"
      :title="t('search.case_sensitive')"
      :class="caseSensitive ? 'pio-text-fg-primary' : 'pio-text-fg-muted hover:pio-text-fg-primary'"
      class="pio-p-1 pio-transition-colors"
    >
      <Search class="pio-w-4 pio-h-4" />
    </button>

    <button
      @click="props.onClose"
      :title="t('search.close')"
      class="pio-p-1 pio-text-fg-muted hover:pio-text-fg-primary pio-transition-colors"
    >
      <X class="pio-w-4 pio-h-4" />
    </button>
  </div>
</template>
