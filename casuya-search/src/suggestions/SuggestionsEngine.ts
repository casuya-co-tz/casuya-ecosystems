/**
 * SuggestionsEngine - Autocomplete and query suggestions
 * Provides intelligent suggestions based on search history and content
 */

import { Suggestion, SearchDocument } from '../types';

export class SuggestionsEngine {
  private suggestions: Map<string, Suggestion>;
  private queryHistory: Map<string, number>;
  private maxSuggestions: number;

  constructor(maxSuggestions: number = 10) {
    this.suggestions = new Map();
    this.queryHistory = new Map();
    this.maxSuggestions = maxSuggestions;
  }

  /**
   * Get suggestions for a partial query
   */
  getSuggestions(query: string): Suggestion[] {
    const normalizedQuery = query.toLowerCase();
    const matches: Suggestion[] = [];

    for (const [key, suggestion] of this.suggestions) {
      if (key.startsWith(normalizedQuery)) {
        matches.push(suggestion);
      }
    }

    // Sort by frequency and return top results
    return matches.sort((a, b) => b.frequency - a.frequency).slice(0, this.maxSuggestions);
  }

  /**
   * Add a suggestion
   */
  addSuggestion(text: string, type: Suggestion['type']): void {
    const key = text.toLowerCase();
    const existing = this.suggestions.get(key);

    if (existing) {
      existing.frequency++;
    } else {
      this.suggestions.set(key, {
        text,
        type,
        frequency: 1,
      });
    }
  }

  /**
   * Add suggestions from documents
   */
  indexDocuments(documents: SearchDocument[]): void {
    for (const doc of documents) {
      // Add title as suggestion
      this.addSuggestion(doc.title, 'query');

      // Add subject as suggestion
      if (doc.subject) {
        this.addSuggestion(doc.subject, 'subject');
      }

      // Add topic as suggestion
      if (doc.topic) {
        this.addSuggestion(doc.topic, 'topic');
      }

      // Add tags as suggestions
      for (const tag of doc.tags) {
        this.addSuggestion(tag, 'tag');
      }
    }
  }

  /**
   * Record a query for history-based suggestions
   */
  recordQuery(query: string): void {
    const normalizedQuery = query.toLowerCase();
    const existing = this.queryHistory.get(normalizedQuery);

    if (existing) {
      this.queryHistory.set(normalizedQuery, existing + 1);
    } else {
      this.queryHistory.set(normalizedQuery, 1);
      this.addSuggestion(query, 'query');
    }
  }

  /**
   * Get popular queries
   */
  getPopularQueries(limit: number = 10): Suggestion[] {
    const popular: Suggestion[] = [];

    for (const [query, frequency] of this.queryHistory) {
      popular.push({
        text: query,
        type: 'query',
        frequency,
      });
    }

    return popular.sort((a, b) => b.frequency - a.frequency).slice(0, limit);
  }

  /**
   * Clear all suggestions
   */
  clear(): void {
    this.suggestions.clear();
    this.queryHistory.clear();
  }

  /**
   * Get suggestion count
   */
  size(): number {
    return this.suggestions.size;
  }
}
