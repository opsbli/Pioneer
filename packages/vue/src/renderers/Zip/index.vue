<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, defineAsyncComponent } from 'vue';
import {
  loadZip,
  buildZipTree,
  inferMimeType,
  ZipPasswordError,
  ZipInvalidPasswordError,
  type ZipHandle,
  type ZipTreeNode,
} from '@pioneer/core';
import ResizableSplit from '../../components/ResizableSplit.vue';
import TreeItem from './TreeItem.vue';
import EncryptedPasswordModal from '../../components/EncryptedPasswordModal.vue';
import { useTranslator } from '../../composables/useTranslator';
import { useFetcher } from '../../composables/useRequest';
import RendererError from '../RendererError.vue';
import { ToolbarEventEmitter } from '../base.types';
import type { RendererHandle } from '../base.types';
import type { ToolbarGroup } from '../toolbar.types';

export interface ZipToolbarStats {
  files: number;
  dirs: number;
  size: number;
}

// 懒加载 PioneerContent 以打破循环依赖
const LazyPioneerContent = defineAsyncComponent(
  () => import('../../PioneerContent.vue')
);

const props = withDefaults(defineProps<{
  url: string;
  /** ZIP 嵌套深度（由 PioneerContent 传入） */
  nestingDepth?: number;
  /** 宿主传入的已知密码（跳过密码弹窗） */
  password?: string;
}>(), {
  nestingDepth: 0,
  password: undefined,
});

const emitter = new ToolbarEventEmitter();

const { t } = useTranslator();
const fetcher = useFetcher();

interface SelectedPreview {
  path: string;
  name: string;
  size: number;
  blobUrl: string;
}

interface HoverTipState {
  text: string;
  x: number;
  y: number;
}

const zip = ref<ZipHandle | null>(null);
const tree = ref<ZipTreeNode | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const expanded = ref<Set<string>>(new Set(['']));
const selected = ref<SelectedPreview | null>(null);
const previewLoading = ref(false);
const previewError = ref<string | null>(null);
const hoverTip = ref<HoverTipState | null>(null);
const splitRef = ref<InstanceType<typeof ResizableSplit> | null>(null);

// 密码弹窗状态
const MAX_PASSWORD_RETRIES = 3;
const needsPassword = ref(false);
const passwordError = ref('');
const passwordRetries = ref(MAX_PASSWORD_RETRIES);
let currentPassword: string | undefined = props.password;
let passwordRetriesLeft = MAX_PASSWORD_RETRIES;
let reloadTick = 0;

const revokeCurrent = () => {
  if (selected.value?.blobUrl) URL.revokeObjectURL(selected.value.blobUrl);
};

const load = async () => {
  revokeCurrent();
  selected.value = null;
  loading.value = true;
  error.value = null;
  passwordError.value = '';
  try {
    const res = await fetcher.value(props.url);
    if (!res.ok) throw new Error('加载失败');
    const buf = await res.arrayBuffer();
    const z = await loadZip(buf, currentPassword);
    const root = buildZipTree(z.entries);
    zip.value = z;
    tree.value = root;
    needsPassword.value = false;
    passwordRetriesLeft = MAX_PASSWORD_RETRIES;
    const init = new Set<string>(['']);
    if (root.children) for (const c of root.children) if (c.isDir) init.add(c.path);
    expanded.value = init;
  } catch (err: any) {
    if (err instanceof ZipPasswordError) {
      // 文件加密且未提供密码 → 弹窗
      needsPassword.value = true;
      return;
    }
    if (err instanceof ZipInvalidPasswordError) {
      // 密码错误 → 重试
      passwordRetriesLeft -= 1;
      passwordRetries.value = passwordRetriesLeft;
      if (passwordRetriesLeft <= 0) {
        passwordError.value = t.value('encrypted.max_attempts');
        needsPassword.value = false;
      } else {
        passwordError.value = t.value('encrypted.error');
        needsPassword.value = true;
      }
      return;
    }
    console.error(err);
    error.value = t.value('zip.load_failed');
  } finally {
    loading.value = false;
  }
};

// 密码提交：设置密码并重新加载
const handlePasswordSubmit = (pwd: string) => {
  currentPassword = pwd;
  needsPassword.value = false;
  passwordError.value = '';
  reloadTick += 1;
  load();
};

const handlePasswordClose = () => {
  needsPassword.value = false;
};

watch(() => props.url, (newUrl) => {
  // 只有 URL 有效时才加载（避免空字符串或已 revoke 的 blob URL）
  if (newUrl) load();
}, { immediate: true });
onBeforeUnmount(() => { revokeCurrent(); });

// 监听 password prop 变化重新加载
watch(() => props.password, (pwd) => {
  if (pwd) {
    currentPassword = pwd;
    if (needsPassword.value) load();
  }
});

const totalStats = computed<ZipToolbarStats | null>(() => {
  if (!tree.value) return null;
  let files = 0, dirs = 0, size = 0;
  const walk = (n: ZipTreeNode) => {
    if (n.isDir) { if (n.path) dirs++; n.children?.forEach(walk); }
    else { files++; size += n.size; }
  };
  walk(tree.value);
  return { files, dirs, size };
});

