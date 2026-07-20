/**
 * Action Cache
 * Caching system for server action responses
 */

/**
 * Cache entry
 */
interface CacheEntry<T = any> {
  /** Cached data */
  data: T;
  /** Cache timestamp */
  timestamp: number;
  /** Time-to-live in milliseconds */
  ttl?: number;
}

/**
 * Cache options
 */
export interface ActionCacheOptions {
  /** Whether cache is enabled */
  enabled?: boolean;
  /** Default time-to-live in milliseconds */
  ttl?: number;
  /** Maximum number of cache entries */
  maxSize?: number;
  /** Cache key prefix */
  prefix?: string;
}

/**
 * Default cache options
 */
const DEFAULT_CACHE_OPTIONS: Required<ActionCacheOptions> = {
  enabled: true,
  ttl: 60000, // 1 minute
  maxSize: 100,
  prefix: 'fyr-action:',
};

/**
 * Action Cache
 */
export class ActionCache {
  private cache: Map<string, CacheEntry> = new Map();
  private options: Required<ActionCacheOptions>;

  constructor(options: ActionCacheOptions = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
  }

  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.options.enabled;
  }

  /**
   * Enable cache
   */
  enable(): void {
    this.options.enabled = true;
  }

  /**
   * Disable cache
   */
  disable(): void {
    this.options.enabled = false;
  }

  /**
   * Get a value from cache
   */
  get<T = any>(key: string): T | null {
    if (!this.options.enabled) {
      return null;
    }

    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return null;
    }

    // Check TTL
    if (entry.ttl !== undefined) {
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(fullKey);
        return null;
      }
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache
   */
  set<T = any>(key: string, data: T, ttl?: number): void {
    if (!this.options.enabled) {
      return;
    }

    // Check max size and evict if needed
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    const fullKey = this.getFullKey(key);
    this.cache.set(fullKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
    });
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return this.cache.delete(fullKey);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearMatching(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache timestamp for a key
   */
  getTimestamp(key: string): number {
    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);
    return entry ? entry.timestamp : 0;
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return this.cache.has(fullKey);
  }

  /**
   * Update cache options
   */
  setOptions(options: Partial<ActionCacheOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current cache options
   */
  getOptions(): Required<ActionCacheOptions> {
    return { ...this.options };
  }

  /**
   * Get full cache key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }

  /**
   * Evict the oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Evict expired entries
   */
  evictExpired(): number {
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.ttl !== undefined) {
        const age = Date.now() - entry.timestamp;
        if (age > entry.ttl) {
          expiredKeys.push(key);
        }
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    return expiredKeys.length;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    enabled: boolean;
    ttl: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      enabled: this.options.enabled,
      ttl: this.options.ttl,
    };
  }
}

/**
 * Default action cache instance
 */
export const actionCache = new ActionCache();

/**
 * Cache decorator for action methods
 */
export function cached(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      const cachedResult = actionCache.get(cacheKey);

      if (cachedResult !== null) {
        return cachedResult;
      }

      const result = originalMethod.apply(this, args);

      if (result && typeof result.then === 'function') {
        // Handle promise
        return result.then((data: any) => {
          actionCache.set(cacheKey, data, ttl);
          return data;
        });
      }

      // Handle sync
      actionCache.set(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
}