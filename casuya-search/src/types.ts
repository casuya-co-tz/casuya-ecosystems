/**
 * Core type definitions for Casuya Search
 */

export interface SearchDocument {
  id: string;
  type: 'subject' | 'topic' | 'lesson' | 'quiz' | 'media';
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  subject?: string;
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchQuery {
  query: string;
  filters?: Filter[];
  limit?: number;
  offset?: number;
  type?: SearchDocument['type'];
  subject?: string;
  topic?: string;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  highlights: string[];
}

export interface RankingConfig {
  weights: {
    title: number;
    content: number;
    tags: number;
    metadata: number;
    recency: number;
    popularity: number;
  };
  boostRecent?: boolean;
  boostPopular?: boolean;
}

export interface Suggestion {
  text: string;
  type: 'query' | 'subject' | 'topic' | 'tag';
  frequency: number;
}

export interface Filter {
  field: keyof SearchDocument | string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: unknown;
}

export interface Recommendation {
  documentId: string;
  reason: string;
  score: number;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}
