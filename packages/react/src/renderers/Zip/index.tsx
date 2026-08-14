import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense, forwardRef, useImperativeHandle } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import {
  Folder,
  FolderOpen,
  FileText,
  FileImage,
  FileCode,
  File as FileIcon,
  ChevronRight,
} from 'lucide-react';
import { RendererError } from '../RendererError';
import type { RendererHandle } from '../base.types';
import {
  loadZip,
  buildZipTree,
  formatFileSize,
  getFileType,
  inferMimeType,
  ZipPasswordError,
  ZipInvalidPasswordError,
  type ZipHandle,
  type ZipTreeNode,
} from '@pioneer/core';
import { EncryptedPasswordModal } from '../../components/EncryptedPasswordModal';
import { ResizableSplit, type ResizableSplitHandle } from '../../components/ResizableSplit';
import { useTranslator } from '../../i18n/LocaleContext';
import { useFetcher } from '../../RequestContext';

export interface ZipToolbarStats {
  files: number;
  dirs: number;
  size: number;
}

// 懒加载 PioneerContent 以打破循环依赖
const LazyPioneerContent = lazy(() =>
  import('../../PioneerContent').then(m => ({ default: m.PioneerContent }))
);

interface ZipRendererProps {
  url: string;
  /** ZIP 嵌套深度（由 PioneerContent 传入） */
  nestingDepth?: number;
  /** 解析完成后向外回报统计信息（files / dirs / size），供工具栏展示 */
  onStatsChange?: (stats: ZipToolbarStats | null) => void;
  /** 宿主传入的已知密码（跳过密码弹窗） */
  password?: string;
}

interface SelectedPreview {
  path: string;
  name: string;
  size: number;
  blobUrl: string;
}

/** 根据文件类型返回树节点图标 */
const resolveIcon = (name: string) => {
  const ft = getFileType({ id: '', name, url: '', type: '' });
  if (ft === 'image') return FileImage;
  if (ft === 'text' || ft === 'markdown' || ft === 'json' || ft === 'csv' || ft === 'xml' || ft === 'subtitle') {
    return name.endsWith('.md') || name.endsWith('.markdown') ? FileText : FileCode;
  }
  return FileIcon;
};

// ---------- Tooltip via portal ----------

interface HoverTipState {
  text: string;
  x: number;
  y: number;
}

// ---------- Tree item ----------

interface TreeItemProps {
  node: ZipTreeNode;
  depth: number;
  selectedPath: string | null;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (node: ZipTreeNode) => void;
  onHover: (text: string, rect: DOMRect) => void;
  onLeave: () => void;
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  depth,
  selectedPath,
  expanded,
  onToggle,
  onSelect,
  onHover,
  onLeave,
}) => {
  const isOpen = expanded.has(node.path);
  const isSelected = selectedPath === node.path;
  const pad = { paddingLeft: `${depth * 14 + 10}px` };
  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onHover(node.name || '/', rect);
  };

  if (node.isDir) {
    return (
      <>
        <button
          type="button"
          onClick={() => onToggle(node.path)}
          onMouseEnter={handleEnter}
          onMouseLeave={onLeave}
          className="pio-w-full pio-flex pio-items-center pio-gap-1.5 pio-py-1.5 pio-pr-2 pio-text-left pio-text-fg-secondary hover:pio-bg-surface-1 pio-text-sm"
          style={pad}
        >
          <ChevronRight
            className={`pio-w-3.5 pio-h-3.5 pio-flex-shrink-0 pio-transition-transform ${
              isOpen ? 'pio-rotate-90' : ''
            }`}
          />
          {isOpen ? (
            <FolderOpen className="pio-w-4 pio-h-4 pio-flex-shrink-0 pio-text-amber-300/80" />
          ) : (
            <Folder className="pio-w-4 pio-h-4 pio-flex-shrink-0 pio-text-amber-300/80" />
          )}
          <span className="pio-truncate pio-flex-1 pio-min-w-0">{node.name || '/'}</span>
        </button>
        {isOpen &&
          node.children?.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onHover={onHover}
              onLeave={onLeave}
            />
          ))}
      </>
    );
  }

  const Icon = resolveIcon(node.name);

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      onMouseEnter={handleEnter}
      onMouseLeave={onLeave}
      className={`pio-w-full pio-flex pio-items-center pio-gap-1.5 pio-py-1.5 pio-pr-2 pio-text-left pio-text-sm ${
        isSelected ? 'pio-bg-surface-2 pio-text-fg-primary' : 'pio-text-fg-secondary hover:pio-bg-surface-1'
      }`}
      style={pad}
    >
      <span className="pio-w-3.5 pio-h-3.5 pio-flex-shrink-0" />
      <Icon className="pio-w-4 pio-h-4 pio-flex-shrink-0 pio-text-fg-tertiary" />
      <span className="pio-flex-1 pio-truncate pio-min-w-0">{node.name}</span>
      <span className="pio-text-xs pio-text-fg-disabled pio-flex-shrink-0 pio-ml-2">
        {formatFileSize(node.size)}
      </span>
    </button>
  );
};

