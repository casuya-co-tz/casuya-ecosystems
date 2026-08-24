import { ArchiveEntry, ContentItem, PaginationOptions, PaginatedResult } from '../../interfaces';

export interface IArchiveProvider {
  readonly name: string;
  initialize(): Promise<void>;
  archive(entry: ArchiveEntry): Promise<ArchiveEntry>;
  restore(archiveId: string): Promise<ContentItem>;
  findById(archiveId: string): Promise<ArchiveEntry | null>;
  findByContentId(contentId: string): Promise<ArchiveEntry | null>;
  search(query: string, options?: PaginationOptions): Promise<PaginatedResult<ArchiveEntry>>;
  list(options?: PaginationOptions): Promise<PaginatedResult<ArchiveEntry>>;
  deleteArchive(archiveId: string): Promise<boolean>;
  compressArchive(archiveId: string): Promise<ArchiveEntry>;
  extractArchive(archiveId: string): Promise<ArchiveEntry>;
  count(): Promise<number>;
  dispose(): Promise<void>;
}
