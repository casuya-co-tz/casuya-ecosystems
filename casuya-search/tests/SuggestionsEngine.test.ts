import { SuggestionsEngine } from '../src/suggestions/SuggestionsEngine';
import { SearchDocument } from '../src/types';

describe('SuggestionsEngine', () => {
  let suggestionsEngine: SuggestionsEngine;
  let sampleDocuments: SearchDocument[];

  beforeEach(() => {
    suggestionsEngine = new SuggestionsEngine(10);
    sampleDocuments = [
      {
        id: '1',
        type: 'lesson',
        title: 'Introduction to Algebra',
        content: 'Learn algebra basics',
        metadata: {},
        tags: ['math', 'algebra', 'beginner'],
        subject: 'Mathematics',
        topic: 'Algebra',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        type: 'lesson',
        title: 'Calculus Fundamentals',
        content: 'Learn calculus basics',
        metadata: {},
        tags: ['math', 'calculus', 'beginner'],
        subject: 'Mathematics',
        topic: 'Calculus',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  });

  describe('getSuggestions', () => {
    it('should return suggestions for partial query', () => {
      suggestionsEngine.addSuggestion('algebra', 'query');
      suggestionsEngine.addSuggestion('algebraic equations', 'query');
      const suggestions = suggestionsEngine.getSuggestions('alg');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].text).toContain('alg');
    });

    it('should return empty array for no matches', () => {
      const suggestions = suggestionsEngine.getSuggestions('xyz');
      expect(suggestions.length).toBe(0);
    });

    it('should limit suggestions to maxSuggestions', () => {
      for (let i = 0; i < 20; i++) {
        suggestionsEngine.addSuggestion(`test${i}`, 'query');
      }
      const suggestions = suggestionsEngine.getSuggestions('test');
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });
  });

  describe('addSuggestion', () => {
    it('should add new suggestion', () => {
      suggestionsEngine.addSuggestion('mathematics', 'subject');
      const suggestions = suggestionsEngine.getSuggestions('math');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should increment frequency for existing suggestion', () => {
      suggestionsEngine.addSuggestion('algebra', 'query');
      suggestionsEngine.addSuggestion('algebra', 'query');
      const suggestions = suggestionsEngine.getSuggestions('algebra');
      expect(suggestions[0].frequency).toBe(2);
    });
  });

  describe('indexDocuments', () => {
    it('should extract suggestions from documents', () => {
      suggestionsEngine.indexDocuments(sampleDocuments);
      const suggestions = suggestionsEngine.getSuggestions('algebra');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('recordQuery', () => {
    it('should record query for history', () => {
      suggestionsEngine.recordQuery('algebra equations');
      const popular = suggestionsEngine.getPopularQueries();
      expect(popular.some((q) => q.text === 'algebra equations')).toBe(true);
    });
  });

  describe('getPopularQueries', () => {
    it('should return popular queries sorted by frequency', () => {
      suggestionsEngine.recordQuery('algebra');
      suggestionsEngine.recordQuery('algebra');
      suggestionsEngine.recordQuery('calculus');
      const popular = suggestionsEngine.getPopularQueries();
      expect(popular[0].text).toBe('algebra');
      expect(popular[0].frequency).toBe(2);
    });

    it('should limit results', () => {
      for (let i = 0; i < 20; i++) {
        suggestionsEngine.recordQuery(`query${i}`);
      }
      const popular = suggestionsEngine.getPopularQueries(5);
      expect(popular.length).toBeLessThanOrEqual(5);
    });
  });

  describe('clear', () => {
    it('should clear all suggestions', () => {
      suggestionsEngine.addSuggestion('test', 'query');
      suggestionsEngine.clear();
      expect(suggestionsEngine.size()).toBe(0);
    });
  });
});
