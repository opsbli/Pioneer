/**
 * stream 模块：预览性能核心之二。
 *
 * 痛点：Office 文件（docx/xlsx/pptx）体积大、下载慢，转换前必须先拿到
 * 完整二进制。stream 模块提供：
 *
 * - {@link fetchStream}：基于 ReadableStream 的分块流式拉取，边下边转、
 *   实时回报进度（loaded/total/percent），支持 AbortSignal 取消
 * - {@link streamToArrayBuffer} / {@link streamToBlob}：把流收拢为
 *   转换器需要的 ArrayBuffer / Blob
 *
 * 与 cache 模块配合：首次流式下载后写入缓存，二次打开直接命中缓存。
 */

export interface StreamProgress {
  /** 已接收字节数 */
  loaded: number;
  /** 总字节数（Content-Length 缺失时为 undefined） */
  total?: number;
  /** 进度百分比 0-100（total 缺失时为 undefined） */
  percent?: number;
}

export interface FetchStreamOptions {
  /** 请求头/方法等自定义 RequestInit */
  init?: RequestInit;
  /** 取消信号：中断下载 */
  signal?: AbortSignal;
  /** 进度回调（每个 chunk 触发一次） */
  onProgress?: (progress: StreamProgress) => void;
  /** 自定义请求器（复用鉴权/Handler 配置）；默认原生 fetch */
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

/**
 * 流式拉取远程资源。
 *
 * 返回可读流与元信息，由调用方决定如何消费：
 * - 直接 `stream.pipeTo(...)` 边下边处理
 * - 或交给 {@link streamToArrayBuffer} / {@link streamToBlob} 收拢
 */
export async function fetchStream(url: string, options: FetchStreamOptions = {}) {
  const { init, signal, onProgress, fetcher } = options;
  const doFetch = fetcher ?? ((u: string, i?: RequestInit) => fetch(u, i));

  const mergedInit: RequestInit | undefined =
    signal && init ? { ...init, signal }
    : signal ? { signal }
    : init;

  const response = await doFetch(url, mergedInit);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  const total = Number(response.headers.get('content-length')) || undefined;

  if (!response.body) {
    // 无流式响应体（如某些代理）：退化为一次性读取，进度只报 100%
    const buf = await response.arrayBuffer();
    onProgress?.({ loaded: buf.byteLength, total: buf.byteLength, percent: 100 });
    return {
      response,
      total,
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(buf));
          controller.close();
        },
      }),
    };
  }

  return {
    response,
    total,
    stream: new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = response.body!.getReader();
        let loaded = 0;
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.byteLength;
            onProgress?.({
              loaded,
              total,
              percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : undefined,
            });
            controller.enqueue(value);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
      cancel(reason) {
        // 消费方提前取消（如切换文件）：终止底层读取
        void reason;
        return response.body?.cancel();
      },
    }),
  };
}

/**
 * 流式拉取并收拢为 ArrayBuffer（Office 转换器如 mammoth/exceljs 的输入格式）。
 */
export async function streamToArrayBuffer(
  url: string,
  options: FetchStreamOptions = {},
): Promise<ArrayBuffer> {
  const { stream } = await fetchStream(url, options);
  return readStream(stream);
}

/**
 * 流式拉取并收拢为 Blob（用于 object URL / 文件下载）。
 */
export async function streamToBlob(
  url: string,
  options: FetchStreamOptions = {},
): Promise<Blob> {
  const { stream, response } = await fetchStream(url, options);
  const buf = await readStream(stream);
  const contentType = response.headers.get('content-type') ?? undefined;
  return new Blob([buf], { type: contentType });
}

/** 读取整个 ReadableStream 为 ArrayBuffer */
export async function readStream(stream: ReadableStream<Uint8Array>): Promise<ArrayBuffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}
