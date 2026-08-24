/**
 * Casuya Search - Google Inside Casuya
 * Educational content search and discovery system
 */

export { SearchIndex } from './indexing/SearchIndex';
export { RankingEngine } from './ranking/RankingEngine';
export { SuggestionsEngine } from './suggestions/SuggestionsEngine';
export { FilterEngine } from './filters/FilterEngine';
export { RecommendationEngine } from './recommendations/RecommendationEngine';
export { CacheManager } from './caching/CacheManager';
export { SearchAPI } from './search-api/SearchAPI';
export { SearchAnalytics } from './analytics/SearchAnalytics';

export type {
  SearchDocument,
  SearchResult,
  SearchQuery,
  RankingConfig,
  Suggestion,
  Filter,
  Recommendation,
  CacheConfig,
} from './types';
