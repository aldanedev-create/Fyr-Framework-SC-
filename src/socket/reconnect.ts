/**
 * Reconnect Manager
 * Manages WebSocket reconnection with exponential backoff
 */

/**
 * Reconnect options
 */
export interface ReconnectOptions {
  /** Maximum number of reconnection attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff factor */
  backoffFactor?: number;
  /** Whether to use jitter */
  jitter?: boolean;
}

/**
 * Reconnect state
 */
export interface ReconnectState {
  /** Current attempt number */
  attempts: number;
  /** Current delay */
  currentDelay: number;
  /** Whether reconnection is active */
  isActive: boolean;
  /** Total reconnections */
  totalReconnections: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<ReconnectOptions> = {
  maxAttempts: 10,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
};

/**
 * Reconnect Manager
 */
export class ReconnectManager {
  private options: Required<ReconnectOptions>;
  private attempts = 0;
  private totalReconnections = 0;
  private isActive = false;
  private currentDelay = 0;

  constructor(options: ReconnectOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.reset();
  }

  /**
   * Reset the manager
   */
  reset(): void {
    this.attempts = 0;
    this.currentDelay = this.options.initialDelay;
    this.isActive = false;
  }

  /**
   * Get the next delay
   */
  getDelay(): number {
    if (!this.isActive) {
      this.isActive = true;
      this.attempts = 0;
      this.currentDelay = this.options.initialDelay;
    }

    this.attempts++;

    // Calculate delay with exponential backoff
    let delay = this.options.initialDelay * Math.pow(this.options.backoffFactor, this.attempts - 1);

    // Apply jitter
    if (this.options.jitter) {
      delay = delay * (0.8 + Math.random() * 0.4);
    }

    // Cap at max delay
    delay = Math.min(delay, this.options.maxDelay);

    this.currentDelay = delay;

    return delay;
  }

  /**
   * Call on successful reconnection
   */
  onSuccess(): void {
    this.totalReconnections++;
    this.reset();
  }

  /**
   * Call on failed reconnection
   */
  onFail(): void {
    // Increment attempts
    this.attempts++;
  }

  /**
   * Check if should retry
   */
  shouldRetry(): boolean {
    return this.attempts < this.options.maxAttempts;
  }

  /**
   * Get current state
   */
  getState(): ReconnectState {
    return {
      attempts: this.attempts,
      currentDelay: this.currentDelay,
      isActive: this.isActive,
      totalReconnections: this.totalReconnections,
    };
  }

  /**
   * Get attempts count
   */
  getAttempts(): number {
    return this.attempts;
  }

  /**
   * Get total reconnections
   */
  getTotalReconnections(): number {
    return this.totalReconnections;
  }

  /**
   * Update options
   */
  setOptions(options: Partial<ReconnectOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get options
   */
  getOptions(): Required<ReconnectOptions> {
    return { ...this.options };
  }
}

/**
 * Default reconnect manager
 */
export const reconnectManager = new ReconnectManager();

/**
 * Create a reconnect manager
 */
export function createReconnectManager(options?: ReconnectOptions): ReconnectManager {
  return new ReconnectManager(options);
}