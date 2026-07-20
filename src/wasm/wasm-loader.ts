/**
 * WASM Loader
 * Loads WebAssembly modules from URLs
 */

import { WasmError, createWasmError } from './wasm-errors';
import type { WasmCache } from './wasm-cache';

/**
 * WASM loader options
 */
export interface WasmLoaderOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Default timeout in milliseconds */
  defaultTimeout?: number;
  /** Allowed origins for WASM files */
  allowedOrigins?: string[];
  /** Cache instance */
  cache?: WasmCache;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<WasmLoaderOptions> = {
  debug: false,
  defaultTimeout: 30000,
  allowedOrigins: ['*'],
  cache: null as any,
};

/**
 * WASM Loader
 */
export class WasmLoader {
  private options: Required<WasmLoaderOptions>;

  constructor(options: WasmLoaderOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Load a WebAssembly module
   */
  async load(
    name: string,
    url: string,
    options?: { imports?: WebAssembly.Imports; timeout?: number }
  ): Promise<WebAssembly.Module> {
    // Check if URL is allowed
    if (!this.isUrlAllowed(url)) {
      throw createWasmError(
        `URL '${url}' is not allowed`,
        'URL_NOT_ALLOWED'
      );
    }

    // Check cache
    if (this.options.cache) {
      const cached = this.options.cache.get(name);
      if (cached) {
        this.log(`Using cached WASM module: ${name}`);
        return cached;
      }
    }

    const timeout = options?.timeout || this.options.defaultTimeout;

    try {
      this.log(`Fetching WASM: ${url}`);

      // Fetch the WASM file
      const response = await this.fetchWithTimeout(url, timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the bytes
      const bytes = await response.arrayBuffer();

      // Compile the WASM module
      const module = await WebAssembly.compile(bytes);

      // Cache the module
      if (this.options.cache) {
        this.options.cache.set(name, module);
      }

      this.log(`WASM module loaded: ${name}`);
      return module;
    } catch (error) {
      this.log(`Failed to load WASM: ${error}`);
      throw createWasmError(
        `Failed to load WASM from '${url}': ${error instanceof Error ? error.message : String(error)}`,
        'LOAD_ERROR'
      );
    }
  }

  /**
   * Fetch with timeout
   */
  private fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return fetch(url, {
      signal: controller.signal,
      credentials: 'same-origin',
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  /**
   * Check if URL is allowed
   */
  private isUrlAllowed(url: string): boolean {
    const allowed = this.options.allowedOrigins;

    if (allowed.includes('*')) {
      return true;
    }

    try {
      const urlObj = new URL(url);
      const origin = urlObj.origin;

      for (const pattern of allowed) {
        if (pattern === origin) {
          return true;
        }
        if (pattern.startsWith('*') && origin.endsWith(pattern.slice(1))) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[WASM Loader] ${message}`, ...data);
    }
  }

  /**
   * Update options
   */
  setOptions(options: Partial<WasmLoaderOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * Default WASM loader instance
 */
export const wasmLoader = new WasmLoader();