import http from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { IEngine, IContract, IWebSocketContract, ILogger } from '../interfaces';
import { ConsoleLogger } from '../utilities';
import { ConnectionManager } from './connection-manager';
import { MessageRouter } from './message-handler';
import { WebSocketEngineOptions } from './types';

export class WebSocketEngine implements IEngine {
  readonly protocol = 'websocket' as const;
  readonly name = 'websocket-engine';
  private wss: WebSocketServer | null = null;
  private server: http.Server | null = null;
  private connectionManager: ConnectionManager;
  private messageRouter: MessageRouter;
  private logger: ILogger;
  private options: WebSocketEngineOptions;
  private running = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private maxConnections: number;
  private maxConnectionsPerIp: number;
  private connectionsPerIp: Map<string, number> = new Map();

  constructor(options: WebSocketEngineOptions) {
    this.options = options;
    this.logger = options.logger || new ConsoleLogger();
    this.connectionManager = new ConnectionManager(this.logger, this.options.backplane);
    this.messageRouter = new MessageRouter(this.connectionManager, this.logger);
    this.maxConnections = options.maxConnections || 10000;
    this.maxConnectionsPerIp = options.maxConnectionsPerIp || 100;
  }

  getConnectionManager(): ConnectionManager {
    return this.connectionManager;
  }

  getMessageRouter(): MessageRouter {
    return this.messageRouter;
  }

  registerContract(contract: IContract): void {
    if (this.isWebSocketContract(contract)) {
      this.logger.info(`Registering WebSocket contract: ${contract.name} v${contract.version}`);
      for (const event of contract.events) {
        this.messageRouter.registerHandler(event.name, async (client, _message) => {
          this.logger.debug(`WebSocket event: ${event.name} from ${client.id}`);
        }, contract);
      }
    }
  }

  async start(): Promise<void> {
    if (this.running) {
      this.logger.warn('WebSocket engine is already running');
      return;
    }

    this.server = http.createServer();
    this.wss = new WebSocketServer({
      server: this.server,
      path: this.options.path || '/ws',
      maxPayload: this.options.maxPayload || 1024 * 1024,
    });

    this.wss.on('connection', (socket: WebSocket, req) => {
      const ip = req.socket.remoteAddress || 'unknown';

      if (this.wss!.clients.size >= this.maxConnections) {
        socket.close(1013, 'Server is full');
        return;
      }

      const ipCount = this.connectionsPerIp.get(ip) || 0;
      if (ipCount >= this.maxConnectionsPerIp) {
        socket.close(1013, 'Too many connections from your IP');
        return;
      }

      this.connectionsPerIp.set(ip, ipCount + 1);

      const client = this.connectionManager.addConnection(socket, {
        ip,
        headers: req.headers,
      });

      socket.on('message', (data: RawData) => {
        const raw = data.toString();
        this.messageRouter.route(client, raw);
      });

      socket.on('close', () => {
        this.connectionManager.removeConnection(client.id);
        const currentCount = this.connectionsPerIp.get(ip) || 1;
        if (currentCount <= 1) {
          this.connectionsPerIp.delete(ip);
        } else {
          this.connectionsPerIp.set(ip, currentCount - 1);
        }
      });

      socket.on('error', (error) => {
        this.logger.error('WebSocket error', { clientId: client.id, error: error.message });
      });
    });

    this.startHeartbeat();

    return new Promise((resolve) => {
      this.server!.listen(this.options.port, this.options.host || '0.0.0.0', () => {
        this.running = true;
        this.logger.info(`WebSocket engine started on port ${this.options.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.wss?.close();
    return new Promise((resolve) => {
      this.server?.close(() => {
        this.running = false;
        this.logger.info('WebSocket engine stopped');
        resolve();
      });
    });
  }

  isRunning(): boolean {
    return this.running;
  }

  private startHeartbeat(): void {
    const interval = this.options.heartbeatInterval || 30000;
    this.heartbeatTimer = setInterval(() => {
      this.connectionManager.cleanup();
    }, interval);
  }

  private isWebSocketContract(contract: IContract): contract is IWebSocketContract {
    return 'events' in contract;
  }
}
