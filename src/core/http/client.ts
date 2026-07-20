/**
 * HTTP Client
 * Main HTTP client with interceptors and configuration
 */

import { createRequest, type RequestOptions, type RequestConfig } from './request';
import { createResponse, type HttpResponse, type ResponseData } from './response';
import { HttpError, NetworkError, TimeoutError, AbortError } from './errors';
import { RetryManager, type RetryOptions } from './retry';
import { TimeoutManager } from './timeout';
import { CSRFManager, type CSRFConfig } from './csrf';

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  /** Base URL for all requests */
  baseURL?: string;
  /** Default headers */
  headers?: Record<string, string>;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Credentials mode */
  credentials?: RequestCredentials;
  /** Retry configuration */
  retry?: RetryOptions;
  /** CSRF configuration */
  csrf?: CSRFConfig;
  /** Request interceptors */
  requestInterceptors?: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>>;
  /** Response interceptors */
  responseInterceptors?: Array<(response: HttpResponse) => HttpResponse | Promise<HttpResponse>>;
  /** Error interceptors */
  errorInterceptors?: Array<(error: Error) => Error | Promise<Error>>;
}

/**
 * Request interceptor function
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

/**
 * Response interceptor function
 */
export type ResponseInterceptor = (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;

/**
 * Error interceptor function
 */
export type ErrorInterceptor = (error: Error) => Error | Promise<Error>;

/**
 * HTTP Client
 */
export class HttpClient {
  private config: HttpClientConfig;
  private retryManager: RetryManager;
  private timeoutManager: TimeoutManager;
  private csrfManager: CSRFManager;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      headers: config.headers || {},
      timeout: config.timeout || 30000,
      credentials: config.credentials || 'include',
      retry: config.retry || { maxRetries: 3, delay: 1000 },
      csrf: config.csrf || { enabled: false },
    };

    this.retryManager = new RetryManager(this.config.retry);
    this.timeoutManager = new TimeoutManager({ timeout: this.config.timeout });
    this.csrfManager = new CSRFManager(this.config.csrf || { enabled: false });

    // Add interceptors from config
    if (config.requestInterceptors) {
      this.requestInterceptors = [...config.requestInterceptors];
    }
    if (config.responseInterceptors) {
      this.responseInterceptors = [...config.responseInterceptors];
    }
    if (config.errorInterceptors) {
      this.errorInterceptors = [...config.errorInterceptors];
    }
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(options: RequestOptions): Promise<HttpResponse<T>> {
    try {
      // 1. Build request config
      let config = this.buildRequestConfig(options);

      // 2. Apply request interceptors
      for (const interceptor of this.requestInterceptors) {
        config = await interceptor(config);
      }

      // 3. Apply CSRF token if enabled
      if (this.csrfManager.isEnabled()) {
        config = await this.csrfManager.applyToken(config);
      }

      // 4. Execute request with retry and timeout
      const response = await this.retryManager.executeWithRetry(async () => {
        return this.timeoutManager.executeWithTimeout(async (signal) => {
          return this.executeRequest<T>(config, signal);
        });
      });

      // 5. Apply response interceptors
      let finalResponse = response;
      for (const interceptor of this.responseInterceptors) {
        finalResponse = await interceptor(finalResponse);
      }

      return finalResponse;
    } catch (error) {
      // Apply error interceptors
      let finalError = error instanceof Error ? error : new Error(String(error));
      for (const interceptor of this.errorInterceptors) {
        finalError = await interceptor(finalError);
      }
      throw finalError;
    }
  }

  /**
   * Execute a single request
   */
  private async executeRequest<T>(
    config: RequestConfig,
    signal?: AbortSignal
  ): Promise<HttpResponse<T>> {
    const { url, method = 'GET', headers = {}, body, credentials } = config;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: credentials || this.config.credentials,
        signal,
      });

      // Parse response
      const data = await this.parseResponseData(response);

      // Create response object
      return createResponse<T>({
        data: data as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AbortError('Request was aborted');
      }
      if (error instanceof Error && error.message === 'Timeout') {
        throw new TimeoutError('Request timed out');
      }
      if (error instanceof TypeError) {
        throw new NetworkError('Network error: ' + error.message);
      }
      throw error;
    }
  }

  /**
   * Parse response data based on content type
   */
  private async parseResponseData(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        // If JSON parsing fails, return text
        return await response.text();
      }
    }

    if (contentType.includes('text/')) {
      return await response.text();
    }

    if (contentType.includes('application/octet-stream')) {
      return await response.arrayBuffer();
    }

    // Default: try to parse as JSON, fallback to text
    try {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      return null;
    }
  }

  /**
   * Build request configuration
   */
  private buildRequestConfig(options: RequestOptions): RequestConfig {
    const url = this.buildURL(options.url, options.params);
    return {
      url,
      method: options.method || 'GET',
      headers: { ...options.headers },
      body: options.body,
      credentials: options.credentials || this.config.credentials,
      timeout: options.timeout || this.config.timeout,
      signal: options.signal,
    };
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(url: string, params?: Record<string, any>): string {
    // Handle base URL
    let fullUrl = url;
    if (this.config.baseURL && !url.startsWith('http://') && !url.startsWith('https://')) {
      const base = this.config.baseURL.replace(/\/$/, '');
      fullUrl = url.startsWith('/') ? base + url : base + '/' + url;
    }

    // Add query parameters
    if (params) {
      const queryString = this.buildQueryString(params);
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    return fullUrl;
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
        }
      } else if (typeof value === 'object') {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`);
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
    return parts.join('&');
  }

  /**
   * Add a request interceptor
   */
  useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add an error interceptor
   */
  useErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * HTTP GET request
   */
  async get<T = any>(url: string, options: Omit<RequestOptions, 'method' | 'url'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'GET' });
  }

  /**
   * HTTP POST request
   */
  async post<T = any>(url: string, body?: any, options: Omit<RequestOptions, 'method' | 'url' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'POST', body });
  }

  /**
   * HTTP PUT request
   */
  async put<T = any>(url: string, body?: any, options: Omit<RequestOptions, 'method' | 'url' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'PUT', body });
  }

  /**
   * HTTP PATCH request
   */
  async patch<T = any>(url: string, body?: any, options: Omit<RequestOptions, 'method' | 'url' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'PATCH', body });
  }

  /**
   * HTTP DELETE request
   */
  async delete<T = any>(url: string, options: Omit<RequestOptions, 'method' | 'url'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'DELETE' });
  }

  /**
   * HTTP HEAD request
   */
  async head<T = any>(url: string, options: Omit<RequestOptions, 'method' | 'url'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'HEAD' });
  }

  /**
   * HTTP OPTIONS request
   */
  async options<T = any>(url: string, options: Omit<RequestOptions, 'method' | 'url'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'OPTIONS' });
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<HttpClientConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.retry) {
      this.retryManager.setOptions(config.retry);
    }
    if (config.timeout !== undefined) {
      this.timeoutManager.setTimeout(config.timeout);
    }
    if (config.csrf !== undefined) {
      this.csrfManager.setConfig(config.csrf);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): HttpClientConfig {
    return { ...this.config };
  }
}

/**
 * Default HTTP client instance
 */
export const httpClient = new HttpClient();

/**
 * Export default instance as Fyr.http
 */
export default httpClient;