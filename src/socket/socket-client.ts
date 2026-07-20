/**
 * Socket Client
 * WebSocket client with automatic reconnection and event handling
 */

import { ReconnectManager, type ReconnectOptions } from './reconnect';
import { HeartbeatManager, type HeartbeatOptions } from './heartbeat';
import { ChannelManager, type ChannelOptions } from './channels';

/**
 * Socket connection state
 */
export type SocketState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'closing';

/**
 * Socket event map
 */
export interface SocketEventMap {
  open: Event;
  close: CloseEvent;
  error: Event;
  message: MessageEvent;
  reconnect: { attempt: number; delay: number };
  reconnectSuccess: void;
  reconnectFailed: { attempts: number };
  heartbeat: void;
  heartbeatTimeout: void;
}

/**
 * Socket options
 */
export interface SocketOptions {
  /** WebSocket URL */
  url: string;
  /** Protocols */
  protocols?: string | string[];
  /** Reconnect options */
  reconnect?: ReconnectOptions;
  /** Heartbeat options */
  heartbeat?: HeartbeatOptions;
  /** Channel options */
  channels?: ChannelOptions;
  /** Enable debug logging */
  debug?: boolean;
  /** Connection timeout in milliseconds */
  timeout?: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Partial<SocketOptions> = {
  debug: false,
  timeout: 10000,
};

/**
 * Socket Client
 */
export class SocketClient {
  private options: SocketOptions;
  private ws: WebSocket | null = null;
  private state: SocketState = 'disconnected';
  private reconnectManager: ReconnectManager;
  private heartbeatManager: HeartbeatManager;
  private channelManager: ChannelManager;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private messageQueue: any[] = [];
  private isQueueProcessing = false;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(options: SocketOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.reconnectManager = new ReconnectManager(options.reconnect);
    this.heartbeatManager = new HeartbeatManager(options.heartbeat);
    this.channelManager = new ChannelManager(this, options.channels);

    // Set up heartbeat event handlers
    this.heartbeatManager.on('timeout', () => {
      this.log('Heartbeat timeout, reconnecting...');
      this.reconnect();
    });

    this.heartbeatManager.on('success', () => {
      this.emit('heartbeat');
    });

    this.log('Socket client initialized');
  }

  /**
   * Connect to the WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === 'connected') {
        resolve();
        return;
      }

      if (this.state === 'connecting') {
        // Wait for connection
        const checkConnection = () => {
          if (this.state === 'connected') {
            resolve();
          } else if (this.state === 'disconnected') {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      try {
        this.state = 'connecting';
        this.log('Connecting to WebSocket...');

        const url = this.options.url;
        const protocols = this.options.protocols;

        this.ws = protocols
          ? new WebSocket(url, protocols)
          : new WebSocket(url);

        this.ws.binaryType = 'arraybuffer';

        // Set up event handlers
        this.ws.onopen = (event) => {
          this.handleOpen(event);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (event) => {
          this.handleError(event);
          reject(new Error('WebSocket error'));
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
        };

        // Set connection timeout
        if (this.options.timeout) {
          this.connectionTimeoutId = setTimeout(() => {
            if (this.state !== 'connected') {
              this.log('Connection timeout');
              this.close();
              reject(new Error('Connection timeout'));
            }
          }, this.options.timeout);
        }
      } catch (error) {
        this.state = 'disconnected';
        this.log('Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle open event
   */
  private handleOpen(event: Event): void {
    this.state = 'connected';
    this.reconnectManager.reset();
    this.heartbeatManager.start();

    // Process queued messages
    this.processQueue();

    // Clear connection timeout
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }

    this.log('WebSocket connected');
    this.emit('open', event);
  }

  /**
   * Handle message event
   */
  private handleMessage(event: MessageEvent): void {
    // Update heartbeat
    this.heartbeatManager.update();

    // Try to parse as JSON
    let data = event.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // Keep as string
      }
    }

    // Check if it's a channel message
    if (data && typeof data === 'object' && data.type === 'channel') {
      this.channelManager.handleMessage(data);
    }

    this.emit('message', event);
  }

  /**
   * Handle error event
   */
  private handleError(event: Event): void {
    this.log('WebSocket error:', event);
    this.emit('error', event);
  }

  /**
   * Handle close event
   */
  private handleClose(event: CloseEvent): void {
    this.state = 'disconnected';
    this.heartbeatManager.stop();

    this.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.emit('close', event);

    // Attempt reconnect
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnect
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId) {
      return;
    }

    const delay = this.reconnectManager.getDelay();
    this.log(`Reconnecting in ${delay}ms...`);

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.reconnect();
    }, delay);
  }

  /**
   * Reconnect
   */
  private async reconnect(): Promise<void> {
    if (this.state === 'connected') {
      return;
    }

    try {
      this.state = 'reconnecting';
      this.log('Attempting reconnect...');

      await this.connect();
      this.reconnectManager.onSuccess();
      this.emit('reconnectSuccess');

      this.log('Reconnect successful');
    } catch (error) {
      this.log('Reconnect failed:', error);
      this.reconnectManager.onFail();
      this.emit('reconnectFailed', { attempts: this.reconnectManager.getAttempts() });

      if (this.reconnectManager.shouldRetry()) {
        this.scheduleReconnect();
      } else {
        this.state = 'disconnected';
        this.log('Reconnect failed, giving up');
      }
    }
  }

  /**
   * Send a message
   */
  send(data: any): void {
    if (this.state === 'connected' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
    } else {
      // Queue message for later
      this.messageQueue.push(data);
      this.log('Message queued');
    }
  }

  /**
   * Process queued messages
   */
  private processQueue(): void {
    if (this.isQueueProcessing) {
      return;
    }

    this.isQueueProcessing = true;

    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      this.send(data);
    }

    this.isQueueProcessing = false;
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, callback: (data: any) => void): () => void {
    this.send({
      type: 'subscribe',
      channel,
    });

    return this.channelManager.subscribe(channel, callback);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    this.send({
      type: 'unsubscribe',
      channel,
    });

    this.channelManager.unsubscribe(channel);
  }

  /**
   * Publish to a channel
   */
  publish(channel: string, data: any): void {
    this.send({
      type: 'publish',
      channel,
      data,
    });
  }

  /**
   * Close the connection
   */
  close(code?: number, reason?: string): void {
    this.state = 'closing';

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }

    this.heartbeatManager.stop();

    if (this.ws) {
      this.ws.close(code || 1000, reason || 'Normal closure');
      this.ws = null;
    }

    this.state = 'disconnected';
    this.log('Connection closed');
  }

  /**
   * Add event listener
   */
  on<K extends keyof SocketEventMap>(
    event: K,
    listener: (data: SocketEventMap[K]) => void
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof SocketEventMap>(
    event: K,
    listener: (data: SocketEventMap[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  private emit<K extends keyof SocketEventMap>(
    event: K,
    data?: SocketEventMap[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data as any);
        } catch (error) {
          console.error(`Socket event '${event}' listener error:`, error);
        }
      }
    }
  }

  /**
   * Get current state
   */
  getState(): SocketState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[Socket Client] ${message}`, ...data);
    }
  }
}

/**
 * Default socket client instance
 */
export const socketClient = new SocketClient({
  url: '',
  debug: false,
});

/**
 * Create a new socket client
 */
export function createSocketClient(options: SocketOptions): SocketClient {
  return new SocketClient(options);
}

export default socketClient;