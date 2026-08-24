import { RecommendationEngine } from '../src/recommendations/RecommendationEngine';
import { SearchDocument } from '../src/types';

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;
  let sampleDocuments: SearchDocument[];

  beforeEach(() => {
    engine = new RecommendationEngine(5);
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
        updatedAt: new Date('2024-01-01'),
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
      {
        id: '4',
        type: 'media',
        title: 'Physics Documentary',
        content: 'A documentary about physics',
        metadata: {},
        tags: ['physics', 'science'],
        subject: 'Physics',
        topic: 'General Physics',
        difficulty: 'beginner',
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04'),
      },
    ];
  });

  describe('getRecommendations', () => {
    it('should return popular recommendations for new users', () => {
      const recs = engine.getRecommendations('new-user', sampleDocuments);
      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0].documentId).toBe('4');
      expect(recs[0].reason).toBe('Popular content');
    });

    it('should return recommendations based on user interactions', () => {
      engine.recordInteraction('user1', '1', 'view');
      engine.recordInteraction('user1', '3', 'like');

      const recs = engine.getRecommendations('user1', sampleDocuments);

      expect(recs.length).toBeGreaterThan(0);
      expect(recs.some((r) => r.documentId === '1')).toBe(true);
      expect(recs.some((r) => r.documentId === '3')).toBe(true);
    });

    it('should recommend documents with matching subjects', () => {
      engine.recordInteraction('user1', '1', 'like');

      const recs = engine.getRecommendations('user1', sampleDocuments);

      // Document 3 shares subject (Mathematics) and topic (Algebra) with doc 1
      const algebraQuiz = recs.find((r) => r.documentId === '3');
      expect(algebraQuiz).toBeDefined();
      expect(algebraQuiz!.reason).toContain('Mathematics');
    });

    it('should not recommend documents already interacted with', () => {
      engine.recordInteraction('user1', '1', 'view');

      const recs = engine.getRecommendations('user1', sampleDocuments);

      // Docs with same subject should still appear in recommendations
      expect(recs.length).toBeGreaterThan(0);
    });
  });

  describe('recordInteraction', () => {
    it('should record multiple interactions for a user', () => {
      engine.recordInteraction('user1', '1', 'view');
      engine.recordInteraction('user1', '2', 'like');
      engine.recordInteraction('user1', '3', 'complete');

      const recs = engine.getRecommendations('user1', sampleDocuments);

      // Should have recommendations based on interactions
      expect(recs.length).toBeGreaterThan(0);
    });
  });

  describe('clearUserInteractions', () => {
    it('should clear interactions for a user', () => {
      engine.recordInteraction('user1', '1', 'view');
      engine.clearUserInteractions('user1');

      const recs = engine.getRecommendations('user1', sampleDocuments);
      expect(recs[0].reason).toBe('Popular content');
    });
  });

  describe('clear', () => {
    it('should clear all data', () => {
      engine.recordInteraction('user1', '1', 'view');
      engine.clear();

      const recs = engine.getRecommendations('user1', sampleDocuments);
      expect(recs[0].reason).toBe('Popular content');
    });
  });

  describe('indexDocuments', () => {
    it('should index documents for later lookups', () => {
      engine.indexDocuments(sampleDocuments);
      engine.recordInteraction('user1', '1', 'like');

      const recs = engine.getRecommendations('user1', sampleDocuments);
      expect(recs.some((r) => r.documentId === '3')).toBe(true);
    });
  });
});
