## ADDED Requirements

### Requirement: 搜索面板唤起

系统 SHALL 支持通过 Ctrl+F（Mac 上 Cmd+F）快捷键唤起搜索面板。搜索面板固定在工具栏下方，展开时不遮挡内容区。

#### Scenario: Ctrl+F 唤起搜索面板
- **WHEN** 用户按下 Ctrl+F（或 Mac 上 Cmd+F）
- **THEN** 搜索面板 MUST 展开并显示输入框，焦点自动定位到输入框

#### Scenario: 不支持搜索的文件类型不显示搜索入口
- **WHEN** 当前预览文件为图片/视频/音频/CAD/字体等不支持搜索的类型
- **THEN** Ctrl+F MUST 不唤起搜索面板，工具栏不显示搜索按钮

#### Scenario: 浏览器原生 Ctrl+F 被拦截
- **WHEN** 预览容器处于 modal 模式且用户按下 Ctrl+F
- **THEN** 浏览器原生搜索框 MUST 不出现，改为唤起预览内搜索面板

### Requirement: 搜索面板 UI

搜索面板 SHALL 包含以下元素：关键词输入框、上一个匹配按钮（↑）、下一个匹配按钮（↓）、匹配计数显示、大小写敏感切换开关、关闭按钮。

#### Scenario: 搜索面板元素完整
- **WHEN** 搜索面板展开
- **THEN** 面板 MUST 包含输入框、↑/↓ 翻页按钮、匹配计数、大小写切换、关闭按钮

#### Scenario: 匹配计数实时更新
- **WHEN** 用户输入搜索关键词
- **THEN** 匹配计数 MUST 实时显示当前匹配序号与总数（"1 / 5"）

### Requirement: PDF 文件搜索

PDF 渲染器 SHALL 实现全文搜索能力，通过 pdfjs-dist 的 `page.getTextContent()` 逐页提取文本并匹配关键词。

#### Scenario: PDF 搜索找到匹配
- **WHEN** 用户在 PDF 中搜索一个存在的关键词
- **THEN** 匹配计数 MUST 显示正确的匹配总数，当前匹配区域高亮显示

#### Scenario: PDF 搜索未找到匹配
- **WHEN** 用户在 PDF 中搜索一个不存在的关键词
- **THEN** 匹配计数 MUST 显示 "0 / 0"，并提示"未找到匹配"

#### Scenario: PDF 搜索结果高亮
- **WHEN** 搜索找到匹配项
- **THEN** 当前匹配区域 MUST 以高亮背景色标记，便于用户定位

#### Scenario: PDF 翻页到下一个匹配
- **WHEN** 搜索有多个匹配，用户点击"下一个"按钮
- **THEN** 视图 MUST 滚动到下一个匹配位置并高亮显示

#### Scenario: PDF 翻页到上一个匹配
- **WHEN** 搜索有多个匹配，用户点击"上一个"按钮
- **THEN** 视图 MUST 滚动到上一个匹配位置并高亮显示

#### Scenario: PDF 搜索支持大小写敏感
- **WHEN** 用户开启大小写敏感并搜索 "Hello"
- **THEN** 系统 MUST 仅匹配精确大小写 "Hello"，不匹配 "hello"

#### Scenario: PDF 搜索关闭大小写敏感
- **WHEN** 用户关闭大小写敏感并搜索 "hello"
- **THEN** 系统 MUST 匹配 "Hello"、"hello"、"HELLO" 等所有大小写变体

### Requirement: 文本类文件搜索

文本类文件（纯文本、代码、JSON、XML、Markdown）SHALL 实现搜索能力，通过 DOM 文本匹配并高亮 `<mark>` 标签。

#### Scenario: 文本文件搜索找到匹配
- **WHEN** 用户在文本文件中搜索存在的关键词
- **THEN** 匹配区域 MUST 以 `<mark>` 标签高亮，匹配计数正确显示

