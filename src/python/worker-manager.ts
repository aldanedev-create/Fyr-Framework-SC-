/**
 * Worker Manager
 * Manages Web Worker for Python execution
 */

import { PythonError, createPythonError } from './python-errors';

/**
 * Worker message types
 */
export type WorkerMessageType = 'run' | 'eval' | 'execute' | 'install' | 'ping' | 'status';

/**
 * Worker message
 */
export interface WorkerMessage {
  id?: string;
  type: WorkerMessageType;
  payload?: any;
  code?: string;
  timeout?: number;
}

/**
 * Worker response
 */
export interface WorkerResponse {
  id: string;
  type?: WorkerMessageType | 'ready';
  success: boolean;
  result?: any;
  error?: {
    message: string;
    code: string;
    stack?: string;
  };
}

/**
 * Worker manager options
 */
export interface WorkerManagerOptions {
  /** Worker script URL */
  workerUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Default timeout in milliseconds */
  defaultTimeout?: number;
  /** Max memory in MB */
  maxMemory?: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<WorkerManagerOptions> = {
  workerUrl: '',
  debug: false,
  defaultTimeout: 30000,
  maxMemory: 512,
};

/**
 * Worker Manager
 */
export class WorkerManager {
  private options: Required<WorkerManagerOptions>;
  private worker: Worker | null = null;
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }> = new Map();
  private isReady = false;
  private readyPromise: Promise<void> | null = null;

  constructor(options: WorkerManagerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Initialize the worker
   */
  async initialize(): Promise<void> {
    if (this.worker) {
      return;
    }

    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = this._initialize();
    await this.readyPromise;
    this.readyPromise = null;
  }

  /**
   * Internal initialize
   */
  private async _initialize(): Promise<void> {
    try {
      this.log('Initializing worker...');

      // Create worker
      const workerUrl = this.options.workerUrl || this.getWorkerUrl();
      this.worker = new Worker(workerUrl);

      // Set up message handler
      this.worker.addEventListener('message', this.handleMessage.bind(this));
      this.worker.addEventListener('error', this.handleError.bind(this));

      // Wait for ready signal
      await this.waitForReady();

      this.isReady = true;
      this.log('Worker initialized');
    } catch (error) {
      this.log('Failed to initialize worker:', error);
      throw createPythonError(
        'Failed to initialize worker: ' + (error instanceof Error ? error.message : String(error)),
        'WORKER_ERROR'
      );
    }
  }

  /**
   * Get worker URL
   */
  private getWorkerUrl(): string {
    // If a URL is provided, use it
    if (this.options.workerUrl) {
      return this.options.workerUrl;
    }

    // Otherwise, use inline worker
    // This is a fallback - in production, you should serve the worker file
    const workerCode = this.getWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  }

  /**
   * Get worker code
   */
  private getWorkerCode(): string {
    // This will be replaced with the actual worker code
    // In production, this should load from a separate file
    return `
      // Python worker
      self.addEventListener('message', async (event) => {
        const { id, type, payload } = event.data;
        
        try {
          // Load Pyodide
          // ... (actual worker implementation)
          
          self.postMessage({ id, success: true, result: 'Worker ready' });
        } catch (error) {
          self.postMessage({
            id,
            success: false,
            error: {
              message: error.message,
              code: 'WORKER_ERROR'
            }
          });
        }
      });
    `;
  }

  /**
   * Wait for worker ready
   */
  private waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker initialization timeout'));
      }, 10000);

      const handler = (event: MessageEvent) => {
        const data = event.data;
        if (data.type === 'ready') {
          clearTimeout(timeout);
          resolve();
        }
      };

      this.worker?.addEventListener('message', handler);
    });
  }

  /**
   * Handle worker message
   */
  private handleMessage(event: MessageEvent): void {
    const response = event.data as WorkerResponse;

    if (!response.id) {
      // Handle non-request messages
      if (response.type === 'ready') {
        this.isReady = true;
        return;
      }
      return;
    }

    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(response.id);

    if (response.success) {
      pending.resolve(response.result);
    } else {
      const error = response.error;
      pending.reject(createPythonError(
        error?.message || 'Worker execution failed',
        error?.code || 'WORKER_ERROR'
      ));
    }
  }

  /**
   * Handle worker error
   */
  private handleError(event: ErrorEvent): void {
    this.log('Worker error:', event);
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(createPythonError(
        event.message || 'Worker error',
        'WORKER_ERROR'
      ));
      this.pendingRequests.delete(id);
    }
  }

  /**
   * Execute code in worker
   */
  async execute(message: WorkerMessage): Promise<any> {
    await this.initialize();

    const id = this.generateId();
    const timeout = message.timeout || this.options.defaultTimeout;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(createPythonError('Worker execution timeout', 'TIMEOUT_ERROR'));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timeoutId });

      this.worker?.postMessage({
        id,
        type: message.type,
        payload: message.payload ?? { code: message.code },
      });
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[Worker Manager] ${message}`, ...data);
    }
  }

  /**
   * Get worker status
   */
  getStatus(): { ready: boolean; pending: number } {
    return {
      ready: this.isReady,
      pending: this.pendingRequests.size,
    };
  }

  /**
   * Terminate worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }

    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(createPythonError('Worker terminated', 'WORKER_TERMINATED'));
    }
    this.pendingRequests.clear();

    this.log('Worker terminated');
  }
}

/**
 * Default worker manager instance
 */
export const workerManager = new WorkerManager();
