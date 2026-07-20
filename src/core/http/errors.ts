/**
 * HTTP Errors
 * Custom error classes for HTTP requests
 */

import type { HttpResponse } from './response';

/**
 * Base HTTP Error
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly response?: HttpResponse;
  public readonly data?: any;

  constructor(
    message: string,
    status: number,
    statusText: string,
    response?: HttpResponse,
    data?: any
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.data = data;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }
}

/**
 * Network Error (connection issues)
 */
export class NetworkError extends HttpError {
  constructor(message: string = 'Network connection error') {
    super(message, 0, 'Network Error');
    this.name = 'NetworkError';
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends HttpError {
  constructor(message: string = 'Request timed out') {
    super(message, 408, 'Timeout Error');
    this.name = 'TimeoutError';
  }
}

/**
 * Abort Error (request cancelled)
 */
export class AbortError extends HttpError {
  constructor(message: string = 'Request aborted') {
    super(message, 499, 'Abort Error');
    this.name = 'AbortError';
  }
}

/**
 * CSRF Error
 */
export class CSRFError extends HttpError {
  constructor(message: string = 'CSRF token validation failed') {
    super(message, 403, 'CSRF Error');
    this.name = 'CSRFError';
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends HttpError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'Authentication Error');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends HttpError {
  constructor(message: string = 'Not authorized') {
    super(message, 403, 'Authorization Error');
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'Not Found');
    this.name = 'NotFoundError';
  }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends HttpError {
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    validationErrors?: Record<string, string[]>
  ) {
    super(message, 422, 'Validation Error');
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

/**
 * Server Error (5xx)
 */
export class ServerError extends HttpError {
  constructor(
    message: string = 'Internal server error',
    status: number = 500
  ) {
    super(message, status, 'Server Error');
    this.name = 'ServerError';
  }
}

/**
 * Parse error from response
 */
export function parseHttpError(
  error: Error,
  response?: Response
): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (error.name === 'AbortError' || error.message === 'Request was aborted') {
    return new AbortError();
  }

  if (error.name === 'TimeoutError' || error.message === 'Request timed out') {
    return new TimeoutError();
  }

  if (error instanceof TypeError) {
    return new NetworkError(error.message);
  }

  if (response) {
    const status = response.status;
    const statusText = response.statusText;

    if (status === 401) return new AuthenticationError();
    if (status === 403) return new AuthorizationError();
    if (status === 404) return new NotFoundError();
    if (status === 422) return new ValidationError();
    if (status >= 500) return new ServerError(statusText, status);

    return new HttpError(error.message, status, statusText);
  }

  return new HttpError(error.message, 0, 'Unknown Error');
}

/**
 * Check if an error is a specific type
 */
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isAbortError(error: unknown): error is AbortError {
  return error instanceof AbortError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError;
}