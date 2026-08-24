import { CsvExportProvider } from '../src/exports/providers/csv-export';
import { JsonExportProvider } from '../src/exports/providers/json-export';
import { ExportEngine } from '../src/exports/engine';
import { ExportFormat } from '../src/interfaces';

describe('CsvExportProvider', () => {
  let provider: CsvExportProvider;

  beforeEach(async () => {
    provider = new CsvExportProvider();
    await provider.configure({
      format: ExportFormat.CSV,
      include_headers: true,
    });
  });

  it('should export data as CSV', async () => {
    const data = [
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'LA' },
    ];

    const result = await provider.export(data);
    expect(result).toContain('name,age,city');
    expect(result).toContain('Alice,30,NYC');
    expect(result).toContain('Bob,25,LA');
  });

  it('should escape special characters', async () => {
    const data = [
      { name: 'Alice, Jr.', note: 'Hello "World"' },
    ];

    const result = await provider.export(data);
    expect(result).toContain('"Alice, Jr."');
    expect(result).toContain('"Hello ""World"""');
  });

  it('should handle empty data', async () => {
    const result = await provider.export([]);
    expect(result).toBe('');
  });

  it('should handle Date objects', async () => {
    const data = [
      { event: 'test', timestamp: new Date('2026-07-05T12:00:00Z') },
    ];

    const result = await provider.export(data);
    expect(result).toContain('2026-07-05T12:00:00.000Z');
  });

  it('should support custom delimiter', async () => {
    await provider.configure({
      format: ExportFormat.CSV,
      include_headers: true,
      options: { delimiter: '|' },
    });

    const data = [{ a: 1, b: 2 }];
    const result = await provider.export(data);
    expect(result).toContain('a|b');
    expect(result).toContain('1|2');
  });

  it('should validate non-empty data', () => {
    expect(provider.validate([{ a: 1 }])).toBe(true);
    expect(provider.validate([])).toBe(false);
  });
});

describe('JsonExportProvider', () => {
  let provider: JsonExportProvider;

  beforeEach(async () => {
    provider = new JsonExportProvider();
    await provider.configure({ format: ExportFormat.JSON });
  });

  it('should export data as JSON', async () => {
    const data = [{ id: 1, name: 'test' }];
    const result = await provider.export(data);
    expect(result).toBe('[{"id":1,"name":"test"}]');
  });

  it('should support pretty printing', async () => {
    await provider.configure({ format: ExportFormat.JSON, options: { pretty: true } });
    const data = [{ id: 1 }];
    const result = await provider.export(data);
    expect(result).toContain('\n  ');
  });

  it('should convert dates to timestamps when configured', async () => {
    await provider.configure({ format: ExportFormat.JSON, options: { dateFormat: 'timestamp' } });
    const data = [{ event: 'test', time: new Date('2026-01-01') }];
    const result = await provider.export(data);
    const parsed = JSON.parse(result);
    expect(typeof parsed[0].time).toBe('number');
  });
});

describe('ExportEngine', () => {
  it('should register and find providers by format', () => {
    const engine = new ExportEngine();
    engine.register(new CsvExportProvider());
    engine.register(new JsonExportProvider());

    expect(engine.getByFormat(ExportFormat.CSV)).toHaveLength(1);
    expect(engine.getByFormat(ExportFormat.JSON)).toHaveLength(1);
  });

  it('should export using format-based lookup', async () => {
    const engine = new ExportEngine();
    engine.register(new CsvExportProvider());

    const data = [{ x: 1, y: 2 }];
    const result = await engine.export(data, ExportFormat.CSV);
    expect(result).toContain('x,y');
  });

  it('should throw if no provider for format', async () => {
    const engine = new ExportEngine();
    await expect(engine.export([], ExportFormat.PARQUET))
      .rejects.toThrow('No export provider found');
  });
});
