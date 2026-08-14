import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Translator } from '@pioneer/core';

export interface NavArrowsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  resetKey: number;
  t: Translator;
}

const NAV_HIDE_DELAY = 2000;

/**
 * 导航箭头组件
 * 自带 mousemove 监听 + 2s 自动隐藏定时器
 * state 隔离在本组件，避免父组件因 navVisible 变化而 re-render
 */
export const NavArrows: React.FC<NavArrowsProps> = ({
  containerRef,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  resetKey,
  t,
}) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  const scheduleHide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), NAV_HIDE_DELAY);
  }, []);

  const show = useCallback(() => {
    setVisible((prev) => (prev ? prev : true));
    scheduleHide();
  }, [scheduleHide]);

  // 监听容器的 mousemove，触发显示 + 重置隐藏定时器
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => show();
    el.addEventListener('mousemove', handler);
    return () => {
      el.removeEventListener('mousemove', handler);
    };
  }, [containerRef, show]);

  // currentIndex 切换时，显示一次并重置定时器
  useEffect(() => {
    setVisible(true);
    scheduleHide();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetKey, scheduleHide]);

  return (
    <>
      {hasPrev && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -20 }}
          transition={{ duration: 0.2 }}
          onClick={onPrev}
          onMouseEnter={show}
          style={{ pointerEvents: visible ? 'auto' : 'none' }}
          aria-label={t('accessibility.previousFile') || '上一个文件'}
          aria-keyshortcuts="ArrowLeft"
          className="pio-absolute pio-z-20 pio-left-2 md:pio-left-4 pio-top-1/2 -pio-translate-y-1/2 pio-w-10 pio-h-10 md:pio-w-12 md:pio-h-12 pio-rounded-full pio-backdrop-blur-xl pio-border pio-flex pio-items-center pio-justify-center pio-transition-colors pio-shadow-2xl pio-bg-surface-nav pio-border-line hover:pio-bg-surface-nav-hover pio-text-fg-primary"
        >
          <ChevronLeft className="pio-w-5 pio-h-5 md:pio-w-6 md:pio-h-6" />
        </motion.button>
      )}
      {hasNext && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 20 }}
          transition={{ duration: 0.2 }}
          onClick={onNext}
          onMouseEnter={show}
          style={{ pointerEvents: visible ? 'auto' : 'none' }}
          aria-label={t('accessibility.nextFile') || '下一个文件'}
          aria-keyshortcuts="ArrowRight"
          className="pio-absolute pio-z-20 pio-right-2 md:pio-right-4 pio-top-1/2 -pio-translate-y-1/2 pio-w-10 pio-h-10 md:pio-w-12 md:pio-h-12 pio-rounded-full pio-backdrop-blur-xl pio-border pio-flex pio-items-center pio-justify-center pio-transition-colors pio-shadow-2xl pio-bg-surface-nav pio-border-line hover:pio-bg-surface-nav-hover pio-text-fg-primary"
        >
          <ChevronRight className="pio-w-5 pio-h-5 md:pio-w-6 md:pio-h-6" />
        </motion.button>
      )}
    </>
  );
};
