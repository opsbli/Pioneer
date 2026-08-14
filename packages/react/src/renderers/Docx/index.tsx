import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import mammoth from 'mammoth';
import {
  loadOfficeFile,
  withConversionCache,
  DEFAULT_CONVERSION_TTL_MS,
} from '@pioneer/core';
import { useTranslator } from '../../i18n/LocaleContext';
import { useFetcher } from '../../RequestContext';
import { RendererError } from '../RendererError';
import type { RendererHandle } from '../base.types';

interface DocxRendererProps {
  url: string;
}

// A4 page dimensions (96dpi)
const PAGE_HEIGHT = 1123;
const PAGE_PADDING_Y = 60;
const PAGE_PADDING_X = 50;
const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING_Y * 2;
const PAGE_GAP = 24;

const contentStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  lineHeight: '1.8',
  color: '#333',
};

export const DocxRenderer = forwardRef<RendererHandle, DocxRendererProps>(({ url }, ref) => {
  const t = useTranslator();
  const fetcher = useFetcher();
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 只有 URL 有效时才加载（避免空字符串或已 revoke 的 blob URL）
    if (!url) return;

    const loadDocx = async () => {
      setLoading(true);
      setError(null);
      setHtml('');

      try {
        // 转换缓存优先：命中则跳过网络下载与 mammoth 转换（Office 预览最大瓶颈）
        const { value } = await withConversionCache('docx:html', url, async () => {
          const { arrayBuffer } = await loadOfficeFile(url, { fetcher });
          const result = await mammoth.convertToHtml({ arrayBuffer });
          return result.value;
        }, { ttlMs: DEFAULT_CONVERSION_TTL_MS });
        setHtml(value);
      } catch (err) {
        console.error('Docx 解析错误:', err);
        setError(t('docx.parse_failed'));
      } finally {
        setLoading(false);
      }
    };

    loadDocx();
  }, [url, fetcher, t]);

  const paginate = useCallback(() => {
    const container = measureRef.current;
    if (!container || !html) return;

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) {
      setPages([html]);
      return;
    }

    const result: string[][] = [[]];
    let currentPageUsed = 0;

    for (const child of children) {
      const h = child.offsetHeight;

      // If adding this block would exceed page content area and page isn't empty,
      // start a new page
      if (currentPageUsed > 0 && currentPageUsed + h > PAGE_CONTENT_HEIGHT) {
        result.push([]);
        currentPageUsed = 0;
      }

      result[result.length - 1].push(child.outerHTML);
      currentPageUsed += h;
    }

    // At least one page
    if (result.length === 0) result.push([]);

    setPages(result.map(blocks => blocks.join('')));
  }, [html]);

  useEffect(() => {
    if (!html || !measureRef.current) return;
    requestAnimationFrame(() => {
      paginate();
    });
  }, [html, paginate]);

  // 暴露接口给父组件
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

  if (error) {
    return <RendererError message={error} />;
  }

  return (
    <div
      className="pio-docx-container pio-w-full pio-h-full pio-overflow-auto pio-py-6 pio-px-4"
      style={{ background: 'rgba(0, 0, 0, 0.15)' }}
    >
      {/* Hidden measurement div — same width as page content area */}
      <div
        ref={measureRef}
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          ...contentStyle,
          position: 'absolute',
          visibility: 'hidden',
          width: `${794 - PAGE_PADDING_X * 2}px`,
          pointerEvents: 'none',
        }}
      />

      {/* Visible pages */}
      <div
        className="pio-flex pio-flex-col pio-items-center"
        style={{ gap: `${PAGE_GAP}px` }}
      >
        {(pages.length > 0 ? pages : ['']).map((pageHtml, i) => (
          <div
            key={i}
            style={{
              width: '100%',
              maxWidth: '794px',
              minHeight: `${PAGE_HEIGHT}px`,
              background: 'white',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.10)',
              flexShrink: 0,
              padding: `${PAGE_PADDING_Y}px ${PAGE_PADDING_X}px`,
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: pageHtml }}
              style={contentStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
