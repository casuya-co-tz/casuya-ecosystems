# Casuya Search Architecture

## Design Principles

### Phase 2 Compliance

- **Feature Provider**: Only provides search capabilities
- **No Authentication**: Delegates to casuya-platform
- **No Synchronization**: Delegates to casuya-bridge
- **No Lesson Execution**: Delegates to casuya-runtime
- **Internet Resilient**: Caching layer for offline scenarios
- **Weak Device Friendly**: Lightweight algorithms, efficient memory usage
- **Extensible**: Modular design for new content types

## Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     SearchAPI                            │
│              (Unified Public Interface)                  │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┬──────────────┬──────────────┐
       ▼                ▼              ▼              ▼
┌──────────────┐ ┌─────────────┐ ┌──────────┐ ┌─────────────┐
│ SearchIndex  │ │RankingEngine│ │Suggestions│ │FilterEngine │
│              │ │             │ │ Engine   │ │             │
└──────────────┘ └─────────────┘ └──────────┘ └─────────────┘
       │                │              │              │
       └────────────────┴──────────────┴──────────────┘
                        │
               ┌────────┴────────┐
               ▼                 ▼
        ┌─────────────┐  ┌──────────────┐
        │CacheManager │  │Recommendation│
        │             │  │   Engine     │
        └─────────────┘  └──────────────┘
               │
               ▼
        ┌──────────────┐
        │SearchAnalytics│
        └──────────────┘
```

## Module Responsibilities

### SearchIndex

- **Purpose**: Core full-text search using Lunr.js
- **Responsibilities**:
  - Document indexing (add, remove, update)
  - Full-text search with field boosting
  - Highlight extraction
  - Type-based filtering
- **Dependencies**: Lunr.js
- **Performance**: O(1) lookup, O(n) rebuild

### RankingEngine

- **Purpose**: Relevance scoring and result ordering
- **Responsibilities**:
  - Configurable weight-based scoring
  - Recency boosting (time-decay)
  - Popularity boosting
  - Score normalization
- **Dependencies**: None
- **Performance**: O(n log n) sorting

### SuggestionsEngine

- **Purpose**: Autocomplete and query suggestions
- **Responsibilities**:
  - Prefix-based suggestions
  - Query history tracking
  - Document-based suggestion generation
  - Popular query ranking
- **Dependencies**: None
- **Performance**: O(n) prefix matching

### FilterEngine

- **Purpose**: Content filtering with complex queries
- **Responsibilities**:
  - Multi-field filtering
  - Comparison operators (eq, ne, gt, lt, in, contains)
  - Fluent builder API
  - Metadata field support
- **Dependencies**: None
- **Performance**: O(n*m) where n=docs, m=filters

### RecommendationEngine

- **Purpose**: Personalized content recommendations
- **Responsibilities**:
  - User interaction tracking
  - Profile building
  - Content scoring based on preferences
  - Cold-start handling (popular content)
- **Dependencies**: None
- **Performance**: O(n) scoring per user

### CacheManager

- **Purpose**: Multi-strategy caching layer
- **Responsibilities**:
  - TTL-based expiration
  - Eviction strategies (LRU, FIFO, LFU)
  - Access pattern tracking
  - Cache statistics
- **Dependencies**: None
- **Performance**: O(1) get/set

### SearchAnalytics

- **Purpose**: Search behavior tracking and analysis
- **Responsibilities**:
  - Event recording
  - Popular query analysis
  - Trend analysis
  - Zero-result query detection
  - Click tracking
- **Dependencies**: None
- **Performance**: O(1) recording, O(n) analysis

## Data Flow

### Indexing Flow

```
Document → SearchAPI → SearchIndex → Lunr Index
                ↓
         SuggestionsEngine (for autocomplete)
```

### Search Flow

```
Query → SearchAPI → CacheManager (check)
                ↓ (miss)
         SearchIndex → Results
                ↓
         FilterEngine → Filtered Results
                ↓
         RankingEngine → Ranked Results
                ↓
         CacheManager (store)
                ↓
         Return to Client
```

### Recommendation Flow

```
User ID → SearchAPI → RecommendationEngine
                ↓
         User Interactions → Profile
                ↓
         All Documents → Scoring
                ↓
         Ranked Recommendations
```

## Performance Considerations

### Memory Usage

- **SearchIndex**: O(n) where n = total documents
- **CacheManager**: O(m) where m = cache size (configurable)
- **SuggestionsEngine**: O(k) where k = unique suggestions
- **RecommendationEngine**: O(u * i) where u = users, i = avg interactions

### CPU Usage

- **Indexing**: O(n) for single doc, O(n) for rebuild
- **Search**: O(log n) for lookup + O(n) for filtering
- **Ranking**: O(n log n) for sorting
- **Recommendations**: O(n) for scoring

### Network Usage

- **Minimal**: All processing happens locally
- **API calls**: Only for initial document fetch
- **Caching**: Reduces repeated network calls

## Extensibility Points

### New Content Types

Add to `SearchDocument` type:

```typescript
type SearchDocumentType = 'subject' | 'topic' | 'lesson' | 'quiz' | 'media' | 'new-type';
```

### New Ranking Strategies

Extend `RankingConfig`:

```typescript
interface RankingConfig {
  // existing...
  customStrategy?: (doc: SearchDocument) => number;
}
```

### New Filter Operators

Add to `Filter` type:

```typescript
type FilterOperator =
  'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'new-operator';
```

### New Cache Strategies

Add to `CacheConfig`:

```typescript
type CacheStrategy = 'lru' | 'fifo' | 'lfu' | 'new-strategy';
```

## Integration Points

### Casuya-Core API

- **Document Fetch**: GET /api/documents
- **Bulk Fetch**: POST /api/documents/bulk
- **Metadata**: GET /api/documents/{id}/metadata

### Casuya-Bridge

- **Sync Events**: Listen for document changes
- **Offline Support**: Cache documents locally

### Casuya-Platform

- **User Context**: Get user preferences for recommendations
- **Permissions**: Filter results based on access

## Testing Strategy

### Unit Tests

- Each module tested independently
- Mock external dependencies
- Edge case coverage

### Integration Tests

- End-to-end search flows
- Cache integration
- Filter combinations

### Performance Tests

- Large dataset indexing (10k+ docs)
- Concurrent search requests
- Cache hit rate measurement

## Deployment Considerations

### Environment Variables

```env
CACHE_SIZE=1000
CACHE_TTL=300000
CACHE_STRATEGY=lru
MAX_SUGGESTIONS=10
MAX_RECOMMENDATIONS=10
```

### Scaling

- **Horizontal**: Multiple instances with shared cache
- **Vertical**: Increase cache size for better hit rates
- **Sharding**: Partition by subject/topic for large datasets

### Monitoring

- Cache hit rate
- Average search latency
- Zero-result query rate
- Recommendation click-through rate
