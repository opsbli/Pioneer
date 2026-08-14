import type { CacheEntry, PreviewCache } from './types';

/**
 * 持久化缓存（IndexedDB 后端）。
 *
 * 用于缓存体积大、值得跨会话复用的数据（如已下载的 Office 原始文件
 * ArrayBuffer / Blob），刷新页面后仍可命中，显著减少重复下载与转换。
 *
 * 仅浏览器环境可用；indexedDB 不可用（如 SSR）时自动退化为空缓存。
 */
export class StorageCache implements PreviewCache {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly dbName = 'pioneer-preview-cache',
    private readonly storeName = 'files',
    private readonly maxEntries = 200,
  ) {}

  get size(): number {
    // IndexedDB 不维护同步计数；返回 0 表示「未知」
    return 0;
  }

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('indexedDB is not available'));
        return;
      }
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName);
          store.createIndex('timestamp', 'timestamp');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('open indexedDB failed'));
    });

    // 失败后允许下次重试
    this.dbPromise.catch(() => {
      this.dbPromise = null;
    });
    return this.dbPromise;
  }

  private async withStore<T>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.getDb();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(this.storeName, mode);
      const store = tx.objectStore(this.storeName);
      const request = fn(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('indexedDB request failed'));
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const entry = await this.withStore<CacheEntry<T> | undefined>('readonly', (s) =>
        s.get(key) as IDBRequest<CacheEntry<T> | undefined>,
      );
      if (!entry) return undefined;
      if (entry.expiresAt !== undefined && entry.expiresAt < Date.now()) {
        await this.delete(key);
        return undefined;
      }
      return entry.value;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      // 淘汰最旧的条目，防止无限增长
      const count = await this.withStore<number>('readonly', (s) => s.count() as IDBRequest<number>);
      if (count >= this.maxEntries) {
        await this.evictOldest();
      }
      const entry: CacheEntry<T> & { timestamp?: number } = {
        value,
        expiresAt: ttlMs !== undefined ? Date.now() + ttlMs : undefined,
        timestamp: Date.now(),
      };
      await this.withStore<void>('readwrite', (s) => s.put(entry, key) as unknown as IDBRequest<void>);
    } catch {
      // 存储失败（配额/隐私模式）静默降级：不缓存不影响功能
    }
  }

  private async evictOldest(): Promise<void> {
    try {
      // 按 timestamp 索引升序取第一条（最旧）并删除
      const key = await new Promise<IDBValidKey | undefined>((resolve, reject) => {
        this.getDb()
          .then((db) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const index = tx.objectStore(this.storeName).index('timestamp');
            const req = index.openCursor();
            req.onsuccess = () => resolve(req.result?.key ?? undefined);
            req.onerror = () => reject(req.error ?? new Error('cursor failed'));
          })
          .catch(reject);
      });
      if (key !== undefined) {
        await this.delete(key as string);
      }
    } catch {
      // 忽略淘汰失败
    }
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.withStore<void>('readwrite', (s) => s.delete(key) as unknown as IDBRequest<void>);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.withStore<void>('readwrite', (s) => s.clear() as IDBRequest<void>);
    } catch {
      // 忽略
    }
  }
}
