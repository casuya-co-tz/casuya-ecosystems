import { WebSocket } from 'ws';
import { WebSocketClient } from './types';
import { generateUuid } from '../utilities';
import { ILogger } from '../interfaces';

/**
 * Cross-pod fan-out backplane for WebSocket broadcasts.
 *
 * A single pod only holds the sockets connected to it. To reach 100k
 * concurrent sockets the API tier must run many pods, so a broadcast to a
 * channel has to be published to every pod holding a subscriber. Inject a
 * Redis (pub/sub) backed implementation in production; when omitted the
 * manager falls back to local-only delivery (single-pod / dev).
 */
export interface WebSocketBackplane {
  /** Publish a message for a channel to all pods (including this one). */
  publish(channel: string, message: string, excludeClientId?: string): Promise<void>;
  /** Register the handler invoked when a message arrives from another pod. */
  subscribe(handler: (channel: string, message: string, excludeClientId?: string) => void): void;
}

export class ConnectionManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private channels: Map<string, Set<string>> = new Map();
  private logger: ILogger;
  private backplane?: WebSocketBackplane;

  constructor(logger: ILogger, backplane?: WebSocketBackplane) {
    this.logger = logger;
    this.backplane = backplane;
    if (this.backplane) {
      this.backplane.subscribe((channel, message, excludeClientId) => {
        this.deliverLocal(channel, message, excludeClientId);
      });
    }
  }

  addConnection(socket: WebSocket, metadata: Record<string, unknown> = {}): WebSocketClient {
    const client: WebSocketClient = {
      id: generateUuid(),
      socket,
      channels: new Set(),
      connectedAt: new Date(),
      metadata,
    };

    this.clients.set(client.id, client);
    this.logger.debug(`WebSocket client connected: ${client.id}`);
    return client;
  }

  removeConnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    for (const channel of client.channels) {
      this.leaveChannel(clientId, channel);
    }

    this.clients.delete(clientId);
    this.logger.debug(`WebSocket client disconnected: ${clientId}`);
  }

  joinChannel(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(clientId);
  }

  leaveChannel(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.channels.delete(channel);
    }

    const channelClients = this.channels.get(channel);
    if (channelClients) {
      channelClients.delete(clientId);
      if (channelClients.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  getClient(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }

  getClientsInChannel(channel: string): WebSocketClient[] {
    const clientIds = this.channels.get(channel);
    if (!clientIds) return [];
    return Array.from(clientIds)
      .map(id => this.clients.get(id))
      .filter((c): c is WebSocketClient => c !== undefined);
  }

  broadcast(channel: string, message: string, excludeClientId?: string): void {
    if (this.backplane) {
      // Publish to all pods; delivery to local sockets happens via the
      // backplane subscription (deliverLocal) so we don't double-send.
      void this.backplane.publish(channel, message, excludeClientId);
      return;
    }
    this.deliverLocal(channel, message, excludeClientId);
  }

  /** Send a channel message only to sockets connected to THIS pod. */
  private deliverLocal(channel: string, message: string, excludeClientId?: string): void {
    const clients = this.getClientsInChannel(channel);
    for (const client of clients) {
      if (client.id !== excludeClientId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
      }
    }
  }

  broadcastAll(message: string): void {
    const openClients = Array.from(this.clients.values()).filter(
      (client) => client.socket.readyState === WebSocket.OPEN
    );

    const CHUNK_SIZE = 100;
    for (let i = 0; i < openClients.length; i += CHUNK_SIZE) {
      const chunk = openClients.slice(i, i + CHUNK_SIZE);
      for (const client of chunk) {
        try {
          client.socket.send(message);
        } catch (error) {
          this.logger.error('Error sending WebSocket message', { clientId: client.id });
        }
      }
    }
  }

  getConnectionCount(): number {
    return this.clients.size;
  }

  getChannelCount(): number {
    return this.channels.size;
  }

  getChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  getChannelSize(channel: string): number {
    return this.channels.get(channel)?.size || 0;
  }

  getAllClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }

  cleanup(): void {
    for (const [id, client] of this.clients) {
      if (client.socket.readyState !== WebSocket.OPEN) {
        this.removeConnection(id);
      }
    }
  }
}
