/**
 * Action Client
 * Handles server action calls with caching, retry, and error handling
 */

import { httpClient } from '../http/client';
import { ActionError, createActionError } from './action-error';
import { ActionCache, actionCache, type ActionCacheOptions } from './action-cache';
import type { HttpResponse } from '../http/response';

/**
 * Action options
 */
export interface ActionOptions {
  /** Action timeout in milliseconds */
  timeout?: number;
  /** Cache configuration */
  cache?: ActionCacheOptions | boolean;
  /** Whether to retry on failure */
  retry?: boolean | number;
  /** Headers to include */
  headers?: Record<string, string>;
  /** Whether to include credentials */
  credentials?: RequestCredentials;
}

/**
 * Action response
 */
export interface ActionResponse<T = any> {
  /** Whether the action succeeded */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  code?: string;
  /** HTTP status code */
  status?: number;
}

/**
 * Action client configuration
 */
export interface ActionClientConfig {
  /** Base URL for actions */
  baseURL?: string;
  /** Default action path prefix */
  actionPath?: string;
  /** Default timeout */
  timeout?: number;
  /** Whether to use caching by default */
  cache?: boolean | ActionCacheOptions;
  /** Default retry count */
  retry?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ActionClientConfig = {
  baseURL: '',
  actionPath: '/_fyr/actions',
  timeout: 30000,
  cache: false,
  retry: 0,
};

/**
 * Action Client
 */
export class ActionClient {
  private config: ActionClientConfig;
  private cache: ActionCache;

  constructor(config: ActionClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new ActionCache();
  }

  /**
   * Call a server action
   * @param name - Action name (e.g., 'dashboard.stats')
   * @param payload - Action payload
   * @param options - Action options
   * @returns Action response
   */
  async call<T = any>(
    name: string,
    payload: any = {},
    options: ActionOptions = {}
  ): Promise<ActionResponse<T>> {
    const startTime = Date.now();

    try {
      // Build URL
      const url = this.buildActionURL(name);

      // Build cache key
      const cacheKey = this.buildCacheKey(name, payload);

      // Check cache
      const cacheOptions = this.getCacheOptions(options);
      if (cacheOptions && this.cache.isEnabled()) {
        const cached = this.cache.get<T>(cacheKey);
        if (cached !== null && cached !== undefined) {
          // Check if cache is still valid
          if (typeof cacheOptions === 'object' && cacheOptions.ttl) {
            const age = Date.now() - this.cache.getTimestamp(cacheKey);
            if (age < cacheOptions.ttl) {
              return {
                success: true,
                data: cached,
                status: 200,
              };
            }
          } else {
            return {
              success: true,
              data: cached,
              status: 200,
            };
          }
        }
      }

      // Prepare request
      const method = 'POST';
      const headers = this.buildHeaders(options);
      const timeout = options.timeout || this.config.timeout;

      // Execute request with retry
      let lastError: Error | null = null;
      const maxRetries = options.retry !== undefined
        ? (typeof options.retry === 'number' ? options.retry : (options.retry ? 3 : 0))
        : (this.config.retry || 0);

      let attempt = 0;
      let response: HttpResponse | null = null;

      while (attempt <= maxRetries) {
        try {
          response = await httpClient.request({
            url,
            method,
            headers,
            body: { data: payload },
            timeout,
            credentials: options.credentials || 'include',
          });

          // Check if response is successful
          if (response.ok) {
            // Cache response if enabled
            if (cacheOptions) {
              const data = response.data?.data ?? response.data;
              this.cache.set(cacheKey, data, typeof cacheOptions === 'object' ? cacheOptions.ttl : undefined);
            }

            return {
              success: true,
              data: response.data?.data ?? response.data,
              status: response.status,
            };
          }

          // Handle error response
          lastError = createActionError(
            response.data?.error || response.data?.message || 'Action failed',
            response.data?.code || 'ACTION_FAILED',
            response.status,
            response.data
          );
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          attempt++;

          // Check if we should retry
          if (attempt <= maxRetries && this.shouldRetry(lastError)) {
            // Wait before retrying (exponential backoff)
            await this.wait(attempt * 1000);
            continue;
          }
          break;
        }
      }

      // If we have an error response
      if (lastError) {
        const actionError = lastError instanceof ActionError
          ? lastError
          : createActionError(
              lastError.message || 'Action failed',
              'ACTION_ERROR',
              500
            );

        return {
          success: false,
          error: actionError.message,
          code: actionError.code,
          status: actionError.status || 500,
        };
      }

      // Fallback error
      return {
        success: false,
        error: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        status: 500,
      };
    } catch (error) {
      const actionError = error instanceof ActionError
        ? error
        : createActionError(
            error instanceof Error ? error.message : 'Action failed',
            'ACTION_ERROR',
            500
          );

      return {
        success: false,
        error: actionError.message,
        code: actionError.code,
        status: actionError.status || 500,
      };
    }
  }

  /**
   * Build action URL
   */
  private buildActionURL(name: string): string {
    const base = this.config.baseURL || '';
    const path = this.config.actionPath || '/_fyr/actions';
    const cleanBase = base.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
    const cleanName = name.replace(/^\//, '');

    return `${cleanBase}/${cleanPath}/${cleanName}`;
  }

  /**
   * Build cache key
   */
  private buildCacheKey(name: string, payload: any): string {
    const payloadStr = JSON.stringify(payload);
    return `${name}:${payloadStr}`;
  }

  /**
   * Build request headers
   */
  private buildHeaders(options: ActionOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    return headers;
  }

  /**
   * Get cache options
   */
  private getCacheOptions(options: ActionOptions): ActionCacheOptions | boolean | null {
    const cacheOption = options.cache !== undefined ? options.cache : this.config.cache;

    if (!cacheOption) {
      return null;
    }

    if (typeof cacheOption === 'boolean') {
      return cacheOption ? { enabled: true } : null;
    }

    return { enabled: true, ...cacheOption };
  }

  /**
   * Check if an error should be retried
   */
  private shouldRetry(error: Error): boolean {
    // Retry on network errors and timeouts
    if (error instanceof TypeError) return true;
    if (error.message?.includes('timeout')) return true;
    if (error.message?.includes('network')) return true;
    if (error.message?.includes('ECONNREFUSED')) return true;
    if (error.message?.includes('fetch')) return true;

    // Don't retry on application errors (4xx) except rate limiting (429)
    if (error instanceof ActionError) {
      const status = error.status || 0;
      if (status === 429) return true;
      if (status >= 500) return true;
      if (status < 400) return true;
      return false;
    }

    return false;
  }

  /**
   * Wait for a specified time
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<ActionClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ActionClientConfig {
    return { ...this.config };
  }

  /**
   * Clear action cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      this.cache.clearMatching(pattern);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Invalidate cache for a specific action
   */
  invalidate(name: string, payload?: any): void {
    if (payload !== undefined) {
      const key = this.buildCacheKey(name, payload);
      this.cache.delete(key);
    } else {
      // Invalidate all cache entries for this action
      const prefix = `${name}:`;
      const keys = this.cache.getKeys().filter(key => key.startsWith(prefix));
      for (const key of keys) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    const keys = this.cache.getKeys();
    return {
      size: keys.length,
      keys,
    };
  }
}

/**
 * Default action client instance
 */
export const actionClient = new ActionClient();

/**
 * Export default instance as Fyr.action
 */
export default actionClient;