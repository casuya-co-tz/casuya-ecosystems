/**
 * SearchIndex - Core indexing system for educational content
 * Supports subjects, topics, lessons, quizzes, and media
 */

import lunr from 'lunr';
import { SearchDocument, SearchQuery, SearchResult } from '../types';

export class SearchIndex {
  private index: lunr.Index;
  private documents: Map<string, SearchDocument>;

  constructor() {
    this.documents = new Map();
    this.index = lunr(function () {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('content', { boost: 1 });
      this.field('tags', { boost: 5 });
      this.field('subject', { boost: 8 });
      this.field('topic', { boost: 6 });
    });
  }

  /**
   * Add or update a document in the search index
   */
  addDocument(document: SearchDocument): void {
    this.documents.set(document.id, document);
    this.rebuildIndex();
  }

  /**
   * Add multiple documents in batch
   */
  addDocuments(documents: SearchDocument[]): void {
    documents.forEach((doc) => this.documents.set(doc.id, doc));
    this.rebuildIndex();
  }

  /**
   * Remove a document from the index
   */
  removeDocument(id: string): void {
    this.documents.delete(id);
    this.rebuildIndex();
  }

  /**
   * Search the index with a query
   */
  search(query: SearchQuery): SearchResult[] {
    const searchResults = this.index.search(query.query);
    const results: SearchResult[] = [];

    for (const result of searchResults) {
      const document = this.documents.get(result.ref);
      if (!document) continue;

      // Apply type filter if specified
      if (query.type && document.type !== query.type) continue;

      // Apply subject filter if specified
      if (query.subject && document.subject !== query.subject) continue;

      // Apply topic filter if specified
      if (query.topic && document.topic !== query.topic) continue;

      results.push({
        document,
        score: result.score,
        highlights: this.extractHighlights(document, query.query),
      });
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get a document by ID
   */
  getDocument(id: string): SearchDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Get all documents of a specific type
   */
  getDocumentsByType(type: SearchDocument['type']): SearchDocument[] {
    return Array.from(this.documents.values()).filter((doc) => doc.type === type);
  }

  /**
   * Get the total number of documents
   */
  size(): number {
    return this.documents.size;
  }

  /**
   * Clear all documents from the index
   */
  clear(): void {
    this.documents.clear();
    this.rebuildIndex();
  }

  /**
   * Rebuild the entire index from documents
   * Called after bulk operations for efficiency
   */
  private rebuildIndex(): void {
    const docs = Array.from(this.documents.values());
    this.index = lunr(function () {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('content', { boost: 1 });
      this.field('tags', { boost: 5 });
      this.field('subject', { boost: 8 });
      this.field('topic', { boost: 6 });

      for (const doc of docs) {
        this.add({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          tags: doc.tags.join(' '),
          subject: doc.subject || '',
          topic: doc.topic || '',
        });
      }
    });
  }

  /**
   * Extract text highlights from a document based on query
   */
  private extractHighlights(document: SearchDocument, query: string): string[] {
    const terms = query.toLowerCase().split(/\s+/);
    const highlights: string[] = [];
    const content = document.content.toLowerCase();

    for (const term of terms) {
      if (term.length < 3) continue;

      const index = content.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + term.length + 50);
        const snippet = document.content.substring(start, end);
        highlights.push(`...${snippet}...`);
      }
    }

    return highlights.slice(0, 3); // Return max 3 highlights
  }
}
