## 1. Core 类型定义（共享）

- [ ] 1.1 在 `packages/core/src/types.ts` 新增水印相关类型：
  - `WatermarkMode: 'text' | 'image'`
  - `WatermarkPosition: 'tile' | 'center' | 'diagonal'`
  - `WatermarkConfig` 接口（详见 design.md 决策 3）
- [ ] 1.2 在 `packages/core/src/types.ts` 新增搜索相关类型：
  - `SearchOptions: { caseSensitive?: boolean; allPages?: boolean }`
  - `SearchResult: { total: number; current: number; matches: number[] }`
- [ ] 1.3 在 `packages/core/src/types.ts` 新增加密文件相关类型：
  - `EncryptedFileState: { needsPassword: boolean; error?: string; retries: number }`
- [ ] 1.4 在 `packages/core/src/index.ts` re-export 所有新增类型

## 2. i18n 国际化

- [ ] 2.1 在 `packages/core/src/i18n/messages/zh-CN.ts` 添加水印/加密/搜索相关翻译键
- [ ] 2.2 在 `packages/core/src/i18n/messages/en-US.ts` 添加对应英文翻译
- [ ] 2.3 更新 `packages/core/src/i18n/types.ts` 的 `MessageKey` 联合类型，加入新键

## 3. React 水印功能

- [ ] 3.1 创建 `packages/react/src/components/WatermarkOverlay.tsx`：
  - Canvas 水印渲染组件
  - 接收 `WatermarkConfig` prop
  - 使用 `useRef` + `useEffect` 管理 Canvas 绘制
  - 使用 `ResizeObserver` 监听容器尺寸变化并重绘
  - 支持文字模式（Canvas `fillText`）和图片模式（`drawImage`）
  - `pointer-events: none` 确保不干扰交互
- [ ] 3.2 在 `PioneerContentProps` 新增 `watermark?: WatermarkConfig` prop
- [ ] 3.3 在 `PioneerContent.tsx` 内容区容器内渲染 `<WatermarkOverlay>`（仅当 `watermark` 存在时）
- [ ] 3.4 在 `PioneerModal.tsx` 和 `PioneerEmbed.tsx` 透传 `watermark` prop
- [ ] 3.5 新增水印相关 CSS 样式（使用 `pio-` prefix）

## 4. Vue 水印功能

- [ ] 4.1 创建 `packages/vue/src/components/WatermarkOverlay.vue`：
  - Canvas 水印渲染组件（与 React 端逻辑等价）
  - `defineProps` 接收 `WatermarkConfig`
  - `onMounted` + `ResizeObserver` 管理 Canvas 绘制
  - 支持文字和图片模式
- [ ] 4.2 在 `PioneerContent.vue` props 新增 `watermark?: WatermarkConfig`
- [ ] 4.3 在内容区渲染 `<WatermarkOverlay v-if="watermark">`
- [ ] 4.4 在 `PioneerModal.vue` 和 `PioneerEmbed.vue` 透传 `watermark`
- [ ] 4.5 新增水印相关 CSS 样式（使用 `pio-` prefix）

## 5. React 加密文件功能

- [ ] 5.1 创建 `packages/react/src/components/EncryptedPasswordModal.tsx`：
  - 弹窗 UI：标题 + 密码输入框 + 确认按钮 + 错误提示 + 重试计数
  - 显示在预览容器内（非全屏覆盖），居中定位
  - 密码输入使用 `type="password"`
- [ ] 5.2 在 `PdfRenderer`（`renderers/Pdf/index.tsx`）中接入 pdfjs `PasswordResponses` 机制：
  - 加载时检测 `PasswordException`
  - 抛出 `needsPassword` 事件到父组件
  - 接收密码后通过 `getDocument({ url, password })` 重新加载
  - 错误密码重试计数，上限 3 次
- [ ] 5.3 在 `PioneerContentProps` 新增 `password?: string` prop
- [ ] 5.4 在 `PioneerContent.tsx` 中管理密码弹窗状态：
  - `passwordModalOpen` / `passwordError` / `retryCount` state
  - 当 `password` prop 传入时直接传给 PdfRenderer，跳过弹窗
- [ ] 5.5 在 `PioneerModal.tsx` 和 `PioneerEmbed.tsx` 透传 `password` prop
- [ ] 5.6 PDF 加载器在 `getDocument` 调用中传入密码参数
- [ ] 5.7 在 `loaders/registry.ts` 或 `pdfWorker.ts` 中处理 `PasswordResponses` 事件

