import { SearchIndex } from '../src/indexing/SearchIndex';
import { SearchDocument, SearchQuery } from '../src/types';

describe('SearchIndex', () => {
  let searchIndex: SearchIndex;
  let sampleDocuments: SearchDocument[];

  beforeEach(() => {
    searchIndex = new SearchIndex();
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
    ];
  });

  describe('addDocument', () => {
    it('should add a single document', () => {
      searchIndex.addDocument(sampleDocuments[0]);
      expect(searchIndex.size()).toBe(1);
    });

    it('should add multiple documents', () => {
      searchIndex.addDocuments(sampleDocuments);
      expect(searchIndex.size()).toBe(3);
    });

    it('should update existing document', () => {
      searchIndex.addDocument(sampleDocuments[0]);
      const updatedDoc = { ...sampleDocuments[0], title: 'Updated Title' };
      searchIndex.addDocument(updatedDoc);
      expect(searchIndex.size()).toBe(1);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      searchIndex.addDocuments(sampleDocuments);
    });

    it('should find documents by title', () => {
      const query: SearchQuery = { query: 'algebra' };
      const results = searchIndex.search(query);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.title).toContain('Algebra');
    });

    it('should find documents by content', () => {
      const query: SearchQuery = { query: 'equations' };
      const results = searchIndex.search(query);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by type', () => {
      const query: SearchQuery = { query: 'algebra', type: 'lesson' };
      const results = searchIndex.search(query);
      expect(results.every((r) => r.document.type === 'lesson')).toBe(true);
    });

    it('should filter by subject', () => {
      const query: SearchQuery = { query: 'algebra', subject: 'Mathematics' };
      const results = searchIndex.search(query);
      expect(results.every((r) => r.document.subject === 'Mathematics')).toBe(true);
    });

    it('should apply pagination', () => {
      const query: SearchQuery = { query: 'math', limit: 1, offset: 0 };
      const results = searchIndex.search(query);
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for no matches', () => {
      const query: SearchQuery = { query: 'nonexistent' };
      const results = searchIndex.search(query);
      expect(results.length).toBe(0);
    });
  });

  describe('removeDocument', () => {
    it('should remove a document', () => {
      searchIndex.addDocuments(sampleDocuments);
      searchIndex.removeDocument('1');
      expect(searchIndex.size()).toBe(2);
      expect(searchIndex.getDocument('1')).toBeUndefined();
    });
  });

  describe('getDocument', () => {
    it('should return document by ID', () => {
      searchIndex.addDocument(sampleDocuments[0]);
      const doc = searchIndex.getDocument('1');
      expect(doc).toBeDefined();
      expect(doc?.id).toBe('1');
    });

    it('should return undefined for non-existent document', () => {
      const doc = searchIndex.getDocument('999');
      expect(doc).toBeUndefined();
    });
  });

  describe('getDocumentsByType', () => {
    it('should return documents of specified type', () => {
      searchIndex.addDocuments(sampleDocuments);
      const lessons = searchIndex.getDocumentsByType('lesson');
      expect(lessons.length).toBe(2);
      expect(lessons.every((d) => d.type === 'lesson')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all documents', () => {
      searchIndex.addDocuments(sampleDocuments);
      searchIndex.clear();
      expect(searchIndex.size()).toBe(0);
    });
  });
});
