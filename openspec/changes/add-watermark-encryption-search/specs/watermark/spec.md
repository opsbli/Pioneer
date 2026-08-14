## ADDED Requirements

### Requirement: 水印配置契约

系统 SHALL 允许用户通过 `watermark?: WatermarkConfig` prop 向 `PioneerContent` / `PioneerModal` / `PioneerEmbed` 注入水印配置。`WatermarkConfig` 必须包含 `mode: 'text' | 'image'`；当 `mode: 'text'` 时必须提供 `text` 字段；当 `mode: 'image'` 时必须提供 `imageUrl` 字段。

#### Scenario: 文字水印模式
- **WHEN** 用户传入 `watermark: { mode: 'text', text: '机密文件' }`
- **THEN** 预览区域 MUST 叠加平铺的文字水印，内容为"机密文件"

#### Scenario: 图片水印模式
- **WHEN** 用户传入 `watermark: { mode: 'image', imageUrl: '/logo.png' }`
- **THEN** 预览区域 MUST 叠加平铺的图片水印

#### Scenario: 未传入 watermark 时不渲染水印层
- **WHEN** 未传入 `watermark` prop
- **THEN** 预览区域 MUST 不渲染水印层，行为与当前主干完全一致

### Requirement: 水印配置选项

`WatermarkConfig` SHALL 支持以下可选配置：`font`、`color`、`imageUrl`、`imageSize`、`opacity`、`rotation`、`spacing`、`position`、`zIndex`。未指定的选项 MUST 使用默认值。

#### Scenario: 自定义水印颜色与透明度
- **WHEN** 用户传入 `watermark: { mode: 'text', text: '测试', color: 'red', opacity: 0.3 }`
- **THEN** 水印文字颜色 MUST 为红色，透明度 MUST 为 0.3

#### Scenario: 自定义旋转角度
- **WHEN** 用户传入 `watermark: { mode: 'text', text: '测试', rotation: 45 }`
- **THEN** 水印文字 MUST 以 45 度角旋转

#### Scenario: 自定义间距
- **WHEN** 用户传入 `watermark: { mode: 'text', text: '测试', spacing: [300, 200] }`
- **THEN** 水印单元水平间距 MUST 为 300px，垂直间距 MUST 为 200px

#### Scenario: 使用默认值时
- **WHEN** 用户仅传入 `watermark: { mode: 'text', text: '测试' }`
- **THEN** `font` MUST 默认为 `'14px sans-serif'`，`color` MUST 默认为 `'rgba(0, 0, 0, 0.15)'`，`opacity` MUST 默认为 `0.15`，`rotation` MUST 默认为 `-30`，`spacing` MUST 默认为 `[200, 150]`，`position` MUST 默认为 `'tile'`

### Requirement: 水印布局模式

`WatermarkConfig.position` SHALL 支持三种布局：`'tile'`（平铺）、`'center'`（居中单个）、`'diagonal'`（对角线平铺）。

#### Scenario: 平铺模式
- **WHEN** `position: 'tile'`
- **THEN** 水印单元 MUST 按 `spacing` 指定的水平/垂直间距平铺覆盖整个预览区域

#### Scenario: 居中模式
- **WHEN** `position: 'center'`
- **THEN** 预览区域中央 MUST 仅显示一个水印单元

#### Scenario: 对角线模式
- **WHEN** `position: 'diagonal'`
- **THEN** 水印单元 MUST 沿对角线方向平铺

### Requirement: 水印不干扰交互

水印层 MUST 设置 `pointer-events: none`，不得阻止用户的点击、缩放、拖拽、滚动等交互操作。

#### Scenario: 水印不拦截点击事件
- **WHEN** 预览区域启用了水印，用户点击内容区域
- **THEN** 点击事件 MUST 穿透水印层到达下层内容

#### Scenario: 水印不阻止缩放
- **WHEN** 图片预览模式启用了水印，用户使用滚轮缩放
- **THEN** 缩放操作 MUST 正常执行，水印层跟随缩放

### Requirement: 水印层随容器 resize 重绘

水印 Canvas MUST 监听容器尺寸变化，在尺寸改变后重新绘制以覆盖新尺寸区域。

#### Scenario: 窗口 resize 后水印覆盖完整区域
- **WHEN** 用户调整浏览器窗口大小
- **THEN** 水印 Canvas MUST 重新绘制，覆盖调整后的整个预览区域

#### Scenario: 水印清晰度随 devicePixelRatio 缩放
- **WHEN** 设备 `devicePixelRatio` 为 2
- **THEN** Canvas 内部尺寸 MUST 为显示尺寸的 2 倍，保证水印清晰不模糊

### Requirement: 水印支持图片模式

当 `mode: 'image'` 时，系统 SHALL 将 `imageUrl` 加载为图片并在 Canvas 上绘制。`imageSize` 可指定水印单元宽高，默认 `[80, 80]`。

#### Scenario: 图片水印正常显示
- **WHEN** 用户传入有效的 `imageUrl`
- **THEN** 水印单元 MUST 显示该图片，尺寸由 `imageSize` 决定

#### Scenario: 图片加载失败时水印层为空
- **WHEN** `imageUrl` 指向一个 404 资源
- **THEN** 水印层 MUST 不崩溃，Canvas 保持空白或显示上一次成功绘制的内容

### Requirement: 水印在所有文件类型上一致

水印层 SHALL 由 `PioneerContent` 统一渲染，覆盖所有文件类型（图片、PDF、Word、Excel、PPT、视频、音频、文本、CAD 等），行为完全一致。

#### Scenario: PDF 预览叠加水印
- **WHEN** PDF 文件预览时启用了水印
- **THEN** PDF 内容上 MUST 叠加水印层

#### Scenario: 图片预览叠加水印
- **WHEN** 图片文件预览时启用了水印
- **THEN** 图片内容上 MUST 叠加水印层

#### Scenario: 文本预览叠加水印
- **WHEN** 文本文件预览时启用了水印
- **THEN** 文本内容上 MUST 叠加水印层

### Requirement: headless 模式隐藏水印

当 `headless: true` 时，水印层 MUST 不渲染。

#### Scenario: headless 模式无水印
- **WHEN** `headless: true` 且 `watermark` 已配置
- **THEN** 水印层 MUST 不渲染，工具栏与导航箭头同样不渲染

### Requirement: React 与 Vue 双端 API 架构

React 包与 Vue 包 SHALL 暴露等价的 `watermark` prop 和等价的 `WatermarkConfig` 类型。两端的默认值、布局模式、交互行为 MUST 完全一致。

#### Scenario: 两端水印配置等价
- **WHEN** 同一份 `WatermarkConfig` 分别在 React 与 Vue 端使用
- **THEN** 两端渲染的水印视觉与行为 MUST 一致