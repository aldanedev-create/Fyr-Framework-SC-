/**
 * Retry Manager
 * Handles request retries with exponential backoff
 */

/**
 * Retry options
 */
export interface RetryOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  delay?: number;
  /** Backoff factor (multiplier for each retry) */
  backoffFactor?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Retry condition function */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Retry strategy */
  strategy?: RetryStrategy;
}

/**
 * Retry strategy
 */
export type RetryStrategy = 'linear' | 'exponential' | 'fibonacci' | 'custom';

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  backoffFactor: 2,
  maxDelay: 30000,
  shouldRetry: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof TypeError) return true;
    if (error.message === 'Request timed out') return true;
    if (error.name === 'AbortError') return false;
    if (error instanceof HttpError) {
      // Retry on 5xx server errors
      return error.status >= 500 && error.status < 600;
    }
    return false;
  },
  strategy: 'exponential',
};

/**
 * Retry Manager
 */
export class RetryManager {
  private options: Required<RetryOptions>;

  constructor(options: RetryOptions = {}) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.options.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        attempt++;
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        if (attempt > this.options.maxRetries || !this.options.shouldRetry(lastError, attempt)) {
          break;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt);

        // Wait before retrying
        await this.wait(delay);
      }
    }

    throw lastError || new Error('Retry failed');
  }

  /**
   * Calculate delay for retry attempt
   */
  private calculateDelay(attempt: number): number {
    const { strategy, delay, backoffFactor, maxDelay } = this.options;

    let baseDelay = delay;

    switch (strategy) {
      case 'linear':
        baseDelay = delay * attempt;
        break;

      case 'exponential':
        baseDelay = delay * Math.pow(backoffFactor, attempt - 1);
        break;

      case 'fibonacci':
        baseDelay = delay * this.fibonacci(attempt);
        break;

      case 'custom':
      default:
        // Use base delay with slight jitter
        baseDelay = delay * (1 + Math.random() * 0.1);
        break;
    }

    // Add jitter to prevent thundering herd
    const jitter = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    const finalDelay = Math.min(baseDelay * jitter, maxDelay);

    return Math.max(0, finalDelay);
  }

  /**
   * Calculate Fibonacci number
   */
  private fibonacci(n: number): number {
    if (n <= 1) return 1;
    let a = 1;
    let b = 1;
    for (let i = 2; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  }

  /**
   * Wait for a specified time
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update retry options
   */
  setOptions(options: Partial<RetryOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current retry options
   */
  getOptions(): Required<RetryOptions> {
    return { ...this.options };
  }

  /**
   * Reset to default options
   */
  reset(): void {
    this.options = { ...DEFAULT_RETRY_OPTIONS };
  }
}

/**
 * Create a retry manager with custom options
 */
export function createRetryManager(options?: RetryOptions): RetryManager {
  return new RetryManager(options);
}

// Export HttpError for use in retry logic
import { HttpError } from './errors';