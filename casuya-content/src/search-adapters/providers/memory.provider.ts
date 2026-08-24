import { ISearchProvider } from './search-provider.interface';
import { SearchQuery, SearchResult, ContentItem, IndexStats, SearchHit } from '../../interfaces';

export class MemorySearchProvider implements ISearchProvider {
  public readonly name = 'memory';
  private store = new Map<string, ContentItem>();

  async initialize(): Promise<void> {}

  async index(item: ContentItem): Promise<void> {
    this.store.set(item.id, { ...item });
  }

  async indexBatch(items: ContentItem[]): Promise<void> {
    for (const item of items) {
      await this.index(item);
    }
  }

  async update(item: ContentItem): Promise<void> {
    this.store.set(item.id, { ...item });
  }

  async remove(id: string): Promise<void> {
    this.store.delete(id);
  }

  async removeBatch(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.store.delete(id);
    }
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const lower = query.query.toLowerCase();
    const results: SearchHit[] = [];

    for (const item of this.store.values()) {
      let score = 0;
      if (item.title.toLowerCase().includes(lower)) score += 10;
      if (item.description?.toLowerCase().includes(lower)) score += 5;
      if (item.tags.some(t => t.toLowerCase().includes(lower))) score += 3;
      if (item.body?.toLowerCase().includes(lower)) score += 1;

      if (score > 0) {
        results.push({
          id: item.id,
          score,
          title: item.title,
          description: item.description,
          contentType: item.contentType,
          status: item.status,
          highlights: {},
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;

    return {
      items: results.slice(offset, offset + limit),
      total: results.length,
      offset,
      limit,
      metadata: { provider: 'memory' },
    };
  }

  async suggest(prefix: string, limit = 5): Promise<string[]> {
    const lower = prefix.toLowerCase();
    const matches: Array<{ title: string; score: number }> = [];
    const seen = new Set<string>();
    for (const item of this.store.values()) {
      if (seen.has(item.title)) continue;
      if (item.title.toLowerCase().startsWith(lower)) {
        matches.push({ title: item.title, score: 10 });
        seen.add(item.title);
      } else if (item.title.toLowerCase().includes(lower)) {
        matches.push({ title: item.title, score: 5 });
        seen.add(item.title);
      }
    }
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, Math.max(1, limit)).map(m => m.title);
  }

  async clearIndex(): Promise<void> {
    this.store.clear();
  }

  async reindex(items: ContentItem[]): Promise<void> {
    this.store.clear();
    for (const item of items) {
      await this.index(item);
    }
  }

  async getIndexStats(): Promise<IndexStats> {
    return {
      totalDocuments: this.store.size,
      fieldCount: 7,
      lastIndexed: new Date(),
    };
  }

  async dispose(): Promise<void> {
    this.store.clear();
  }
}
