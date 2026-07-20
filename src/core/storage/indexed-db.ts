/**
 * IndexedDB Storage
 * Wrapper for IndexedDB with promise-based API
 */

/**
 * IndexedDB options
 */
export interface IndexedDBOptions {
  /** Database name */
  dbName?: string;
  /** Database version */
  version?: number;
  /** Object store name */
  storeName?: string;
  /** Storage key prefix */
  prefix?: string;
  /** Default TTL in milliseconds */
  defaultTTL?: number;
}

/**
 * Storage entry
 */
interface StorageEntry<T = any> {
  /** Storage key */
  key: string;
  /** Stored data */
  data: T;
  /** Expiration timestamp */
  expires?: number;
  /** Created timestamp */
  created: number;
  /** Updated timestamp */
  updated: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<IndexedDBOptions> = {
  dbName: 'fyr-storage',
  version: 1,
  storeName: 'fyr-store',
  prefix: '',
  defaultTTL: 0,
};

/**
 * IndexedDB Storage manager
 */
export class IndexedDBManager {
  private options: Required<IndexedDBOptions>;
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isInitialized: boolean = false;

  constructor(options: IndexedDBOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.options.dbName, this.options.version);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.options.storeName)) {
          const store = db.createObjectStore(this.options.storeName, {
            keyPath: 'key',
          });
          store.createIndex('expires', 'expires', { unique: false });
          store.createIndex('created', 'created', { unique: false });
          store.createIndex('updated', 'updated', { unique: false });
        }
      };
    });

    await this.dbPromise;
  }

  /**
   * Get the database connection
   */
  private async getDB(): Promise<IDBDatabase> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.db!;
  }

  /**
   * Set a value in IndexedDB
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const db = await this.getDB();
    const fullKey = this.getFullKey(key);

    const entry: StorageEntry<T> = {
      key: fullKey,
      data: value,
      created: Date.now(),
      updated: Date.now(),
      expires: ttl !== undefined && ttl > 0
        ? Date.now() + ttl
        : this.options.defaultTTL > 0
          ? Date.now() + this.options.defaultTTL
          : undefined,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.put(entry);

      request.onerror = () => {
        reject(new Error(`Failed to save to IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Get a value from IndexedDB
   */
  async get<T = any>(key: string): Promise<T | null> {
    const db = await this.getDB();
    const fullKey = this.getFullKey(key);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], 'readonly');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.get(fullKey);

      request.onerror = () => {
        reject(new Error(`Failed to get from IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const entry = request.result as StorageEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check expiration
        if (entry.expires && Date.now() > entry.expires) {
          // Delete expired entry
          this.remove(key).catch(() => {});
          resolve(null);
          return;
        }

        resolve(entry.data);
      };
    });
  }

  /**
   * Remove a value from IndexedDB
   */
  async remove(key: string): Promise<void> {
    const db = await this.getDB();
    const fullKey = this.getFullKey(key);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.delete(fullKey);

      request.onerror = () => {
        reject(new Error(`Failed to remove from IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Check if a key exists in IndexedDB
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get all entries from IndexedDB
   */
  async getAll<T = any>(): Promise<Record<string, T>> {
    const db = await this.getDB();
    const result: Record<string, T> = {};

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], 'readonly');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error(`Failed to get all from IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const entries = request.result as StorageEntry<T>[];
        for (const entry of entries) {
          // Check expiration
          if (entry.expires && Date.now() > entry.expires) {
            continue;
          }
          const key = this.getCleanKey(entry.key);
          result[key] = entry.data;
        }
        resolve(result);
      };
    });
  }

  /**
   * Get all keys from IndexedDB
   */
  async getKeys(): Promise<string[]> {
    const db = await this.getDB();
    const keys: string[] = [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], 'readonly');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.getAllKeys();

      request.onerror = () => {
        reject(new Error(`Failed to get keys from IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const rawKeys = request.result as string[];
        for (const key of rawKeys) {
          const cleanKey = this.getCleanKey(key);
          keys.push(cleanKey);
        }
        resolve(keys);
      };
    });
  }

  /**
   * Clear all entries from IndexedDB
   */
  async clear(): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.clear();

      request.onerror = () => {
        reject(new Error(`Failed to clear IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Get count of entries
   */
  async count(): Promise<number> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], 'readonly');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.count();

      request.onerror = () => {
        reject(new Error(`Failed to count IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<number> {
    const db = await this.getDB();
    let count = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const request = store.index('expires');

      // Get all entries with expires <= now
      const range = IDBKeyRange.upperBound(Date.now());
      const cursorRequest = request.openCursor(range);

      cursorRequest.onerror = () => {
        reject(new Error(`Failed to clear expired: ${cursorRequest.error?.message}`));
      };

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          count++;
          cursor.continue();
        } else {
          resolve(count);
        }
      };
    });
  }

  /**
   * Get the full key with prefix
   */
  getFullKey(key: string): string {
    return this.options.prefix ? `${this.options.prefix}${key}` : key;
  }

  /**
   * Get the clean key (without prefix)
   */
  getCleanKey(fullKey: string): string {
    if (this.options.prefix && fullKey.startsWith(this.options.prefix)) {
      return fullKey.slice(this.options.prefix.length);
    }
    return fullKey;
  }

  /**
   * Update options
   */
  setOptions(options: Partial<IndexedDBOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): Required<IndexedDBOptions> {
    return { ...this.options };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

/**
 * Default IndexedDB instance
 */
export const indexedDBManager = new IndexedDBManager();

/**
 * Export default instance
 */
export default indexedDBManager;