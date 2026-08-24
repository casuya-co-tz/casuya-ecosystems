import { IArchiveProvider } from './archive-provider.interface';
import { ArchiveEntry, ContentItem, PaginationOptions, PaginatedResult } from '../../interfaces';

export class MemoryArchiveProvider implements IArchiveProvider {
  public readonly name = 'memory';
  private archives = new Map<string, ArchiveEntry>();

  async initialize(): Promise<void> {}

  async archive(entry: ArchiveEntry): Promise<ArchiveEntry> {
    this.archives.set(entry.id, { ...entry });
    return { ...entry };
  }

  async restore(archiveId: string): Promise<ContentItem> {
    const entry = this.archives.get(archiveId);
    if (!entry) throw new Error(`Archive ${archiveId} not found`);
    return { ...entry.data };
  }

  async findById(archiveId: string): Promise<ArchiveEntry | null> {
    const e = this.archives.get(archiveId);
    return e ? { ...e } : null;
  }

  async findByContentId(contentId: string): Promise<ArchiveEntry | null> {
    for (const e of this.archives.values()) {
      if (e.contentId === contentId) return { ...e };
    }
    return null;
  }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<ArchiveEntry>> {
    const lower = query.toLowerCase();
    const matches = [...this.archives.values()].filter(e =>
      e.reason?.toLowerCase().includes(lower) || e.archivedBy.toLowerCase().includes(lower)
    );
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return { items: matches.slice(offset, offset + limit).map(e => ({ ...e })), total: matches.length, offset, limit };
  }

  async list(options?: PaginationOptions): Promise<PaginatedResult<ArchiveEntry>> {
    const all = [...this.archives.values()];
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return { items: all.slice(offset, offset + limit).map(e => ({ ...e })), total: all.length, offset, limit };
  }

  async deleteArchive(archiveId: string): Promise<boolean> { return this.archives.delete(archiveId); }

  async compressArchive(archiveId: string): Promise<ArchiveEntry> {
    const entry = this.archives.get(archiveId);
    if (!entry) throw new Error(`Archive ${archiveId} not found`);
    entry.metadata.compressed = true;
    return { ...entry };
  }

  async extractArchive(archiveId: string): Promise<ArchiveEntry> {
    const entry = this.archives.get(archiveId);
    if (!entry) throw new Error(`Archive ${archiveId} not found`);
    entry.metadata.compressed = false;
    return { ...entry };
  }

  async count(): Promise<number> { return this.archives.size; }

  async dispose(): Promise<void> { this.archives.clear(); }
}
