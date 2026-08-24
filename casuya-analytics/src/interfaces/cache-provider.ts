import { CacheStrategy } from './types';

export interface CacheConfig {
  strategy: CacheStrategy;
  max_size: number;
  ttl_seconds?: number;
  namespace?: string;
}

export interface CacheProvider {
  readonly name: string;
  configure(config: CacheConfig): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl_seconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): Promise<CacheStats>;
  shutdown(): Promise<void>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hit_rate: number;
}
