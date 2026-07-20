/**
 * WASM Cache
 * Caches WebAssembly modules
 */

import { WasmError, createWasmError } from './wasm-errors';

/**
 * Cache options
 */
export interface WasmCacheOptions {
  /** Enable caching */
  enabled?: boolean;
  /** Cache TTL in milliseconds */
  ttl?: number;
  /** Max number of entries */
  maxEntries?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Cache entry
 */
interface CacheEntry {
  /** WASM module */
  module: WebAssembly.Module;
  /** Cached timestamp */
  timestamp: number;
  /** TTL in milliseconds */
  ttl?: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<WasmCacheOptions> = {
  enabled: true,
  ttl: 3600000, // 1 hour
  maxEntries: 50,
  debug: false,
};

/**
 * WASM Cache
 */
export class WasmCache {
  private options: Required<WasmCacheOptions>;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(options: WasmCacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.options.enabled;
  }

  /**
   * Enable caching
   */
  enable(): void {
    this.options.enabled = true;
  }

  /**
   * Disable caching
   */
  disable(): void {
    this.options.enabled = false;
  }

  /**
   * Get a module from cache
   */
  get(name: string): WebAssembly.Module | null {
    if (!this.options.enabled) {
      return null;
    }

    const entry = this.cache.get(name);
    if (!entry) {
      return null;
    }

    // Check TTL
    const ttl = entry.ttl || this.options.ttl;
    if (ttl > 0 && Date.now() - entry.timestamp > ttl) {
      this.cache.delete(name);
      this.log(`Cache entry '${name}' expired`);
      return null;
    }

    this.log(`Cache hit: ${name}`);
    return entry.module;
  }

  /**
   * Set a module in cache
   */
  set(name: string, module: WebAssembly.Module, ttl?: number): void {
    if (!this.options.enabled) {
      return;
    }

    // Check max entries
    if (this.cache.size >= this.options.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(name, {
      module,
      timestamp: Date.now(),
      ttl,
    });

    this.log(`Cached WASM module: ${name}`);
  }

  /**
   * Remove a module from cache
   */
  delete(name: string): boolean {
    const result = this.cache.delete(name);
    if (result) {
      this.log(`Removed from cache: ${name}`);
    }
    return result;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.log('Cache cleared');
  }

  /**
   * Check if a module is cached
   */
  has(name: string): boolean {
    return this.cache.has(name);
  }

  /**
   * Get cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict the oldest entry
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
      this.log(`Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache) {
      const ttl = entry.ttl || this.options.ttl;
      if (ttl > 0 && now - entry.timestamp > ttl) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.log(`Cleared ${count} expired cache entries`);
    }

    return count;
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    maxEntries: number;
    enabled: boolean;
    ttl: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxEntries: this.options.maxEntries,
      enabled: this.options.enabled,
      ttl: this.options.ttl,
      keys: this.keys(),
    };
  }

  /**
   * Update options
   */
  setOptions(options: Partial<WasmCacheOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[WASM Cache] ${message}`, ...data);
    }
  }
}

/**
 * Default WASM cache instance
 */
export const wasmCache = new WasmCache();