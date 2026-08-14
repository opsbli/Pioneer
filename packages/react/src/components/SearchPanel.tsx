import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, X, CaseSensitive } from 'lucide-react';
import type { Translator } from '@pioneer/core';

interface SearchPanelProps {
  t: Translator;
  onClose: () => void;
  onSearch: (query: string, options: { caseSensitive: boolean }) => void;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  matchCount: number;
  totalCount: number;
}

/**
 * 全文搜索面板
 * 固定在工具栏下方，包含输入框、翻页按钮、匹配计数、大小写切换、关闭按钮
 */
export function SearchPanel({
  t,
  onClose,
  onSearch,
  onPrevMatch,
  onNextMatch,
  matchCount,
  totalCount,
}: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(val, { caseSensitive });
    }, 300);
  }, [caseSensitive, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        onSearch(query, { caseSensitive });
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onPrevMatch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onNextMatch();
      }
    },
    [query, caseSensitive, onSearch, onPrevMatch, onNextMatch, onClose],
  );

  const displayCount = totalCount > 0 ? `${matchCount + 1} / ${totalCount}` : t('search.no_results');

  return (
    <div className="pio-flex pio-items-center pio-gap-2 pio-px-3 md:pio-px-5 pio-py-1.5 pio-border-b pio-border-line-weak pio-bg-surface-toolbar">
      {/* 输入框 */}
      <div className="pio-flex pio-items-center pio-gap-1 pio-flex-1 pio-min-w-0 pio-max-w-sm pio-px-2 pio-py-1 pio-rounded-md pio-border pio-border-line pio-bg-surface-input focus-within:pio-border-fg-primary">
        <Search className="pio-w-3.5 pio-h-3.5 pio-text-fg-muted pio-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          className="pio-flex-1 pio-min-w-0 pio-text-xs pio-bg-transparent pio-text-fg-primary pio-outline-none pio-placeholder:text-fg-muted"
        />
      </div>

      {/* 匹配计数 */}
      <span className="pio-text-xs pio-text-fg-muted pio-tabular-nums pio-shrink-0">
        {displayCount}
      </span>

      {/* 翻页按钮 */}
      <button
        onClick={onPrevMatch}
        disabled={totalCount === 0}
        className="pio-p-1 pio-text-fg-muted hover:pio-text-fg-primary pio-transition-colors pio-disabled:text-fg-disabled pio-disabled:cursor-not-allowed"
        title={t('search.prev_match')}
      >
        <ChevronUp className="pio-w-4 pio-h-4" />
      </button>
      <button
        onClick={onNextMatch}
        disabled={totalCount === 0}
        className="pio-p-1 pio-text-fg-muted hover:pio-text-fg-primary pio-transition-colors pio-disabled:text-fg-disabled pio-disabled:cursor-not-allowed"
        title={t('search.next_match')}
      >
        <ChevronDown className="pio-w-4 pio-h-4" />
      </button>

      {/* 大小写切换 */}
      <button
        onClick={() => {
          setCaseSensitive((v) => !v);
          if (query) {
            onSearch(query, { caseSensitive: !caseSensitive });
          }
        }}
        className={`pio-p-1 pio-transition-colors ${
          caseSensitive ? 'pio-text-fg-primary' : 'pio-text-fg-muted hover:pio-text-fg-primary'
        }`}
        title={t('search.case_sensitive')}
      >
        <CaseSensitive className="pio-w-4 pio-h-4" />
      </button>

      {/* 关闭 */}
      <button
        onClick={onClose}
        className="pio-p-1 pio-text-fg-muted hover:pio-text-fg-primary pio-transition-colors"
        title={t('search.close')}
      >
        <X className="pio-w-4 pio-h-4" />
      </button>
    </div>
  );
}
