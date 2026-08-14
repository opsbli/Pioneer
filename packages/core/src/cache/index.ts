/**
 * cache 模块：预览性能核心之一。
 *
 * 痛点：Office 文件（docx/xlsx/pptx）的转换是预览链路中最重的环节——
 * 网络下载 + 格式解析 + 渲染转换。cache 模块提供两级缓存：
 *
 * - {@link MemoryCache}：会话级 LRU，缓存转换结果（docx→HTML、xlsx→sheet 数据等）
 * - {@link StorageCache}：IndexedDB 持久化，缓存原始文件 ArrayBuffer/Blob，
 *   刷新页面后仍可命中，跳过重复下载
 *
 * 两个缓存共用统一的 {@link PreviewCache} 异步接口，可自由替换实现。
 */

export type { CacheEntry, PreviewCache } from './types';
export { MemoryCache } from './memoryCache';
export { StorageCache } from './storageCache';
import { MemoryCache } from './memoryCache';
import { StorageCache } from './storageCache';

/**
 * 生成稳定的缓存键。
 * 用于把「URL + 转换类型」组合成唯一键，避免不同转换结果互相覆盖。
 */
export function createCacheKey(...parts: Array<string | number | undefined>): string {
  return parts.filter((p) => p !== undefined).join(':');
}

/**
 * 默认持久化缓存实例：缓存 Office 原始文件（IndexedDB 后端）。
 */
export const fileCache = new StorageCache('pioneer-preview-cache', 'office-files');

/**
 * 默认内存缓存实例：缓存转换结果（LRU，会话级）。
 */
export const conversionCache = new MemoryCache(200);
