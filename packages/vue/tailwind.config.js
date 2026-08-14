/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'pio-',
  important: '.pio-root',
  corePlugins: {
    preflight: false,
  },
  content: [
    './src/**/*.{js,ts,vue}',
  ],
  theme: {
    extend: {
      // 语义化颜色 token：renderer 必须用这些类（如 pio-text-fg-primary、pio-bg-surface-1）
      // 真实颜色由 src/index.css 中的 CSS 变量（--pio-*）按 data-theme 切换
      colors: {
        'fg-primary':         'var(--pio-fg-primary)',
        'fg-secondary':       'var(--pio-fg-secondary)',
        'fg-tertiary':        'var(--pio-fg-tertiary)',
        'fg-muted':           'var(--pio-fg-muted)',
        'fg-disabled':        'var(--pio-fg-disabled)',
        'fg-inverse':         'var(--pio-fg-inverse)',
        'surface-1':          'var(--pio-surface-1)',
        'surface-2':          'var(--pio-surface-2)',
        'surface-3':          'var(--pio-surface-3)',
        'surface-toolbar':    'var(--pio-surface-toolbar)',
        'surface-overlay':    'var(--pio-surface-overlay)',
        'surface-nav':        'var(--pio-surface-nav)',
        'surface-nav-hover':  'var(--pio-surface-nav-hover)',
        'line-weak':          'var(--pio-line-weak)',
        'line':               'var(--pio-line)',
        'line-strong':        'var(--pio-line-strong)',
        'divide':             'var(--pio-divide)',
        'accent':             'var(--pio-accent)',
        'accent-hover':       'var(--pio-accent-hover)',
        'accent-soft':        'var(--pio-accent-soft)',
        'code-bg':            'var(--pio-code-bg)',
        'code-fg':            'var(--pio-code-fg)',
        'code-header':        'var(--pio-code-header)',
        'media-bg':           'var(--pio-media-bg)',
        'spinner-track':      'var(--pio-spinner-track)',
        'spinner-head':       'var(--pio-spinner-head)',
      },
    },
  },
  plugins: [],
};
