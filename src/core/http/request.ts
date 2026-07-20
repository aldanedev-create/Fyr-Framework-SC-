/**
 * HTTP Request
 * Request building and configuration
 */

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Request options
 */
export interface RequestOptions {
  /** URL for the request */
  url: string;
  /** HTTP method */
  method?: HttpMethod;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** Query parameters */
  params?: Record<string, any>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Credentials mode */
  credentials?: RequestCredentials;
  /** Abort signal */
  signal?: AbortSignal;
}

/**
 * Internal request configuration
 */
export interface RequestConfig extends RequestOptions {
  method: HttpMethod;
  url: string;
}

/**
 * Create a request configuration
 */
export function createRequest(options: RequestOptions): RequestConfig {
  return {
    url: options.url,
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body,
    params: options.params,
    timeout: options.timeout,
    credentials: options.credentials,
    signal: options.signal,
  };
}

/**
 * Create a GET request
 */
export function createGetRequest(url: string, params?: Record<string, any>): RequestConfig {
  return createRequest({ url, method: 'GET', params });
}

/**
 * Create a POST request
 */
export function createPostRequest(url: string, body?: any): RequestConfig {
  return createRequest({ url, method: 'POST', body });
}

/**
 * Create a PUT request
 */
export function createPutRequest(url: string, body?: any): RequestConfig {
  return createRequest({ url, method: 'PUT', body });
}

/**
 * Create a PATCH request
 */
export function createPatchRequest(url: string, body?: any): RequestConfig {
  return createRequest({ url, method: 'PATCH', body });
}

/**
 * Create a DELETE request
 */
export function createDeleteRequest(url: string): RequestConfig {
  return createRequest({ url, method: 'DELETE' });
}

/**
 * Validate request configuration
 */
export function validateRequest(config: RequestConfig): boolean {
  if (!config.url || config.url.trim() === '') {
    throw new Error('Request URL is required');
  }

  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(config.method)) {
    throw new Error(`Invalid HTTP method: ${config.method}`);
  }

  return true;
}

/**
 * Clone request configuration
 */
export function cloneRequestConfig(config: RequestConfig): RequestConfig {
  return {
    url: config.url,
    method: config.method,
    headers: { ...config.headers },
    body: config.body,
    params: { ...config.params },
    timeout: config.timeout,
    credentials: config.credentials,
    signal: config.signal,
  };
}

/**
 * Merge request configurations
 */
export function mergeRequestConfigs(
  base: RequestConfig,
  override: Partial<RequestConfig>
): RequestConfig {
  return {
    ...base,
    ...override,
    headers: { ...base.headers, ...override.headers },
    params: { ...base.params, ...override.params },
  };
}