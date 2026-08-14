## Context

`Pioneer` 以 core（纯逻辑/工具）+ React / Vue 两个 UI 适配包组织。`PioneerContent`（两端）负责装配"工具栏 + 内容区 + 导航箭头 + 水印层"。三个新功能的共性约束：

- 水印层位于内容区之上、导航箭头之外，`pointer-events: none`，需覆盖所有渲染器类型。
- 加密文件处理集中在 PDF 渲染器内（pdfjs-dist 原生支持 `PasswordResponses`），其他 Office 格式暂不支持。
- 搜索面板需与工具栏共存，Ctrl+F 快捷键需与现有键盘导航（←/→/Esc）协调。
- 三个功能均需 React 与 Vue 两端同构实现。

现状约束：
- React：水印/搜索/密码组件全新创建，无既有组件可复用。
- Vue：同理。
- 当前 PDF 渲染器已用 `forwardRef` + `useImperativeHandle` 暴露 `getToolbarGroups` / `onToolbarChange`，搜索与密码相关工具栏按钮可复用此机制。
- 键盘事件当前在 `useKeyboardNavigation`（React）和 `handleKeyDown`（Vue）中处理，搜索快捷键需在此扩展。

利益相关：
- 组件库用户：希望通过简单 prop 配置水印和密码，通过 Ctrl+F 使用搜索。
- 组件库内部：三个功能必须两端同构，CSS 使用各自 prefix（pio- / pio-）。

## Goals / Non-Goals

**Goals:**
- 水印：支持文字/图片两种模式，可配置位置、颜色、透明度、旋转、间距，Canvas 渲染保证性能。
- 加密文件：自动检测 PDF 加密并弹出密码输入框；支持宿主直接传入密码；错误密码重试上限 3 次。
- 全文搜索：Ctrl+F 唤起搜索面板；支持 PDF + 文本类文件搜索与高亮；匹配计数与翻页。
- 三个功能均为纯加法，向后兼容，不破坏现有 API。

**Non-Goals:**
- 不实现 DOCX/XLSX/PPTX 的密码解密（前端无成熟 OpenXML 解密库）。
- 不实现跨文件类型的全局搜索（如同时搜索多个文件的合并结果）。
- 不实现搜索历史的持久化。
- 不实现水印的动态刷新（如每 N 秒更新用户名），水印内容在渲染时确定。
- 不引入新依赖。

## Decisions

### 决策 1：水印层统一渲染在 PioneerContent 级别，而非各渲染器各自实现

**选项 A（采用）**：在 `PioneerContent` 的内容区容器内，绝对定位渲染一个统一的水印 Canvas 层。该层位于所有渲染器内容之上、导航箭头之外，`pointer-events: none`。水印配置通过 Context 传递。

**选项 B**：每个渲染器在自身内部渲染水印层。

**选择理由**：
- 统一层保证所有文件类型的水印行为完全一致（位置、密度、样式），避免各渲染器实现差异。
- Canvas 一次性渲染，性能优于每渲染器各画一份。
- 新增/修改水印逻辑只需改一处。
- 若采用选项 B，纯文本/代码渲染器等无 Canvas 上下文的渲染器需要额外适配。

### 决策 2：水印用 Canvas 渲染，CSS 背景图作为降级方案

**方案**：Canvas 绘制水印网格，覆盖整个内容区。Canvas 在容器 resize 时重新绘制。

**CSS 降级**：若环境不支持 Canvas（极罕见），fallback 到 CSS `background-image` + `background-repeat` 平铺 SVG 数据 URI 文字。

**选择理由**：Canvas 可精确控制旋转角度、透明度、间距，且支持图片水印。CSS 背景图无法旋转单个水印单元。

### 决策 3：水印配置作为 PioneerContent / Modal / Embed 的顶层 prop

```
watermark?: WatermarkConfig
```

`WatermarkConfig` 设计：
```ts
interface WatermarkConfig {
  mode: 'text' | 'image';
  // text 模式
  text?: string;              // 水印文字，支持 {username} {time} 占位符
  font?: string;              // 字体，默认 '14px sans-serif'
  color?: string;             // 颜色，默认 'rgba(0, 0, 0, 0.15)'
  // image 模式
  imageUrl?: string;          // 水印图片 URL
  imageSize?: [number, number]; // 宽高 [w, h]
  // 通用
  opacity?: number;           // 透明度 0-1，默认 0.15
  rotation?: number;          // 旋转角度，默认 -30
  spacing?: [number, number]; // 水平/垂直间距 [x, y]，默认 [200, 150]
  position?: 'tile' | 'center' | 'diagonal'; // 布局方式
  zIndex?: number;            // 层级，默认 5
}
```

### 决策 4：加密 PDF 通过 pdfjs-dist 的 PasswordResponses 机制

**方案**：
1. 加载 PDF 时若抛出 `PasswordException` 或 `PasswordResponses` 事件，触发密码弹窗。
2. 用户输入密码后，将密码传给 `getDocument({ url, password })` 重新加载。
3. 错误密码再次抛出异常，允许重试（最多 3 次）。
4. 超限后显示错误信息，不再允许输入。

**实现位置**：`PdfRenderer`（React: `renderers/Pdf/index.tsx`，Vue: `renderers/Pdf/index.vue`）

### 决策 5：密码弹窗作为独立组件 + PioneerContent 状态管理

