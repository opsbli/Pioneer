## Why

项目已具备 17+ 文件类型预览、双框架（React/Vue）同构、国际化、主题、自定义渲染器等核心能力。但对照企业级文档预览产品（Google Drive、Office Online、金山文档、语雀、腾讯文档等），当前存在三个高优先级安全与体验缺口：

1. **水印缺失**：企业场景下文档预览的截图外泄是安全事件常见源头。当前完全无水印能力，无法通过配置在预览区域叠加文字或图片水印，更无法注入用户信息/时间戳等动态内容。
2. **加密文件不支持**：加密 PDF 是办公场景高频文件类型。当前 PDF.js 加载加密 PDF 时直接走 `RenderingCancelledException` 或静默失败，无密码输入交互。XLSX/PPTX/DOCX 的 OpenXML 加密同理未覆盖。
3. **全文搜索缺失**：长文档（PDF 数十页、Markdown 数百行、代码文件）无搜索能力，用户无法 Ctrl+F 定位关键词，严重影响使用效率。

这三个功能属于企业级文档预览的"标配"能力，缺失直接限制项目在 B 端场景的落地。

## What Changes

### 功能 1：水印（Watermark）

- 在 `core` 新增 `WatermarkConfig` 类型，支持文字水印和图片水印两种模式
- 水印配置作为顶层 prop 注入 `PioneerContent`，通过 Context 向下传递至各渲染器
- 水印层以绝对定位 Canvas 叠加在预览内容之上，`pointer-events: none` 保证不干扰交互
- 支持配置项：文字内容/图片 URL、颜色、透明度、字号、旋转角度、间距、方向（平铺/居中/对角）、是否跟随滚动
- 水印层在所有渲染器之上统一渲染（非各渲染器各自实现），保证跨文件类型行为一致
- React 与 Vue 两端 API 同构

### 功能 2：加密文件（Encrypted File）

- 新增密码输入弹窗组件（React: `EncryptedPasswordModal`，Vue: `EncryptedPasswordModal.vue`），在检测到加密文件时自动弹出
- PDF 加密处理：通过 PDF.js 的 `PasswordResponses` 机制，将用户输入密码传入 `getDocument({ password })` 后重试加载；错误密码则提示并允许重新输入，上限 3 次后提示失败
- 文件级 `password` prop：允许宿主直接传入已知密码，跳过弹窗
- 密码错误/超限有明确错误提示，通过 `onError` 回调通知宿主
- DOCX/XLSX/PPTX 加密暂不支持（OpenXML 加密解密在前端缺乏成熟库），命中时展示"文件受密码保护"提示

### 功能 3：全文搜索（Full-text Search）

- 新增搜索面板组件（React: `SearchPanel`，Vue: `SearchPanel.vue`），固定在预览容器顶部，支持 Ctrl+F 快捷键唤起
- 搜索范围：PDF（基于 pdfjs TextLayer 文本提取）、纯文本/代码/JSON/XML/Markdown（直接文本匹配）、DOCX（解析后文本匹配）
- 搜索交互：输入框 + 上/下翻页 + 匹配计数 + 大小写敏感切换 + 关闭按钮
- 搜索结果高亮：PDF 通过 TextLayer 高亮、文本类通过 DOM 标记高亮
- 未支持搜索的文件类型（图片、视频、音频、CAD、字体等）不显示搜索入口
- 搜索面板状态通过 `RendererHandle` 扩展统一暴露，与工具栏同模式集成

## Capabilities

### New Capabilities
- `watermark`: 预览区域水印覆盖能力，支持文字/图片两种模式、平铺/居中布局、动态内容注入；覆盖 React 与 Vue 两端等价行为
- `encrypted-file`: 加密 PDF 文件密码交互能力，支持自动检测、弹窗输入、重试与错误提示、宿主直接传入密码；覆盖 React 与 Vue 两端
- `fulltext-search`: 全文搜索能力，支持 Ctrl+F 唤起、关键词高亮、翻页导航、匹配计数；覆盖 PDF 与文本类文件

### Modified Capabilities
- 无既有能力需要修改。水印、加密、搜索均为纯加法，不改变现有渲染器行为

## Impact

- 代码：
  - `core/src/types.ts`：新增 `WatermarkConfig`、`WatermarkMode`、`WatermarkPosition` 等类型
  - `core/src/index.ts`：re-export 新类型
  - `react`：新增 `WatermarkOverlay` 组件、`EncryptedPasswordModal` 组件、`SearchPanel` 组件；`PioneerContent` / `Modal` / `Embed` 接入新 prop；`PdfRenderer` 扩展搜索与密码能力；i18n 新增对应翻译
  - `vue`：对应 Vue 版本组件；`PioneerContent.vue` / `Modal` / `Embed` 接入；`Pdf/index.vue` 扩展；i18n 同步
  - 新增 CSS 样式：水印 Canvas 样式、密码弹窗样式、搜索面板样式（各框架独立维护，使用各自 prefix 规范 pio- / pio-）
- API：`PioneerContent` / `PioneerModal` / `PioneerEmbed` 新增可选 prop：`watermark`（WatermarkConfig）、`password`（string）；搜索通过 Ctrl+F 全局快捷键触发，无需 prop
- 依赖：**无新增依赖**。水印用原生 Canvas、加密用 pdfjs-dist 已有 `PasswordResponses`、搜索用原生文本匹配 + PDF TextLayer
- 文档：README 需追加水印、加密文件、搜索三个章节的 API 说明与示例