#### Scenario: 文本文件翻页到下一个匹配
- **WHEN** 搜索有多个匹配，用户点击"下一个"
- **THEN** 当前高亮 MUST 切换到下一个匹配项

#### Scenario: 文本文件搜索关闭后清除高亮
- **WHEN** 用户关闭搜索面板
- **THEN** 所有搜索高亮 MUST 被清除，文本恢复原样

### Requirement: 搜索面板关闭

系统 SHALL 支持多种方式关闭搜索面板：点击关闭按钮、按 Esc 键、切换到不支持搜索的文件类型。

#### Scenario: 点击关闭按钮
- **WHEN** 用户点击搜索面板的关闭按钮
- **THEN** 搜索面板 MUST 关闭，搜索高亮清除

#### Scenario: Esc 关闭搜索面板
- **WHEN** 搜索面板打开时用户按下 Esc
- **THEN** 搜索面板 MUST 关闭（而非关闭预览）

#### Scenario: Esc 关闭预览
- **WHEN** 搜索面板未打开时用户按下 Esc（modal 模式）
- **THEN** 预览 MUST 关闭

### Requirement: 键盘翻页导航

搜索面板打开时，↑/↓ 键 SHALL 用于翻页到上一个/下一个匹配，不触发文件切换。

#### Scenario: ↑ 键翻页到上一个匹配
- **WHEN** 搜索面板打开且用户按下 ↑ 键
- **THEN** 视图 MUST 跳转到上一个匹配位置

#### Scenario: ↓ 键翻页到下一个匹配
- **WHEN** 搜索面板打开且用户按下 ↓ 键
- **THEN** 视图 MUST 跳转到下一个匹配位置

#### Scenario: 搜索面板打开时不切换文件
- **WHEN** 搜索面板打开且用户按下 ←/→ 键
- **THEN** 文件切换 MUST 不触发

### Requirement: 搜索通过 RendererHandle 扩展

各渲染器 SHALL 通过 `RendererHandle` 接口声明搜索能力。`canSearch()` 返回 `true` 时搜索面板才可用。

#### Scenario: 渲染器声明支持搜索
- **WHEN** 渲染器实现 `canSearch: () => true`
- **THEN** 搜索面板 MUST 对该文件类型可用

#### Scenario: 渲染器不支持搜索
- **WHEN** 渲染器未实现 `canSearch` 或返回 `false`
- **THEN** 搜索面板 MUST 对该文件类型不可用

#### Scenario: 搜索完成后清除
- **WHEN** 用户调用 `clearSearch()`
- **THEN** 渲染器 MUST 清除所有高亮并重置搜索状态

### Requirement: 工具栏搜索按钮

支持搜索的渲染器 SHALL 通过 `getToolbarGroups` 在工具栏中暴露搜索按钮（放大镜图标）。搜索激活时按钮显示 active 状态。

#### Scenario: 搜索按钮在工具栏中
- **WHEN** 当前文件类型支持搜索
- **THEN** 工具栏 MUST 显示搜索按钮（放大镜图标）

#### Scenario: 搜索激活时按钮高亮
- **WHEN** 搜索面板已展开
- **THEN** 搜索按钮 MUST 显示 active 状态

#### Scenario: 不支持搜索时无搜索按钮
- **WHEN** 当前文件类型不支持搜索
- **THEN** 工具栏 MUST 不显示搜索按钮

### Requirement: React 与 Vue 双端 API 架构

React 包与 Vue 包 SHALL 暴露等价的搜索面板 UI、等价的快捷键行为、等价的搜索高亮逻辑。两端的搜索交互 MUST 完全一致。

#### Scenario: 两端搜索面板 UI 一致
- **WHEN** 同一 PDF 分别在 React 与 Vue 端搜索同一关键词
- **THEN** 两端的搜索面板视觉与交互 MUST 一致

#### Scenario: 两端快捷键行为一致
- **WHEN** 分别在 React 与 Vue 端按下 Ctrl+F
- **THEN** 两端 MUST 都以相同方式唤起搜索面板