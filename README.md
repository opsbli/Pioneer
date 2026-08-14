# Pioneer

[![npm version](https://img.shields.io/npm/v/@pioneer/react.svg)](https://www.npmjs.com/package/@pioneer/react)
[![license](https://img.shields.io/npm/l/@pioneer/react.svg)](https://github.com/opsbli/Pioneer/blob/master/LICENSE)
[![react downloads](https://img.shields.io/npm/dm/@pioneer/react.svg?label=@pioneer/react)](https://www.npmjs.com/package/@pioneer/react)
[![vue downloads](https://img.shields.io/npm/dm/@pioneer/vue.svg?label=@pioneer/vue)](https://www.npmjs.com/package/@pioneer/vue)

English | [简体中文](./README.zh-CN.md)

A modern, feature-rich file preview component library with **first-class support for both React and Vue**. Preview images, videos, audio, PDFs, Office documents (Word, Excel, PowerPoint), Markdown, and code files — through a shared core and framework-specific bindings.

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/2728.svg" width="20" height="20" alt="✨" /> Key Features

- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f3a8.svg" width="16" height="16" alt="🎨" style="vertical-align: middle;" /> **Modern UI** — Clean and modern interface with smooth animations
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4c1.svg" width="16" height="16" alt="📁" style="vertical-align: middle;" /> **20+ Format Support** — Images, videos, audio, PDF, Office, code, e-books, and more
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1fa9f.svg" width="16" height="16" alt="🪟" style="vertical-align: middle;" /> **Dual Display Modes** — Full-screen modal or inline embedded preview
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f3af.svg" width="16" height="16" alt="🎯" style="vertical-align: middle;" /> **Multi-framework Support** — React and Vue share core logic with consistent APIs
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/2328.svg" width="16" height="16" alt="⌨️" style="vertical-align: middle;" /> **Full Interaction** — Keyboard navigation, drag-and-drop, zoom/rotate, custom players

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f310.svg" width="20" height="20" alt="🌐" /> Quick Navigation

<table>
<tr>
  <td width="33%"><strong><img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4d6.svg" width="16" height="16" alt="📖" style="vertical-align: middle;" /> Documentation & Demos</strong></td>
  <td width="33%"><strong><img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4e6.svg" width="16" height="16" alt="📦" style="vertical-align: middle;" /> Packages & Resources</strong></td>
  <td width="33%"><strong><img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f6e0.svg" width="16" height="16" alt="🛠️" style="vertical-align: middle;" /> Development & Contributing</strong></td>
</tr>
<tr>
  <td>
    &bull; <a href="https://opsbli.github.io/Pioneer/docs/">Full Documentation</a><br>
    &bull; <a href="https://opsbli.github.io/Pioneer/">React Demo</a><br>
    &bull; <a href="https://opsbli.github.io/Pioneer/vue/">Vue Demo</a>
  </td>
  <td>
    &bull; <a href="https://www.npmjs.com/package/@pioneer/react">React Package</a><br>
    &bull; <a href="https://www.npmjs.com/package/@pioneer/vue">Vue Package</a><br>
    &bull; <a href="https://github.com/opsbli/Pioneer/issues">Issue Tracker</a>
  </td>
  <td>
    &bull; <a href="#-project-architecture">Monorepo Structure</a><br>
    &bull; <a href="#-development-guide">Dev Commands</a><br>
    &bull; <a href="./CONTRIBUTING.md">Contributing Guide</a>
  </td>
</tr>
</table>

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f3af.svg" width="20" height="20" alt="🎯" /> Quick Start

### React

```bash
npm install @pioneer/react
```

```tsx
import { PioneerModal } from '@pioneer/react';
import '@pioneer/react/style.css';

<PioneerModal
  files={[file]}
  currentIndex={0}
  isOpen={true}
  onClose={() => setIsOpen(false)}
/>
```

<img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f449.svg" width="16" height="16" alt="👉" style="vertical-align: middle;" /> [View React Full Documentation](./packages/react/README.md) | [Live Demo](https://opsbli.github.io/Pioneer/)

### Vue

```bash
npm install @pioneer/vue
```

```vue
<script setup>
import { PioneerModal } from '@pioneer/vue';
import '@pioneer/vue/style.css';
</script>

<template>
  <PioneerModal
    :files="[file]"
    :current-index="0"
    :is-open="true"
    @close="isOpen = false"
  />
</template>
```

<img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f449.svg" width="16" height="16" alt="👉" style="vertical-align: middle;" /> [View Vue Full Documentation](./packages/vue/README.md) | [Live Demo](https://opsbli.github.io/Pioneer/vue/)

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4e6.svg" width="20" height="20" alt="📦" /> Package Overview

| Package | Description | Version | Documentation |
|---------|-------------|---------|---------------|
| [@pioneer/react](https://www.npmjs.com/package/@pioneer/react) | React component library | [![npm](https://img.shields.io/npm/v/@pioneer/react.svg)](https://www.npmjs.com/package/@pioneer/react) | [README](./packages/react/README.md) |
| [@pioneer/vue](https://www.npmjs.com/package/@pioneer/vue) | Vue 3 component library | [![npm](https://img.shields.io/npm/v/@pioneer/vue.svg)](https://www.npmjs.com/package/@pioneer/vue) | [README](./packages/vue/README.md) |
| core | Framework-agnostic core | Internal | - |

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4cb.svg" width="20" height="20" alt="📋" /> Supported Formats

<table>
<tr>
  <th width="15%">Type</th>
  <th width="40%">Formats</th>
  <th width="45%">Key Features</th>
</tr>
<tr>
  <td><strong>Images</strong></td>
  <td>JPG, PNG, GIF, WebP, SVG, BMP, ICO, AVIF, HEIC</td>
  <td>Zoom (0.01x-10x), rotate, drag, mouse wheel zoom</td>
</tr>
<tr>
  <td><strong>Videos</strong></td>
  <td>MP4, WebM, OGG, MOV, AVI, MKV, M4V, 3GP, FLV</td>
  <td>Custom player, progress control, volume adjustment, fullscreen</td>
</tr>
<tr>
  <td><strong>Audio</strong></td>
  <td>MP3, WAV, OGG, M4A, AAC, FLAC</td>
  <td>Custom player, progress bar, volume control, skip forward/backward</td>
</tr>
<tr>
  <td><strong>Documents</strong></td>
  <td>PDF, DOCX, XLSX, PPTX/PPT</td>
  <td>Pagination, zoom, slide preview, spreadsheet view</td>
</tr>
<tr>
  <td><strong>Code</strong></td>
  <td>JS, TS, Python, Java, C++, Go, Rust, and 40+ languages</td>
  <td>Syntax highlighting, theme support, line numbers</td>
</tr>
<tr>
  <td><strong>Subtitles</strong></td>
  <td>SRT, WebVTT, LRC, ASS/SSA, TTML/DFXP</td>
  <td>Timeline parsing, metadata extraction, structured display</td>
</tr>
<tr>
  <td><strong>CAD / 3D</strong></td>
  <td>DXF, STL, OBJ, GLTF, GLB</td>
  <td>Interactive 3D viewer, orbit/zoom/pan, wireframe toggle, grid &amp; axes</td>
</tr>
<tr>
  <td><strong>Others</strong></td>
  <td>Markdown, CSV, JSON, XML, ZIP, MSG, EPUB, Fonts</td>
  <td>Rendering, formatting, tree view, character set preview</td>
</tr>
</table>

<img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f449.svg" width="16" height="16" alt="👉" style="vertical-align: middle;" /> [View complete format list and examples](https://opsbli.github.io/Pioneer/docs/guide/supported-types.html)

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f3d7.svg" width="20" height="20" alt="🏗️" /> Project Architecture

This project uses a pnpm workspace monorepo architecture:

```
Pioneer/
├── packages/
│   ├── core/     # Framework-agnostic core (types, detection, parsers)
│   │   ├── cache/    # Caching: in-memory LRU + IndexedDB persistence
│   │   └── stream/   # Streaming: chunked fetch with progress + Office load pipeline
│   ├── react/    # React bindings → @pioneer/react
│   ├── vue/      # Vue bindings → @pioneer/vue
│   ├── react-example/        # React demo app (deployed to GitHub Pages)
│   ├── vue-example/          # Vue demo app (deployed to GitHub Pages /vue)
│   └── docs/                # VitePress documentation site
└── openspec/                # OpenSpec change records
```

### Performance Core: `cache` + `stream`

Office files (docx/xlsx/pptx) are the heaviest preview workload — network download plus format conversion. Pioneer's core is built around two modules to attack this bottleneck:

- **`cache` (缓存)** — Two-level caching with a unified async `PreviewCache` interface:
  - `MemoryCache`: session-level LRU for conversion results (docx→HTML, xlsx→sheet data)
  - `StorageCache`: IndexedDB-backed persistence for raw file `ArrayBuffer`s, surviving page refreshes
- **`stream` (流式加载)** — Chunked `ReadableStream` fetching with real-time progress (`loaded`/`total`/`percent`) and `AbortSignal` cancellation, plus a ready-to-use `loadOfficeFile` / `withConversionCache` pipeline for renderers.

Re-opening the same URL skips both download and conversion; the second preview is near-instant.

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f6e0.svg" width="20" height="20" alt="🛠️" /> Development Guide

### Install Dependencies

```bash
pnpm install
```

### Development Commands

```bash
# Start dev servers
pnpm dev              # React demo
pnpm dev:vue          # Vue demo
pnpm dev:docs         # Documentation site

# Build
pnpm build            # Build all packages
pnpm build:lib        # Build library only
pnpm build:example    # Build examples only

# Preview builds
pnpm preview:example  # Preview example build
pnpm preview:docs     # Preview docs build

# Deploy and publish
pnpm gh               # Build and deploy examples and docs to GitHub Pages
pnpm pub:react        # Publish the React package to npm
pnpm pub:vue          # Publish the Vue package to npm
```

### Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Submit a Pull Request

<img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f449.svg" width="16" height="16" alt="👉" style="vertical-align: middle;" /> [Read full contributing guide](./CONTRIBUTING.md)

---


## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f9e9.svg" width="20" height="20" alt="🧩" /> Custom Renderers

Support custom renderers for file types not built-in.

**React Example:**

```tsx
import { PioneerModal } from '@pioneer/react';

const customRenderers = [
  {
    test: (file) => file.type === 'application/custom',
    render: (file) => <div>Custom render: {file.url}</div>
  }
];

<PioneerModal
  files={files}
  currentIndex={0}
  isOpen={true}
  onClose={() => setIsOpen(false)}
  customRenderers={customRenderers}
/>
```

**Vue Example:**

```vue
<script setup>
import { PioneerModal } from '@pioneer/vue';

const CustomRenderer = {
  props: ['url'],
  template: '<div>Custom render: {{ url }}</div>'
};

const customRenderers = [
  {
    test: (file) => file.type === 'application/custom',
    render: () => CustomRenderer
  }
];
</script>

<template>
  <PioneerModal
    :files="files"
    :current-index="0"
    :is-open="true"
    :custom-renderers="customRenderers"
    @close="isOpen = false"
  />
</template>
```

<img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f449.svg" width="16" height="16" alt="👉" style="vertical-align: middle;" /> Full documentation: [React Custom Renderers](./packages/react/README.md#-custom-renderers) | [Vue Custom Renderers](./packages/vue/README.md#-custom-renderers)

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/2328.svg" width="20" height="20" alt="⌨️" /> Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Close preview |
| `←` / `→` | Navigate to previous/next file |
| `Mouse Wheel` | Zoom image (image preview only) |

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4c4.svg" width="20" height="20" alt="📄" /> License

[MIT](./LICENSE) © [opsbli](https://github.com/opsbli/Pioneer)

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f517.svg" width="20" height="20" alt="🔗" /> Links

- **GitHub**: [opsbli/Pioneer](https://github.com/opsbli/Pioneer)
- **Documentation**: [opsbli/Pioneer/docs](https://opsbli.github.io/Pioneer/docs/)
- **Issue Tracker**: [GitHub Issues](https://github.com/opsbli/Pioneer/issues)
- **Community**: [Linux.do](https://linux.do/)

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4ac.svg" width="20" height="20" alt="💬" /> Community & Support

If this project helps you, please:

- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/2b50.svg" width="16" height="16" alt="⭐" style="vertical-align: middle;" /> Star the project on GitHub
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f41b.svg" width="16" height="16" alt="🐛" style="vertical-align: middle;" /> [Report issues](https://github.com/opsbli/Pioneer/issues) to help us improve
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4a1.svg" width="16" height="16" alt="💡" style="vertical-align: middle;" /> [Submit PRs](https://github.com/opsbli/Pioneer/pulls) to contribute code
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4e2.svg" width="16" height="16" alt="📢" style="vertical-align: middle;" /> Share it with more developers
