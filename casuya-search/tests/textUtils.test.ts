import {
  normalizeText,
  extractKeywords,
  calculateSimilarity,
  truncateText,
  highlightTerms,
  removeDiacritics,
  generateSlug,
} from '../src/utilities/textUtils';

describe('textUtils', () => {
  describe('normalizeText', () => {
    it('should lowercase text', () => {
      expect(normalizeText('Hello World')).toBe('hello world');
    });

    it('should trim whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello');
    });

    it('should replace multiple spaces with single space', () => {
      expect(normalizeText('hello   world')).toBe('hello world');
    });
  });

  describe('extractKeywords', () => {
    it('should extract words of minimum length', () => {
      const keywords = extractKeywords('a an the cat dog elephant');
      expect(keywords).toEqual(['the', 'cat', 'dog', 'elephant']);
    });

    it('should return empty array for no matches', () => {
      expect(extractKeywords('a an')).toEqual([]);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical texts', () => {
      expect(calculateSimilarity('hello world', 'hello world')).toBe(1);
    });

    it('should return 0 for completely different texts', () => {
      expect(calculateSimilarity('cat dog', 'apple banana')).toBe(0);
    });

    it('should return 1 if both texts are empty', () => {
      expect(calculateSimilarity('', '')).toBe(1);
    });

    it('should return 0 if one text is empty', () => {
      expect(calculateSimilarity('hello', '')).toBe(0);
    });

    it('should calculate partial similarity', () => {
      const similarity = calculateSimilarity('the cat sat', 'the dog sat');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe('truncateText', () => {
    it('should return text as-is if within max length', () => {
      expect(truncateText('hello', 10)).toBe('hello');
    });

    it('should truncate with ellipsis if over max length', () => {
      expect(truncateText('hello world this is long', 10)).toBe('hello w...');
    });
  });

  describe('highlightTerms', () => {
    it('should wrap matching terms in mark tags', () => {
      const result = highlightTerms('hello world', ['world']);
      expect(result).toBe('hello <mark>world</mark>');
    });

    it('should highlight multiple terms', () => {
      const result = highlightTerms('hello world hello', ['hello']);
      expect(result).toBe('<mark>hello</mark> world <mark>hello</mark>');
    });

    it('should handle case-insensitive matching', () => {
      const result = highlightTerms('Hello World', ['hello']);
      expect(result).toBe('<mark>Hello</mark> World');
    });
  });

  describe('removeDiacritics', () => {
    it('should remove diacritical marks', () => {
      expect(removeDiacritics('café résumé')).toBe('cafe resume');
    });

    it('should return text without diacritics as-is', () => {
      expect(removeDiacritics('hello')).toBe('hello');
    });
  });

  describe('generateSlug', () => {
    it('should generate a slug from text', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello, World! How are you?')).toBe('hello-world-how-are-you');
    });

    it('should collapse multiple hyphens', () => {
      expect(generateSlug('Hello---World')).toBe('hello-world');
    });
  });
});
