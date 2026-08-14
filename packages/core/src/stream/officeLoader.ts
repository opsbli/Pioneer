/**
 * Office 文件加载管线：cache（缓存）+ stream（流式加载）的组合入口。
 *
 * 这是整个预览库针对「Office 转换慢」痛点的核心优化路径：
 * 1. 先查缓存（内存转换缓存 / IndexedDB 文件缓存），命中则零网络开销
 * 2. 未命中时流式下载（带进度回调），下载完成即写入文件缓存
 * 3. 转换结果由调用方写入 {@link conversionCache}，二次打开直接复用
 */

import { conversionCache, fileCache, createCacheKey } from '../cache';
import type { PreviewCache } from '../cache';
import { streamToArrayBuffer, type StreamProgress, type FetchStreamOptions } from './index';

export interface LoadOfficeFileOptions extends FetchStreamOptions {
  /**
   * 文件级缓存（默认 {@link fileCache}，IndexedDB 持久化）。
   * 传 null 关闭文件缓存。
   */
  fileCacheOverride?: PreviewCache | null;
  /** 转换结果缓存（默认 {@link conversionCache}） */
  conversionCacheOverride?: PreviewCache | null;
  /** 缓存键前缀（默认按 URL 生成） */
  cacheKeyPrefix?: string;
  /** 文件缓存 TTL（毫秒，默认不过期） */
  fileTtlMs?: number;
  /** 转换结果 TTL（毫秒，默认 10 分钟） */
  conversionTtlMs?: number;
}

export interface OfficeFileResult {
  arrayBuffer: ArrayBuffer;
  /** 是否命中文件缓存（未发网络请求） */
  fromFileCache: boolean;
}

export interface OfficeConversionResult<T> {
  value: T;
  /** 是否命中转换缓存 */
  fromConversionCache: boolean;
}

/**
 * 加载 Office 文件原始二进制：缓存优先，未命中则流式下载并回填缓存。
 */
export async function loadOfficeFile(
  url: string,
  options: LoadOfficeFileOptions = {},
): Promise<OfficeFileResult> {
  const fileCacheInstance =
    options.fileCacheOverride === undefined ? fileCache : options.fileCacheOverride;

  const fileKey = createCacheKey(options.cacheKeyPrefix, url);

  if (fileCacheInstance) {
    const cached = await fileCacheInstance.get<ArrayBuffer>(fileKey);
    if (cached) {
      return { arrayBuffer: cached, fromFileCache: true };
    }
  }

  const arrayBuffer = await streamToArrayBuffer(url, {
    init: options.init,
    signal: options.signal,
    fetcher: options.fetcher,
    onProgress: options.onProgress,
  });

  if (fileCacheInstance) {
    // 默认 1 小时：兼顾复用率与文件更新/鉴权过期风险
    await fileCacheInstance.set(fileKey, arrayBuffer, options.fileTtlMs ?? DEFAULT_FILE_TTL_MS);
  }

  return { arrayBuffer, fromFileCache: false };
}

/** 文件缓存默认 TTL：1 小时（原始文件可能更新，且鉴权 URL 可能过期） */
export const DEFAULT_FILE_TTL_MS = 60 * 60 * 1000;

/**
 * 转换结果缓存封装：key = cacheKeyPrefix + url + suffix。
 *
 * 用法：
 * ```ts
 * const html = await withConversionCache('docx:html', url, () => mammoth.convertToHtml({ arrayBuffer }));
 * ```
 */
export async function withConversionCache<T>(
  suffix: string,
  url: string,
  produce: () => Promise<T>,
  options: { conversionCacheOverride?: PreviewCache | null; cacheKeyPrefix?: string; ttlMs?: number } = {},
): Promise<OfficeConversionResult<T>> {
  const cacheInstance =
    options.conversionCacheOverride === undefined
      ? conversionCache
      : options.conversionCacheOverride;

  const key = createCacheKey(options.cacheKeyPrefix, url, suffix);

  if (cacheInstance) {
    const cached = await cacheInstance.get<T>(key);
    if (cached !== undefined) {
      return { value: cached, fromConversionCache: true };
    }
  }

  const value = await produce();

  if (cacheInstance) {
    await cacheInstance.set(key, value, options.ttlMs);
  }

  return { value, fromConversionCache: false };
}

/** 转换结果缓存默认 TTL：10 分钟（文件可能更新，不宜过长） */
export const DEFAULT_CONVERSION_TTL_MS = 10 * 60 * 1000;

export type { StreamProgress };
