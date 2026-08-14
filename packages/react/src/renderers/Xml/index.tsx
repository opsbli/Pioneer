import { useState, useEffect, Fragment, forwardRef, useImperativeHandle, useRef } from 'react';
import { fetchTextUtf8 } from '@pioneer/core';
import type { SearchOptions, SearchResult } from '@pioneer/core';
import { useTranslator } from '../../i18n/LocaleContext';
import { useFetcher } from '../../RequestContext';
import { useShikiHighlight } from '../../hooks/useShikiHighlight';
import { useDomSearch } from '../../hooks/useDomSearch';
import { RendererError } from '../RendererError';
import type { RendererHandle } from '../base.types';

interface XmlRendererProps {
  url: string;
  fileName: string;
}

/**
 * 用 DOMParser 美化 XML：失败则原样返回
 */
const prettyPrintXml = (xml: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    // 检测解析错误
    const errNode = doc.querySelector('parsererror');
    if (errNode) return xml;
    // 使用 XSLT 或手动缩进：这里手动缩进更稳
    const serializer = new XMLSerializer();
    const serialized = serializer.serializeToString(doc);
    return indentXml(serialized);
  } catch {
    return xml;
  }
};

const indentXml = (xml: string): string => {
  const PADDING = '  ';
  const reg = /(>)(<)(\/*)/g;
  let formatted = xml.replace(reg, '$1\n$2$3');
  // 自闭合和 CDATA 等不处理
  let pad = 0;
  return formatted
    .split('\n')
    .map((line) => {
      let indent = 0;
      if (/^<\/\w/.test(line)) {
        pad = Math.max(pad - 1, 0);
      } else if (/^<\w[^>]*[^/]>.*$/.test(line) && !/<.+<\/.+>$/.test(line)) {
        indent = 1;
      }
      const padded = PADDING.repeat(pad) + line;
      pad += indent;
      return padded;
    })
    .join('\n');
};

export const XmlRenderer = forwardRef<RendererHandle, XmlRendererProps>(({ url }, ref) => {
  const t = useTranslator();
  const fetcher = useFetcher();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const search = useDomSearch(rootRef);
  const { lineHtmls } = useShikiHighlight(content, 'xml');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const raw = await fetchTextUtf8(url, { fetcher, signal: controller.signal });
        setContent(prettyPrintXml(raw));
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(err);
        setError(t('xml.load_failed'));
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [url]);

  // 暴露接口给父组件（必须在 early return 之前调用）
  useImperativeHandle(ref, () => ({
    getToolbarGroups: () => [],
    canSearch: () => search.canSearch,
    search: (query: string, options?: SearchOptions): SearchResult => search.search(query, options),
    goToNextMatch: () => search.goToNextMatch(),
    goToPrevMatch: () => search.goToPrevMatch(),
    clearSearch: () => search.clearSearch(),
  }), [search]);

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

  if (lineHtmls.length === 0) {
    return (
      <div ref={rootRef} className="pio-w-full pio-h-full pio-overflow-auto pio-bg-code-bg">
        <pre className="pio-py-6 pio-px-4 pio-text-fg-primary pio-font-mono pio-text-sm pio-whitespace-pre-wrap pio-break-words">
          {content}
        </pre>
      </div>
    );
  }

  const lines = content.split('\n');
  return (
    <div ref={rootRef} className="pio-w-full pio-h-full pio-overflow-auto pio-bg-code-bg">
      <div
        className="pio-code-block with-line-numbers pio-w-full"
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
