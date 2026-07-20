/**
 * Heartbeat Manager
 * Manages WebSocket heartbeat/ping-pong
 */

/**
 * Heartbeat options
 */
export interface HeartbeatOptions {
  /** Heartbeat interval in milliseconds */
  interval?: number;
  /** Heartbeat timeout in milliseconds */
  timeout?: number;
  /** Heartbeat message */
  message?: string | object;
  /** Enable automatic heartbeat */
  enabled?: boolean;
}

/**
 * Heartbeat status
 */
export interface HeartbeatStatus {
  /** Is heartbeat active */
  isActive: boolean;
  /** Last heartbeat sent timestamp */
  lastSent: number | null;
  /** Last heartbeat received timestamp */
  lastReceived: number | null;
  /** Number of heartbeats sent */
  sentCount: number;
  /** Number of heartbeats received */
  receivedCount: number;
  /** Number of timeouts */
  timeoutCount: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<HeartbeatOptions> = {
  interval: 30000,
  timeout: 10000,
  message: { type: 'ping' },
  enabled: true,
};

/**
 * Heartbeat Manager
 */
export class HeartbeatManager {
  private options: Required<HeartbeatOptions>;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isActive = false;
  private lastSent: number | null = null;
  private lastReceived: number | null = null;
  private sentCount = 0;
  private receivedCount = 0;
  private timeoutCount = 0;
  private listeners: Map<string, Set<Function>> = new Map();
  private sendCallback: (() => void) | null = null;

  constructor(options: HeartbeatOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Start heartbeat
   */
  start(): void {
    if (!this.options.enabled || this.isActive) {
      return;
    }

    this.isActive = true;
    this.sentCount = 0;
    this.receivedCount = 0;
    this.timeoutCount = 0;
    this.lastSent = null;
    this.lastReceived = null;

    // Send first heartbeat immediately
    this.sendHeartbeat();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.sendHeartbeat();
    }, this.options.interval);

    this.emit('start');
  }

  /**
   * Stop heartbeat
   */
  stop(): void {
    this.isActive = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.emit('stop');
  }

  /**
   * Send heartbeat
   */
  private sendHeartbeat(): void {
    if (!this.isActive) {
      return;
    }

    this.lastSent = Date.now();
    this.sentCount++;

    // Send heartbeat message
    if (this.sendCallback) {
      this.sendCallback();
    }

    // Set timeout for response
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.timeoutCount++;
      this.emit('timeout');
    }, this.options.timeout);

    this.emit('sent');
  }

  /**
   * Update heartbeat (call on message received)
   */
  update(): void {
    if (!this.isActive) {
      return;
    }

    this.lastReceived = Date.now();
    this.receivedCount++;

    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.emit('success');
  }

  /**
   * Set send callback
   */
  setSendCallback(callback: () => void): void {
    this.sendCallback = callback;
  }

  /**
   * Get heartbeat message
   */
  getMessage(): string | object {
    const message = this.options.message;
    if (typeof message === 'function') {
      return message();
    }
    return message;
  }

  /**
   * Add event listener
   */
  on(event: 'start' | 'stop' | 'sent' | 'success' | 'timeout', listener: () => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: 'start' | 'stop' | 'sent' | 'success' | 'timeout', listener: () => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: 'start' | 'stop' | 'sent' | 'success' | 'timeout'): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener();
        } catch (error) {
          console.error(`Heartbeat event '${event}' listener error:`, error);
        }
      }
    }
  }

  /**
   * Get heartbeat status
   */
  getStatus(): HeartbeatStatus {
    return {
      isActive: this.isActive,
      lastSent: this.lastSent,
      lastReceived: this.lastReceived,
      sentCount: this.sentCount,
      receivedCount: this.receivedCount,
      timeoutCount: this.timeoutCount,
    };
  }

  /**
   * Get options
   */
  getOptions(): Required<HeartbeatOptions> {
    return { ...this.options };
  }

  /**
   * Update options
   */
  setOptions(options: Partial<HeartbeatOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.options.enabled && this.isActive) {
      this.stop();
      this.start();
    }
  }
}

/**
 * Default heartbeat manager
 */
export const heartbeatManager = new HeartbeatManager();

/**
 * Create a heartbeat manager
 */
export function createHeartbeatManager(options?: HeartbeatOptions): HeartbeatManager {
  return new HeartbeatManager(options);
}