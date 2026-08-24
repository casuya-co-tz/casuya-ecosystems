import { PaginationOptions, PaginatedResult } from '../interfaces';

export class PaginationHelper {
  static createOptions(offset?: number, limit?: number, sort?: string, order?: 'asc' | 'desc'): PaginationOptions {
    return {
      offset: Math.max(0, offset ?? 0),
      limit: Math.min(100, Math.max(1, limit ?? 50)),
      sort,
      order,
    };
  }

  static paginate<T>(items: T[], options?: PaginationOptions): PaginatedResult<T> {
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
    const total = items.length;
    const page = items.slice(offset, offset + limit);
    return { items: page, total, offset, limit };
  }

  static calculatePages(total: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.ceil(total / limit);
  }
}
