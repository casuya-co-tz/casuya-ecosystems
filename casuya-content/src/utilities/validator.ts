import { ContentItem, ContentStatus, ContentSummary } from '../interfaces';

export class ContentValidator {
  static validateRequired(item: Partial<ContentItem>): string[] {
    const errors: string[] = [];
    if (typeof item.title !== 'string' || item.title.trim().length === 0) errors.push('title is required and must be a non-empty string');
    if (typeof item.slug !== 'string' || item.slug.trim().length === 0) errors.push('slug is required and must be a non-empty string');
    if (typeof item.contentType !== 'string' || item.contentType.trim().length === 0) errors.push('contentType is required and must be a non-empty string');
    if (!item.status) errors.push('status is required');
    if (item.status && !this.validateStatus(item.status)) errors.push('status must be one of: draft, review, published, archived');
    return errors;
  }

  static validateStatus(status: string): status is ContentStatus {
    return ['draft', 'review', 'published', 'archived'].includes(status);
  }

  static validateContentType(contentType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(contentType);
  }

  static sanitizeSummary(item: ContentItem): ContentSummary {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      contentType: item.contentType,
      status: item.status,
      version: item.version,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
