/**
 * HTTP Response
 * Response handling and formatting
 */

import type { RequestConfig } from './request';

/**
 * Response data with type
 */
export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
}

/**
 * HTTP Response wrapper
 */
export interface HttpResponse<T = any> extends ResponseData<T> {
  /** Check if response is OK (status 2xx) */
  ok: boolean;
  /** Get a header value */
  getHeader(name: string): string | null;
  /** Check if a header exists */
  hasHeader(name: string): boolean;
}

/**
 * Create a response object
 */
export function createResponse<T = any>(options: ResponseData<T>): HttpResponse<T> {
  const { data, status, statusText, headers, config } = options;

  return {
    data,
    status,
    statusText,
    headers,
    config,
    ok: status >= 200 && status < 300,

    getHeader(name: string): string | null {
      return headers.get(name);
    },

    hasHeader(name: string): boolean {
      return headers.has(name);
    },
  };
}

/**
 * Create a successful response
 */
export function createSuccessResponse<T>(
  data: T,
  options: {
    status?: number;
    statusText?: string;
    config?: RequestConfig;
  } = {}
): HttpResponse<T> {
  return createResponse({
    data,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    headers: new Headers(),
    config: options.config || { url: '', method: 'GET' },
  });
}

/**
 * Create an error response
 */
export function createErrorResponse(
  status: number,
  statusText: string,
  data?: any,
  config: RequestConfig = { url: '', method: 'GET' }
): HttpResponse {
  return createResponse({
    data: data || { error: statusText },
    status,
    statusText,
    headers: new Headers(),
    config,
  });
}

/**
 * Check if a response is successful
 */
export function isSuccessResponse(response: HttpResponse): boolean {
  return response.ok;
}

/**
 * Get response data with error handling
 */
export function getResponseData<T>(response: HttpResponse<T>): T {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
  }
  return response.data;
}

/**
 * Extract JSON data from response
 */
export async function extractJsonData<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Extract text data from response
 */
export async function extractTextData(response: Response): Promise<string> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
  }
  return await response.text();
}