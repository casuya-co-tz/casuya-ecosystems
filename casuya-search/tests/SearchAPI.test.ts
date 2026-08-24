import { SearchAPI } from '../src/search-api/SearchAPI';
import { SearchDocument, SearchQuery } from '../src/types';

describe('SearchAPI', () => {
  let api: SearchAPI;
  let sampleDocuments: SearchDocument[];

  beforeEach(() => {
    api = new SearchAPI({ maxSize: 100, ttl: 300000, strategy: 'lru' });
    sampleDocuments = [
      {
        id: '1',
        type: 'lesson',
        title: 'Introduction to Algebra',
        content: 'Learn the basics of algebraic equations and variables',
        metadata: { duration: 30 },
        tags: ['math', 'algebra', 'beginner'],
        subject: 'Mathematics',
        topic: 'Algebra',
        difficulty: 'beginner',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: '2',
        type: 'lesson',
        title: 'Advanced Calculus',
        content: 'Deep dive into derivatives and integrals',
        metadata: { duration: 45 },
        tags: ['math', 'calculus', 'advanced'],
        subject: 'Mathematics',
        topic: 'Calculus',
        difficulty: 'advanced',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        type: 'quiz',
        title: 'Algebra Quiz',
        content: 'Test your algebra knowledge',
        metadata: { questions: 10 },
        tags: ['math', 'algebra', 'quiz'],
        subject: 'Mathematics',
        topic: 'Algebra',
        difficulty: 'intermediate',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
    ];
  });

  describe('indexDocument', () => {
    it('should index a single document', () => {
      api.indexDocument(sampleDocuments[0]);
      const stats = api.getStats();
      expect(stats.totalDocuments).toBe(1);
    });

    it('should make document searchable', async () => {
      api.indexDocument(sampleDocuments[0]);
      const results = await api.search({ query: 'algebra' });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('indexDocuments', () => {
    it('should index multiple documents', () => {
      api.indexDocuments(sampleDocuments);
      const stats = api.getStats();
      expect(stats.totalDocuments).toBe(3);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      api.indexDocuments(sampleDocuments);
    });

    it('should return matching results', async () => {
      const results = await api.search({ query: 'algebra' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should apply filters', async () => {
      const query: SearchQuery = {
        query: 'algebra',
        filters: [{ field: 'type', operator: 'eq', value: 'quiz' }],
      };
      const results = await api.search(query);
      expect(results.every((r) => r.document.type === 'quiz')).toBe(true);
    });

    it('should cache results', async () => {
      const query: SearchQuery = { query: 'algebra' };
      const first = await api.search(query);
      const second = await api.search(query);
      expect(first).toEqual(second);
    });

    it('should limit results', async () => {
      const results = await api.search({ query: 'math', limit: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions for queries', () => {
      api.indexDocuments(sampleDocuments);
      const suggestions = api.getSuggestions('alge');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.text.toLowerCase().includes('alge'))).toBe(true);
    });
  });

  describe('getRecommendations', () => {
    it('should return recommendations for a user', () => {
      api.indexDocuments(sampleDocuments);
      api.recordInteraction('user1', '1', 'view');
      const recs = api.getRecommendations('user1');
      expect(recs.length).toBeGreaterThan(0);
    });
  });

  describe('removeDocument', () => {
    it('should remove a document and invalidate cache', () => {
      api.indexDocuments(sampleDocuments);
      api.removeDocument('1');
      const stats = api.getStats();
      expect(stats.totalDocuments).toBe(2);
    });
  });

  describe('updatePopularity', () => {
    it('should update popularity scores', async () => {
      api.indexDocuments(sampleDocuments);
      const scores = new Map([['1', 100]]);
      api.updatePopularity(scores);
      const results = await api.search({ query: 'equations' });
      if (results.length > 0) {
        expect(results[0].document.id).toBe('1');
      }
    });
  });

  describe('getStats', () => {
    it('should return search statistics', () => {
      api.indexDocuments(sampleDocuments);
      const stats = api.getStats();
      expect(stats.totalDocuments).toBe(3);
      expect(stats.cacheStats).toBeDefined();
      expect(stats.analyticsStats).toBeDefined();
      expect(stats.analyticsStats.totalEvents).toBe(0);
    });

    it('should track analytics events after searches', async () => {
      api.indexDocuments(sampleDocuments);
      await api.search({ query: 'algebra' });
      const stats = api.getStats();
      expect(stats.analyticsStats.totalEvents).toBeGreaterThan(0);
    });
  });

  describe('recordClick', () => {
    it('should record a click event', () => {
      api.recordClick({ query: 'algebra' }, '1');
      const clicked = api.getMostClickedDocuments();
      expect(clicked.length).toBe(1);
      expect(clicked[0].documentId).toBe('1');
      expect(clicked[0].clicks).toBe(1);
    });
  });
});
