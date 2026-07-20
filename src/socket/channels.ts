/**
 * Channels Manager
 * Manages WebSocket channels for pub/sub
 */

import { socketClient, type SocketClient } from './socket-client';

/**
 * Channel options
 */
export interface ChannelOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Prefix for channel names */
  prefix?: string;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<ChannelOptions> = {
  debug: false,
  prefix: '',
};

/**
 * Channel subscriber
 */
export interface ChannelSubscriber {
  id: string;
  callback: (data: any) => void;
}

/**
 * Channel
 */
export interface Channel {
  name: string;
  subscribers: Set<ChannelSubscriber>;
  lastMessage: any;
  messageCount: number;
}

/**
 * Channel Manager
 */
export class ChannelManager {
  private options: Required<ChannelOptions>;
  private socket: SocketClient;
  private channels: Map<string, Channel> = new Map();
  private subscriberIdCounter = 0;

  constructor(socket: SocketClient, options: ChannelOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.socket = socket;
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, callback: (data: any) => void): () => void {
    const fullChannel = this.getFullChannel(channel);

    if (!this.channels.has(fullChannel)) {
      this.channels.set(fullChannel, {
        name: fullChannel,
        subscribers: new Set(),
        lastMessage: null,
        messageCount: 0,
      });
    }

    const channelObj = this.channels.get(fullChannel)!;

    const subscriber: ChannelSubscriber = {
      id: `sub_${++this.subscriberIdCounter}`,
      callback,
    };

    channelObj.subscribers.add(subscriber);

    this.log(`Subscribed to channel: ${fullChannel}`);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(fullChannel, subscriber.id);
    };
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string, subscriberId?: string): void {
    const fullChannel = this.getFullChannel(channel);
    const channelObj = this.channels.get(fullChannel);

    if (!channelObj) {
      return;
    }

    if (subscriberId) {
      // Remove specific subscriber
      for (const sub of channelObj.subscribers) {
        if (sub.id === subscriberId) {
          channelObj.subscribers.delete(sub);
          break;
        }
      }
    } else {
      // Remove all subscribers
      channelObj.subscribers.clear();
    }

    // Remove channel if no subscribers
    if (channelObj.subscribers.size === 0) {
      this.channels.delete(fullChannel);
    }

    this.log(`Unsubscribed from channel: ${fullChannel}`);
  }

  /**
   * Handle incoming message
   */
  handleMessage(data: any): void {
    if (!data.channel) {
      return;
    }

    const fullChannel = this.getFullChannel(data.channel);
    const channelObj = this.channels.get(fullChannel);

    if (!channelObj) {
      return;
    }

    // Update channel
    channelObj.lastMessage = data.data;
    channelObj.messageCount++;

    // Notify subscribers
    for (const subscriber of channelObj.subscribers) {
      try {
        subscriber.callback(data.data);
      } catch (error) {
        console.error(`Channel '${fullChannel}' subscriber error:`, error);
      }
    }

    this.log(`Received message on channel: ${fullChannel}`);
  }

  /**
   * Get full channel name with prefix
   */
  private getFullChannel(channel: string): string {
    return this.options.prefix ? `${this.options.prefix}${channel}` : channel;
  }

  /**
   * Get channel subscribers
   */
  getSubscribers(channel: string): ChannelSubscriber[] {
    const fullChannel = this.getFullChannel(channel);
    const channelObj = this.channels.get(fullChannel);
    return channelObj ? Array.from(channelObj.subscribers) : [];
  }

  /**
   * Get channel count
   */
  getChannelCount(): number {
    return this.channels.size;
  }

  /**
   * Get subscriber count for a channel
   */
  getSubscriberCount(channel: string): number {
    const fullChannel = this.getFullChannel(channel);
    const channelObj = this.channels.get(fullChannel);
    return channelObj ? channelObj.subscribers.size : 0;
  }

  /**
   * Get all channels
   */
  getChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Clear all channels
   */
  clear(): void {
    this.channels.clear();
    this.log('All channels cleared');
  }

  /**
   * Log debug message
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      console.log(`[Channel Manager] ${message}`, ...data);
    }
  }
}

/**
 * Default channel manager
 */
export const channelManager = new ChannelManager(socketClient);

/**
 * Create a channel manager
 */
export function createChannelManager(
  socket: SocketClient,
  options?: ChannelOptions
): ChannelManager {
  return new ChannelManager(socket, options);
}
