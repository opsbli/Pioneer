## ADDED Requirements

### Requirement: 多层水印配置契约

系统 SHALL 允许用户通过 `WatermarkConfig.layers?: WatermarkLayer[]` 配置多个水印层。`WatermarkLayer` SHALL 包含 `type: 'text' | 'image'`，以及该层独立的 `text` / `imageUrl` / `font` / `color` / `imageSize` / `opacity` / `rotation` / `spacing` / `position` 配置；未指定的配置项 MUST 使用与单层模式相同的默认值（`font` 默认 `'14px sans-serif'`、`opacity` 默认 `0.35`、`rotation` 默认 `-30`、`spacing` 默认 `[200, 150]`、`position` 默认 `'tile'`、`imageSize` 默认 `[80, 80]`，`color` 默认随主题自适应：dark 白 / light 黑）。

#### Scenario: 文字层与图片层混合叠加
- **WHEN** 用户传入 `watermark: { layers: [{ type: 'image', imageUrl: '/logo.png' }, { type: 'text', text: '{username} {time}' }] }`
- **THEN** 预览区域 MUST 同时渲染图片水印与文字水印，文字层渲染于图片层之上，且文字层 MUST 支持 `{username}` / `{time}` 占位符替换

#### Scenario: 每层独立配置
- **WHEN** 用户传入 `watermark: { layers: [{ type: 'text', text: '机密', opacity: 0.3, rotation: 0 }, { type: 'text', text: '内部', opacity: 0.5, rotation: -45 }] }`
- **THEN** 两层 MUST 各自按自己的 `opacity` / `rotation` 渲染，互不影响

#### Scenario: 层间叠放顺序
- **WHEN** 用户传入 `layers: [A, B]`
- **THEN** 渲染结果 MUST 使 B 层覆盖于 A 层之上（数组顺序即绘制顺序）

### Requirement: 兼容既有单层写法

当 `WatermarkConfig` 未提供 `layers` 时，系统 SHALL 保持现有行为：`mode` + 顶层字段（`text` / `imageUrl` / `font` / `color` / `imageSize` / `opacity` / `rotation` / `spacing` / `position` / `zIndex`）的语义与现状完全一致。当 `layers` 与 `mode` 同时存在时，`layers` MUST 优先，忽略顶层单层字段。

#### Scenario: 旧写法不受影响
- **WHEN** 用户传入 `watermark: { mode: 'text', text: '机密文件' }`
- **THEN** 渲染结果 MUST 与改造前完全一致（文字平铺水印）

#### Scenario: 旧写法图片模式
- **WHEN** 用户传入 `watermark: { mode: 'image', imageUrl: '/logo.png' }`
- **THEN** 渲染结果 MUST 与改造前完全一致（图片平铺水印）

#### Scenario: layers 优先于 mode
- **WHEN** 用户传入 `watermark: { mode: 'text', text: '顶层文字', layers: [{ type: 'image', imageUrl: '/logo.png' }] }`
- **THEN** 仅渲染图片层，顶层 `text` MUST 被忽略

### Requirement: 无效层过滤

`type: 'text'` 且无 `text`、或 `type: 'image'` 且无 `imageUrl` 的层 MUST 被忽略（不绘制），其余有效层 MUST 正常渲染。

#### Scenario: 部分层无效
- **WHEN** 用户传入 `layers: [{ type: 'text' }, { type: 'text', text: '有效层' }]`
- **THEN** 仅渲染"有效层"，不产生任何报错

#### Scenario: 空数组
- **WHEN** 用户传入 `layers: []`
- **THEN** 预览区域 MUST 不渲染任何水印

### Requirement: 图片层加载与重绘

每个图片层 SHALL 独立预加载其 `imageUrl`；加载完成或失败后 MUST 触发整体重绘。加载失败的图片层 MUST 保持空白（跳过该层），其余层不受影响。

#### Scenario: 多图片层异步加载
- **WHEN** 用户传入 `layers: [{ type: 'image', imageUrl: '/a.png' }, { type: 'image', imageUrl: '/b.png' }]`
- **THEN** 两张图片 MUST 各自加载，全部就绪后水印 MUST 完整渲染

#### Scenario: 单层图片加载失败
- **WHEN** 图片 URL 404，且存在另一有效文字层
- **THEN** 图片层 MUST 跳过，文字层 MUST 正常渲染

### Requirement: 主题与浅色内容自适应（逐层生效）

文字层未显式配置 `color` 时，其颜色 MUST 随主题切换（dark 白 / light 黑），且落在浅色内容区域（xlsx 表格白底 / docx 白纸）的 tile MUST 使用深色以保证可见性；显式配置 `color` 的层 MUST 统一使用用户颜色，不做区域覆盖。该规则 MUST 对每个文字层独立生效。

#### Scenario: 多层文字主题自适应
- **WHEN** 主题切换为 light，且存在两个未显式配色的文字层
- **THEN** 两层默认色 MUST 均切换为黑色系，浅色内容区 tile 保持深色可见

#### Scenario: 单层显式配色
- **WHEN** `layers: [{ type: 'text', text: 'A', color: 'red' }, { type: 'text', text: 'B' }]`
- **THEN** A 层 MUST 全部使用红色（含浅色区域），B 层 MUST 按主题自适应
