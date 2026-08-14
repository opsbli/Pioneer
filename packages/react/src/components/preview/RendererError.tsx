import React from 'react';
import { AlertCircle, Download, RotateCw } from 'lucide-react';
import type { Translator } from '@pioneer/core';

export interface RendererErrorProps {
  error: Error;
  fileName: string;
  t: Translator;
  onRetry: () => void;
  onDownload: () => void;
}

/**
 * 渲染器错误 UI 组件
 * 显示错误信息、文件名、重试和下载按钮
 */
export const RendererError: React.FC<RendererErrorProps> = ({
  error,
  fileName,
  t,
  onRetry,
  onDownload,
}) => {
  return (
    <div className="pio-flex pio-flex-col pio-items-center pio-justify-center pio-h-full pio-px-4 pio-text-fg-primary">
      <AlertCircle className="pio-w-16 pio-h-16 pio-mb-4 pio-text-error" />
      <h3 className="pio-text-lg pio-font-semibold pio-mb-2">
        {t('common.unknown_error')}
      </h3>
      <p className="pio-text-sm pio-text-fg-secondary pio-mb-1 pio-max-w-md pio-text-center">
        {error.message}
      </p>
      <p className="pio-text-xs pio-text-fg-tertiary pio-mb-6 pio-max-w-md pio-text-center">
        {fileName}
      </p>
      <div className="pio-flex pio-gap-3">
        <button
          onClick={onRetry}
          aria-label={t('common.retry')}
          className="pio-flex pio-items-center pio-gap-2 pio-px-4 pio-py-2 pio-bg-surface-2 hover:pio-bg-surface-3 pio-rounded-md pio-text-sm pio-font-medium pio-transition-colors"
        >
          <RotateCw className="pio-w-4 pio-h-4" />
          {t('common.retry')}
        </button>
        <button
          onClick={onDownload}
          aria-label={t('accessibility.downloadFile')}
          className="pio-flex pio-items-center pio-gap-2 pio-px-4 pio-py-2 pio-bg-surface-2 hover:pio-bg-surface-3 pio-rounded-md pio-text-sm pio-font-medium pio-transition-colors"
        >
          <Download className="pio-w-4 pio-h-4" />
          {t('common.download')}
        </button>
      </div>
    </div>
  );
};
