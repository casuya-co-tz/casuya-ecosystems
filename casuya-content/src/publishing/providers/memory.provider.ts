import { IPublishingProvider } from './publishing-provider.interface';
import { PublishingState, ContentStatus, PaginationOptions, PaginatedResult, ProcessingResult } from '../../interfaces';

export class MemoryPublishingProvider implements IPublishingProvider {
  public readonly name = 'memory';
  private states = new Map<string, PublishingState>();

  async initialize(): Promise<void> {}

  async publish(contentId: string, publishedBy: string, notes?: string): Promise<PublishingState> {
    const now = new Date();
    const state: PublishingState = {
      id: this.states.get(contentId)?.id ?? `${contentId}-pub`,
      contentId,
      status: 'published',
      publishedAt: now,
      publishedBy,
      notes,
      metadata: {},
    };
    this.states.set(contentId, state);
    return { ...state };
  }

  async unpublish(contentId: string, notes?: string): Promise<PublishingState> {
    const existing = this.states.get(contentId);
    const state: PublishingState = {
      id: existing?.id ?? `${contentId}-pub`,
      contentId,
      status: 'draft',
      notes,
      metadata: {},
    };
    this.states.set(contentId, state);
    return { ...state };
  }

  async schedule(contentId: string, scheduledAt: Date, scheduledBy: string): Promise<PublishingState> {
    const state: PublishingState = {
      id: `${contentId}-sch`,
      contentId,
      status: 'draft',
      scheduledAt,
      metadata: { scheduledBy },
    };
    this.states.set(contentId, state);
    return { ...state };
  }

  async cancelScheduling(contentId: string): Promise<PublishingState> {
    const existing = this.states.get(contentId);
    if (existing) {
      const updated = { ...existing, scheduledAt: undefined };
      this.states.set(contentId, updated);
      return { ...updated };
    }
    return {
      id: `${contentId}-pub`,
      contentId,
      status: 'draft',
      metadata: {},
    };
  }

  async getPublishingState(contentId: string): Promise<PublishingState | null> {
    const s = this.states.get(contentId);
    return s ? { ...s } : null;
  }

  async getPublishedContent(options?: PaginationOptions): Promise<PaginatedResult<PublishingState>> {
    return this.filterByStatus('published', options);
  }

  async getScheduledContent(options?: PaginationOptions): Promise<PaginatedResult<PublishingState>> {
    const all = [...this.states.values()].filter(s => s.scheduledAt);
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return { items: all.slice(offset, offset + limit).map(s => ({ ...s })), total: all.length, offset, limit };
  }

  async getContentByStatus(status: ContentStatus, options?: PaginationOptions): Promise<PaginatedResult<PublishingState>> {
    return this.filterByStatus(status, options);
  }

  async processScheduledPublishing(): Promise<ProcessingResult> {
    const now = new Date();
    let processed = 0;
    let succeeded = 0;
    const errors: ProcessingResult['errors'] = [];
    for (const [id, state] of this.states.entries()) {
      if (state.scheduledAt && state.scheduledAt <= now) {
        processed++;
        const updated = { ...state, status: 'published' as const, publishedAt: now, scheduledAt: undefined };
        this.states.set(id, updated);
        succeeded++;
      }
    }
    return { processed, succeeded, failed: errors.length, errors };
  }

  async archive(contentId: string, archivedBy: string, reason?: string): Promise<PublishingState> {
    const existing = this.states.get(contentId);
    const state: PublishingState = {
      id: existing?.id ?? `${contentId}-arch`,
      contentId,
      status: 'archived',
      publishedAt: new Date(),
      notes: reason,
      metadata: { archivedBy, archivedAt: new Date().toISOString() },
    };
    this.states.set(contentId, state);
    return { ...state };
  }

  async restore(contentId: string): Promise<PublishingState> {
    const existing = this.states.get(contentId);
    if (existing) {
      const updated = { ...existing, status: 'draft' as const };
      this.states.set(contentId, updated);
      return { ...updated };
    }
    return {
      id: `${contentId}-pub`,
      contentId,
      status: 'draft',
      metadata: {},
    };
  }

  async dispose(): Promise<void> {
    this.states.clear();
  }

  private filterByStatus(status: ContentStatus, options?: PaginationOptions): PaginatedResult<PublishingState> {
    const all = [...this.states.values()].filter(s => s.status === status);
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return { items: all.slice(offset, offset + limit).map(s => ({ ...s })), total: all.length, offset, limit };
  }
}