- `EncryptedPasswordModal`（React）/ `EncryptedPasswordModal.vue`（Vue）：独立弹窗组件，显示在预览容器内（非全屏覆盖），包含标题、密码输入框、确认按钮、错误提示、重试计数。
- `PioneerContent` 维护 `passwordModalOpen` / `passwordError` / `retryCount` 状态。
- `password` prop：若宿主直接传入密码，跳过弹窗直接加载。

### 决策 6：搜索面板固定在预览容器顶部，位于工具栏下方

**位置**：工具栏与内容区之间，搜索激活时展开。

**交互**：
- Ctrl+F / Cmd+F 唤起（非输入框焦点时）
- Esc 关闭搜索面板
- ↑/↓ 翻页到上一个/下一个匹配
- Enter 确认搜索
- 大小写敏感切换开关

**实现**：`SearchPanel` 组件 + 各渲染器实现 `search(query, options)` 方法。

### 决策 7：搜索能力通过 RendererHandle 扩展

在 `RendererHandle` 接口中新增可选方法：

```ts
interface RendererHandle {
  getToolbarGroups: () => ToolbarGroup[];
  onToolbarChange?: (listener: () => void) => (() => void);
  // 新增：搜索能力声明
  canSearch?: () => boolean;
  search?: (query: string, options?: SearchOptions) => SearchResult | Promise<SearchResult>;
  goToNextMatch?: () => void;
  goToPrevMatch?: () => void;
  clearSearch?: () => void;
}
```

仅 PDF 和文本类渲染器实现 `canSearch: () => true`。其他类型不实现，搜索面板自动隐藏。

### 决策 8：键盘快捷键协调

现有快捷键：
- Esc → 关闭预览（modal）
- ←/→ → 切换文件

新增：
- Ctrl+F / Cmd+F → 唤起搜索面板
- Esc → 若搜索面板打开则关闭搜索面板，否则关闭预览
- ↑/↓ → 若搜索面板打开则翻页匹配，否则保持原行为（当前无 ↑/↓ 行为）
- Enter → 若焦点在搜索输入框则执行搜索

实现：在 `useKeyboardNavigation`（React）和 `handleKeyDown`（Vue）中增加搜索面板状态感知分支。

### 决策 9：i18n 新消息键

水印、密码、搜索相关翻译添加到 `zh-CN.ts` 和 `en-US.ts`：
- `watermark.text_placeholder`: 水印文字占位符说明
- `encrypted.title`: 密码弹窗标题
- `encrypted.password_placeholder`: 密码输入占位符
- `encrypted.confirm`: 确认按钮
- `encrypted.error`: 密码错误提示
- `encrypted.max_attempts`: 已达最大重试次数
- `search.placeholder`: 搜索输入占位符
- `search.no_results`: 未找到匹配
- `search.match_count`: 匹配计数 "{current}/{total}"
- `search.case_sensitive`: 大小写敏感

### 决策 10：Vue 端 ctx 注入与 React 端 Context 的等价

- React：水印配置通过 React Context 传递（新建 `WatermarkContext`），搜索与密码状态在 `PioneerContent` 内管理，通过 ref 暴露给子组件。
- Vue：水印配置通过 `provide('pioneer:watermark', config)` 注入，搜索与密码状态在 `PioneerContent.vue` 的 `ref` 中管理。

## Risks / Trade-offs

- **[风险] Canvas 水印在大量页面时性能**：Canvas 每次 resize 重绘。若水印间距小（如 50x50）且容器大（如 4K），网格单元数可达数千。→ 使用 `resizeObserver` 防抖重绘；Canvas 宽度以 `devicePixelRatio` 缩放保证清晰度。
- **[风险] 密码弹窗阻塞交互**：密码弹窗打开时内容区应显示加载态而非空白，避免用户困惑。→ 密码弹窗打开时内容区显示"等待输入密码"提示。
- **[风险] 搜索快捷键与浏览器原生 Ctrl+F 冲突**：浏览器原生 Ctrl+F 会唤起搜索框。→ 在预览容器根元素上 `e.preventDefault()` 拦截 Ctrl+F，但需在 `headless` 模式或 embed 模式聚焦时才拦截，避免影响页面其他区域。
- **[风险] PDF TextLayer 搜索性能**：大 PDF（数百页）全文搜索需逐页提取文本。→ 采用懒加载策略：仅搜索已渲染页面；未渲染页面在用户滚动到附近时再搜索。提供"搜索全部页面"选项。
- **[取舍] 不支持 DOCX/XLSX/PPTX 加密**：前端缺乏成熟 OpenXML 解密库（如 `openxml-encryption` 等不成熟或体积大）。命中加密 Office 文件时展示提示"文件受密码保护，请下载后用 Office 打开"。
- **[取舍] 搜索不支持图片/视频/CAD 等二进制格式**：这些格式无文本内容可搜索，不显示搜索入口。

## Migration Plan

- 三个功能全部为新增可选 prop / 新增组件，零破坏。
- 现有代码无需修改即可继续使用。
- 发布说明中给出三个功能的最小使用示例。
- 无需 rollback 计划。

## Open Questions

- 水印是否需要在打印时也叠加？当前不实现（打印走浏览器原生，水印 Canvas 不进入 print media）。如需实现需额外监听 `beforeprint` 事件。
- 搜索是否需要支持正则表达式？当前仅支持精确匹配。正则搜索会增加 XSS 风险与复杂度，暂不实现。
- 密码弹窗是否需要记住密码（session 级别）？当前不支持，每次打开加密文件都需输入。如需实现可在 `sessionStorage` 中缓存。