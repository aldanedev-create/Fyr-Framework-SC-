/**
 * Local Storage
 * Wrapper for localStorage with JSON support and expiration
 */

/**
 * Local storage options
 */
export interface LocalStorageOptions {
  /** Storage key prefix */
  prefix?: string;
  /** Default TTL in milliseconds */
  defaultTTL?: number;
  /** Enable compression */
  compress?: boolean;
}

/**
 * Storage entry
 */
interface StorageEntry<T = any> {
  /** Stored data */
  data: T;
  /** Expiration timestamp */
  expires?: number;
  /** Created timestamp */
  created: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<LocalStorageOptions> = {
  prefix: 'fyr:',
  defaultTTL: 0,
  compress: false,
};

/**
 * Local Storage manager
 */
export class LocalStorageManager {
  private options: Required<LocalStorageOptions>;

  constructor(options: LocalStorageOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Set a value in localStorage
   */
  set<T = any>(key: string, value: T, ttl?: number): void {
    const fullKey = this.getFullKey(key);
    const entry: StorageEntry<T> = {
      data: value,
      created: Date.now(),
      expires: ttl !== undefined && ttl > 0 ? Date.now() + ttl : this.options.defaultTTL > 0 ? Date.now() + this.options.defaultTTL : undefined,
    };

    try {
      const serialized = JSON.stringify(entry);
      localStorage.setItem(fullKey, serialized);
    } catch (error) {
      console.error(`[Fyr] Error saving to localStorage:`, error);
    }
  }

  /**
   * Get a value from localStorage
   */
  get<T = any>(key: string): T | null {
    const fullKey = this.getFullKey(key);
    const value = localStorage.getItem(fullKey);

    if (!value) {
      return null;
    }

    try {
      const entry = JSON.parse(value) as StorageEntry<T>;

      // Check expiration
      if (entry.expires && Date.now() > entry.expires) {
        localStorage.removeItem(fullKey);
        return null;
      }

      return entry.data;
    } catch {
      // If parsing fails, return null
      return null;
    }
  }

  /**
   * Remove a value from localStorage
   */
  remove(key: string): void {
    const fullKey = this.getFullKey(key);
    localStorage.removeItem(fullKey);
  }

  /**
   * Check if a key exists in localStorage
   */
  has(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * Clear all localStorage entries with the prefix
   */
  clear(): void {
    const keys = this.getKeys();
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Get all keys with the prefix
   */
  getKeys(): string[] {
    const keys: string[] = [];
    const prefix = this.options.prefix;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
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
  setOptions(options: Partial<LocalStorageOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): Required<LocalStorageOptions> {
    return { ...this.options };
  }

  /**
   * Get storage size (in bytes)
   */
  getSize(): number {
    let size = 0;
    const keys = this.getKeys();
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    }
    return size;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    let count = 0;
    const keys = this.getKeys();
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const entry = JSON.parse(value);
          if (entry.expires && Date.now() > entry.expires) {
            localStorage.removeItem(key);
            count++;
          }
        } catch {
          // If parsing fails, remove the item
          localStorage.removeItem(key);
          count++;
        }
      }
    }
    return count;
  }
}

/**
 * Default local storage instance
 */
export const localStorageManager = new LocalStorageManager();

/**
 * Export default instance
 */
export default localStorageManager;