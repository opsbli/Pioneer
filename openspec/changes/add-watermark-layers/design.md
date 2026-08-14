# 水印多层叠加（layers）设计

## 1. 类型设计（core）

```ts
// types.ts 新增
export interface WatermarkLayer {
  /** 层类型：文字 或 图片 */
  type: WatermarkMode;                 // 'text' | 'image'
  /** 文字层内容（type='text' 时必填），支持 {username} {time} 占位符 */
  text?: string;
  /** 图片层 URL（type='image' 时必填） */
  imageUrl?: string;
  /** 文字字体，默认 '14px sans-serif' */
  font?: string;
  /** 文字颜色，默认主题自适应（dark 白 / light 黑） */
  color?: string;
  /** 图片单元尺寸 [宽, 高]，默认 [80, 80] */
  imageSize?: [number, number];
  /** 透明度 0-1，默认 0.15 */
  opacity?: number;
  /** 旋转角度（度），默认 -30 */
  rotation?: number;
  /** 水平/垂直间距 [x, y]（px），默认 [200, 150] */
  spacing?: [number, number];
  /** 布局方式，默认 'tile' */
  position?: WatermarkPosition;        // 'tile' | 'center' | 'diagonal'
}

// WatermarkConfig 扩展（向后兼容，纯加法）
export interface WatermarkConfig {
  mode: WatermarkMode;                 // 保留：兼容单层写法（layers 优先）
  layers?: WatermarkLayer[];           // 新增：多层叠加；传入时忽略 mode 单层语义
  // 以下既有顶层字段保留（mode 单层写法时生效）：
  text?: string;
  font?: string;
  color?: string;
  imageUrl?: string;
  imageSize?: [number, number];
  opacity?: number;
  rotation?: number;
  spacing?: [number, number];
  position?: WatermarkPosition;
  zIndex?: number;                     // 整个水印 Canvas 的层级（兼容保留）
}
```

**层间顺序语义**：`layers` 数组顺序 = 绘制顺序，后绘制的层叠放于上方。不提供层内 `zIndex`（同一 Canvas 内层序由数组顺序天然决定，避免过度设计）。Canvas 整体 `zIndex` 仍由 `WatermarkConfig.zIndex` 控制（默认 800），与现状一致。

## 2. 归一化工具（core，双框架共享）

新增 `packages/core/src/utils/watermark.ts`：

```ts
export interface ResolvedWatermarkLayer extends Required<Pick<WatermarkLayer, 'font' | 'color' | 'opacity' | 'rotation' | 'spacing' | 'position' | 'imageSize'>> {
  type: WatermarkMode;
  text?: string;
  imageUrl?: string;
}

/** 兼容归一化：无 layers 时由 mode + 顶层字段合成单层；color 默认主题自适应 */
export function resolveWatermarkLayers(config: WatermarkConfig, theme: 'dark' | 'light'): ResolvedWatermarkLayer[];
```

- `config.layers` 存在且非空 → 逐层归一化；否则 `[{ type: config.mode, text: config.text, imageUrl: config.imageUrl, ...顶层字段 }]`
- 无效层（`type='text'` 无 `text`、`type='image'` 无 `imageUrl`）在归一化时过滤掉（与现状"分支不绘制"行为一致）
- 每层默认值独立解析（不同层可有不同 opacity/rotation/position）

## 3. 渲染重构（React `WatermarkOverlay.tsx` / Vue `WatermarkOverlay.vue`）

保持单 Canvas + `pointer-events: none` 架构，`drawWatermark` 改为遍历归一化后的 layers 逐层绘制：

```
drawWatermark():
  layers = resolveWatermarkLayers(config, theme)
  clearRect
  for layer in layers:
    if layer.type == 'image' 且图片已加载（layerIndex → Image 缓存）:
      按 layer.position 布局循环 drawImage（center/diagonal/tile 三布局复用现有算法）
    else if layer.type == 'text' 且有 text:
      按 layer.position 布局循环 fillText
      // 浅色内容区域自适应（isLightContentAt）仅在该层未显式配置 color 时启用
  // 每层独立 ctx.save()/ctx.globalAlpha/ctx.rotate，绘制完 restore
```

关键点：

- **图片预加载**：`imgRef` 从单个 `HTMLImageElement` 改为 `Map<number, HTMLImageElement>`（key = layerIndex）；所有图片加载完成（含失败跳过）后触发统一重绘；`config.imageUrl` 变化时失效对应缓存并重新加载
- **重绘触发**（复用现有机制）：容器 ResizeObserver / MutationObserver（防抖 200ms）/ 500ms 兜底轮询 / config 变化 / 图片 onload
- **浅色区域自适应**：现有 `isLightContentAt` 逻辑按层保留——仅当该层未显式传 `color` 时，该层文字 tile 落在浅色内容区（xlsx 白底 / docx 白纸）用黑色，其余用主题默认色；显式传色的层不做区域覆盖（与现状语义一致，逐层独立判断）
- **主题切换**：`theme` 变化时 `resolveWatermarkLayers` 重新计算默认色并重绘（现有 `resolved` 已依赖 theme，保持响应式）
- **placeholder**：`{username}` / `{time}` 替换逻辑（如现有实现位于渲染器则逐层复用；如位于配置注入层则归一化前处理一次即可——实现时以现状为准，保持每层独立支持）

## 4. 示例与文档

- `packages/example/src/App.tsx` / `packages/vue-example/src/App.vue`：水印配置面板支持"添加层"（选择类型 text/image、配置该层内容/颜色/透明度/旋转/间距/position），展示多层叠加效果；面板内区分"全局配置（zIndex）"与"层配置"
- README（react/vue × 中英）× 4 + docs 水印章节：补充 `layers` API 说明与"Logo 图片 + 用户名时间戳文字"组合示例

## 5. 边界与兼容

| 场景 | 行为 |
|---|---|
| `{ mode: 'text', text: '机密' }`（旧写法） | 等价 `layers: [{ type: 'text', text: '机密' }]`，渲染完全一致 |
| `{ mode: 'image', imageUrl }`（旧写法） | 等价单图片层，渲染完全一致 |
| `layers` 与 `mode` 同时传 | `layers` 优先，忽略顶层单层字段 |
| 空数组 `layers: []` | 不绘制任何水印 |
| 图片层加载失败 | 该层跳过，其余层正常绘制（现状行为） |
| 深层嵌套 ZIP 混合背景 | 每层文字独立做浅色区域自适应 |

## 6. 非目标

- 不支持图层混合模式（multiply/screen 等）
- 不支持层内动画
- 不改变 `WatermarkOverlay` 之外的组件与 API
