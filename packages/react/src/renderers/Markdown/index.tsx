import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Copy, Check, Eye, Code } from 'lucide-react';
import { fetchTextUtf8 } from '@pioneer/core';
import type { SearchOptions, SearchResult } from '@pioneer/core';
import { useTranslator } from '../../i18n/LocaleContext';
import { useFetcher } from '../../RequestContext';
import { useShikiHighlight } from '../../hooks/useShikiHighlight';
import { useDomSearch } from '../../hooks/useDomSearch';
import { RendererError } from '../RendererError';
import type { RendererHandle } from '../base.types';
import type { ToolbarGroup } from '../toolbar.types';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  url: string;
}

const useCopy = (text: string) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return { copied, handleCopy };
};

/** 内联版复制按钮：放在代码块 header 行内，始终可见 */
const InlineCopyButton = ({ text }: { text: string }) => {
  const t = useTranslator();
  const { copied, handleCopy } = useCopy(text);
  return (
    <button
      onClick={handleCopy}
      className="pio-p-1 pio-rounded pio-text-fg-muted hover:pio-text-fg-secondary pio-transition-colors pio-flex pio-items-center pio-gap-1"
      title={copied ? t('markdown.copied') : t('markdown.copy_code')}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
};

/** 浮动版复制按钮：无 header 时绝对定位于代码块右上角（hover 显示） */
const FloatingCopyButton = ({ text }: { text: string }) => {
  const t = useTranslator();
  const { copied, handleCopy } = useCopy(text);
  return (
    <button
      onClick={handleCopy}
      className="pio-absolute pio-top-2 pio-right-2 pio-p-1.5 pio-rounded-md pio-bg-surface-2 hover:pio-bg-surface-3 pio-text-fg-tertiary hover:pio-text-fg-secondary pio-transition-colors pio-opacity-0 group-hover:pio-opacity-100 pio-border pio-border-line"
      title={copied ? t('markdown.copied') : t('markdown.copy_code')}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

/** 带语言标注的代码块：shiki 高亮 + header + 复制按钮 */
const ShikiCodeBlock = ({ code, lang }: { code: string; lang: string }) => {
  const { html } = useShikiHighlight(code, lang);
  return (
    <div className="pio-relative pio-group pio-my-4">
      <div className="pio-flex pio-items-center pio-justify-between pio-px-4 pio-py-1.5 pio-bg-surface-1 pio-border pio-border-line-weak pio-rounded-t-md pio-border-b-0">
        <span className="pio-text-xs pio-text-fg-secondary pio-font-mono pio-select-none">{lang}</span>
        <InlineCopyButton text={code} />
      </div>
      {html ? (
        <div
          className="pio-shiki-wrapper pio-rounded-b-md pio-border pio-border-line-weak pio-border-t-0 pio-overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          className="pio-m-0 pio-rounded-b-md pio-border pio-border-line-weak pio-border-t-0 pio-overflow-x-auto pio-p-4 pio-bg-code-bg"
          style={{ fontSize: '13px', lineHeight: '1.5' }}
        >
          <code className="pio-font-mono pio-text-code-fg pio-text-sm">{code}</code>
        </pre>
      )}
    </div>
  );
};

export const MarkdownRenderer = forwardRef<RendererHandle, MarkdownRendererProps>(({ url }, ref) => {
  const t = useTranslator();
  const fetcher = useFetcher();

  // 内部状态管理
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const rootRef = useRef<HTMLDivElement>(null);
  const search = useDomSearch(rootRef);

  const { html: sourceHtml } = useShikiHighlight(
    viewMode === 'source' ? content : '',
    'markdown',
  );

  useEffect(() => {
    const controller = new AbortController();
    const loadMarkdown = async () => {
      try {
        setLoading(true);
        setError(null);
        const text = await fetchTextUtf8(url, { fetcher, signal: controller.signal });
        setContent(text);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(t('markdown.load_failed'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMarkdown();
    return () => controller.abort();
  }, [url, fetcher, t]);

  // 事件发射器：用于通知主组件工具栏状态变化
  const listenersRef = useRef<Set<() => void>>(new Set());
  const notifyToolbarChange = useCallback(() => {
    listenersRef.current.forEach(listener => listener());
  }, []);

  // 监听影响工具栏的状态变化
  useEffect(() => {
    notifyToolbarChange();
  }, [viewMode, notifyToolbarChange]);

  // 切换视图模式
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'preview' ? 'source' : 'preview');
  }, []);

  // 工具栏配置
  const getToolbarGroups = useCallback((): ToolbarGroup[] => [
    {
      items: [
        {
          type: 'button',
          icon: viewMode === 'preview' ? <Code className="pio-w-4 pio-h-4" /> : <Eye className="pio-w-4 pio-h-4" />,
          tooltip: viewMode === 'preview' ? t('toolbar.source') : t('toolbar.preview'),
          action: toggleViewMode,
          active: viewMode === 'source',
        },
      ],
    },
  ], [viewMode, t, toggleViewMode]);

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
      <div className="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full">
        <div className="pio-w-12 pio-h-12 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin" />
      </div>
    );
  }

  if (error) {
    return <RendererError message={error} />;
  }

  // 源码视图
  if (viewMode === 'source') {
    return (
      <div ref={rootRef} className="pio-w-full pio-h-full pio-overflow-auto pio-bg-code-bg">
        {sourceHtml ? (
          <div
            className="pio-shiki-wrapper with-line-numbers"
            dangerouslySetInnerHTML={{ __html: sourceHtml }}
          />
        ) : (
          <pre className="pio-p-6 pio-text-fg-primary pio-font-mono pio-text-sm pio-whitespace-pre-wrap pio-break-words">
            {content}
          </pre>
        )}
      </div>
    );
  }

  // 预览视图
  return (
    <div ref={rootRef} className="pio-w-full pio-h-full pio-overflow-auto pio-py-6 pio-px-4">
      <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              code({ node: _node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                // react-markdown v9 不再传 inline，需要兜底判断：
                // 无语言 className 且不含换行视为内联代码
                const isInline = inline ?? (!match && !codeString.includes('\n'));

                // 行内代码 - 返回纯 <code>
                if (isInline) {
                  return (
                    <code
                      className="pio-bg-surface-2 pio-px-1.5 pio-py-0.5 pio-rounded pio-text-sm pio-font-mono pio-text-fg-primary pio-border pio-border-line-weak"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                // 代码块 - 有语言标注
                if (match) {
                  return <ShikiCodeBlock code={codeString} lang={match[1]} />;
                }

                // 代码块 - 无语言标注
                return (
                  <div className="pio-relative pio-group pio-my-4">
                    <FloatingCopyButton text={codeString} />
                    <pre
                      className="pio-m-0 pio-rounded-md pio-border pio-border-line-weak pio-overflow-x-auto pio-p-4 pio-bg-code-bg"
                      style={{ fontSize: '13px', lineHeight: '1.5' }}
                    >
                      <code className="pio-font-mono pio-text-code-fg pio-text-sm">{children}</code>
                    </pre>
                  </div>
                );
              },
              h1: ({ children }) => (
                <h1 className="pio-text-3xl pio-font-semibold pio-mb-4 pio-mt-6 pio-text-fg-primary first:pio-mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="pio-text-2xl pio-font-semibold pio-mb-3 pio-mt-8 pio-text-fg-primary">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="pio-text-xl pio-font-semibold pio-mb-2 pio-mt-6 pio-text-fg-primary">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="pio-text-lg pio-font-semibold pio-mb-2 pio-mt-4 pio-text-fg-primary">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="pio-text-fg-secondary pio-mb-4 pio-leading-7 pio-text-base">{children}</p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="pio-text-indigo-400 hover:pio-text-indigo-300 pio-underline pio-decoration-indigo-600 hover:pio-decoration-indigo-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="pio-list-disc pio-pl-6 pio-mb-4 pio-text-fg-secondary pio-space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="pio-list-decimal pio-pl-6 pio-mb-4 pio-text-fg-secondary pio-space-y-1">{children}</ol>
              ),
              li: ({ children }) => <li className="pio-leading-7">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="pio-border-l-4 pio-border-line-strong pio-pl-4 pio-text-fg-tertiary pio-my-4 pio-italic">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="pio-overflow-x-auto pio-my-4 pio-rounded-md pio-border pio-border-line">
                  <table className="pio-min-w-full pio-divide-y pio-divide-divide">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="pio-bg-surface-1">{children}</thead>,
              tbody: ({ children }) => (
                <tbody className="pio-divide-y pio-divide-divide pio-bg-transparent">{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:pio-bg-surface-1 pio-transition-colors">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="pio-px-4 pio-py-3 pio-text-left pio-text-xs pio-font-semibold pio-text-fg-tertiary pio-uppercase pio-tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="pio-px-4 pio-py-3 pio-text-sm pio-text-fg-secondary">{children}</td>
              ),
              hr: () => <hr className="pio-border-line pio-my-6" />,
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt}
                  className="pio-rounded-md pio-max-w-full pio-h-auto pio-my-4 pio-mx-auto pio-block pio-shadow-sm"
                />
              ),
              input: ({ type, checked, ...props }) => {
                if (type === 'checkbox') {
                  return (
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      className="pio-mr-2 pio-rounded pio-border-line"
                      {...props}
                    />
                  );
                }
                return <input type={type} {...props} />;
              },
              strong: ({ children }) => (
                <strong className="pio-font-semibold pio-text-fg-primary">{children}</strong>
              ),
              em: ({ children }) => <em className="pio-italic">{children}</em>,
              del: ({ children }) => (
                <del className="pio-text-fg-muted pio-line-through">{children}</del>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
    </div>
  );
});
