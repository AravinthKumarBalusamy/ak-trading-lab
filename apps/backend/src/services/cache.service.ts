interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private memoryCache = new Map<string, CacheItem<unknown>>();

  public async get<T>(key: string): Promise<T | null> {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  public async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }
}

export const cacheService = new CacheService();
