/**
 * WASM Errors
 * Custom error types for WASM plugin
 */

/**
 * WASM error codes
 */
export const WasmErrorCode = {
  /** Module not loaded */
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  /** Module already registered */
  DUPLICATE_MODULE: 'DUPLICATE_MODULE',
  /** Export not found */
  EXPORT_NOT_FOUND: 'EXPORT_NOT_FOUND',
  /** Call error */
  CALL_ERROR: 'CALL_ERROR',
  /** Load error */
  LOAD_ERROR: 'LOAD_ERROR',
  /** Compile error */
  COMPILE_ERROR: 'COMPILE_ERROR',
  /** Instantiate error */
  INSTANTIATE_ERROR: 'INSTANTIATE_ERROR',
  /** Instance error */
  INSTANCE_ERROR: 'INSTANCE_ERROR',
  /** Instance destroyed */
  INSTANCE_DESTROYED: 'INSTANCE_DESTROYED',
  /** Instance not ready */
  INSTANCE_NOT_READY: 'INSTANCE_NOT_READY',
  /** No exports */
  NO_EXPORTS: 'NO_EXPORTS',
  /** URL not allowed */
  URL_NOT_ALLOWED: 'URL_NOT_ALLOWED',
  /** Memory not found */
  MEMORY_NOT_FOUND: 'MEMORY_NOT_FOUND',
  /** Memory limit exceeded */
  MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
  /** Loader not initialized */
  LOADER_NOT_INITIALIZED: 'LOADER_NOT_INITIALIZED',
  /** Registry not initialized */
  REGISTRY_NOT_INITIALIZED: 'REGISTRY_NOT_INITIALIZED',
  /** Timeout error */
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  /** Unknown error */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type WasmErrorCodeType = typeof WasmErrorCode[keyof typeof WasmErrorCode];

/**
 * WASM Error class
 */
export class WasmError extends Error {
  public readonly code: WasmErrorCodeType | string;
  public readonly details?: any;

  constructor(
    message: string,
    code: WasmErrorCodeType | string = WasmErrorCode.UNKNOWN_ERROR,
    details?: any
  ) {
    super(message);
    this.name = 'WasmError';
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WasmError);
    }
  }

  /**
   * Check if the error is a load error
   */
  isLoadError(): boolean {
    return [
      WasmErrorCode.LOAD_ERROR,
      WasmErrorCode.COMPILE_ERROR,
      WasmErrorCode.URL_NOT_ALLOWED,
      WasmErrorCode.TIMEOUT_ERROR,
    ].includes(this.code as WasmErrorCodeType);
  }

  /**
   * Check if the error is an instance error
   */
  isInstanceError(): boolean {
    return [
      WasmErrorCode.INSTANCE_ERROR,
      WasmErrorCode.INSTANTIATE_ERROR,
      WasmErrorCode.INSTANCE_DESTROYED,
      WasmErrorCode.INSTANCE_NOT_READY,
    ].includes(this.code as WasmErrorCodeType);
  }

  /**
   * Check if the error is a call error
   */
  isCallError(): boolean {
    return [
      WasmErrorCode.CALL_ERROR,
      WasmErrorCode.EXPORT_NOT_FOUND,
      WasmErrorCode.NO_EXPORTS,
    ].includes(this.code as WasmErrorCodeType);
  }

  /**
   * Check if the error is a memory error
   */
  isMemoryError(): boolean {
    return [
      WasmErrorCode.MEMORY_NOT_FOUND,
      WasmErrorCode.MEMORY_LIMIT_EXCEEDED,
    ].includes(this.code as WasmErrorCodeType);
  }
}

/**
 * Create a WASM error
 */
export function createWasmError(
  message: string,
  code?: WasmErrorCodeType | string,
  details?: any
): WasmError {
  return new WasmError(message, code, details);
}

/**
 * Check if an error is a WASM error
 */
export function isWasmError(error: unknown): error is WasmError {
  return error instanceof WasmError;
}

/**
 * Get error message from unknown error
 */
export function getWasmErrorMessage(error: unknown): string {
  if (error instanceof WasmError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Get error code from unknown error
 */
export function getWasmErrorCode(error: unknown): string {
  if (error instanceof WasmError) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.name || WasmErrorCode.UNKNOWN_ERROR;
  }
  return WasmErrorCode.UNKNOWN_ERROR;
}