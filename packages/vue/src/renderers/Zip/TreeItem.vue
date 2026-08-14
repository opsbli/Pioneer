<script setup lang="ts">
import { computed } from 'vue';
import {
  Folder,
  FolderOpen,
  FileText,
  FileImage,
  FileCode,
  File as FileIcon,
  ChevronRight,
} from 'lucide-vue-next';
import { formatFileSize, getFileType, type ZipTreeNode } from '@pioneer/core';

const props = defineProps<{
  node: ZipTreeNode;
  depth: number;
  selectedPath: string | null;
  expanded: Set<string>;
}>();

const emit = defineEmits<{
  (e: 'toggle', path: string): void;
  (e: 'select', node: ZipTreeNode): void;
  (e: 'hover', text: string, rect: DOMRect): void;
  (e: 'leave'): void;
}>();

const padStyle = computed(() => ({ paddingLeft: `${props.depth * 14 + 10}px` }));
const isOpen = computed(() => props.expanded.has(props.node.path));
const isSelected = computed(() => props.selectedPath === props.node.path);

const fileIcon = computed(() => {
  const ft = getFileType({ id: '', name: props.node.name, url: '', type: '' });
  if (ft === 'image') return FileImage;
  if (ft === 'text' || ft === 'markdown' || ft === 'json' || ft === 'csv' || ft === 'xml' || ft === 'subtitle') {
    return (props.node.name.endsWith('.md') || props.node.name.endsWith('.markdown')) ? FileText : FileCode;
  }
  return FileIcon;
});

const handleEnter = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  emit('hover', props.node.name || '/', rect);
};

const handleLeave = () => emit('leave');
</script>

<template>
  <div v-if="node.isDir">
    <button
      type="button"
      class="tree-row dir-row"
      :style="padStyle"
      @click="emit('toggle', node.path)"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
    >
      <ChevronRight
        class="pio-w-3.5 pio-h-3.5 pio-flex-shrink-0 pio-transition-transform"
        :class="{ 'pio-rotate-90': isOpen }"
      />
      <component
        :is="isOpen ? FolderOpen : Folder"
        class="pio-w-4 pio-h-4 pio-flex-shrink-0 pio-text-amber-300/80"
      />
      <span class="pio-truncate pio-flex-1 pio-min-w-0">{{ node.name || '/' }}</span>
    </button>
    <template v-if="isOpen && node.children">
      <ZipTreeItem
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        :expanded="expanded"
        @toggle="(p) => emit('toggle', p)"
        @select="(n) => emit('select', n)"
        @hover="(t, r) => emit('hover', t, r)"
        @leave="emit('leave')"
      />
    </template>
  </div>
  <button
    v-else
    type="button"
    class="tree-row file-row"
    :class="{ selected: isSelected }"
    :style="padStyle"
    @click="emit('select', node)"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    <span class="pio-w-3.5 pio-h-3.5 pio-flex-shrink-0" />
    <component :is="fileIcon" class="pio-w-4 pio-h-4 pio-flex-shrink-0 pio-text-fg-tertiary" />
    <span class="pio-flex-1 pio-truncate pio-min-w-0">{{ node.name }}</span>
    <span class="pio-text-xs pio-text-fg-disabled pio-flex-shrink-0 pio-ml-2">{{ formatFileSize(node.size) }}</span>
  </button>
</template>

<script lang="ts">
export default { name: 'ZipTreeItem' };
</script>

<style scoped>
.tree-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  padding-right: 0.5rem;
  text-align: left;
  font-size: 0.875rem;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.dir-row {
  color: var(--pio-fg-secondary);
}
.file-row {
  color: var(--pio-fg-secondary);
}
.tree-row:hover {
  background: var(--pio-surface-1);
}
.file-row.selected {
  background: var(--pio-line);
  color: #fff;
}
</style>
