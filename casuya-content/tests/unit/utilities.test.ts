import { IdGenerator } from '../../src/utilities/id-generator';
import { SlugGenerator } from '../../src/utilities/slug';
import { ContentValidator } from '../../src/utilities/validator';
import { PaginationHelper } from '../../src/utilities/pagination';
import { ContentSanitizer } from '../../src/utilities/sanitizer';

describe('Utilities', () => {
  describe('IdGenerator', () => {
    it('should generate UUIDs', () => {
      const id = IdGenerator.generate();
      expect(id).toMatch(/^[0-9a-f-]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => IdGenerator.generate()));
      expect(ids.size).toBe(100);
    });
  });

  describe('SlugGenerator', () => {
    it('should generate slugs from titles', () => {
      expect(SlugGenerator.generate('Hello World')).toBe('hello-world');
      expect(SlugGenerator.generate('  Special   Characters!  ')).toBe('special-characters');
      expect(SlugGenerator.generate('Already-a-slug')).toBe('already-a-slug');
    });

    it('should generate unique slugs', () => {
      const existing = ['hello-world', 'test'];
      expect(SlugGenerator.generateUnique('Hello World', existing)).toBe('hello-world-1');
      expect(SlugGenerator.generateUnique('New Article', existing)).toBe('new-article');
    });

    it('should validate slugs', () => {
      expect(SlugGenerator.isValid('hello-world')).toBe(true);
      expect(SlugGenerator.isValid('Hello World')).toBe(false);
      expect(SlugGenerator.isValid('')).toBe(false);
    });
  });

  describe('ContentValidator', () => {
    it('should validate required fields', () => {
      const errors = ContentValidator.validateRequired({});
      expect(errors.length).toBeGreaterThan(0);
      expect(ContentValidator.validateRequired({ title: 'Test', slug: 'test', contentType: 'article', status: 'draft' })).toHaveLength(0);
    });

    it('should validate content status', () => {
      expect(ContentValidator.validateStatus('published')).toBe(true);
      expect(ContentValidator.validateStatus('invalid')).toBe(false);
    });
  });

  describe('PaginationHelper', () => {
    it('should create pagination options with defaults', () => {
      const opts = PaginationHelper.createOptions();
      expect(opts.offset).toBe(0);
      expect(opts.limit).toBe(50);
    });

    it('should paginate arrays', () => {
      const items = [1, 2, 3, 4, 5];
      const result = PaginationHelper.paginate(items, { offset: 1, limit: 2 });
      expect(result.items).toEqual([2, 3]);
      expect(result.total).toBe(5);
    });

    it('should calculate pages', () => {
      expect(PaginationHelper.calculatePages(100, 10)).toBe(10);
      expect(PaginationHelper.calculatePages(101, 10)).toBe(11);
    });
  });

  describe('ContentSanitizer', () => {
    it('should sanitize HTML', () => {
      expect(ContentSanitizer.sanitizeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should truncate text', () => {
      expect(ContentSanitizer.truncate('Hello World', 5)).toBe('He...');
      expect(ContentSanitizer.truncate('Hello', 10)).toBe('Hello');
    });

    it('should strip HTML', () => {
      expect(ContentSanitizer.stripHtml('<p>Hello</p>')).toBe('Hello');
    });

    it('should create safe file names', () => {
      expect(ContentSanitizer.toSafeFileName('file:name/test.txt')).toBe('file_name_test.txt');
    });
  });
});
