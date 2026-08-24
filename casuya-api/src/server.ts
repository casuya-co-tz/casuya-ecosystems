import { RestEngine } from './rest/rest-engine';
import { ConsoleLogger } from './utilities';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import net from 'node:net';
import { HealthChecker } from './monitoring/health-checker';
import { createBlackboardContracts } from './blackboard-handlers';
import { RateLimiter, MemoryRateLimitStore, RedisRateLimitStore } from './middleware/rate-limiter';
import { getRedisClient, getRedisSubClient, closeRedisClients } from './infrastructure/redis-client';
import { RedisWebSocketBackplane } from './websocket/redis-backplane';
import { WebSocketEngine } from './websocket/websocket-engine';

const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 8081);
const HOST = process.env.HOST ?? '0.0.0.0';
const WS_PORT = Number(process.env.WS_PORT ?? 8082);
const logger = new ConsoleLogger();

// ---------------------------------------------------------------------------
// Redis clients (null when REDIS_URL / REDIS_HOST is not set — falls back
// to in-memory stores which is fine for single-pod dev).
// ---------------------------------------------------------------------------
const redisClient = getRedisClient();
const redisSubClient = getRedisSubClient();

// ---------------------------------------------------------------------------
// Distributed rate limiter — Redis-backed when Redis is reachable, otherwise
// in-memory (single-pod).  Rate limits are per-client-IP across all pods.
// ---------------------------------------------------------------------------
const rateLimiterWindow = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const rateLimiterMax = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100);
const rateLimiterStore = redisClient
  ? new RedisRateLimitStore(redisClient, 'ratelimit:')
  : new MemoryRateLimitStore();
const rateLimiter = new RateLimiter(rateLimiterWindow, rateLimiterMax, rateLimiterStore);

// ---------------------------------------------------------------------------
// WebSocket backplane — Redis pub/sub fan-out for cross-pod broadcasts.
// Activated only when a Redis connection is available.
// ---------------------------------------------------------------------------
let backplane: RedisWebSocketBackplane | null = null;
if (redisClient && redisSubClient) {
  backplane = new RedisWebSocketBackplane(redisClient, redisSubClient);
}

// ---------------------------------------------------------------------------
// REST engine
// ---------------------------------------------------------------------------
const restEngine = new RestEngine({ port: PORT, host: HOST, logger });

// Register this service's own API contract if present.
const contractPath = join(process.cwd(), 'contracts', 'contract.json');
if (existsSync(contractPath)) {
  try {
    const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
    restEngine.registerContract(contract);
  } catch (err) {
    logger.warn(`Failed to load API contract: ${(err as Error).message}`);
  }
}

// Register blackboard routes.
for (const { contract, handler } of createBlackboardContracts()) {
  restEngine.registerRoute(contract as any, handler as any);
}

// Global rate-limiter middleware (runs before every /api request).
const app = restEngine.getApp();
app.use('/api', rateLimiter.middleware());

// ---------------------------------------------------------------------------
// Readiness probes (lightweight TCP checks).
// ---------------------------------------------------------------------------
const POSTGRES_PORT = Number(process.env.POSTGRES_PORT ?? 5432);
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
const DB_HOST = process.env.POSTGRES_HOST ?? 'localhost';
const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';

function tcpProbe(host: string, port: number, timeoutMs = 1500): Promise<{ status: string; message?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket
      .once('connect', () => {
        socket.destroy();
        resolve({ status: 'healthy' });
      })
      .once('timeout', () => {
        socket.destroy();
        resolve({ status: 'unhealthy', message: `timeout connecting to ${host}:${port}` });
      })
      .once('error', (err: Error) => {
        socket.destroy();
        resolve({ status: 'unhealthy', message: err.message });
      });
    socket.connect(port, host);
  });
}

const healthChecker = new HealthChecker('1.0.0');
healthChecker.register({ name: 'postgres', check: () => tcpProbe(DB_HOST, POSTGRES_PORT) });
healthChecker.register({ name: 'redis', check: () => tcpProbe(REDIS_HOST, REDIS_PORT) });

// Expose readiness + detailed health on the engine's app.
app.get('/health/ready', async (_req, res) => {
  const result = await healthChecker.checkAll();
  res.status(200).json(result);
});
app.get('/health/detail', async (_req, res) => {
  const result = await healthChecker.checkAll();
  res.json(result);
});

// ---------------------------------------------------------------------------
// WebSocket engine (cross-pod broadcast when backplane is configured).
// ---------------------------------------------------------------------------
const wsEngine = new WebSocketEngine({
  port: WS_PORT,
  host: HOST,
  logger,
  backplane: backplane ?? undefined,
});

// ---------------------------------------------------------------------------
// Start — all independent work runs in parallel for fastest boot.
// ---------------------------------------------------------------------------
async function start(): Promise<void> {
  const t0 = Date.now();

  // Connect Redis clients in parallel (lazyConnect: true).
  const redisPromises: Promise<void>[] = [];
  if (redisClient) {
    redisPromises.push(
      redisClient.connect()
        .then(() => { logger.info('Redis primary client connected'); })
        .catch((err) => { logger.warn(`Redis primary connection failed: ${(err as Error).message} — continuing without cache`); }),
    );
  }
  if (redisSubClient) {
    redisPromises.push(
      redisSubClient.connect()
        .then(() => { logger.info('Redis sub client connected'); })
        .catch((err) => { logger.warn(`Redis sub connection failed: ${(err as Error).message}`); }),
    );
  }

  // Start REST + WebSocket engines in parallel while Redis connects.
  const enginePromises: Promise<void>[] = [
    restEngine.start(),
    wsEngine.start(),
  ];

  // Wait for everything concurrently.
  await Promise.all([...redisPromises, ...enginePromises]);

  // Activate the pub/sub backplane only AFTER both Redis clients are connected.
  if (backplane) {
    await backplane.activate();
    logger.info('Redis WebSocket backplane activated');
  }

  const elapsed = Date.now() - t0;
  logger.info(`Casuya API gateway listening on http://${HOST}:${PORT} (${elapsed}ms boot)`);
  logger.info(`WebSocket engine listening on ws://${HOST}:${WS_PORT}`);
  logger.info(`Health: /health (liveness)  /health/ready (readiness)  /health/detail`);
  logger.info(`Rate limiter: ${redisClient ? 'Redis-backed (distributed)' : 'in-memory (local)'}`);
  logger.info(`WebSocket backplane: ${backplane ? 'Redis pub/sub (cross-pod)' : 'local-only'}`);
}

start().catch((err) => {
  logger.error(`Failed to start API gateway: ${(err as Error).message}`);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
async function shutdown(): Promise<void> {
  logger.info('Shutting down API gateway...');
  try {
    await wsEngine.stop();
    await backplane?.deactivate();
    await restEngine.stop();
    await closeRedisClients();
  } catch (err) {
    logger.error(`Shutdown error: ${(err as Error).message}`);
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
