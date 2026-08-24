import { SearchAPI, SearchDocument } from 'casuya-search';

let searchApi: SearchAPI;

export async function initSearch() {
  searchApi = new SearchAPI({ maxSize: 5000, ttl: 600, strategy: 'lru' }, 10000);
}

export const searchOps = {
  index(body: Record<string, unknown>) {
    if (body.createdAt && !(body.createdAt instanceof Date)) body.createdAt = new Date(body.createdAt as string | number);
    if (body.updatedAt && !(body.updatedAt instanceof Date)) body.updatedAt = new Date(body.updatedAt as string | number);
    searchApi.indexDocument(body as unknown as SearchDocument);
    return { ok: true };
  },
  indexBatch(body: Record<string, unknown>) {
    const docs = (body.documents as Record<string, unknown>[]).map((d) => {
      if (d.createdAt && !(d.createdAt instanceof Date)) d.createdAt = new Date(d.createdAt as string | number);
      if (d.updatedAt && !(d.updatedAt instanceof Date)) d.updatedAt = new Date(d.updatedAt as string | number);
      return d;
    });
    searchApi.indexDocuments(docs as unknown as SearchDocument[]);
    return { ok: true };
  },
  remove(id: string) {
    searchApi.removeDocument(id);
    return { ok: true };
  },
  async search(body: Record<string, unknown>) {
    return searchApi.search(body as unknown as Parameters<typeof searchApi.search>[0]);
  },
  suggestions(query: string) {
    return searchApi.getSuggestions(query);
  },
  recommendations(userId: string) {
    return searchApi.getRecommendations(userId);
  },
  recordInteraction(body: Record<string, unknown>) {
    searchApi.recordInteraction(body.userId as string, body.documentId as string, body.type as Parameters<typeof searchApi.recordInteraction>[2]);
    return { ok: true };
  },
  stats() {
    return searchApi.getStats();
  },
  trends(days?: number) {
    return searchApi.getSearchTrends(days);
  },
};
