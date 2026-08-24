import { ISearchAdapter, SearchQuery, SearchResult, ContentItem, IndexStats } from '../interfaces';
import { ISearchProvider } from './providers/search-provider.interface';

export class SearchAdapter implements ISearchAdapter {
  public readonly name: string;
  private provider: ISearchProvider;
  private initialized = false;

  constructor(provider: ISearchProvider) {
    this.name = `search-${provider.name}`;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('SearchAdapter not initialized');
  }

  async index(item: ContentItem): Promise<void> { this.check(); return this.provider.index(item); }
  async indexBatch(items: ContentItem[]): Promise<void> { this.check(); return this.provider.indexBatch(items); }
  async update(item: ContentItem): Promise<void> { this.check(); return this.provider.update(item); }
  async remove(id: string): Promise<void> { this.check(); return this.provider.remove(id); }
  async removeBatch(ids: string[]): Promise<void> { this.check(); return this.provider.removeBatch(ids); }

  async search(query: SearchQuery): Promise<SearchResult> {
    this.check();
    return this.provider.search(query);
  }

  async suggest(prefix: string, limit?: number): Promise<string[]> {
    this.check();
    return this.provider.suggest(prefix, limit);
  }

  async clearIndex(): Promise<void> { this.check(); return this.provider.clearIndex(); }
  async reindex(items: ContentItem[]): Promise<void> { this.check(); return this.provider.reindex(items); }

  async getIndexStats(): Promise<IndexStats> {
    this.check();
    return this.provider.getIndexStats();
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
