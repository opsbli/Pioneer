## ADDED Requirements

### Requirement: 加密 PDF 自动检测

当 PDF 文件受密码保护时，系统 SHALL 自动检测并在加载时触发密码输入流程。检测方式基于 pdfjs-dist 的 `PasswordResponses` 事件或 `PasswordException` 异常。

#### Scenario: 加密 PDF 触发密码输入
- **WHEN** 用户打开一个受密码保护的 PDF 文件
- **THEN** 系统 MUST 检测到加密状态并弹出密码输入弹窗

#### Scenario: 非加密 PDF 不触发密码输入
- **WHEN** 用户打开一个非加密的 PDF 文件
- **THEN** 系统 MUST 正常加载 PDF，不弹出密码输入弹窗

### Requirement: 密码输入弹窗

系统 SHALL 提供一个密码输入弹窗组件，显示在预览容器内居中位置，包含标题、密码输入框、确认按钮、错误提示信息、剩余重试次数。

#### Scenario: 密码弹窗 UI 元素完整
- **WHEN** 加密 PDF 触发密码输入
- **THEN** 弹窗 MUST 包含标题（"文件需要密码"）、密码输入框（`type="password"`）、确认按钮、重试次数提示

#### Scenario: 密码输入框为密码类型
- **WHEN** 密码弹窗打开
- **THEN** 密码输入框 MUST 为 `type="password"`，输入内容不可见

### Requirement: 密码正确时加载 PDF

用户输入正确密码后，系统 SHALL 将密码传递给 pdfjs-dist `getDocument({ url, password })` 并成功加载 PDF。

#### Scenario: 正确密码加载成功
- **WHEN** 用户输入正确的 PDF 密码并点击确认
- **THEN** PDF 内容 MUST 正常显示，密码弹窗关闭

#### Scenario: 密码正确后水印正常叠加
- **WHEN** 加密 PDF 密码正确且启用了水印
- **THEN** PDF 内容上 MUST 正常叠加水印

### Requirement: 密码错误时提示并重试

用户输入错误密码后，系统 SHALL 显示错误提示信息并允许重新输入。重试次数上限为 3 次。

#### Scenario: 错误密码提示
- **WHEN** 用户输入错误的 PDF 密码
- **THEN** 弹窗 MUST 显示错误提示（"密码错误，请重试"），并重置密码输入框

#### Scenario: 错误密码重试计数
- **WHEN** 用户第 1 次输入错误密码
- **THEN** 弹窗 MUST 显示剩余重试次数为 2

#### Scenario: 第 2 次错误密码
- **WHEN** 用户第 2 次输入错误密码
- **THEN** 弹窗 MUST 显示剩余重试次数为 1

### Requirement: 重试上限阻止

用户连续输入错误密码达到上限（3 次）后，系统 SHALL 阻止继续输入并显示最终错误提示。

#### Scenario: 达到重试上限
- **WHEN** 用户第 3 次输入错误密码
- **THEN** 弹窗 MUST 关闭，显示"已达最大重试次数，无法打开文件"提示

#### Scenario: 超限后不再允许输入
- **WHEN** 重试次数已达上限
- **THEN** 系统 MUST 不再弹出密码输入框

### Requirement: 宿主直接传入密码

系统 SHALL 允许宿主通过 `password?: string` prop 直接传入已知密码，跳过密码输入弹窗。

#### Scenario: 直接传入正确密码
- **WHEN** 宿主传入 `password="123456"` 且密码正确
- **THEN** PDF MUST 直接加载，不弹出密码输入弹窗

#### Scenario: 直接传入错误密码
- **WHEN** 宿主传入 `password="wrong"` 且密码错误
- **THEN** 系统 MUST 通过 `onError` 回调通知宿主，不弹出密码输入弹窗

#### Scenario: 非加密 PDF 传入密码时忽略
- **WHEN** 非加密 PDF 且宿主传入了 `password`
- **THEN** 系统 MUST 忽略密码参数，正常加载 PDF

### Requirement: 加密 Office 文件处理

DOCX、XLSX、PPTX 等 Office 文件若受密码保护，系统 SHALL 展示"文件受密码保护"提示，不提供密码输入功能。

#### Scenario: 加密 DOCX 提示
- **WHEN** 用户打开一个受密码保护的 DOCX 文件
- **THEN** 系统 MUST 显示"文件受密码保护，请下载后用 Office 打开"的提示信息

#### Scenario: 加密 XLSX 提示
- **WHEN** 用户打开一个受密码保护的 XLSX 文件
- **THEN** 系统 MUST 显示"文件受密码保护"的提示信息

### Requirement: 密码弹窗不阻塞内容区

密码弹窗打开时，内容区 SHALL 显示"等待输入密码"的加载提示，而非空白。

#### Scenario: 密码弹窗打开时内容区状态
- **WHEN** 密码弹窗打开
- **THEN** 内容区 MUST 显示"等待输入密码"提示文字或加载动画

### Requirement: React 与 Vue 双端 API 架构

React 包与 Vue 包 SHALL 暴露等价的 `password` prop、等价的密码弹窗 UI、等价的错误处理逻辑。两端的重试上限、错误提示、交互行为 MUST 完全一致。

#### Scenario: 两端密码弹窗 UI 一致
- **WHEN** 同一加密 PDF 分别在 React 与 Vue 端打开
- **THEN** 两端的密码弹窗 MUST 视觉与交互一致

#### Scenario: 两端重试上限一致
- **WHEN** 分别在 React 与 Vue 端连续输入错误密码 3 次
- **THEN** 两端 MUST 都在第 3 次后阻止继续输入