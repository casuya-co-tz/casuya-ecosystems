import { BaseImporter, JsonImporterProvider, CsvImporterProvider } from '../../src/importers';

describe('Importers', () => {
  describe('JsonImporter', () => {
    let importer: BaseImporter;

    beforeEach(async () => {
      importer = new BaseImporter(new JsonImporterProvider());
      await importer.initialize();
    });

    it('should validate valid JSON', async () => {
      const data = JSON.stringify([{ title: 'Test', slug: 'test' }]);
      const result = await importer.validate(data);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid JSON', async () => {
      const result = await importer.validate('not json');
      expect(result.valid).toBe(false);
    });

    it('should preview JSON data', async () => {
      const data = JSON.stringify([
        { title: 'Article 1', slug: 'article-1', description: 'First article' },
        { title: 'Article 2', slug: 'article-2', description: 'Second article' },
      ]);
      const preview = await importer.preview(data);
      expect(preview.totalItems).toBe(2);
      expect(preview.sampleItems).toHaveLength(2);
    });

    it('should import JSON data', async () => {
      const data = JSON.stringify([
        { title: 'Article 1', slug: 'article-1' },
        { title: 'Article 2', slug: 'article-2' },
      ]);
      const result = await importer.import(data);
      expect(result.imported).toBe(2);
      expect(result.success).toBe(true);
    });

    it('should support field mapping', async () => {
      importer.mapFields({ name: 'title', identifier: 'slug' });
      const data = JSON.stringify([
        { name: 'Article', identifier: 'article-1' },
      ]);
      const preview = await importer.preview(data);
      expect(preview.totalItems).toBe(1);
    });
  });

  describe('CsvImporter', () => {
    let importer: BaseImporter;

    beforeEach(async () => {
      importer = new BaseImporter(new CsvImporterProvider());
      await importer.initialize();
    });

    it('should validate CSV data', async () => {
      const data = 'title,slug\nTest,test';
      const result = await importer.validate(data, { delimiter: ',' });
      expect(result.valid).toBe(true);
    });

    it('should import CSV data', async () => {
      const data = 'title,slug,description\nArticle 1,article-1,Desc 1\nArticle 2,article-2,Desc 2';
      const result = await importer.import(data);
      expect(result.imported).toBe(2);
    });

    it('should preview CSV data', async () => {
      const data = 'title,slug\nArticle 1,article-1\nArticle 2,article-2';
      const preview = await importer.preview(data);
      expect(preview.totalItems).toBe(2);
    });
  });
});
