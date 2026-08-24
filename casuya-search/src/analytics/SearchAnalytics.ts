/**
 * SearchAnalytics - Analytics for search behavior
 * Tracks and analyzes search patterns for optimization
 */

interface SearchEvent {
  query: string;
  timestamp: Date;
  resultsCount: number;
  userId?: string;
  filters?: string[];
  clickedResults?: string[];
}

export class SearchAnalytics {
  private events: SearchEvent[];
  private maxEvents: number;

  constructor(maxEvents: number = 10000) {
    this.events = [];
    this.maxEvents = maxEvents;
  }

  /**
   * Record a search event
   */
  recordSearch(event: SearchEvent): void {
    this.events.push(event);

    // Evict old events if at capacity
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Get popular search queries
   */
  getPopularQueries(limit: number = 10): Array<{ query: string; count: number }> {
    const queryCounts = new Map<string, number>();

    for (const event of this.events) {
      const count = queryCounts.get(event.query) || 0;
      queryCounts.set(event.query, count + 1);
    }

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get search trends over time
   */
  getSearchTrends(days: number = 7): Array<{ date: string; count: number }> {
    const trends = new Map<string, number>();
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    for (const event of this.events) {
      if (event.timestamp < cutoff) continue;

      const dateKey = event.timestamp.toISOString().split('T')[0];
      const count = trends.get(dateKey) || 0;
      trends.set(dateKey, count + 1);
    }

    return Array.from(trends.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get zero-result queries (queries that returned no results)
   */
  getZeroResultQueries(limit: number = 10): Array<{ query: string; count: number }> {
    const queryCounts = new Map<string, number>();

    for (const event of this.events) {
      if (event.resultsCount === 0) {
        const count = queryCounts.get(event.query) || 0;
        queryCounts.set(event.query, count + 1);
      }
    }

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get average results per search
   */
  getAverageResults(): number {
    if (this.events.length === 0) return 0;

    const total = this.events.reduce((sum, event) => sum + event.resultsCount, 0);
    return total / this.events.length;
  }

  /**
   * Get most clicked documents
   */
  getMostClickedDocuments(limit: number = 10): Array<{ documentId: string; clicks: number }> {
    const clickCounts = new Map<string, number>();

    for (const event of this.events) {
      if (!event.clickedResults) continue;

      for (const docId of event.clickedResults) {
        const count = clickCounts.get(docId) || 0;
        clickCounts.set(docId, count + 1);
      }
    }

    return Array.from(clickCounts.entries())
      .map(([documentId, clicks]) => ({ documentId, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit);
  }

  /**
   * Get filter usage statistics
   */
  getFilterUsage(): Array<{ filter: string; count: number }> {
    const filterCounts = new Map<string, number>();

    for (const event of this.events) {
      if (!event.filters) continue;

      for (const filter of event.filters) {
        const count = filterCounts.get(filter) || 0;
        filterCounts.set(filter, count + 1);
      }
    }

    return Array.from(filterCounts.entries())
      .map(([filter, count]) => ({ filter, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get total event count
   */
  size(): number {
    return this.events.length;
  }
}
