/**
 * RankingEngine - Advanced ranking algorithms for search results
 * Supports configurable weights and boosting strategies
 */

import { SearchResult, SearchDocument, RankingConfig } from '../types';

export class RankingEngine {
  private config: RankingConfig;
  private popularityScores: Map<string, number>;

  constructor(config?: Partial<RankingConfig>) {
    this.config = {
      weights: {
        title: 10,
        content: 1,
        tags: 5,
        metadata: 2,
        recency: 3,
        popularity: 4,
      },
      boostRecent: true,
      boostPopular: true,
      ...config,
    };
    this.popularityScores = new Map();
  }

  /**
   * Rank search results based on configuration
   */
  rank(results: SearchResult[]): SearchResult[] {
    return results
      .map((result) => ({
        ...result,
        score: this.calculateScore(result),
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate a comprehensive score for a search result
   */
  private calculateScore(result: SearchResult): number {
    const { document, score: baseScore } = result;
    let finalScore = baseScore;

    // Apply recency boost if enabled
    if (this.config.boostRecent) {
      const recencyScore = this.calculateRecencyScore(document);
      finalScore += recencyScore * this.config.weights.recency;
    }

    // Apply popularity boost if enabled
    if (this.config.boostPopular) {
      const popularityScore = this.popularityScores.get(document.id) || 0;
      finalScore += popularityScore * this.config.weights.popularity;
    }

    return finalScore;
  }

  /**
   * Calculate recency score based on document update time
   * More recent documents get higher scores
   */
  private calculateRecencyScore(document: SearchDocument): number {
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - document.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    // Decay score over time (30-day half-life)
    return Math.exp(-daysSinceUpdate / 30);
  }

  /**
   * Update popularity score for a document
   */
  updatePopularity(documentId: string, score: number): void {
    this.popularityScores.set(documentId, score);
  }

  /**
   * Batch update popularity scores
   */
  updatePopularityBatch(scores: Map<string, number>): void {
    scores.forEach((score, id) => {
      this.popularityScores.set(id, score);
    });
  }

  /**
   * Update ranking configuration
   */
  updateConfig(config: Partial<RankingConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      weights: {
        ...this.config.weights,
        ...config.weights,
      },
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): RankingConfig {
    return { ...this.config };
  }

  /**
   * Reset popularity scores
   */
  resetPopularity(): void {
    this.popularityScores.clear();
  }
}
