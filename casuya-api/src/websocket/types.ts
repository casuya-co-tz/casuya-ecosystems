import { WebSocket } from 'ws';
import { ILogger, IWebSocketContract } from '../interfaces';
import { WebSocketBackplane } from './connection-manager';

export interface WebSocketClient {
  id: string;
  socket: WebSocket;
  channels: Set<string>;
  connectedAt: Date;
  metadata: Record<string, unknown>;
  userId?: string;
}

export interface WebSocketMessage {
  type: string;
  channel?: string;
  payload: unknown;
  id?: string;
  timestamp?: string;
}

export interface WebSocketEngineOptions {
  port: number;
  host?: string;
  logger?: ILogger;
  path?: string;
  maxPayload?: number;
  heartbeatInterval?: number;
  maxConnections?: number;
  maxConnectionsPerIp?: number;
  /** Inject a Redis-backed backplane for cross-pod broadcasts at scale. */
  backplane?: WebSocketBackplane;
}

export type MessageHandler = (
  client: WebSocketClient,
  message: WebSocketMessage,
  contract: IWebSocketContract,
) => Promise<void> | void;
