import type { CacheEntry, PreviewCache } from './types';

/**
 * 内存 LRU 缓存：会话级、零依赖。
 *
 * 用于缓存转换结果（docx→HTML、xlsx→sheet 数据、pptx→解析结果）等
 * 无需跨会话持久化的高频数据；超出 maxEntries 时按 LRU 淘汰最久未访问项。
 */
export class MemoryCache implements PreviewCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly maxEntries = 100) {}

  get size(): number {
    return this.store.size;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    // 过期即删
    if (entry.expiresAt !== undefined && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    // LRU：重新插入以刷新访问顺序
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    // 先删除再插入，保证 key 在 Map 中保持最新位置
    this.store.delete(key);
    this.store.set(key, {
      value,
      expiresAt: ttlMs !== undefined ? Date.now() + ttlMs : undefined,
    });

    // 超过上限：淘汰最久未访问（Map 迭代顺序 = 插入顺序 = 最近访问顺序）
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
