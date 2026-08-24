// Errors
export {
  ContentServiceError,
  NotFoundError,
  ValidationError,
  DuplicateError,
  CycleError,
  InvalidStateError,
} from './errors';

// Interfaces
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
} from './interfaces';

export type { IContentRepository } from './interfaces';
export type { IMetadataEngine, MetadataValidationResult, MetadataValidationError, MetadataValidationWarning } from './interfaces';
export type { ITaxonomyService } from './interfaces';
export type { ICategoryService } from './interfaces';
export type { ITagService } from './interfaces';
export type { IPublishingService, ProcessingResult } from './interfaces';
export type { IWorkflowService, WorkflowState, WorkflowHistoryEntry } from './interfaces';
export type { IVersioningService, VersionDiff, VersionChange } from './interfaces';
export type { IArchiveService } from './interfaces';
export type { IImporter, ImportValidationResult, ImportValidationError, ImportPreview } from './interfaces';
export type { IExporter } from './interfaces';
export type { ISearchAdapter, IndexStats } from './interfaces';

// Repositories
export { ContentRepository } from './repositories';
export type { IContentRepositoryProvider } from './repositories';
export { MemoryContentRepositoryProvider, FileSystemContentRepositoryProvider, DatabaseContentRepositoryProvider } from './repositories';

// Metadata
export { MetadataEngine } from './metadata';
export type { IMetadataProvider } from './metadata';
export { MemoryMetadataProvider, JsonSchemaBackedMetadataProvider } from './metadata';

// Taxonomies
export { TaxonomyService } from './taxonomies';
export type { ITaxonomyProvider } from './taxonomies';
export { MemoryTaxonomyProvider } from './taxonomies';

// Categories
export { CategoryService } from './categories';
export type { ICategoryProvider } from './categories';
export { MemoryCategoryProvider } from './categories';

// Tags
export { TagService } from './tags';
export type { ITagProvider } from './tags';
export { MemoryTagProvider } from './tags';

// Publishing
export { PublishingService } from './publishing';
export type { IPublishingProvider } from './publishing';
export { MemoryPublishingProvider } from './publishing';

// Workflows
export { WorkflowService } from './workflows';
export type { IWorkflowProvider } from './workflows';
export { MemoryWorkflowProvider } from './workflows';

// Versioning
export { VersioningService } from './versioning';
export type { IVersioningProvider } from './versioning';
export { MemoryVersioningProvider } from './versioning';

// Archives
export { ArchiveService } from './archives';
export type { IArchiveProvider } from './archives';
export { MemoryArchiveProvider } from './archives';

// Importers
export { BaseImporter } from './importers';
export type { IImporterProvider } from './importers';
export { JsonImporterProvider, CsvImporterProvider } from './importers';

// Exporters
export { BaseExporter } from './exporters';
export type { IExporterProvider } from './exporters';
export { JsonExporterProvider, CsvExporterProvider } from './exporters';

// Search Adapters
export { SearchAdapter } from './search-adapters';
export type { ISearchProvider } from './search-adapters';
export { MemorySearchProvider } from './search-adapters';

// Utilities
export { IdGenerator } from './utilities';
export { SlugGenerator } from './utilities';
export { ContentValidator } from './utilities';
export { PaginationHelper } from './utilities';
export { ContentSanitizer } from './utilities';
