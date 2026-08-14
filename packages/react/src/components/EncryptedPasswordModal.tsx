import { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, X } from 'lucide-react';
import type { Translator } from '@pioneer/core';

interface EncryptedPasswordModalProps {
  t: Translator;
  retriesLeft: number;
  errorMessage: string;
  onSubmit: (password: string) => void;
  onClose?: () => void;
  autoFocus?: boolean;
}

/**
 * 加密文件密码输入弹窗
 * 显示在预览容器内居中位置，包含标题、密码输入框、确认按钮、错误提示
 */
export function EncryptedPasswordModal({
  t,
  retriesLeft,
  errorMessage,
  onSubmit,
  onClose,
  autoFocus = true,
}: EncryptedPasswordModalProps) {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = useCallback(() => {
    if (!password.trim()) return;
    onSubmit(password);
    setPassword('');
  }, [password, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    },
    [handleSubmit, onClose],
  );

  const isMaxReached = retriesLeft <= 0;

  return (
    <div
      className="pio-absolute pio-inset-0 pio-flex pio-items-center pio-justify-center pio-z-[20] pio-bg-black/40 pio-backdrop-blur-sm"
      onClick={() => onClose?.()}
    >
      <div
        className="pio-relative pio-w-80 pio-max-w-[90%] pio-bg-surface-panel pio-rounded-lg pio-shadow-2xl pio-border pio-border-line pio-p-5 pio-flex pio-flex-col pio-gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        {onClose && (
          <button
            className="pio-absolute pio-top-3 pio-right-3 pio-p-1 pio-text-fg-muted hover:pio-text-fg-primary pio-transition-colors"
            onClick={onClose}
            title={t('common.close')}
          >
            <X className="pio-w-4 pio-h-4" />
          </button>
        )}

        {/* 图标 + 标题 */}
        <div className="pio-flex pio-items-center pio-gap-3">
          <div className="pio-p-2 pio-rounded-lg pio-bg-surface-2">
            <Lock className="pio-w-5 pio-h-5 pio-text-fg-primary" />
          </div>
          <h3 className="pio-font-medium pio-text-sm pio-text-fg-primary">
            {t('encrypted.title')}
          </h3>
        </div>

        {/* 密码输入 */}
        <div className="pio-flex pio-flex-col pio-gap-2">
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('encrypted.password_placeholder')}
            disabled={isMaxReached}
            className="pio-w-full pio-px-3 pio-py-2 pio-text-sm pio-rounded-md pio-border pio-border-line pio-bg-surface-input pio-text-fg-primary pio-outline-none focus:pio-border-fg-primary focus:pio-ring-1 focus:pio-ring-fg-primary/30 pio-placeholder:text-fg-muted disabled:pio-opacity-50 disabled:pio-cursor-not-allowed"
          />

          {/* 错误提示 */}
          {errorMessage && (
            <p className="pio-text-xs pio-text-red-500 pio-flex pio-items-center pio-gap-1">
              {errorMessage}
            </p>
          )}

          {/* 重试次数 */}
          {!isMaxReached && (
            <p className="pio-text-xs pio-text-fg-muted">
              {t('encrypted.retries_left', { count: retriesLeft })}
            </p>
          )}
        </div>

        {/* 确认按钮 */}
        <button
          onClick={handleSubmit}
          disabled={isMaxReached || !password.trim()}
          className="pio-w-full pio-py-2 pio-text-sm pio-font-medium pio-rounded-md pio-bg-fg-primary pio-text-fg-inverse pio-transition-colors hover:pio-opacity-90 disabled:pio-opacity-40 disabled:pio-cursor-not-allowed"
        >
          {isMaxReached ? t('encrypted.max_attempts') : t('encrypted.confirm')}
        </button>
      </div>
    </div>
  );
}
