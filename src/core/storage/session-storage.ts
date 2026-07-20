/**
 * Session Storage
 * Wrapper for sessionStorage with JSON support
 */

import type { LocalStorageOptions } from './local-storage';

/**
 * Session storage options (same as local storage)
 */
export type SessionStorageOptions = LocalStorageOptions;

/**
 * Storage entry
 */
interface StorageEntry<T = any> {
  /** Stored data */
  data: T;
  /** Created timestamp */
  created: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<SessionStorageOptions> = {
  prefix: 'fyr:session:',
  defaultTTL: 0,
  compress: false,
};

/**
 * Session Storage manager
 */
export class SessionStorageManager {
  private options: Required<SessionStorageOptions>;

  constructor(options: SessionStorageOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Set a value in sessionStorage
   */
  set<T = any>(key: string, value: T): void {
    const fullKey = this.getFullKey(key);
    const entry: StorageEntry<T> = {
      data: value,
      created: Date.now(),
    };

    try {
      const serialized = JSON.stringify(entry);
      sessionStorage.setItem(fullKey, serialized);
    } catch (error) {
      console.error(`[Fyr] Error saving to sessionStorage:`, error);
    }
  }

  /**
   * Get a value from sessionStorage
   */
  get<T = any>(key: string): T | null {
    const fullKey = this.getFullKey(key);
    const value = sessionStorage.getItem(fullKey);

    if (!value) {
      return null;
    }

    try {
      const entry = JSON.parse(value) as StorageEntry<T>;
      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Remove a value from sessionStorage
   */
  remove(key: string): void {
    const fullKey = this.getFullKey(key);
    sessionStorage.removeItem(fullKey);
  }

  /**
   * Check if a key exists in sessionStorage
   */
  has(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return sessionStorage.getItem(fullKey) !== null;
  }

  /**
   * Clear all sessionStorage entries with the prefix
   */
  clear(): void {
    const keys = this.getKeys();
    for (const key of keys) {
      sessionStorage.removeItem(key);
    }
  }

  /**
   * Get all keys with the prefix
   */
  getKeys(): string[] {
    const keys: string[] = [];
    const prefix = this.options.prefix;

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * Get the full key with prefix
   */
  getFullKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }

  /**
   * Update options
   */
  setOptions(options: Partial<SessionStorageOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): Required<SessionStorageOptions> {
    return { ...this.options };
  }

  /**
   * Get storage size (in bytes)
   */
  getSize(): number {
    let size = 0;
    const keys = this.getKeys();
    for (const key of keys) {
      const value = sessionStorage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    }
    return size;
  }
}

/**
 * Default session storage instance
 */
export const sessionStorageManager = new SessionStorageManager();

/**
 * Export default instance
 */
export default sessionStorageManager;