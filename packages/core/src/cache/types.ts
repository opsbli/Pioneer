/**
 * 缓存条目：包装真实值并携带过期时间（可选）。
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

/**
 * 预览缓存统一接口（异步，兼容内存与持久化实现）。
 *
 * 设计目标：Office 文件（docx/xlsx/pptx）转换是预览链路最重的环节，
 * cache 模块负责把「下载结果」与「转换结果」按 URL 缓存，
 * 二次打开同一文件时直接命中，跳过网络下载与重复转换。
 */
export interface PreviewCache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  readonly size: number;
}
