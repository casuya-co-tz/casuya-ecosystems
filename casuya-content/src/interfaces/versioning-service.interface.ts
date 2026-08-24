import { ContentVersion, ContentItem, PaginationOptions, PaginatedResult } from './types';

export interface IVersioningService {
  readonly name: string;
  initialize(): Promise<void>;
  createVersion(content: ContentItem, createdBy: string, message?: string): Promise<ContentVersion>;
  getVersion(versionId: string): Promise<ContentVersion | null>;
  getContentVersions(contentId: string, options?: PaginationOptions): Promise<PaginatedResult<ContentVersion>>;
  getLatestVersion(contentId: string): Promise<ContentVersion | null>;
  getVersionByNumber(contentId: string, version: number): Promise<ContentVersion | null>;
  restoreVersion(contentId: string, versionId: string, restoredBy: string): Promise<ContentItem>;
  compareVersions(versionIdA: string, versionIdB: string): Promise<VersionDiff>;
  deleteVersion(versionId: string): Promise<boolean>;
  pruneVersions(contentId: string, keepCount: number): Promise<number>;
  dispose(): Promise<void>;
}

export interface VersionDiff {
  versionA: number;
  versionB: number;
  changes: VersionChange[];
  summary: string;
}

export interface VersionChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  changeType: 'added' | 'removed' | 'modified';
}
