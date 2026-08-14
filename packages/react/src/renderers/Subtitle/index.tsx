import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import {
  parseSubtitle,
  formatSubtitleTime,
  fetchTextUtf8,
  type SubtitleParseResult,
  type SubtitleFormat,
} from '@pioneer/core';
import { useTranslator } from '../../i18n/LocaleContext';
import { useFetcher } from '../../RequestContext';
import { RendererError } from '../RendererError';
import type { RendererHandle } from '../base.types';

interface SubtitleRendererProps {
  url: string;
  fileName: string;
}

const FORMAT_BY_EXT: Record<string, SubtitleFormat> = {
  srt: 'srt',
  vtt: 'vtt',
  lrc: 'lrc',
  elrc: 'elrc',
  ass: 'ass',
  ssa: 'ssa',
  ttml: 'ttml',
  dfxp: 'ttml',
};

const getFormat = (fileName: string): SubtitleFormat | undefined => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return FORMAT_BY_EXT[ext];
};

export const SubtitleRenderer = forwardRef<RendererHandle, SubtitleRendererProps>(({ url, fileName }, ref) => {
  const t = useTranslator();
  const fetcher = useFetcher();
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setText(await fetchTextUtf8(url, { fetcher, signal: controller.signal }));
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('[SubtitleRenderer] Failed to load subtitle:', err instanceof Error ? err.message : String(err));
        setError(t('subtitle.load_failed'));
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [url]);

  const parsed: SubtitleParseResult | null = useMemo(() => {
    if (!text) return null;
    try {
      return parseSubtitle(text, getFormat(fileName));
    } catch (err) {
      // 字幕解析失败通常是格式不支持或文件损坏，用 warn 级别记录
      console.warn('[SubtitleRenderer] Failed to parse subtitle:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [text, fileName]);

  // 暴露接口给父组件
  useImperativeHandle(ref, () => ({
    getToolbarGroups: () => [],
  }), []);

  if (loading) {
    return (
      <div className="pio-flex pio-items-center pio-justify-center pio-w-full pio-h-full pio-bg-[#0f0f12]">
        <div className="pio-w-12 pio-h-12 pio-border-4 pio-border-line-strong pio-border-t-spinner-head pio-rounded-full pio-animate-spin" />
      </div>
    );
  }

  if (error || !parsed) {
    return <RendererError message={error || t('subtitle.parse_failed')} />;
  }

  const isLyric = parsed.format === 'lrc' || parsed.format === 'elrc';
  const meta = parsed.metadata ?? {};
  const dotHover = isLyric ? 'group-hover:pio-bg-violet-400' : 'group-hover:pio-bg-sky-400';

  return (
    <div className="pio-relative pio-w-full pio-h-full pio-bg-[#0f0f12]">
      {/* 内容滚动区 */}
      <div className="pio-w-full pio-h-full pio-overflow-auto pio-px-4 pio-pt-6 pio-pb-16">
        <div className="pio-relative">
          {/* vertical line */}
          <div className="pio-absolute pio-left-[5px] pio-top-2 pio-bottom-2 pio-w-px pio-bg-surface-1" />

          <ol className="pio-space-y-5">
            {parsed.cues.map((cue, i) => (
              <li key={`cue-${i}`} className="pio-relative pio-pl-6 pio-group">
                {/* dot */}
                <div
                  className={`pio-absolute pio-left-0 pio-top-[0.4rem] pio-w-3 pio-h-3 pio-rounded-full pio-bg-surface-3 pio-border-2 pio-border-[#0f0f12] pio-transition-colors ${dotHover}`}
                />

                <div className="pio-flex pio-flex-wrap pio-items-baseline pio-gap-x-3 pio-gap-y-1 pio-mb-1.5">
                  <span className="pio-text-[11px] pio-font-mono pio-text-fg-muted pio-tabular-nums">
                    {formatSubtitleTime(cue.start)}
                  </span>
                  <span className="pio-text-[11px] pio-text-fg-disabled">→</span>
                  <span className="pio-text-[11px] pio-font-mono pio-text-fg-muted pio-tabular-nums">
                    {formatSubtitleTime(cue.end)}
                  </span>
                  <span className="pio-text-[10px] pio-font-mono pio-text-fg-disabled pio-tabular-nums">
                    #{cue.id ?? i + 1}
                  </span>
                  {cue.style && (
                    <span className="pio-text-[9px] pio-uppercase pio-tracking-widest pio-text-fg-tertiary pio-px-1.5 pio-py-0.5 pio-rounded pio-bg-surface-1 pio-border pio-border-line-weak">
                      {cue.style}
                    </span>
                  )}
                </div>

                {cue.words && cue.words.length > 0 ? (
                  <div className="pio-flex pio-flex-wrap pio-gap-x-1.5 pio-gap-y-1 pio-text-base pio-text-fg-primary pio-leading-relaxed group-hover:pio-text-fg-primary pio-transition-colors">
                    {cue.words.map((word, wi) => (
                      <span
                        key={`w-${wi}`}
                        className="pio-inline-flex pio-flex-col pio-items-start"
                        title={formatSubtitleTime(word.start)}
                      >
                        <span className="pio-text-[9px] pio-text-fg-disabled pio-font-mono pio-leading-none pio-tabular-nums">
                          {formatSubtitleTime(word.start).slice(3, 8)}
                        </span>
                        <span className="pio-leading-snug">{word.text}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`pio-whitespace-pre-wrap pio-break-words pio-leading-relaxed group-hover:pio-text-fg-primary pio-transition-colors pio-text-fg-primary pio-min-h-[1.25rem] ${
                      isLyric ? 'pio-text-base pio-font-medium' : 'pio-text-sm'
                    }`}
                  >
                    {cue.text}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="pio-pointer-events-none pio-absolute pio-bottom-3 pio-right-3 pio-flex pio-items-center pio-gap-2 pio-px-2.5 pio-py-1 pio-rounded-full pio-bg-surface-nav pio-backdrop-blur pio-border pio-border-line-weak pio-text-[10px] pio-text-fg-tertiary pio-font-mono pio-tabular-nums">
        <span>{parsed.cues.length} {isLyric ? t('subtitle.lines') : t('subtitle.cues')}</span>
        {meta.length && (
          <>
            <span className="pio-text-fg-disabled">·</span>
            <span>{meta.length}</span>
          </>
        )}
      </div>
    </div>
  );
});
