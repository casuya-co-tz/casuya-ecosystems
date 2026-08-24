import Redis from 'ioredis';
import { ConsoleLogger } from '../utilities';

const logger = new ConsoleLogger();

let _client: Redis | null = null;
let _subClient: Redis | null = null;

export interface RedisClientOptions {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
}

function resolveConfig(): RedisClientOptions {
  return {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST ?? process.env.REDIS_URL ? undefined : 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB ?? 0),
    maxRetriesPerRequest: 3,
  };
}

function buildOpts(cfg: RedisClientOptions) {
  return {
    host: cfg.host,
    port: cfg.port,
    password: cfg.password,
    db: cfg.db,
    maxRetriesPerRequest: cfg.maxRetriesPerRequest,
    retryStrategy(times: number) {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
    lazyConnect: true,
    enableReadyCheck: true,
  };
}

/**
 * Returns the shared primary Redis connection. Safe to call multiple times —
 * returns the same instance. Returns null if REDIS_URL/REDIS_HOST is not set
 * (lets callers fall back to in-memory behaviour).
 */
export function getRedisClient(): Redis | null {
  if (_client) return _client;

  const cfg = resolveConfig();
  if (!cfg.url && !cfg.host && !process.env.REDIS_HOST) {
    return null;
  }

  _client = cfg.url ? new Redis(cfg.url, buildOpts(cfg)) : new Redis(buildOpts(cfg));

  _client.on('error', (err) => {
    logger.error('Redis client error', { error: err.message });
  });

  _client.on('connect', () => {
    logger.info('Redis client connected');
  });

  return _client;
}

/**
 * Returns a second Redis connection dedicated to pub/sub subscriptions.
 * ioredis pub/sub requires a dedicated client because once in subscribe mode
 * the connection can only issue subscribe/unsubscribe commands.
 */
export function getRedisSubClient(): Redis | null {
  if (_subClient) return _subClient;

  const primary = getRedisClient();
  if (!primary) return null;

  const cfg = resolveConfig();
  _subClient = cfg.url ? new Redis(cfg.url, buildOpts(cfg)) : new Redis(buildOpts(cfg));

  _subClient.on('error', (err) => {
    logger.error('Redis sub client error', { error: err.message });
  });

  return _subClient;
}

export async function closeRedisClients(): Promise<void> {
  const clients = [_client, _subClient].filter(Boolean) as Redis[];
  await Promise.allSettled(clients.map((c) => c.quit()));
  _client = null;
  _subClient = null;
}
