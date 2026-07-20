/**
 * Timeout Manager
 * Handles request timeouts with abort controllers
 */

/**
 * Timeout options
 */
export interface TimeoutOptions {
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Whether to abort on timeout */
  abortOnTimeout?: boolean;
}

/**
 * Default timeout options
 */
const DEFAULT_TIMEOUT_OPTIONS: Required<TimeoutOptions> = {
  timeout: 30000,
  abortOnTimeout: true,
};

/**
 * Timeout Manager
 */
export class TimeoutManager {
  private options: Required<TimeoutOptions>;

  constructor(options: TimeoutOptions = {}) {
    this.options = { ...DEFAULT_TIMEOUT_OPTIONS, ...options };
  }

  /**
   * Execute a function with timeout
   */
  async executeWithTimeout<T>(
    fn: (signal?: AbortSignal) => Promise<T>,
    timeout?: number
  ): Promise<T> {
    const ms = timeout || this.options.timeout;

    // If no timeout, execute directly
    if (ms <= 0) {
      return await fn();
    }

    // Create abort controller
    const controller = new AbortController();
    const { signal } = controller;

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (this.options.abortOnTimeout) {
        controller.abort();
      }
    }, ms);

    try {
      // Execute with signal
      const result = await fn(signal);
      return result;
    } catch (error) {
      // Check if it's an abort error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout');
      }
      throw error;
    } finally {
      // Clear timeout
      clearTimeout(timeoutId);
    }
  }

  /**
   * Update timeout options
   */
  setTimeout(timeout: number): void {
    this.options.timeout = timeout;
  }

  /**
   * Set abort on timeout behavior
   */
  setAbortOnTimeout(abort: boolean): void {
    this.options.abortOnTimeout = abort;
  }

  /**
   * Get current timeout options
   */
  getOptions(): Required<TimeoutOptions> {
    return { ...this.options };
  }

  /**
   * Create an abort signal with timeout
   */
  createTimeoutSignal(timeout?: number): AbortSignal {
    const ms = timeout || this.options.timeout;
    const controller = new AbortController();

    if (ms > 0) {
      setTimeout(() => {
        if (this.options.abortOnTimeout) {
          controller.abort();
        }
      }, ms);
    }

    return controller.signal;
  }

  /**
   * Reset to default options
   */
  reset(): void {
    this.options = { ...DEFAULT_TIMEOUT_OPTIONS };
  }
}

/**
 * Create a timeout manager with custom options
 */
export function createTimeoutManager(options?: TimeoutOptions): TimeoutManager {
  return new TimeoutManager(options);
}

/**
 * Promise timeout helper
 */
export function promiseTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  onTimeout?: () => void
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (onTimeout) onTimeout();
      reject(new Error('Timeout'));
    }, timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  }) as Promise<T>;
}

/**
 * Abortable promise helper
 */
export function abortablePromise<T>(
  promise: Promise<T>,
  signal: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const abortHandler = () => {
      reject(new Error('Aborted'));
    };

    signal.addEventListener('abort', abortHandler);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal.removeEventListener('abort', abortHandler);
      });
  });
}