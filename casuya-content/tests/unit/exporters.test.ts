import { BaseExporter, JsonExporterProvider, CsvExporterProvider } from '../../src/exporters';

describe('Exporters', () => {
  describe('JsonExporter', () => {
    let exporter: BaseExporter;

    beforeEach(async () => {
      exporter = new BaseExporter(new JsonExporterProvider());
      await exporter.initialize();
    });

    it('should export to JSON', async () => {
      const items = [
        { id: '1', title: 'Test', slug: 'test', contentType: 'article', status: 'draft', version: 1, tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' } as any,
      ];
      const result = await exporter.export(items, { format: 'json' });
      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
      expect(result.totalItems).toBe(1);
    });

    it('should export single item', async () => {
      const item = { id: '1', title: 'Single', slug: 'single', contentType: 'doc', status: 'draft', version: 1, tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' } as any;
      const result = await exporter.exportSingle(item, 'json');
      expect(result.totalItems).toBe(1);
    });

    it('should filter fields on export', async () => {
      const items = [
        { id: '1', title: 'Test', slug: 'test', contentType: 'article', status: 'draft', version: 1, tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' } as any,
      ];
      const result = await exporter.export(items, { format: 'json', fields: ['id', 'title'] });
      const parsed = JSON.parse(result.data as string);
      expect(Object.keys(parsed[0])).toEqual(['id', 'title']);
    });
  });

  describe('CsvExporter', () => {
    let exporter: BaseExporter;

    beforeEach(async () => {
      exporter = new BaseExporter(new CsvExporterProvider());
      await exporter.initialize();
    });

    it('should export to CSV', async () => {
      const items = [
        { id: '1', title: 'Test', slug: 'test', contentType: 'article', status: 'draft', version: 1, tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' } as any,
      ];
      const result = await exporter.export(items, { format: 'csv' });
      expect(result.success).toBe(true);
      expect(result.format).toBe('csv');
      expect(typeof result.data).toBe('string');
    });
  });
});
