import { IVersioningProvider } from './versioning-provider.interface';
import { ContentVersion, ContentItem, PaginationOptions, PaginatedResult, VersionDiff, VersionChange } from '../../interfaces';

export class MemoryVersioningProvider implements IVersioningProvider {
  public readonly name = 'memory';
  private versions = new Map<string, ContentVersion>();
  private contentVersions = new Map<string, ContentVersion[]>();

  async initialize(): Promise<void> {}

  async createVersion(version: ContentVersion): Promise<ContentVersion> {
    this.versions.set(version.id, { ...version });
    const list = this.contentVersions.get(version.contentId) || [];
    list.push({ ...version });
    this.contentVersions.set(version.contentId, list);
    return { ...version };
  }

  async getVersion(versionId: string): Promise<ContentVersion | null> {
    const v = this.versions.get(versionId);
    return v ? { ...v } : null;
  }

  async getContentVersions(contentId: string, options?: PaginationOptions): Promise<PaginatedResult<ContentVersion>> {
    const list = this.contentVersions.get(contentId) || [];
    const sorted = [...list].sort((a, b) => b.version - a.version);
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
    return { items: sorted.slice(offset, offset + limit).map(v => ({ ...v })), total: sorted.length, offset, limit };
  }

  async getLatestVersion(contentId: string): Promise<ContentVersion | null> {
    const list = this.contentVersions.get(contentId);
    if (!list || list.length === 0) return null;
    const sorted = [...list].sort((a, b) => b.version - a.version);
    return { ...sorted[0] };
  }

  async getVersionByNumber(contentId: string, version: number): Promise<ContentVersion | null> {
    const list = this.contentVersions.get(contentId);
    if (!list) return null;
    const v = list.find(v => v.version === version);
    return v ? { ...v } : null;
  }

  async restoreVersion(_contentId: string, version: ContentVersion): Promise<ContentItem> {
    const data = version.data;
    if (!data.id || !data.slug || !data.title) {
      throw new Error(`Version ${version.id} data is incomplete - missing required fields`);
    }
    return data as ContentItem;
  }

  async compareVersions(versionA: ContentVersion, versionB: ContentVersion): Promise<VersionDiff> {
    const changes: VersionChange[] = [];
    const dataA = versionA.data as Record<string, unknown>;
    const dataB = versionB.data as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(dataA), ...Object.keys(dataB)]);

    for (const key of allKeys) {
      if (key === 'id' || key === 'version') continue;
      const hasA = Object.prototype.hasOwnProperty.call(dataA, key);
      const hasB = Object.prototype.hasOwnProperty.call(dataB, key);
      const valA = dataA[key];
      const valB = dataB[key];

      if (JSON.stringify(valA) !== JSON.stringify(valB)) {
        changes.push({
          field: key,
          oldValue: valA,
          newValue: valB,
          changeType: !hasA ? 'added' : !hasB ? 'removed' : 'modified',
        });
      }
    }

    return {
      versionA: versionA.version,
      versionB: versionB.version,
      changes,
      summary: `${changes.length} field(s) changed`,
    };
  }

  async deleteVersion(versionId: string): Promise<boolean> {
    const version = this.versions.get(versionId);
    if (version) {
      const list = this.contentVersions.get(version.contentId) || [];
      this.contentVersions.set(version.contentId, list.filter(v => v.id !== versionId));
    }
    return this.versions.delete(versionId);
  }

  async pruneVersions(contentId: string, keepCount: number): Promise<number> {
    const list = this.contentVersions.get(contentId) || [];
    const sorted = [...list].sort((a, b) => b.version - a.version);
    const toRemove = sorted.slice(keepCount);
    for (const v of toRemove) {
      this.versions.delete(v.id);
    }
    this.contentVersions.set(contentId, sorted.slice(0, keepCount));
    return toRemove.length;
  }

  async dispose(): Promise<void> {
    this.versions.clear();
    this.contentVersions.clear();
  }
}
