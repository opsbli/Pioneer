# 性能核心：缓存与流式加载

Office 文件（docx / xlsx / pptx）的预览链路是最重的：**网络下载大文件 + 格式解析 + 转换渲染**。
Pioneer 的 core 包围绕两大核心模块解决这个痛点：**`cache`（缓存）** 与 **`stream`（流式加载）**。

## 架构总览

```
@pioneer/core
├── cache/                  # 缓存模块
│   ├── MemoryCache         # 会话级 LRU（转换结果缓存）
│   ├── StorageCache        # IndexedDB 持久化（原始文件缓存）
│   └── createCacheKey()    # 稳定缓存键生成
└── stream/                 # 流式加载模块
    ├── fetchStream()       # ReadableStream 分块拉取 + 进度回报
    ├── streamToArrayBuffer() / streamToBlob()
    └── officeLoader        # Office 加载管线
        ├── loadOfficeFile()      # 文件级：缓存优先 → 流式下载 → 回填缓存
        └── withConversionCache() # 转换级：缓存优先 → 转换 → 回填缓存
```

## cache：两级缓存

所有缓存实现统一异步接口 `PreviewCache`，可自由替换：

```ts
interface PreviewCache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  readonly size: number;
}
```

### MemoryCache —— 转换结果（会话级）

缓存 docx→HTML、xlsx→sheet 数据等转换产物。LRU 淘汰，默认容量 200 条。

```ts
import { MemoryCache } from '@pioneer/core';

const cache = new MemoryCache<string>(100);
await cache.set('docx:https://cdn/example.docx', '<h1>转换结果</h1>', 10 * 60 * 1000);
const html = await cache.get('docx:https://cdn/example.docx');
```

### StorageCache —— 原始文件（持久化）

基于 IndexedDB，缓存下载到的 `ArrayBuffer` / `Blob`。**刷新页面后仍然命中**，
同一文件二次预览不再发网络请求。默认容量 200 条，按写入时间淘汰最旧条目。

```ts
import { StorageCache } from '@pioneer/core';

const cache = new StorageCache('my-db', 'office-files');
await cache.set('https://cdn/example.xlsx', arrayBuffer, 60 * 60 * 1000);
```

> 注意：文件可能更新、鉴权 URL 可能过期，`set` 时建议传入 TTL。

## stream：流式加载

`fetchStream` 基于 `ReadableStream` 分块拉取，实时回报进度，支持 `AbortSignal` 取消：

```ts
import { fetchStream } from '@pioneer/core';

const { stream, total } = await fetchStream(url, {
  fetcher, // 复用鉴权 fetcher（默认原生 fetch）
  signal,
  onProgress: ({ loaded, total, percent }) => {
    // 驱动加载进度条
  },
});
```

收拢工具：

- `streamToArrayBuffer(url, opts)` —— Office 转换器（mammoth / exceljs）需要的输入
- `streamToBlob(url, opts)` —— object URL / 文件下载

## officeLoader：开箱即用的管线

renderer 直接使用两条管线，无需关心缓存细节：

```ts
import { loadOfficeFile, withConversionCache } from '@pioneer/core';

// 文件级：缓存优先 → 流式下载（带进度）→ 回填 IndexedDB 缓存
const { arrayBuffer, fromFileCache } = await loadOfficeFile(url, { fetcher });

// 转换级：缓存优先 → 执行转换 → 回填内存缓存
const { value } = await withConversionCache('docx:html', url, async () => {
  const { arrayBuffer } = await loadOfficeFile(url, { fetcher });
  return (await mammoth.convertToHtml({ arrayBuffer })).value;
}, { ttlMs: 10 * 60 * 1000 });
```

- 文件缓存默认 TTL：**1 小时**（`DEFAULT_FILE_TTL_MS`）
- 转换缓存默认 TTL：**10 分钟**（`DEFAULT_CONVERSION_TTL_MS`）

## 默认实例

| 实例 | 类型 | 用途 |
|------|------|------|
| `fileCache` | StorageCache | 原始文件 ArrayBuffer 持久化缓存 |
| `conversionCache` | MemoryCache | 转换结果会话级缓存 |

内置 Docx / Xlsx / Pptx renderer 已默认接入这两条管线：**同一 URL 二次打开时跳过下载与转换，近乎秒开**。
