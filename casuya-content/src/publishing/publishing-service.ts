import {
  IPublishingService,
  PublishingState,
  ContentStatus,
  PaginationOptions,
  PaginatedResult,
  ProcessingResult,
} from '../interfaces';
import { IPublishingProvider } from './providers/publishing-provider.interface';

export class PublishingService implements IPublishingService {
  public readonly name: string;
  private provider: IPublishingProvider;
  private initialized = false;

  constructor(provider: IPublishingProvider) {
    this.name = `publishing-${provider.name}`;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('PublishingService not initialized');
  }

  async publish(contentId: string, publishedBy: string, notes?: string): Promise<PublishingState> {
    this.check();
    return this.provider.publish(contentId, publishedBy, notes);
  }

  async unpublish(contentId: string, notes?: string): Promise<PublishingState> {
    this.check();
    return this.provider.unpublish(contentId, notes);
  }

  async schedule(contentId: string, scheduledAt: Date, scheduledBy: string): Promise<PublishingState> {
    this.check();
    return this.provider.schedule(contentId, scheduledAt, scheduledBy);
  }

  async cancelScheduling(contentId: string): Promise<PublishingState> {
    this.check();
    return this.provider.cancelScheduling(contentId);
  }

  async getPublishingState(contentId: string): Promise<PublishingState | null> {
    this.check();
    return this.provider.getPublishingState(contentId);
  }

  async getPublishedContent(options?: PaginationOptions): Promise<PaginatedResult<PublishingState>> {
    this.check();
    return this.provider.getPublishedContent(options);
  }

  async getScheduledContent(options?: PaginationOptions): Promise<PaginatedResult<PublishingState>> {
    this.check();
    return this.provider.getScheduledContent(options);
  }

  async getContentByStatus(status: ContentStatus, options?: PaginationOptions): Promise<PaginatedResult<PublishingState>> {
    this.check();
    return this.provider.getContentByStatus(status, options);
  }

  async processScheduledPublishing(): Promise<ProcessingResult> {
    this.check();
    return this.provider.processScheduledPublishing();
  }

  async archive(contentId: string, archivedBy: string, reason?: string): Promise<PublishingState> {
    this.check();
    return this.provider.archive(contentId, archivedBy, reason);
  }

  async restore(contentId: string): Promise<PublishingState> {
    this.check();
    return this.provider.restore(contentId);
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
