export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  body?: string;
  contentType: string;
  status: ContentStatus;
  metadata: Record<string, unknown>;
  tags: string[];
  categoryIds: string[];
  taxonomyIds: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
  createdBy: string;
  updatedBy: string;
}

export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';

export interface ContentSummary {
  id: string;
  slug: string;
  title: string;
  contentType: string;
  status: ContentStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetadataSchema {
  id: string;
  name: string;
  description?: string;
  fields: MetadataField[];
  version: number;
}

export interface MetadataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'enum';
  required: boolean;
  defaultValue?: unknown;
  validation?: Record<string, unknown>;
  enumValues?: string[];
}

export interface TaxonomyNode {
  id: string;
  slug: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: TaxonomyNode[];
  order: number;
  metadata: Record<string, unknown>;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  order: number;
  metadata: Record<string, unknown>;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  usageCount: number;
  metadata: Record<string, unknown>;
}

export interface PublishingState {
  id: string;
  contentId: string;
  status: ContentStatus;
  workflowId?: string;
  stage?: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  publishedBy?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  metadata: Record<string, unknown>;
}

export interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  requiredApprovals: number;
  metadata: Record<string, unknown>;
}

export interface WorkflowTransition {
  fromStageId: string;
  toStageId: string;
  condition?: string;
  metadata: Record<string, unknown>;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  data: Partial<ContentItem>;
  diff?: string;
  createdBy: string;
  createdAt: Date;
  message?: string;
  metadata: Record<string, unknown>;
}

export interface ArchiveEntry {
  id: string;
  contentId: string;
  archivedAt: Date;
  archivedBy: string;
  reason?: string;
  data: ContentItem;
  metadata: Record<string, unknown>;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
  metadata: Record<string, unknown>;
}

export interface ImportError {
  line: number;
  message: string;
  data?: Record<string, unknown>;
}

export interface ExportOptions {
  format: string;
  filters?: Record<string, unknown>;
  fields?: string[];
  includeMetadata?: boolean;
  includeVersions?: boolean;
  compression?: boolean;
  delimiter?: string;
}

export interface ExportResult {
  success: boolean;
  data: string | Buffer;
  format: string;
  totalItems: number;
  metadata: Record<string, unknown>;
}

export interface SearchQuery {
  query: string;
  filters?: Record<string, unknown>;
  sort?: string;
  order?: 'asc' | 'desc';
  offset: number;
  limit: number;
  fields?: string[];
}

export interface SearchResult {
  items: SearchHit[];
  total: number;
  offset: number;
  limit: number;
  facets?: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface SearchHit {
  id: string;
  score: number;
  title: string;
  description?: string;
  contentType: string;
  status: ContentStatus;
  url?: string;
  highlights?: Record<string, string[]>;
  fields?: Record<string, unknown>;
}

export interface PaginationOptions {
  offset: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  options: Record<string, unknown>;
}

export interface ContentRepositoryConfig {
  provider: ProviderConfig;
  metadataProvider?: ProviderConfig;
  cacheProvider?: ProviderConfig;
}
