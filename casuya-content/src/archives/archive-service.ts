import { v4 as uuidv4 } from 'uuid';
import { IArchiveService, ArchiveEntry, ContentItem, PaginationOptions, PaginatedResult } from '../interfaces';
import { IArchiveProvider } from './providers/archive-provider.interface';

export class ArchiveService implements IArchiveService {
  public readonly name: string;
  private provider: IArchiveProvider;
  private initialized = false;

  constructor(provider: IArchiveProvider) {
    this.name = `archive-${provider.name}`;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('ArchiveService not initialized');
  }

  async archive(content: ContentItem, archivedBy: string, reason?: string): Promise<ArchiveEntry> {
    this.check();
    const entry: ArchiveEntry = {
      id: uuidv4(),
      contentId: content.id,
      archivedAt: new Date(),
      archivedBy,
      reason,
      data: { ...content },
      metadata: {},
    };
    return this.provider.archive(entry);
  }

  async restore(archiveId: string): Promise<ContentItem> { this.check(); return this.provider.restore(archiveId); }
  async findById(archiveId: string): Promise<ArchiveEntry | null> { this.check(); return this.provider.findById(archiveId); }
  async findByContentId(contentId: string): Promise<ArchiveEntry | null> { this.check(); return this.provider.findByContentId(contentId); }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<ArchiveEntry>> {
    this.check();
    return this.provider.search(query, options);
  }

  async list(options?: PaginationOptions): Promise<PaginatedResult<ArchiveEntry>> {
    this.check();
    return this.provider.list(options);
  }

  async deleteArchive(archiveId: string): Promise<boolean> { this.check(); return this.provider.deleteArchive(archiveId); }
  async compressArchive(archiveId: string): Promise<ArchiveEntry> { this.check(); return this.provider.compressArchive(archiveId); }
  async extractArchive(archiveId: string): Promise<ArchiveEntry> { this.check(); return this.provider.extractArchive(archiveId); }
  async count(): Promise<number> { this.check(); return this.provider.count(); }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
