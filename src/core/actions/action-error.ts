/**
 * Action Error
 * Custom error for server action failures
 */

/**
 * Action error codes
 */
export const ActionErrorCode = {
  /** Action not found */
  NOT_FOUND: 'ACTION_NOT_FOUND',
  /** Validation failed */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Authentication required */
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  /** Not authorized */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** Rate limited */
  RATE_LIMITED: 'RATE_LIMITED',
  /** Internal server error */
  SERVER_ERROR: 'SERVER_ERROR',
  /** Network error */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** Timeout error */
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  /** Unknown error */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ActionErrorCodeType = typeof ActionErrorCode[keyof typeof ActionErrorCode];

/**
 * Action Error
 */
export class ActionError extends Error {
  public readonly code: ActionErrorCodeType | string;
  public readonly status?: number;
  public readonly details?: any;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: ActionErrorCodeType | string = ActionErrorCode.UNKNOWN_ERROR,
    status?: number,
    details?: any,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ActionError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ActionError);
    }
  }

  /**
   * Check if the error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }

  /**
   * Check if the error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status !== undefined && this.status >= 500 && this.status < 600;
  }

  /**
   * Check if the error is a network error
   */
  isNetworkError(): boolean {
    return this.code === ActionErrorCode.NETWORK_ERROR;
  }

  /**
   * Check if the error is a timeout error
   */
  isTimeoutError(): boolean {
    return this.code === ActionErrorCode.TIMEOUT_ERROR;
  }

  /**
   * Check if the error is a validation error
   */
  isValidationError(): boolean {
    return this.code === ActionErrorCode.VALIDATION_ERROR;
  }
}

/**
 * Create an action error from a response or error
 */
export function createActionError(
  message: string,
  code?: ActionErrorCodeType | string,
  status?: number,
  details?: any,
  originalError?: Error
): ActionError {
  // Determine error code from status if not provided
  if (!code && status) {
    if (status === 404) code = ActionErrorCode.NOT_FOUND;
    else if (status === 401) code = ActionErrorCode.UNAUTHENTICATED;
    else if (status === 403) code = ActionErrorCode.UNAUTHORIZED;
    else if (status === 429) code = ActionErrorCode.RATE_LIMITED;
    else if (status >= 500) code = ActionErrorCode.SERVER_ERROR;
  }

  return new ActionError(
    message,
    code || ActionErrorCode.UNKNOWN_ERROR,
    status,
    details,
    originalError
  );
}

/**
 * Check if an error is an ActionError
 */
export function isActionError(error: unknown): error is ActionError {
  return error instanceof ActionError;
}

/**
 * Get error message from unknown error
 */
export function getActionErrorMessage(error: unknown): string {
  if (error instanceof ActionError) {
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
export function getActionErrorCode(error: unknown): string {
  if (error instanceof ActionError) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.name || ActionErrorCode.UNKNOWN_ERROR;
  }
  return ActionErrorCode.UNKNOWN_ERROR;
}

/**
 * Get error status from unknown error
 */
export function getActionErrorStatus(error: unknown): number | undefined {
  if (error instanceof ActionError) {
    return error.status;
  }
  return undefined;
}