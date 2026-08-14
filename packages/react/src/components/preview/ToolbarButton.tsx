import React from 'react';

export interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** 激活状态：true 时按钮显示高亮样式 */
  active?: boolean;
  ariaKeyshortcuts?: string;
}

/**
 * 工具栏按钮组件
 * 支持 tooltip、disabled 状态、active 高亮和 aria 属性
 */
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  disabled,
  active,
  ariaKeyshortcuts,
}) => {
  let stateClass: string;
  if (disabled) {
    stateClass = 'pio-text-fg-disabled pio-cursor-not-allowed';
  } else if (active) {
    stateClass = 'pio-text-fg-primary pio-bg-surface-3 hover:pio-bg-surface-3 active:pio-bg-surface-3';
  } else {
    stateClass = 'pio-text-fg-primary hover:pio-bg-surface-2 active:pio-bg-surface-3';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      aria-keyshortcuts={ariaKeyshortcuts}
      aria-disabled={disabled}
      className={`pio-relative pio-group pio-p-2 md:pio-p-1.5 pio-rounded-md pio-transition-all pio-select-none ${stateClass}`}
    >
      {icon}
      <span className="pio-absolute pio-left-1/2 -pio-translate-x-1/2 pio-top-full pio-mt-1.5 pio-px-2 pio-py-1 pio-text-xs pio-rounded pio-whitespace-nowrap pio-pointer-events-none pio-opacity-0 pio-invisible group-hover:pio-opacity-100 group-hover:pio-visible pio-transition-opacity pio-duration-200 pio-z-50 pio-bg-fg-primary pio-text-fg-inverse max-[1023px]:!pio-hidden">
        <span className="pio-absolute pio-left-1/2 -pio-translate-x-1/2 -pio-top-1 pio-w-2 pio-h-2 pio-rotate-45 pio-bg-fg-primary" />
        <span className="pio-relative">{label}</span>
      </span>
    </button>
  );
};
