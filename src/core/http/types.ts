import type { HttpClientConfig } from './client';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type HttpHeaders = Record<string, string>;
export type HttpOptions = HttpClientConfig;
export type HttpInterceptor<T = unknown> = (value: T) => T | Promise<T>;
export interface FyrHttpError extends Error { status?: number; response?: unknown; }
export { HttpError } from './errors';
