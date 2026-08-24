import { IImporterProvider } from './importer-provider.interface';
import { ContentItem, ImportResult, ImportValidationResult, ImportPreview } from '../../interfaces';

export class JsonImporterProvider implements IImporterProvider {
  public readonly name = 'json';
  public readonly supportedFormats = ['json'];
  private fieldMapping: Record<string, string> = {};

  async initialize(): Promise<void> {}

  async validate(data: Buffer | string, _options?: Record<string, unknown>): Promise<ImportValidationResult> {
    void _options;
    try {
      const items = this.parse(data);
      if (!Array.isArray(items)) {
        return { valid: false, errors: [{ line: 0, field: 'root', message: 'Root element must be an array' }], totalItems: 0 };
      }
      return { valid: true, errors: [], totalItems: items.length };
    } catch (e) {
      return { valid: false, errors: [{ line: 0, field: 'root', message: (e as Error).message }], totalItems: 0 };
    }
  }

  async import(data: Buffer | string, _options?: Record<string, unknown>): Promise<ImportResult> {
    void _options;
    try {
      const items = this.parse(data);
      const imported: number[] = [];
      const errors: ImportResult['errors'] = [];

      for (let i = 0; i < items.length; i++) {
        try {
          const mapped = this.applyMapping(items[i]);
          if (this.validateItem(mapped)) {
            imported.push(i);
          } else {
            errors.push({ line: i + 1, message: 'Missing required fields (title, slug)', data: mapped });
          }
        } catch (e) {
          errors.push({ line: i + 1, message: (e as Error).message });
        }
      }

      return {
        success: errors.length === 0,
        imported: imported.length,
        failed: errors.length,
        errors,
        metadata: { format: 'json', totalInput: items.length },
      };
    } catch (e) {
      return { success: false, imported: 0, failed: 1, errors: [{ line: 0, message: (e as Error).message }], metadata: {} };
    }
  }

  async preview(data: Buffer | string, _options?: Record<string, unknown>): Promise<ImportPreview> {
    void _options;
    try {
      const items = this.parse(data);
      const sample = items.slice(0, 3).map((item: Record<string, unknown>) => ({
        title: typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : '',
        slug: typeof item.slug === 'string' ? item.slug : '',
        contentType: typeof item.contentType === 'string' ? item.contentType : 'document',
        status: 'draft' as const,
        tags: Array.isArray(item.tags) ? item.tags.filter((t: unknown) => typeof t === 'string') : [],
        categoryIds: [],
        taxonomyIds: [],
        metadata: {},
        description: typeof item.description === 'string' ? item.description : undefined,
      } as Partial<ContentItem>));

      return {
        totalItems: items.length,
        sampleItems: sample,
        detectedFields: items.length > 0 ? Object.keys(items[0]) : [],
        warnings: [],
      };
    } catch {
      return { totalItems: 0, sampleItems: [], detectedFields: [], warnings: ['Could not parse input data'] };
    }
  }

  mapFields(mapping: Record<string, string>): void {
    this.fieldMapping = mapping;
  }

  async dispose(): Promise<void> {}

  private parse(data: Buffer | string): Record<string, unknown>[] {
    const str = typeof data === 'string' ? data : data.toString('utf-8');
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  private applyMapping(item: Record<string, unknown>): Record<string, unknown> {
    if (Object.keys(this.fieldMapping).length === 0) return item;
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item)) {
      mapped[this.fieldMapping[key] || key] = value;
    }
    return mapped;
  }

  private validateItem(item: Record<string, unknown>): boolean {
    const hasTitle = typeof item.title === 'string' && item.title.trim().length > 0;
    const hasSlug = typeof item.slug === 'string' && item.slug.trim().length > 0;
    return hasTitle && hasSlug;
  }
}