## 6. Vue 加密文件功能

- [ ] 6.1 创建 `packages/vue/src/components/EncryptedPasswordModal.vue`（与 React 端等价）
- [ ] 6.2 在 `renderers/Pdf/index.vue` 中接入 pdfjs `PasswordResponses`（与 React 端逻辑等价）
- [ ] 6.3 在 `PioneerContent.vue` props 新增 `password?: string`
- [ ] 6.4 管理密码弹窗状态（`ref`），接入 PdfRenderer 事件
- [ ] 6.5 在 `PioneerModal.vue` 和 `PioneerEmbed.vue` 透传 `password`

## 7. React 全文搜索功能

- [ ] 7.1 创建 `packages/react/src/components/SearchPanel.tsx`：
  - 搜索面板 UI：输入框 + 上/下翻页按钮 + 匹配计数 + 大小写切换 + 关闭按钮
  - 固定在工具栏下方，搜索激活时展开
  - 使用 `useState` 管理搜索状态
- [ ] 7.2 扩展 `RendererHandle` 接口（`renderers/base.types.ts`）：
  - `canSearch?: () => boolean`
  - `search?: (query: string, options?: SearchOptions) => SearchResult`
  - `goToNextMatch?: () => void`
  - `goToPrevMatch?: () => void`
  - `clearSearch?: () => void`
- [ ] 7.3 在 `PdfRenderer` 中实现搜索：
  - 通过 pdfjs `page.getTextContent()` 提取文本
  - 关键词匹配 + 结果定位
  - 高亮匹配区域（通过 TextLayer 或 Canvas overlay）
  - 翻页到上一个/下一个匹配
- [ ] 7.4 在文本类渲染器（Text/Json/Xml/Markdown）中实现搜索：
  - DOM 文本搜索 + 高亮 `<mark>` 标签
  - 翻页到下一个匹配
- [ ] 7.5 在 `useKeyboardNavigation` 中增加 Ctrl+F 快捷键：
  - Ctrl+F → 唤起搜索面板
  - Esc → 优先关闭搜索面板，再关闭预览
  - ↑/↓ → 搜索面板打开时翻页匹配
- [ ] 7.6 在 `PioneerContent.tsx` 中管理搜索面板状态：
  - `searchOpen` / `searchQuery` / `searchResults` state
  - 通过 ref 调用渲染器的 `search` / `goToNextMatch` 等方法
  - 搜索面板仅在 `renderer.canSearch()` 为 true 时显示

## 8. Vue 全文搜索功能

- [ ] 8.1 创建 `packages/vue/src/components/SearchPanel.vue`（与 React 端等价）
- [ ] 8.2 扩展 `renderers/base.types.ts`（Vue 端）：与 React 端相同的搜索方法声明
- [ ] 8.3 在 `renderers/Pdf/index.vue` 中实现搜索（与 React 端等价）
- [ ] 8.4 在文本类渲染器（Text/Json/Xml/Markdown）中实现搜索
- [ ] 8.5 在 `PioneerContent.vue` 的 `handleKeyDown` 中增加 Ctrl+F 快捷键
- [ ] 8.6 管理搜索面板状态（`ref` + `computed`），接入渲染器搜索方法

## 9. 工具栏集成

- [ ] 9.1 在支持搜索的渲染器中，通过 `getToolbarGroups` 暴露搜索按钮（放大镜图标）
- [ ] 9.2 搜索面板展开时，工具栏搜索按钮显示 active 状态

## 10. 构建与类型检查

- [ ] 10.1 执行 `pnpm build:lib` 确保 core / react / vue 全部通过
- [ ] 10.2 确认 tsc 无类型错误，d.ts 正确生成

## 11. 示例自检

- [ ] 11.1 水印：在 example 中配置水印（文字 + 图片各一个），验证各文件类型均叠加水印
- [ ] 11.2 加密文件：准备一个加密 PDF，验证弹窗弹出、密码正确加载、密码错误提示、超限阻止
- [ ] 11.3 搜索：打开一个多页 PDF，Ctrl+F 搜索关键词，验证高亮和翻页
- [ ] 11.4 向后兼容：不传 watermark/password、不使用搜索时，行为与当前主干完全一致