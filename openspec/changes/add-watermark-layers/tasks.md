# Tasks: add-watermark-layers

## Phase 1: Core（类型 + 归一化工具）

- [x] `packages/core/src/types.ts`：新增 `WatermarkLayer` 接口；`WatermarkConfig` 增加 `layers?: WatermarkLayer[]`（注释说明 layers 优先于 mode）
- [x] 新增 `packages/core/src/utils/watermark.ts`：`resolveWatermarkLayers(config, theme)` 归一化函数
  - 无 `layers` 时由 `mode` + 顶层字段合成单层
  - `layers` 存在时逐层归一化默认值；无效层（text 无 text / image 无 imageUrl）过滤
  - 导出 `ResolvedWatermarkLayer` 类型（含 `colorExplicit`：用户是否显式配色，供浅色区域自适应判断）
- [x] `packages/core/src/index.ts`：re-export `WatermarkLayer`、`ResolvedWatermarkLayer`、`resolveWatermarkLayers`

## Phase 2: React 渲染器

- [x] `packages/react/src/components/WatermarkOverlay.tsx`：重构为多层绘制
  - `imgRef` 改为 `Map<number, HTMLImageElement>`（key = layerIndex），多图片层独立预加载，加载完成/失败触发整体重绘
  - `drawWatermark` 遍历 `resolveWatermarkLayers(config, theme)` 逐层绘制（复用现有 center/diagonal/tile 布局算法）
  - 浅色内容自适应（`isLightContentAt`）逐层独立判断（仅未显式配色的文字层）
  - `config.zIndex` 仍控制 Canvas 整体层级
- [x] 验证：`pnpm build:lib:react` 通过

## Phase 3: Vue 渲染器（与 React 对齐）

- [x] `packages/vue/src/components/WatermarkOverlay.vue`：与 React 1:1 对齐重构
  - 同一 `resolveWatermarkLayers`（core 共享，无框架差异）
  - 多图片层缓存、逐层绘制、主题/浅色自适应逻辑与 React 行为一致
- [x] 验证：`pnpm build:lib:vue` 通过

## Phase 4: 示例

- [x] `packages/example/src/App.tsx`：水印配置面板支持添加多个层（选择 type、配置该层 text/imageUrl/color/opacity/rotation/spacing/position），实时预览多层叠加
- [x] `packages/vue-example/src/App.vue`：与 React 示例对齐
- [x] 验证：`tsc` / `vue-tsc` 类型检查通过（vite build 因 vite-plugin-static-copy 在 Windows 的既有问题失败，与本次改动无关，已用 stash 验证）

## Phase 5: 文档

- [x] `packages/react/README.md` / `README.zh-CN.md`：水印章节补充 `layers` API 与组合示例（en 侧新增 Watermark 小节）
- [x] `packages/vue/README.md` / `README.zh-CN.md`：同上
- [x] `packages/docs`：无水印独立文档，无需改动（已确认）

## Phase 6: 验证与收尾

- [x] `pnpm test` 通过（6/6，core 契约测试）
- [x] `pnpm build:lib && pnpm size` 通过（无新增依赖，主入口 293 B / 306 B，全量 2.13 MB，CSS ≤ 29 kB，均低于限额）
- [ ] 双主题目测：多层水印在 dark/light 下均可见，文字层浅色区域自适应正常（需浏览器环境，本环境未执行）
- [x] 回归：旧 `mode` 单层写法渲染与改造前一致（`resolveWatermarkLayers` 合成单层，运行时验证通过）
