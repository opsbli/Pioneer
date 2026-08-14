import React from 'react';
import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import type { ToolbarGroup } from '../../renderers/toolbar.types';
import type { Translator } from '@pioneer/core';
import { renderToolbarItems } from '../../toolbar/renderItems';

export interface PioneerToolbarProps {
  fileName: string;
  currentIndex: number;
  totalFiles: number;
  toolGroups: ToolbarGroup[];
  t: Translator;
  onDownload: () => void;
  onClose?: () => void;
  showClose: boolean;
  showDownload: boolean;
}

/**
 * 文件预览顶部工具栏组件
 * - 桌面端：单行显示所有按钮
 * - 移动端：第一行显示文件名 + 下载/关闭，第二行显示工具按钮
 */
export const PioneerToolbar: React.FC<PioneerToolbarProps> = ({
  fileName,
  currentIndex,
  totalFiles,
  toolGroups,
  t,
  onDownload,
  onClose,
  showClose,
  showDownload,
}) => {
  const showCloseButton = showClose;

  // 操作组：下载、关闭（通用，不属于任何 Renderer）
  const actionGroups: ToolbarGroup[] = [
    ...(showDownload
      ? [
          {
            items: [
              {
                type: 'button' as const,
                icon: <Download className="pio-w-4 pio-h-4" />,
                tooltip: t('accessibility.downloadFile'),
                action: onDownload,
              },
            ],
          },
        ]
      : []),
    ...(showCloseButton
      ? [
          {
            items: [
              {
                type: 'button' as const,
                icon: <X className="pio-w-4 pio-h-4" />,
                tooltip: t('accessibility.closePreview'),
                action: onClose!,
                ariaKeyshortcuts: 'Escape',
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pio-flex-shrink-0 pio-z-10 pio-backdrop-blur-md pio-border-b pio-bg-surface-toolbar pio-border-line"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* 第一行：文件名 + 分页 + 关闭/下载（移动端右侧）/全部按钮（桌面端） */}
      <div className="pio-flex pio-items-center pio-justify-between pio-px-3 md:pio-px-5 pio-py-1.5 md:pio-py-2.5">
        {/* 左侧：文件名 + 分页 */}
        <div className="pio-flex pio-items-center pio-flex-1 pio-min-w-0 pio-mr-2 md:pio-mr-3">
          <h2 className="pio-font-medium pio-text-xs md:pio-text-sm pio-truncate pio-text-fg-primary">
            {fileName}
          </h2>
          <span
            className="pio-text-xs pio-ml-2 pio-flex-shrink-0 pio-text-fg-muted"
            aria-live="polite"
            aria-atomic="true"
          >
            {currentIndex + 1}/{totalFiles}
          </span>
        </div>

        {/* 移动端：仅显示下载 + 关闭 */}
        <div className="pio-flex pio-items-center pio-gap-1 md:pio-hidden pio-flex-shrink-0">
          {renderToolbarItems(actionGroups, 'pio-mx-0.5')}
        </div>

        {/* 桌面端：所有工具按钮 */}
        <div className="pio-hidden md:pio-flex pio-items-center pio-gap-1 pio-flex-shrink-0">
          {renderToolbarItems(toolGroups, 'pio-mx-1')}
          {toolGroups.length > 0 && actionGroups.length > 0 && (
            <div className="pio-w-px pio-h-4 pio-mx-1 pio-bg-divide" />
          )}
          {renderToolbarItems(actionGroups, 'pio-mx-1')}
        </div>
      </div>

      {/* 第二行：移动端工具按钮 */}
      {toolGroups.length > 0 && (
        <div className="pio-flex pio-items-center pio-gap-1 pio-px-3 pio-pb-1.5 pio-overflow-x-auto scrollbar-hide md:pio-hidden">
          {renderToolbarItems(toolGroups, 'pio-mx-0.5')}
        </div>
      )}
    </motion.div>
  );
};