// 通知工具栏变化
watch(totalStats, () => emitter.notify());

// 工具栏配置（对齐 React：返回空数组，不显示统计信息）
const getToolbarGroups = (): ToolbarGroup[] => [];

defineExpose<RendererHandle>({
  getToolbarGroups,
  onToolbarChange: (listener) => emitter.subscribe(listener),
});

const handleToggle = (path: string) => {
  const next = new Set(expanded.value);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  expanded.value = next;
};

const handleHover = (text: string, rect: DOMRect) => {
  hoverTip.value = { text, x: rect.right + 8, y: rect.top + rect.height / 2 };
};
const handleLeave = () => { hoverTip.value = null; };

const handleSelect = async (node: ZipTreeNode) => {
  if (!zip.value || node.isDir) return;
  revokeCurrent();
  previewLoading.value = true;
  previewError.value = null;

  try {
    const mime = inferMimeType(node.name);
    const blob = await zip.value.readBlob(node.path, mime !== 'application/octet-stream' ? mime : undefined);
    const blobUrl = URL.createObjectURL(blob);
    selected.value = { path: node.path, name: node.name, size: node.size, blobUrl };
    // 移动端切换到预览 tab
    splitRef.value?.switchTab('right');
  } catch (err: any) {
    if (err instanceof ZipInvalidPasswordError) {
      // 条目读取时密码错误（理论上加载时已校验，兜底处理）
      passwordRetriesLeft -= 1;
      passwordRetries.value = passwordRetriesLeft;
      if (passwordRetriesLeft <= 0) {
        passwordError.value = t.value('encrypted.max_attempts');
      } else {
        passwordError.value = t.value('encrypted.error');
        needsPassword.value = true;
      }
      return;
    }
    console.error(err);
    previewError.value = '条目读取失败';
  } finally {
    previewLoading.value = false;
  }
};

/** 为嵌入的 PioneerContent 构建 files 数组 */
const previewFiles = computed(() => {
  if (!selected.value) return [];
  return [{ name: selected.value.name, url: selected.value.blobUrl, type: inferMimeType(selected.value.name) }];
});
</script>

<template>
  <div v-if="loading" class="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
    <div class="pio-w-12 pio-h-12 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin" />
  </div>

  <!-- 需要密码时优先显示密码弹窗（tree 未加载） -->
  <div v-else-if="needsPassword" class="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
    <p class="pio-text-sm pio-text-fg-muted">{{ t('encrypted.waiting') }}</p>
  </div>

  <RendererError v-else-if="error || !tree" :message="error || t('zip.parse_failed')" />

  <template v-else>
    <ResizableSplit
      ref="splitRef"
      :initial-left-width="280"
      :min-left-width="180"
      :max-left-width="560"
      storage-key="pio-zip-split-left"
      mobile-tab-mode
      left-tab-label="文件树"
      right-tab-label="预览"
    >
      <template #left>
        <div class="pio-w-full pio-h-full pio-overflow-auto">
          <TreeItem
            v-for="child in tree.children || []"
            :key="child.path"
            :node="child"
            :depth="0"
            :selected-path="selected?.path ?? null"
            :expanded="expanded"
            @toggle="handleToggle"
            @select="handleSelect"
            @hover="handleHover"
            @leave="handleLeave"
          />
        </div>
      </template>

      <template #right>
        <div class="pio-w-full pio-h-full pio-flex pio-flex-col">
          <div v-if="!selected" class="pio-flex-1 pio-flex pio-items-center pio-justify-center pio-text-fg-muted pio-text-sm pio-p-6">
            从左侧选择一个文件以预览
          </div>
          <div v-else-if="previewLoading" class="pio-flex-1 pio-flex pio-items-center pio-justify-center">
            <div class="pio-w-8 pio-h-8 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin" />
          </div>
          <div v-else-if="previewError" class="pio-flex-1 pio-flex pio-items-center pio-justify-center pio-text-fg-secondary">{{ previewError }}</div>
          <template v-else>
            <div class="pio-flex-1 pio-min-h-0 pio-overflow-hidden pio-flex pio-relative pio-z-0">
              <LazyPioneerContent
                mode="embed"
                :files="previewFiles"
                :current-index="0"
                :zip-nesting-depth="nestingDepth + 1"
              />
            </div>
          </template>
        </div>
      </template>
    </ResizableSplit>

    <!-- 文件名 hover tooltip (teleport 到 body 避免被滚动区裁剪) -->
    <Teleport to="body">
      <div
        v-if="hoverTip"
        class="pio-zip-tip"
        :style="{ left: hoverTip.x + 'px', top: hoverTip.y + 'px' }"
      >
        {{ hoverTip.text }}
      </div>
    </Teleport>
  </template>

  <!-- 密码弹窗：ZIP 加密且未提供密码时弹出 -->
  <EncryptedPasswordModal
    v-if="needsPassword"
    :retries-left="passwordRetries"
    :error-message="passwordError"
    @submit="handlePasswordSubmit"
    @close="handlePasswordClose"
  />
</template>

<style>
/* 全局 tooltip（不能 scoped，因 Teleport 到 body） */
.pio-zip-tip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transform: translateY(-50%);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 4px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
