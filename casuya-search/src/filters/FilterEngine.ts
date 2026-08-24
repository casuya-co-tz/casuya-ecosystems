/**
 * FilterEngine - Content filtering system
 * Supports complex filtering operations on search results
 */

import { SearchDocument, Filter } from '../types';

export class FilterEngine {
  /**
   * Apply filters to a list of documents
   */
  applyFilters(documents: SearchDocument[], filters: Filter[]): SearchDocument[] {
    if (filters.length === 0) {
      return documents;
    }

    return documents.filter((doc) => filters.every((filter) => this.matchesFilter(doc, filter)));
  }

  /**
   * Check if a document matches a single filter
   */
  private matchesFilter(document: SearchDocument, filter: Filter): boolean {
    const value = this.getFieldValue(document, filter.field);

    switch (filter.operator) {
      case 'eq':
        return value === filter.value;
      case 'ne':
        return value !== filter.value;
      case 'gt':
        return typeof value === 'number' && value > (filter.value as number);
      case 'lt':
        return typeof value === 'number' && value < (filter.value as number);
      case 'gte':
        return typeof value === 'number' && value >= (filter.value as number);
      case 'lte':
        return typeof value === 'number' && value <= (filter.value as number);
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      case 'contains':
        return (
          typeof value === 'string' &&
          value.toLowerCase().includes((filter.value as string).toLowerCase())
        );
      default:
        return false;
    }
  }

  /**
   * Get field value from document, supporting nested metadata
   */
  private getFieldValue(document: SearchDocument, field: string): unknown {
    // Check direct fields first
    if (field in document) {
      return (document as unknown as Record<string, unknown>)[field];
    }

    // Check metadata
    if (field in document.metadata) {
      return document.metadata[field];
    }

    return undefined;
  }

  /**
   * Create a filter builder for fluent API
   */
  static builder(): FilterBuilder {
    return new FilterBuilder();
  }
}

/**
 * Fluent builder for creating filters
 */
export class FilterBuilder {
  private filters: Filter[] = [];

  /**
   * Add equality filter
   */
  equals(field: string, value: unknown): FilterBuilder {
    this.filters.push({ field, operator: 'eq', value });
    return this;
  }

  /**
   * Add inequality filter
   */
  notEquals(field: string, value: unknown): FilterBuilder {
    this.filters.push({ field, operator: 'ne', value });
    return this;
  }

  /**
   * Add greater than filter
   */
  greaterThan(field: string, value: number): FilterBuilder {
    this.filters.push({ field, operator: 'gt', value });
    return this;
  }

  /**
   * Add less than filter
   */
  lessThan(field: string, value: number): FilterBuilder {
    this.filters.push({ field, operator: 'lt', value });
    return this;
  }

  /**
   * Add contains filter
   */
  contains(field: string, value: string): FilterBuilder {
    this.filters.push({ field, operator: 'contains', value });
    return this;
  }

  /**
   * Add in array filter
   */
  in(field: string, values: unknown[]): FilterBuilder {
    this.filters.push({ field, operator: 'in', value: values });
    return this;
  }

  /**
   * Build the filter array
   */
  build(): Filter[] {
    return [...this.filters];
  }

  /**
   * Reset the builder
   */
  reset(): FilterBuilder {
    this.filters = [];
    return this;
  }
}
