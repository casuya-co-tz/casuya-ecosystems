import { v4 as uuidv4 } from 'uuid';
import {
  IVersioningService,
  ContentVersion,
  ContentItem,
  PaginationOptions,
  PaginatedResult,
  VersionDiff,
} from '../interfaces';
import { IVersioningProvider } from './providers/versioning-provider.interface';

export class VersioningService implements IVersioningService {
  public readonly name: string;
  private provider: IVersioningProvider;
  private initialized = false;

  constructor(provider: IVersioningProvider) {
    this.name = `versioning-${provider.name}`;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('VersioningService not initialized');
  }

  async createVersion(content: ContentItem, createdBy: string, message?: string): Promise<ContentVersion> {
    this.check();
    const version: ContentVersion = {
      id: uuidv4(),
      contentId: content.id,
      version: content.version,
      data: { ...content },
      createdBy,
      createdAt: new Date(),
      message,
      metadata: {},
    };
    return this.provider.createVersion(version);
  }

  async getVersion(versionId: string): Promise<ContentVersion | null> { this.check(); return this.provider.getVersion(versionId); }

  async getContentVersions(contentId: string, options?: PaginationOptions): Promise<PaginatedResult<ContentVersion>> {
    this.check();
    return this.provider.getContentVersions(contentId, options);
  }

  async getLatestVersion(contentId: string): Promise<ContentVersion | null> { this.check(); return this.provider.getLatestVersion(contentId); }

  async getVersionByNumber(contentId: string, version: number): Promise<ContentVersion | null> {
    this.check();
    return this.provider.getVersionByNumber(contentId, version);
  }

  async restoreVersion(contentId: string, versionId: string, restoredBy: string): Promise<ContentItem> {
    this.check();
    const version = await this.provider.getVersion(versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);
    const restored = await this.provider.restoreVersion(contentId, version);
    await this.createVersion(restored, restoredBy, `Restored from version ${version.version}`);
    return restored;
  }

  async compareVersions(versionIdA: string, versionIdB: string): Promise<VersionDiff> {
    this.check();
    const versionA = await this.provider.getVersion(versionIdA);
    const versionB = await this.provider.getVersion(versionIdB);
    if (!versionA || !versionB) throw new Error('One or both versions not found');
    return this.provider.compareVersions(versionA, versionB);
  }

  async deleteVersion(versionId: string): Promise<boolean> { this.check(); return this.provider.deleteVersion(versionId); }

  async pruneVersions(contentId: string, keepCount: number): Promise<number> {
    this.check();
    return this.provider.pruneVersions(contentId, keepCount);
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
