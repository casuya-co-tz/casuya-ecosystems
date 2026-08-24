import { FilterEngine } from '../src/filters/FilterEngine';
import { SearchDocument, Filter } from '../src/types';

describe('FilterEngine', () => {
  let filterEngine: FilterEngine;
  let sampleDocuments: SearchDocument[];

  beforeEach(() => {
    filterEngine = new FilterEngine();
    sampleDocuments = [
      {
        id: '1',
        type: 'lesson',
        title: 'Introduction to Algebra',
        content: 'Learn algebra basics',
        metadata: { duration: 30, difficulty: 'beginner' },
        tags: ['math', 'algebra'],
        difficulty: 'beginner',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        type: 'quiz',
        title: 'Algebra Quiz',
        content: 'Test your knowledge',
        metadata: { duration: 15, difficulty: 'intermediate' },
        tags: ['math', 'algebra', 'quiz'],
        difficulty: 'intermediate',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        type: 'lesson',
        title: 'Advanced Calculus',
        content: 'Deep dive into calculus',
        metadata: { duration: 45, difficulty: 'advanced' },
        tags: ['math', 'calculus'],
        difficulty: 'advanced',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  });

  describe('applyFilters', () => {
    it('should return all documents when no filters', () => {
      const filtered = filterEngine.applyFilters(sampleDocuments, []);
      expect(filtered.length).toBe(3);
    });

    it('should filter by equality', () => {
      const filters: Filter[] = [{ field: 'type', operator: 'eq', value: 'lesson' }];
      const filtered = filterEngine.applyFilters(sampleDocuments, filters);
      expect(filtered.length).toBe(2);
      expect(filtered.every((d) => d.type === 'lesson')).toBe(true);
    });

    it('should filter by inequality', () => {
      const filters: Filter[] = [{ field: 'type', operator: 'ne', value: 'quiz' }];
      const filtered = filterEngine.applyFilters(sampleDocuments, filters);
      expect(filtered.length).toBe(2);
      expect(filtered.every((d) => d.type !== 'quiz')).toBe(true);
    });

    it('should filter by contains', () => {
      const filters: Filter[] = [{ field: 'title', operator: 'contains', value: 'algebra' }];
      const filtered = filterEngine.applyFilters(sampleDocuments, filters);
      expect(filtered.length).toBe(2);
      expect(filtered.every((d) => d.title.toLowerCase().includes('algebra'))).toBe(true);
    });

    it('should filter by in array', () => {
      const filters: Filter[] = [
        { field: 'difficulty', operator: 'in', value: ['beginner', 'intermediate'] },
      ];
      const filtered = filterEngine.applyFilters(sampleDocuments, filters);
      expect(filtered.length).toBe(2);
    });

    it('should apply multiple filters', () => {
      const filters: Filter[] = [
        { field: 'type', operator: 'eq', value: 'lesson' },
        { field: 'difficulty', operator: 'eq', value: 'beginner' },
      ];
      const filtered = filterEngine.applyFilters(sampleDocuments, filters);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by metadata field', () => {
      const filters: Filter[] = [{ field: 'duration', operator: 'gt', value: 20 }];
      const filtered = filterEngine.applyFilters(sampleDocuments, filters);
      expect(filtered.length).toBe(2);
    });
  });

  describe('FilterBuilder', () => {
    it('should build equality filter', () => {
      const filters = FilterEngine.builder().equals('type', 'lesson').build();
      expect(filters.length).toBe(1);
      expect(filters[0].operator).toBe('eq');
    });

    it('should build multiple filters', () => {
      const filters = FilterEngine.builder()
        .equals('type', 'lesson')
        .contains('title', 'algebra')
        .build();
      expect(filters.length).toBe(2);
    });

    it('should reset builder', () => {
      const builder = FilterEngine.builder().equals('type', 'lesson');
      builder.reset();
      const filters = builder.build();
      expect(filters.length).toBe(0);
    });
  });
});
