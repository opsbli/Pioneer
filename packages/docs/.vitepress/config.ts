import { defineConfig } from 'vitepress'

// 环境检测：开发环境和生产环境的 URL
const isDev = process.env.NODE_ENV !== 'production'
const REACT_EXAMPLE_URL = isDev
  ? 'http://localhost:4800/'
  : 'https://opsbli.github.io/Pioneer/'
const VUE_EXAMPLE_URL = isDev
  ? 'http://localhost:4802/'
  : 'https://opsbli.github.io/Pioneer/vue/'

const base = '/Pioneer/docs/'

export default defineConfig({
  title: 'Pioneer Preview',
  description: 'A modern, feature-rich file preview component for React & Vue 3',
  base,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}icon.svg` }],
  ],

  vite: {
    server: {
      port: 4801,
      strictPort: true,
    },
  },

  themeConfig: {
    logo: '/icon.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/components' },
      {
        text: '在线示例',
        items: [
          { text: 'React 版本', link: REACT_EXAMPLE_URL, target: '_blank' },
          { text: 'Vue 3 版本', link: VUE_EXAMPLE_URL, target: '_blank' },
        ],
      },
      {
        text: '框架',
        items: [
          { text: 'React (@opsbli/react)', link: 'https://www.npmjs.com/package/@opsbli/react', target: '_blank' },
          { text: 'Vue 3 (@opsbli/vue)', link: 'https://www.npmjs.com/package/@opsbli/vue', target: '_blank' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
            { text: '基础用法', link: '/guide/basic-usage' }
          ]
        },
        {
          text: '功能',
          items: [
            { text: '支持的文件类型', link: '/guide/supported-types' },
            { text: '自定义渲染器', link: '/guide/custom-renderers' },
            { text: '鉴权与自定义请求', link: '/guide/authentication' },
            { text: '国际化 (i18n)', link: '/guide/i18n' },
            { text: '主题定制', link: '/guide/theming' },
            { text: '性能核心：缓存与流式加载', link: '/guide/performance' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '组件', link: '/api/components' },
            { text: '类型定义', link: '/api/types' },
            { text: '工具函数', link: '/api/utils' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/opsbli/Pioneer' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-2026 <a href="https://github.com/opsbli/Pioneer" target="_blank">opsbli</a>'
    },

    search: {
      provider: 'local'
    }
  }
})
