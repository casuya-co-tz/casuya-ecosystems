export type {
  ContentItem,
  ContentSummary,
  ContentStatus,
  MetadataSchema,
  MetadataField,
  TaxonomyNode,
  Category,
  Tag,
  PublishingState,
  Workflow,
  WorkflowStage,
  WorkflowTransition,
  ContentVersion,
  ArchiveEntry,
  ImportResult,
  ImportError,
  ExportOptions,
  ExportResult,
  SearchQuery,
  SearchResult,
  SearchHit,
  PaginationOptions,
  PaginatedResult,
  ProviderConfig,
  ContentRepositoryConfig,
} from './types';

export type { IContentRepository } from './content-repository.interface';
export type { IMetadataEngine, MetadataValidationResult, MetadataValidationError, MetadataValidationWarning } from './metadata-engine.interface';
export type { ITaxonomyService } from './taxonomy-service.interface';
export type { ICategoryService } from './category-service.interface';
export type { ITagService } from './tag-service.interface';
export type { IPublishingService, ProcessingResult } from './publishing-service.interface';
export type { IWorkflowService, WorkflowState, WorkflowHistoryEntry } from './workflow-service.interface';
export type { IVersioningService, VersionDiff, VersionChange } from './versioning-service.interface';
export type { IArchiveService } from './archive-service.interface';
export type { IImporter, ImportValidationResult, ImportValidationError, ImportPreview } from './importer.interface';
export type { IExporter } from './exporter.interface';
export type { ISearchAdapter, IndexStats } from './search-adapter.interface';
