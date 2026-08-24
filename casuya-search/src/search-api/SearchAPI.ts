/**
 * SearchAPI - Public API for search functionality
 * Integrates all search components into a unified interface
 */

import { SearchIndex } from '../indexing/SearchIndex';
import { RankingEngine } from '../ranking/RankingEngine';
import { SuggestionsEngine } from '../suggestions/SuggestionsEngine';
import { FilterEngine } from '../filters/FilterEngine';
import { RecommendationEngine } from '../recommendations/RecommendationEngine';
import { CacheManager } from '../caching/CacheManager';
import { SearchAnalytics } from '../analytics/SearchAnalytics';
import {
  SearchDocument,
  SearchQuery,
  SearchResult,
  Suggestion,
  Recommendation,
  CacheConfig,
} from '../types';

export class SearchAPI {
  private searchIndex: SearchIndex;
  private rankingEngine: RankingEngine;
  private suggestionsEngine: SuggestionsEngine;
  private filterEngine: FilterEngine;
  private recommendationEngine: RecommendationEngine;
  private resultCache: CacheManager<SearchResult[]>;
  private analytics: SearchAnalytics;

  constructor(cacheConfig?: CacheConfig, maxAnalyticsEvents?: number) {
    this.searchIndex = new SearchIndex();
    this.rankingEngine = new RankingEngine();
    this.suggestionsEngine = new SuggestionsEngine();
    this.filterEngine = new FilterEngine();
    this.recommendationEngine = new RecommendationEngine();
    this.analytics = new SearchAnalytics(maxAnalyticsEvents);

    // Default cache configuration
    this.resultCache = new CacheManager<SearchResult[]>(
      cacheConfig || {
        maxSize: 1000,
        ttl: 300000, // 5 minutes
        strategy: 'lru',
      }
    );
  }

  /**
   * Perform a search query
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Check cache first
    const cacheKey = this.generateCacheKey(query);
    const cached = this.resultCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform search
    let results = this.searchIndex.search(query);

    // Apply filters if provided
    if (query.filters && query.filters.length > 0) {
      const documents = results.map((r) => r.document);
      const filteredDocs = this.filterEngine.applyFilters(documents, query.filters);
      const filteredIds = new Set(filteredDocs.map((d) => d.id));
      results = results.filter((r) => filteredIds.has(r.document.id));
    }

    // Apply ranking
    results = this.rankingEngine.rank(results);

    // Cache results
    this.resultCache.set(cacheKey, results);

    // Record query for suggestions
    this.suggestionsEngine.recordQuery(query.query);

    // Record analytics event
    this.analytics.recordSearch({
      query: query.query,
      timestamp: new Date(),
      resultsCount: results.length,
      filters: query.filters?.map((f) => `${f.field}:${f.operator}`),
    });

    return results;
  }

  /**
   * Get search suggestions
   */
  getSuggestions(query: string): Suggestion[] {
    return this.suggestionsEngine.getSuggestions(query);
  }

  /**
   * Get recommendations for a user
   */
  getRecommendations(userId: string): Recommendation[] {
    const allDocuments = Array.from(this.searchIndex['documents'].values());
    return this.recommendationEngine.getRecommendations(userId, allDocuments);
  }

  /**
   * Index a document
   */
  indexDocument(document: SearchDocument): void {
    this.searchIndex.addDocument(document);
    this.suggestionsEngine.indexDocuments([document]);
    this.invalidateCache();
  }

  /**
   * Index multiple documents
   */
  indexDocuments(documents: SearchDocument[]): void {
    this.searchIndex.addDocuments(documents);
    this.suggestionsEngine.indexDocuments(documents);
    this.invalidateCache();
  }

  /**
   * Remove a document from index
   */
  removeDocument(id: string): void {
    this.searchIndex.removeDocument(id);
    this.invalidateCache();
  }

  /**
   * Record user interaction for recommendations
   */
  recordInteraction(
    userId: string,
    documentId: string,
    type: 'view' | 'like' | 'complete' | 'bookmark'
  ): void {
    this.recommendationEngine.recordInteraction(userId, documentId, type);
  }

  /**
   * Update popularity scores for ranking
   */
  updatePopularity(scores: Map<string, number>): void {
    this.rankingEngine.updatePopularityBatch(scores);
  }

  /**
   * Get search statistics
   */
  getStats(): SearchStats {
    return {
      totalDocuments: this.searchIndex.size(),
      totalSuggestions: this.suggestionsEngine.size(),
      cacheStats: this.resultCache.getStats(),
      analyticsStats: {
        totalEvents: this.analytics.size(),
        popularQueries: this.analytics.getPopularQueries(5),
        averageResults: this.analytics.getAverageResults(),
        zeroResultQueries: this.analytics.getZeroResultQueries(5),
      },
    };
  }

  /**
   * Get search trends from analytics
   */
  getSearchTrends(days?: number): ReturnType<SearchAnalytics['getSearchTrends']> {
    return this.analytics.getSearchTrends(days);
  }

  /**
   * Get most clicked documents from analytics
   */
  getMostClickedDocuments(limit?: number): ReturnType<SearchAnalytics['getMostClickedDocuments']> {
    return this.analytics.getMostClickedDocuments(limit);
  }

  /**
   * Record a click on a search result for analytics
   */
  recordClick(query: SearchQuery, documentId: string): void {
    this.analytics.recordSearch({
      query: query.query,
      timestamp: new Date(),
      resultsCount: 0,
      clickedResults: [documentId],
      filters: query.filters?.map((f) => `${f.field}:${f.operator}`),
    });
  }

  /**
   * Generate cache key from query
   */
  private generateCacheKey(query: SearchQuery): string {
    return JSON.stringify(query);
  }

  /**
   * Invalidate all cached results
   */
  private invalidateCache(): void {
    this.resultCache.clear();
  }
}

interface SearchStats {
  totalDocuments: number;
  totalSuggestions: number;
  cacheStats: unknown;
  analyticsStats: {
    totalEvents: number;
    popularQueries: Array<{ query: string; count: number }>;
    averageResults: number;
    zeroResultQueries: Array<{ query: string; count: number }>;
  };
}
