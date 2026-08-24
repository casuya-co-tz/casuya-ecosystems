import { PublishingState, ContentStatus, PaginationOptions, PaginatedResult } from './types';

export interface IPublishingService {
  readonly name: string;
  initialize(): Promise<void>;
  publish(contentId: string, publishedBy: string, notes?: string): Promise<PublishingState>;
  unpublish(contentId: string, notes?: string): Promise<PublishingState>;
  schedule(contentId: string, scheduledAt: Date, scheduledBy: string): Promise<PublishingState>;
  cancelScheduling(contentId: string): Promise<PublishingState>;
  getPublishingState(contentId: string): Promise<PublishingState | null>;
  getPublishedContent(options?: PaginationOptions): Promise<PaginatedResult<PublishingState>>;
  getScheduledContent(options?: PaginationOptions): Promise<PaginatedResult<PublishingState>>;
  getContentByStatus(status: ContentStatus, options?: PaginationOptions): Promise<PaginatedResult<PublishingState>>;
  processScheduledPublishing(): Promise<ProcessingResult>;
  archive(contentId: string, archivedBy: string, reason?: string): Promise<PublishingState>;
  restore(contentId: string): Promise<PublishingState>;
  dispose(): Promise<void>;
}

export interface ProcessingResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ contentId: string; error: string }>;
}
