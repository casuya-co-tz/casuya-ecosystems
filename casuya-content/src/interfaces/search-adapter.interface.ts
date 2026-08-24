import { SearchQuery, SearchResult, ContentItem } from './types';

export interface ISearchAdapter {
  readonly name: string;
  initialize(): Promise<void>;
  index(item: ContentItem): Promise<void>;
  indexBatch(items: ContentItem[]): Promise<void>;
  update(item: ContentItem): Promise<void>;
  remove(id: string): Promise<void>;
  removeBatch(ids: string[]): Promise<void>;
  search(query: SearchQuery): Promise<SearchResult>;
  suggest(prefix: string, limit?: number): Promise<string[]>;
  clearIndex(): Promise<void>;
  reindex(items: ContentItem[]): Promise<void>;
  getIndexStats(): Promise<IndexStats>;
  dispose(): Promise<void>;
}

export interface IndexStats {
  totalDocuments: number;
  indexSize?: number;
  lastIndexed?: Date;
  fieldCount: number;
}
