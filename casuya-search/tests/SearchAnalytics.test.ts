import { SearchAnalytics } from '../src/analytics/SearchAnalytics';

describe('SearchAnalytics', () => {
  let analytics: SearchAnalytics;

  beforeEach(() => {
    analytics = new SearchAnalytics(100);
  });

  describe('recordSearch', () => {
    it('should record a search event', () => {
      analytics.recordSearch({
        query: 'algebra',
        timestamp: new Date(),
        resultsCount: 5,
      });
      expect(analytics.size()).toBe(1);
    });

    it('should evict old events when at capacity', () => {
      const smallAnalytics = new SearchAnalytics(2);
      smallAnalytics.recordSearch({ query: 'q1', timestamp: new Date(), resultsCount: 1 });
      smallAnalytics.recordSearch({ query: 'q2', timestamp: new Date(), resultsCount: 2 });
      smallAnalytics.recordSearch({ query: 'q3', timestamp: new Date(), resultsCount: 3 });
      expect(smallAnalytics.size()).toBe(2);
    });
  });

  describe('getPopularQueries', () => {
    it('should return popular queries sorted by count', () => {
      analytics.recordSearch({ query: 'algebra', timestamp: new Date(), resultsCount: 5 });
      analytics.recordSearch({ query: 'algebra', timestamp: new Date(), resultsCount: 3 });
      analytics.recordSearch({ query: 'calculus', timestamp: new Date(), resultsCount: 4 });
      analytics.recordSearch({ query: 'physics', timestamp: new Date(), resultsCount: 2 });

      const popular = analytics.getPopularQueries(2);
      expect(popular.length).toBe(2);
      expect(popular[0].query).toBe('algebra');
      expect(popular[0].count).toBe(2);
    });
  });

  describe('getSearchTrends', () => {
    it('should return search counts grouped by date', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      analytics.recordSearch({ query: 'algebra', timestamp: yesterday, resultsCount: 5 });
      analytics.recordSearch({ query: 'calculus', timestamp: yesterday, resultsCount: 3 });
      analytics.recordSearch({ query: 'physics', timestamp: twoDaysAgo, resultsCount: 2 });

      const trends = analytics.getSearchTrends(30);
      expect(trends.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter events outside the date range', () => {
      const now = new Date();
      const oldDate = new Date('2020-01-01');

      analytics.recordSearch({ query: 'old', timestamp: oldDate, resultsCount: 1 });
      analytics.recordSearch({ query: 'recent', timestamp: now, resultsCount: 1 });

      const trends = analytics.getSearchTrends(7);
      const oldEntry = trends.find((t) => t.date === '2020-01-01');
      expect(oldEntry).toBeUndefined();
    });
  });

  describe('getZeroResultQueries', () => {
    it('should return queries with zero results', () => {
      analytics.recordSearch({ query: 'algebra', timestamp: new Date(), resultsCount: 0 });
      analytics.recordSearch({ query: 'algebra', timestamp: new Date(), resultsCount: 0 });
      analytics.recordSearch({ query: 'calculus', timestamp: new Date(), resultsCount: 5 });
      analytics.recordSearch({ query: 'physics', timestamp: new Date(), resultsCount: 0 });

      const zeroResults = analytics.getZeroResultQueries(10);
      expect(zeroResults.length).toBe(2);
      expect(zeroResults[0].query).toBe('algebra');
      expect(zeroResults[0].count).toBe(2);
    });
  });

  describe('getAverageResults', () => {
    it('should calculate average results per search', () => {
      analytics.recordSearch({ query: 'q1', timestamp: new Date(), resultsCount: 10 });
      analytics.recordSearch({ query: 'q2', timestamp: new Date(), resultsCount: 20 });
      analytics.recordSearch({ query: 'q3', timestamp: new Date(), resultsCount: 30 });

      expect(analytics.getAverageResults()).toBe(20);
    });

    it('should return 0 if no events', () => {
      expect(analytics.getAverageResults()).toBe(0);
    });
  });

  describe('getMostClickedDocuments', () => {
    it('should return documents sorted by click count', () => {
      analytics.recordSearch({
        query: 'algebra',
        timestamp: new Date(),
        resultsCount: 5,
        clickedResults: ['doc1', 'doc2'],
      });
      analytics.recordSearch({
        query: 'calculus',
        timestamp: new Date(),
        resultsCount: 3,
        clickedResults: ['doc1'],
      });

      const clicked = analytics.getMostClickedDocuments(10);
      expect(clicked.length).toBe(2);
      expect(clicked[0].documentId).toBe('doc1');
      expect(clicked[0].clicks).toBe(2);
    });
  });

  describe('getFilterUsage', () => {
    it('should return filter usage statistics', () => {
      analytics.recordSearch({
        query: 'algebra',
        timestamp: new Date(),
        resultsCount: 5,
        filters: ['type:lesson', 'difficulty:beginner'],
      });
      analytics.recordSearch({
        query: 'calculus',
        timestamp: new Date(),
        resultsCount: 3,
        filters: ['type:lesson'],
      });

      const usage = analytics.getFilterUsage();
      expect(usage.length).toBe(2);
      expect(usage.find((f) => f.filter === 'type:lesson')!.count).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all events', () => {
      analytics.recordSearch({ query: 'algebra', timestamp: new Date(), resultsCount: 5 });
      analytics.clear();
      expect(analytics.size()).toBe(0);
    });
  });
});
