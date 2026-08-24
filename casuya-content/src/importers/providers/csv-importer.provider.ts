import { IImporterProvider } from './importer-provider.interface';
import { ContentItem, ImportResult, ImportValidationResult, ImportPreview } from '../../interfaces';

export class CsvImporterProvider implements IImporterProvider {
  public readonly name = 'csv';
  public readonly supportedFormats = ['csv', 'tsv'];
  private fieldMapping: Record<string, string> = {};
  private delimiter = ',';

  async initialize(): Promise<void> {}

  async validate(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportValidationResult> {
    this.delimiter = (options?.delimiter as string) || ',';
    const lines = this.parseLines(data);
    if (lines.length < 2) {
      return { valid: false, errors: [{ line: 0, field: 'root', message: 'File must have a header row and at least one data row' }], totalItems: 0 };
    }
    return { valid: true, errors: [], totalItems: lines.length - 1 };
  }

  async import(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportResult> {
    this.delimiter = (options?.delimiter as string) || ',';
    try {
      const lines = this.parseLines(data);
      if (lines.length < 2) throw new Error('No data rows found');
      const headerRow = lines[0].split(this.delimiter).map(h => h.trim());
      const errors: ImportResult['errors'] = [];
      let imported = 0;

      for (let i = 1; i < lines.length; i++) {
        try {
          const row = this.parseRow(lines[i], headerRow);
          const mapped = this.applyMapping(row);
          const hasTitle = typeof mapped.title === 'string' && (mapped.title as string).trim().length > 0;
          const hasSlug = typeof mapped.slug === 'string' && (mapped.slug as string).trim().length > 0;
          if (hasTitle && hasSlug) {
            imported++;
          } else {
            errors.push({ line: i, message: 'Missing required fields (title/slug)', data: row });
          }
        } catch (e) {
          errors.push({ line: i, message: (e as Error).message });
        }
      }

      return {
        success: errors.length === 0,
        imported,
        failed: errors.length,
        errors,
        metadata: { format: 'csv', totalInput: lines.length - 1 },
      };
    } catch (e) {
      return { success: false, imported: 0, failed: 1, errors: [{ line: 0, message: (e as Error).message }], metadata: {} };
    }
  }

  async preview(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportPreview> {
    this.delimiter = (options?.delimiter as string) || ',';
    const lines = this.parseLines(data).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { totalItems: 0, sampleItems: [], detectedFields: [], warnings: ['No data rows found'] };
    }
    const headers = lines[0].split(this.delimiter).map(h => h.trim());
    const sample: Partial<ContentItem>[] = [];
    const startIdx = lines.length > 1 ? 1 : 0;
    const endIdx = Math.min(startIdx + 3, lines.length);
    for (let i = startIdx; i < endIdx; i++) {
      const row = this.parseRow(lines[i], headers);
      sample.push({
        title: typeof row.title === 'string' ? row.title : typeof row.name === 'string' ? row.name : '',
        slug: typeof row.slug === 'string' ? row.slug : '',
        description: typeof row.description === 'string' ? row.description : undefined,
        contentType: typeof row.contentType === 'string' ? row.contentType : 'document',
        status: 'draft',
        tags: [],
        categoryIds: [],
        taxonomyIds: [],
        metadata: {},
      });
    }
    return {
      totalItems: Math.max(0, lines.length - 1),
      sampleItems: sample,
      detectedFields: headers,
      warnings: [],
    };
  }

  mapFields(mapping: Record<string, string>): void {
    this.fieldMapping = mapping;
  }

  async dispose(): Promise<void> {}

  private parseLines(data: Buffer | string): string[] {
    const str = typeof data === 'string' ? data : data.toString('utf-8');
    return str.split(/\r?\n/);
  }

  private parseRow(line: string, headers: string[]): Record<string, unknown> {
    const values = this.parseCsvLine(line);
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || '').trim();
    });
    return row;
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === this.delimiter) {
          values.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    values.push(current);
    return values;
  }

  private applyMapping(row: Record<string, unknown>): Record<string, unknown> {
    if (Object.keys(this.fieldMapping).length === 0) return row;
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[this.fieldMapping[key] || key] = value;
    }
    return mapped;
  }
}