// ---------- Main Zip Renderer ----------

export const ZipRenderer = forwardRef<RendererHandle, ZipRendererProps>(({ url, nestingDepth = 0, onStatsChange, password: initialPassword }, ref) => {
  const t = useTranslator();
  const fetcher = useFetcher();
  const [zip, setZip] = useState<ZipHandle | null>(null);
  const [tree, setTree] = useState<ZipTreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['']));
  const [selected, setSelected] = useState<SelectedPreview | null>(null);

  // 密码弹窗状态
  const MAX_PASSWORD_RETRIES = 3;
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordRetries, setPasswordRetries] = useState(MAX_PASSWORD_RETRIES);
  const passwordRef = useRef<string | undefined>(initialPassword);
  const passwordRetriesRef = useRef(MAX_PASSWORD_RETRIES);
  const updatePasswordRetries = useCallback((n: number) => {
    passwordRetriesRef.current = n;
    setPasswordRetries(n);
  }, []);
  // 密码提交后强制重新加载
  const [reloadTick, setReloadTick] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [hoverTip, setHoverTip] = useState<HoverTipState | null>(null);
  const onStatsChangeRef = useRef(onStatsChange);
  const splitRef = useRef<ResizableSplitHandle>(null);

  useEffect(() => {
    onStatsChangeRef.current = onStatsChange;
  }, [onStatsChange]);

  useEffect(() => {
    // 只有 URL 有效时才加载（避免空字符串或已 revoke 的 blob URL）
    if (!url) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setPasswordError('');
        const res = await fetcher(url);
        if (!res.ok) throw new Error('加载失败');
        const buf = await res.arrayBuffer();
        const z = await loadZip(buf, passwordRef.current);
        if (cancelled) return;
        const root = buildZipTree(z.entries);
        setZip(z);
        setTree(root);
        setNeedsPassword(false);
        updatePasswordRetries(MAX_PASSWORD_RETRIES);
        const init = new Set<string>(['']);
        if (root.children) {
          for (const c of root.children) if (c.isDir) init.add(c.path);
        }
        setExpanded(init);
      } catch (err: any) {
        if (cancelled) return;
        if (err instanceof ZipPasswordError) {
          // 文件加密且未提供密码 → 弹窗
          setNeedsPassword(true);
          setLoading(false);
          return;
        }
        if (err instanceof ZipInvalidPasswordError) {
          // 密码错误 → 重试
          const remaining = passwordRetriesRef.current - 1;
          updatePasswordRetries(remaining);
          if (remaining <= 0) {
            setPasswordError(t('encrypted.max_attempts'));
            setNeedsPassword(false);
          } else {
            setPasswordError(t('encrypted.error'));
            setNeedsPassword(true);
          }
          setLoading(false);
          return;
        }
        console.error(err);
        setError(t('zip.load_failed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [url, t, updatePasswordRetries, reloadTick]);

  // 切换文件时回收 blob URL
  useEffect(() => {
    return () => {
      if (selected?.blobUrl) URL.revokeObjectURL(selected.blobUrl);
    };
  }, [selected]);

  // 密码提交处理：设置密码并重新加载 ZIP
  const handlePasswordSubmit = useCallback((pwd: string) => {
    passwordRef.current = pwd;
    setNeedsPassword(false);
    setPasswordError('');
    // 触发重新加载（依赖 reloadTick）
    setZip(null);
    setTree(null);
    setReloadTick((t) => t + 1);
  }, []);

  const handlePasswordClose = useCallback(() => {
    setNeedsPassword(false);
  }, []);

  const totalStats = useMemo<ZipToolbarStats | null>(() => {
    if (!tree) return null;
    let files = 0;
    let dirs = 0;
    let size = 0;
    const walk = (n: ZipTreeNode) => {
      if (n.isDir) {
        if (n.path) dirs++;
        n.children?.forEach(walk);
      } else {
        files++;
        size += n.size;
      }
    };
    walk(tree);
    return { files, dirs, size };
  }, [tree]);

  // 向外回报 stats
  useEffect(() => {
    onStatsChangeRef.current?.(totalStats);
    return () => {
      onStatsChangeRef.current?.(null);
    };
  }, [totalStats]);

  const handleToggle = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleHover = useCallback((text: string, rect: DOMRect) => {
    setHoverTip({
      text,
      x: rect.right + 8,
      y: rect.top + rect.height / 2,
    });
  }, []);

  const handleLeave = useCallback(() => {
    setHoverTip(null);
  }, []);

  const handleSelect = useCallback(
    async (node: ZipTreeNode) => {
      if (!zip || node.isDir) return;
      if (selected?.blobUrl) URL.revokeObjectURL(selected.blobUrl);
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const mime = inferMimeType(node.name);
        const blob = await zip.readBlob(node.path, mime !== 'application/octet-stream' ? mime : undefined);
        const blobUrl = URL.createObjectURL(blob);
        setSelected({ path: node.path, name: node.name, size: node.size, blobUrl });
        // 移动端切换到预览 tab
        splitRef.current?.switchTab('right');
      } catch (err: any) {
        if (err instanceof ZipInvalidPasswordError) {
          // 条目读取时密码错误（理论上加载时已校验，兜底处理）
          const remaining = passwordRetriesRef.current - 1;
          updatePasswordRetries(remaining);
          if (remaining <= 0) {
            setPasswordError(t('encrypted.max_attempts'));
          } else {
            setPasswordError(t('encrypted.error'));
            setNeedsPassword(true);
          }
          return;
        }
        console.error(err);
        setPreviewError('条目读取失败');
      } finally {
        setPreviewLoading(false);
      }
    },
    [zip, selected]
  );

  // Memoize files 数组以避免无限重新渲染
  const previewFiles = useMemo(() => {
    if (!selected) return [];
    return [{ name: selected.name, url: selected.blobUrl, type: inferMimeType(selected.name) }];
  }, [selected]);

  // 暴露接口给父组件（必须在 early return 之前调用）
  useImperativeHandle(ref, () => ({
    getToolbarGroups: () => [],
  }), []);

  if (loading) {
    return (
      <div className="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
        <div className="pio-w-12 pio-h-12 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin" />
      </div>
    );
  }

  if (error || !tree) {
    // 需要密码时优先显示密码弹窗（tree 未加载），否则显示错误
    return (
      <>
        {needsPassword && (
          <EncryptedPasswordModal
            t={t}
            retriesLeft={passwordRetries}
            errorMessage={passwordError}
            onSubmit={handlePasswordSubmit}
            onClose={handlePasswordClose}
          />
        )}
        {needsPassword ? (
          <div className="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
            <p className="pio-text-sm pio-text-fg-muted">{t('encrypted.waiting')}</p>
          </div>
        ) : (
          <RendererError message={error || t('zip.parse_failed')} />
        )}
      </>
    );
  }

  // 左侧：文件树
  const leftPane = (
    <div className="pio-w-full pio-h-full pio-overflow-auto">
      {tree.children?.map((child) => (
        <TreeItem
          key={child.path}
          node={child}
          depth={0}
          selectedPath={selected?.path ?? null}
          expanded={expanded}
          onToggle={handleToggle}
          onSelect={handleSelect}
          onHover={handleHover}
          onLeave={handleLeave}
        />
      ))}
    </div>
  );

  // 右侧：预览区
  const rightPane = (
    <div className="pio-w-full pio-h-full pio-flex pio-flex-col">
      {!selected && (
        <div className="pio-flex-1 pio-flex pio-items-center pio-justify-center pio-text-fg-muted pio-text-sm pio-p-6">
          从左侧选择一个文件以预览
        </div>
      )}
      {selected && previewLoading && (
        <div className="pio-flex-1 pio-flex pio-items-center pio-justify-center">
          <div className="pio-w-8 pio-h-8 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin" />
        </div>
      )}
      {selected && !previewLoading && previewError && (
        <div className="pio-flex-1 pio-flex pio-items-center pio-justify-center pio-text-fg-secondary">
          {previewError}
        </div>
      )}
      {selected && !previewLoading && !previewError && (
        <>
          <div className="pio-flex-1 pio-min-h-0 pio-overflow-hidden pio-flex pio-relative pio-z-0">
            <Suspense
              fallback={
                <div className="pio-flex-1 pio-flex pio-items-center pio-justify-center">
                  <div className="pio-w-8 pio-h-8 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin" />
                </div>
              }
            >
              <LazyPioneerContent
                mode="embed"
                files={previewFiles}
                currentIndex={0}
                zipNestingDepth={nestingDepth + 1}
              />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <ResizableSplit
        ref={splitRef}
        left={leftPane}
        right={rightPane}
        initialLeftWidth={280}
        minLeftWidth={180}
        maxLeftWidth={560}
        storageKey="pio-zip-split-left"
        mobileTabMode
        leftTabLabel="文件树"
        rightTabLabel="预览"
      />
      {/* 文件名 hover tooltip（portal 到 body，避免被滚动区裁剪） */}
      {hoverTip &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pio-fixed pio-z-[9999] pio-pointer-events-none pio-px-2 pio-py-1 pio-bg-[rgba(0,0,0,0.85)] pio-text-fg-primary pio-text-xs pio-rounded pio-whitespace-nowrap pio-shadow-lg"
            style={{
              left: `${hoverTip.x}px`,
              top: `${hoverTip.y}px`,
              transform: 'translateY(-50%)',
            }}
          >
            {hoverTip.text}
          </div>,
          document.body
        )}

      {/* 密码弹窗：ZIP 加密且未提供密码时弹出 */}
      {needsPassword && (
        <EncryptedPasswordModal
          t={t}
          retriesLeft={passwordRetries}
          errorMessage={passwordError}
          onSubmit={handlePasswordSubmit}
          onClose={handlePasswordClose}
        />
      )}
    </>
  );
});
