/**
 * Socket System - Main Export
 * WebSocket client with reconnection, heartbeat, and channels
 */

export { SocketClient, socketClient, type SocketOptions, type SocketEventMap } from './socket-client';
export { ReconnectManager, reconnectManager, type ReconnectOptions, type ReconnectState } from './reconnect';
export { HeartbeatManager, heartbeatManager, type HeartbeatOptions, type HeartbeatStatus } from './heartbeat';
export { ChannelManager, channelManager, type Channel, type ChannelOptions } from './channels';

// Default export
export default socketClient;