import { RankingEngine } from '../src/ranking/RankingEngine';
import { SearchResult, RankingConfig } from '../src/types';

describe('RankingEngine', () => {
  let rankingEngine: RankingEngine;
  let sampleResults: SearchResult[];

  beforeEach(() => {
    rankingEngine = new RankingEngine();
    sampleResults = [
      {
        document: {
          id: '1',
          type: 'lesson',
          title: 'Introduction to Algebra',
          content: 'Learn algebra basics',
          metadata: {},
          tags: ['math', 'algebra'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-10'),
        },
        score: 5,
        highlights: [],
      },
      {
        document: {
          id: '2',
          type: 'lesson',
          title: 'Advanced Calculus',
          content: 'Deep dive into calculus',
          metadata: {},
          tags: ['math', 'calculus'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        score: 3,
        highlights: [],
      },
      {
        document: {
          id: '3',
          type: 'quiz',
          title: 'Math Quiz',
          content: 'Test your knowledge',
          metadata: {},
          tags: ['math', 'quiz'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-05'),
        },
        score: 4,
        highlights: [],
      },
    ];
  });

  describe('rank', () => {
    it('should rank results by score', () => {
      const ranked = rankingEngine.rank(sampleResults);
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
      expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
    });

    it('should apply recency boost when enabled', () => {
      const config: Partial<RankingConfig> = { boostRecent: true };
      rankingEngine.updateConfig(config);
      const ranked = rankingEngine.rank(sampleResults);
      // Most recent document should have higher score
      expect(ranked[0].document.id).toBe('1');
    });
  });

  describe('updatePopularity', () => {
    it('should update popularity score for a document', () => {
      rankingEngine.updatePopularity('1', 10);
      const ranked = rankingEngine.rank(sampleResults);
      // Document with popularity should be ranked higher
      expect(ranked[0].document.id).toBe('1');
    });

    it('should batch update popularity scores', () => {
      const scores = new Map([
        ['1', 10],
        ['2', 5],
        ['3', 15],
      ]);
      rankingEngine.updatePopularityBatch(scores);
      const ranked = rankingEngine.rank(sampleResults);
      expect(ranked[0].document.id).toBe('3');
    });
  });

  describe('updateConfig', () => {
    it('should update ranking configuration', () => {
      const newConfig: Partial<RankingConfig> = {
        weights: {
          title: 20,
          content: 2,
          tags: 10,
          metadata: 5,
          recency: 5,
          popularity: 8,
        },
      };
      rankingEngine.updateConfig(newConfig);
      const config = rankingEngine.getConfig();
      expect(config.weights.title).toBe(20);
    });
  });

  describe('resetPopularity', () => {
    it('should reset all popularity scores', () => {
      rankingEngine.updatePopularity('1', 10);
      rankingEngine.resetPopularity();
      // Disable recency boost for this test
      rankingEngine.updateConfig({ boostRecent: false, boostPopular: false });
      const ranked = rankingEngine.rank(sampleResults);
      // After reset, ranking should be based on base score only
      expect(ranked[0].score).toBe(5);
    });
  });
});
