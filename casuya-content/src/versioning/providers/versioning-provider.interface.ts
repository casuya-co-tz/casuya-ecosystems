import { ContentVersion, ContentItem, PaginationOptions, PaginatedResult, VersionDiff } from '../../interfaces';

export interface IVersioningProvider {
  readonly name: string;
  initialize(): Promise<void>;
  createVersion(version: ContentVersion): Promise<ContentVersion>;
  getVersion(versionId: string): Promise<ContentVersion | null>;
  getContentVersions(contentId: string, options?: PaginationOptions): Promise<PaginatedResult<ContentVersion>>;
  getLatestVersion(contentId: string): Promise<ContentVersion | null>;
  getVersionByNumber(contentId: string, version: number): Promise<ContentVersion | null>;
  restoreVersion(contentId: string, version: ContentVersion): Promise<ContentItem>;
  compareVersions(versionA: ContentVersion, versionB: ContentVersion): Promise<VersionDiff>;
  deleteVersion(versionId: string): Promise<boolean>;
  pruneVersions(contentId: string, keepCount: number): Promise<number>;
  dispose(): Promise<void>;
}
