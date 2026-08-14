## Why

当前水印能力（`WatermarkConfig`）的 `mode` 字段为 `'text' | 'image'` 二选一，同一时刻只能渲染文字水印或图片水印。企业场景中常见的需求是**图片 + 文字同时叠加**：例如"公司 Logo 图片水印 + 当前用户与时间戳文字水印"（`{username}` / `{time}` 占位符）、或"图片水印 + 警示文案"的组合。当前 API 无法表达，只能二选一，限制了 B 端落地。

## What Changes

- 在 `core` 新增 `WatermarkLayer` 类型：单个水印层，可声明 `type: 'text' | 'image'` 及该层独立的配置项（内容、颜色、透明度、旋转、间距、布局、层级等）
- `WatermarkConfig` 新增 `layers?: WatermarkLayer[]`，支持任意层数叠加（文字层与图片层可混合，顺序即绘制顺序）
- **向后兼容**：既有 `mode` + 顶层字段的写法继续有效，语义等价于单层 `layers: [{ type: mode, ... }]`；`mode` 与 `layers` 同时传入时以 `layers` 为准（`layers` 优先）
- React 与 Vue 两端的 `WatermarkOverlay` 改为逐层绘制（单 Canvas 多次绘制，或按需多层），层间按数组顺序叠放，每层独立支持 `{username}` / `{time}` 占位符与主题自适应默认色
- 示例与文档同步：react/vue example 水印配置面板支持多层；README 与 docs 水印章节补充 `layers` API 说明

## Capabilities

### New Capabilities
- `watermark-layers`: 多层水印叠加能力，支持文字/图片层任意混合、逐层独立配置（内容、颜色、透明度、旋转、间距、position）、层序控制；覆盖 React 与 Vue 两端等价行为

### Modified Capabilities
- `watermark`: `WatermarkConfig` 扩展 `layers` 字段，既有 `mode` 单层写法不受影响（纯加法，向后兼容）

## Impact

- 代码：
  - `core/src/types.ts`：新增 `WatermarkLayer` 类型；`WatermarkConfig` 增加 `layers?: WatermarkLayer[]`
  - `core/src/index.ts`：re-export `WatermarkLayer`
  - `react/src/components/WatermarkOverlay.tsx`：多层绘制重构（解析 layers 为绘制队列，逐层 draw）
  - `vue/src/components/WatermarkOverlay.vue`：与 React 对齐的 Vue 版本重构
  - `packages/example/src/App.tsx` / `packages/vue-example/src/App.vue`：水印配置面板支持添加多层（文字/图片混合）
- API：`WatermarkConfig` 新增可选字段 `layers`，无破坏性变更
- 依赖：**无新增依赖**（仍使用原生 Canvas）
- 文档：react/vue README 水印章节、`docs/guide/watermark*`（如存在）补充 `layers` API 与组合示例
