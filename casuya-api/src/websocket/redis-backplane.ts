import Redis from 'ioredis';
import { WebSocketBackplane } from './connection-manager';

const CHANNEL_PREFIX = 'casuya:ws:';

/**
 * Redis pub/sub backplane for WebSocket fan-out across API pods.
 *
 * Each pod publishes on the channel name; every other pod subscribes via a
 * dedicated Redis connection. Messages include a local `excludeClientId`
 * hint encoded as a header so the receiving pod can skip delivery to the
 * originating socket when applicable.
 */
export class RedisWebSocketBackplane implements WebSocketBackplane {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Array<(channel: string, message: string, excludeClientId?: string) => void> = [];

  constructor(publisher: Redis, subscriber: Redis) {
    this.publisher = publisher;
    this.subscriber = subscriber;

    this.subscriber.on('message', (_channel: string, raw: string) => {
      // Format: "excludeClientId|null|payload"
      const sepIdx = raw.indexOf('|');
      const sepIdx2 = raw.indexOf('|', sepIdx + 1);
      const excludeClientId = raw.substring(0, sepIdx);
      const payload = raw.substring(sepIdx2 + 1);
      const channel = _channel.substring(CHANNEL_PREFIX.length);

      for (const handler of this.handlers) {
        handler(channel, payload, excludeClientId || undefined);
      }
    });
  }

  async publish(channel: string, message: string, excludeClientId?: string): Promise<void> {
    const envelope = `${excludeClientId || ''}|${message}`;
    await this.publisher.publish(`${CHANNEL_PREFIX}${channel}`, envelope);
  }

  subscribe(handler: (channel: string, message: string, excludeClientId?: string) => void): void {
    this.handlers.push(handler);
  }

  /**
   * Subscribe to a specific Redis channel (must be called before the
   * backplane starts receiving). The backplane uses pattern subscribe so
   * any new channel name is automatically covered.
   */
  async activate(pattern: string = `${CHANNEL_PREFIX}*`): Promise<void> {
    await this.subscriber.psubscribe(pattern);
  }

  async deactivate(): Promise<void> {
    await this.subscriber.punsubscribe();
  }
}
