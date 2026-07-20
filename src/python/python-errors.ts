/**
 * Python Errors
 * Custom error types for Python plugin
 */

/**
 * Python error codes
 */
export const PythonErrorCode = {
  /** Runtime not loaded */
  NOT_LOADED: 'NOT_LOADED',
  /** Runtime not initialized */
  RUNTIME_NOT_INITIALIZED: 'RUNTIME_NOT_INITIALIZED',
  /** Initialization error */
  INIT_ERROR: 'INIT_ERROR',
  /** Load error */
  LOAD_ERROR: 'LOAD_ERROR',
  /** Execution error */
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  /** Evaluation error */
  EVAL_ERROR: 'EVAL_ERROR',
  /** Package error */
  PACKAGE_ERROR: 'PACKAGE_ERROR',
  /** Package install error */
  PACKAGE_INSTALL_ERROR: 'PACKAGE_INSTALL_ERROR',
  /** Package not allowed */
  PACKAGE_NOT_ALLOWED: 'PACKAGE_NOT_ALLOWED',
  /** Worker error */
  WORKER_ERROR: 'WORKER_ERROR',
  /** Worker terminated */
  WORKER_TERMINATED: 'WORKER_TERMINATED',
  /** Bridge error */
  BRIDGE_ERROR: 'BRIDGE_ERROR',
  /** Bridge function not found */
  BRIDGE_FUNCTION_NOT_FOUND: 'BRIDGE_FUNCTION_NOT_FOUND',
  /** Bridge call error */
  BRIDGE_CALL_ERROR: 'BRIDGE_CALL_ERROR',
  /** Timeout error */
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  /** Unknown error */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type PythonErrorCodeType = typeof PythonErrorCode[keyof typeof PythonErrorCode];

/**
 * Python Error class
 */
export class PythonError extends Error {
  public readonly code: PythonErrorCodeType | string;
  public readonly details?: any;

  constructor(
    message: string,
    code: PythonErrorCodeType | string = PythonErrorCode.UNKNOWN_ERROR,
    details?: any
  ) {
    super(message);
    this.name = 'PythonError';
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PythonError);
    }
  }

  /**
   * Check if the error is a runtime error
   */
  isRuntimeError(): boolean {
    return [
      PythonErrorCode.NOT_LOADED,
      PythonErrorCode.RUNTIME_NOT_INITIALIZED,
      PythonErrorCode.INIT_ERROR,
      PythonErrorCode.LOAD_ERROR,
    ].includes(this.code as PythonErrorCodeType);
  }

  /**
   * Check if the error is an execution error
   */
  isExecutionError(): boolean {
    return [
      PythonErrorCode.EXECUTION_ERROR,
      PythonErrorCode.EVAL_ERROR,
      PythonErrorCode.TIMEOUT_ERROR,
    ].includes(this.code as PythonErrorCodeType);
  }

  /**
   * Check if the error is a package error
   */
  isPackageError(): boolean {
    return [
      PythonErrorCode.PACKAGE_ERROR,
      PythonErrorCode.PACKAGE_INSTALL_ERROR,
      PythonErrorCode.PACKAGE_NOT_ALLOWED,
    ].includes(this.code as PythonErrorCodeType);
  }

  /**
   * Check if the error is a worker error
   */
  isWorkerError(): boolean {
    return [
      PythonErrorCode.WORKER_ERROR,
      PythonErrorCode.WORKER_TERMINATED,
    ].includes(this.code as PythonErrorCodeType);
  }

  /**
   * Check if the error is a bridge error
   */
  isBridgeError(): boolean {
    return [
      PythonErrorCode.BRIDGE_ERROR,
      PythonErrorCode.BRIDGE_FUNCTION_NOT_FOUND,
      PythonErrorCode.BRIDGE_CALL_ERROR,
    ].includes(this.code as PythonErrorCodeType);
  }
}

/**
 * Create a Python error
 */
export function createPythonError(
  message: string,
  code?: PythonErrorCodeType | string,
  details?: any
): PythonError {
  return new PythonError(message, code, details);
}

/**
 * Check if an error is a Python error
 */
export function isPythonError(error: unknown): error is PythonError {
  return error instanceof PythonError;
}

/**
 * Get error message from unknown error
 */
export function getPythonErrorMessage(error: unknown): string {
  if (error instanceof PythonError) {
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
export function getPythonErrorCode(error: unknown): string {
  if (error instanceof PythonError) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.name || PythonErrorCode.UNKNOWN_ERROR;
  }
  return PythonErrorCode.UNKNOWN_ERROR;
}