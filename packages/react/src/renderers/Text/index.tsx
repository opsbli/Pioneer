import { useState, useEffect, Fragment, forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { fetchTextUtf8, getLanguageFromFileName } from '@pioneer/core';
import { useTranslator } from '../../i18n/LocaleContext';
import { useFetcher } from '../../RequestContext';
import { useShikiHighlight } from '../../hooks/useShikiHighlight';
import { useDomSearch } from '../../hooks/useDomSearch';
import { RendererError } from '../RendererError';
import { WrapText, Code, Eye } from 'lucide-react';
import type { RendererHandle } from '../base.types';
import type { ToolbarGroup } from '../toolbar.types';
import type { SearchOptions, SearchResult } from '@pioneer/core';

interface TextRendererProps {
  url: string;
  fileName: string;
}

export const TextRenderer = forwardRef<RendererHandle, TextRendererProps>(({
  url,
  fileName,
}, ref) => {
  const t = useTranslator();
  const fetcher = useFetcher();
  const rootRef = useRef<HTMLDivElement>(null);
  const search = useDomSearch(rootRef);

  // 内部状态管理
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordWrap, setWordWrap] = useState(true);
  const [htmlPreview, setHtmlPreview] = useState(false);

  const language = getLanguageFromFileName(fileName);
  const { lineHtmls } = useShikiHighlight(
    language !== 'text' ? content : '',
    language,
  );

  useEffect(() => {
    const controller = new AbortController();
    const loadText = async () => {
      try {
        setLoading(true);
        setError(null);
        const text = await fetchTextUtf8(url, { fetcher, signal: controller.signal });
        setContent(text);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(t('text.load_failed'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadText();
    return () => controller.abort();
  }, [url]);

  // 事件发射器：用于通知主组件工具栏状态变化
  const listenersRef = useRef<Set<() => void>>(new Set());
  const notifyToolbarChange = useCallback(() => {
    listenersRef.current.forEach(listener => listener());
  }, []);

  // 监听影响工具栏的状态变化
  useEffect(() => {
    notifyToolbarChange();
  }, [wordWrap, notifyToolbarChange]);

  useEffect(() => {
    notifyToolbarChange();
  }, [htmlPreview, notifyToolbarChange]);

  // 切换操作
  const toggleWordWrap = useCallback(() => {
    setWordWrap(prev => !prev);
  }, []);

  const toggleHtmlPreview = useCallback(() => {
    setHtmlPreview(prev => !prev);
  }, []);

  // 工具栏配置
  const getToolbarGroups = useCallback((): ToolbarGroup[] => {
    const groups: ToolbarGroup[] = [
      {
        items: [
          {
            type: 'button',
            icon: <WrapText className="pio-w-4 pio-h-4" />,
            tooltip: wordWrap ? t('toolbar.wrap_off') : t('toolbar.wrap_on'),
            action: toggleWordWrap,
            active: wordWrap,
          },
        ],
      },
    ];

    // HTML 文件显示预览按钮
    if (language === 'html') {
      groups.push({
        items: [
          {
            type: 'button',
            icon: htmlPreview
              ? <Code className="pio-w-4 pio-h-4" />
              : <Eye className="pio-w-4 pio-h-4" />,
            tooltip: htmlPreview ? t('toolbar.source') : t('toolbar.preview'),
            action: toggleHtmlPreview,
            active: htmlPreview,
          },
        ],
      });
    }

    return groups;
  }, [wordWrap, htmlPreview, language, t, toggleWordWrap, toggleHtmlPreview]);

  // 暴露接口给父组件
  useImperativeHandle(ref, () => ({
    getToolbarGroups,
    onToolbarChange: (listener: () => void) => {
      listenersRef.current.add(listener);
      return () => listenersRef.current.delete(listener);
    },
    canSearch: () => search.canSearch,
    search: (query: string, options?: SearchOptions): SearchResult => search.search(query, options),
    goToNextMatch: () => search.goToNextMatch(),
    goToPrevMatch: () => search.goToPrevMatch(),
    clearSearch: () => search.clearSearch(),
  }), [getToolbarGroups, search]);

  if (loading) {
    return (
      <div ref={rootRef} className="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
        <div className="pio-w-12 pio-h-12 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div ref={rootRef} className="pio-w-full pio-h-full"><RendererError message={error} /></div>;
  }

  // HTML 预览模式
  if (htmlPreview && (language === 'html')) {
    return (
      <div ref={rootRef} className="pio-w-full pio-h-full pio-bg-surface-toolbar">
        <iframe
          srcDoc={content}
          sandbox="allow-same-origin"
          className="pio-w-full pio-h-full pio-border-0"
          title={fileName}
        />
      </div>
    );
  }

  // 纯文本或高亮未就绪：fallback 到普通 pre
  if (language === 'text' || lineHtmls.length === 0) {
    return (
      <div ref={rootRef} className="pio-w-full pio-h-full pio-overflow-auto pio-bg-code-bg">
        <pre
          className={`pio-py-6 pio-px-4 pio-text-fg-primary pio-font-mono pio-text-sm ${
            wordWrap ? 'pio-whitespace-pre-wrap pio-break-words' : 'pio-whitespace-pre'
          }`}
        >
          {content}
        </pre>
      </div>
    );
  }

  // 双列布局：左 gutter（行号），右 code（shiki 高亮）
  const lines = content.split('\n');
  return (
    <div ref={rootRef} className="pio-w-full pio-h-full pio-overflow-auto pio-bg-code-bg">
      <div
        className={`pio-code-block with-line-numbers ${wordWrap ? '' : 'no-wrap'} pio-w-full`}
        style={{ gridTemplateRows: `repeat(${lines.length}, auto) minmax(1.5rem, 1fr)` }}
      >
        {lines.map((_, i) => (
          <Fragment key={i}>
            <span className="pio-code-gutter">{i + 1}</span>
            <span
              className="pio-code-line"
              dangerouslySetInnerHTML={{ __html: lineHtmls[i] ?? '' }}
            />
          </Fragment>
        ))}
        {/* 占位行：撑满剩余高度，让 gutter border 延伸到底部 */}
        <span className="pio-code-gutter-filler" />
        <span className="pio-code-line-filler" />
      </div>
    </div>
  );
});
