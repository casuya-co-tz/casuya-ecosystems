# Casuya Search

**Google Inside Casuya** - Educational content search and discovery system

## Overview

Casuya Search is a Phase 2 educational repository that provides instant search capabilities for educational content including subjects, topics, lessons, quizzes, and media. It enables students and teachers to find educational content within seconds.

## Features

- **Search Indexing**: Full-text search with configurable field boosting
- **Ranking Algorithms**: Advanced ranking with recency and popularity boosting
- **Suggestions**: Autocomplete and query suggestions based on usage
- **Filters**: Flexible filtering system with fluent API
- **Recommendations**: Personalized content recommendations
- **Caching**: Multi-strategy caching layer (LRU, FIFO, LFU)
- **Analytics**: Search behavior tracking and analysis

## Architecture

```
casuya-search/
├── indexing/          # Search indexing system
│   ├── subjects/      # Subject indexing
│   ├── topics/        # Topic indexing
│   ├── lessons/       # Lesson indexing
│   ├── quizzes/       # Quiz indexing
│   └── media/         # Media indexing
├── ranking/           # Ranking algorithms
├── suggestions/       # Autocomplete system
├── filters/           # Content filtering
├── recommendations/   # Recommendation engine
├── caching/           # Caching layer
├── search-api/        # Public API
├── analytics/         # Search analytics
└── utilities/         # Text utilities
```

## Installation

```bash
npm install
```

## Usage

### Basic Search

```typescript
import { SearchAPI } from 'casuya-search';

const searchAPI = new SearchAPI();

// Index documents
await searchAPI.indexDocuments([
  {
    id: '1',
    type: 'lesson',
    title: 'Introduction to Algebra',
    content: 'Learn the basics of algebraic equations...',
    metadata: {},
    tags: ['math', 'algebra', 'beginner'],
    subject: 'Mathematics',
    topic: 'Algebra',
    difficulty: 'beginner',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// Search
const results = await searchAPI.search({
  query: 'algebra equations',
  limit: 10,
});
```

### Advanced Filtering

```typescript
import { FilterEngine } from 'casuya-search';

const filterEngine = new FilterEngine();

const filters = FilterEngine.builder()
  .equals('type', 'lesson')
  .equals('difficulty', 'beginner')
  .in('tags', ['math', 'algebra'])
  .build();

const filtered = filterEngine.applyFilters(documents, filters);
```

### Recommendations

```typescript
// Record user interactions
searchAPI.recordInteraction('user123', 'doc1', 'view');
searchAPI.recordInteraction('user123', 'doc1', 'like');

// Get recommendations
const recommendations = searchAPI.getRecommendations('user123');
```

### Suggestions

```typescript
// Get autocomplete suggestions
const suggestions = searchAPI.getSuggestions('alg');
// Returns: [{ text: 'algebra', type: 'topic', frequency: 100 }, ...]
```

## API Reference

### SearchAPI

Main entry point for all search functionality.

- `search(query: SearchQuery): Promise<SearchResult[]>` - Perform search
- `getSuggestions(query: string): Suggestion[]` - Get autocomplete suggestions
- `getRecommendations(userId: string): Recommendation[]` - Get personalized recommendations
- `indexDocument(document: SearchDocument): void` - Index a single document
- `indexDocuments(documents: SearchDocument[]): void` - Index multiple documents
- `removeDocument(id: string): void` - Remove document from index
- `recordInteraction(userId, documentId, type): void` - Record user interaction
- `updatePopularity(scores: Map<string, number>): void` - Update popularity scores
- `getStats(): SearchStats` - Get search statistics

### SearchIndex

Core indexing system using Lunr.js.

- `addDocument(document: SearchDocument): void` - Add document to index
- `addDocuments(documents: SearchDocument[]): void` - Batch add documents
- `removeDocument(id: string): void` - Remove document from index
- `search(query: SearchQuery): SearchResult[]` - Search the index
- `getDocument(id: string): SearchDocument | undefined` - Get document by ID
- `getDocumentsByType(type): SearchDocument[]` - Get documents by type
- `size(): number` - Get total document count
- `clear(): void` - Clear all documents

### RankingEngine

Advanced ranking with configurable weights.

- `rank(results: SearchResult[]): SearchResult[]` - Rank search results
- `updatePopularity(documentId: string, score: number): void` - Update popularity
- `updatePopularityBatch(scores: Map<string, number>): void` - Batch update
- `updateConfig(config: Partial<RankingConfig>): void` - Update configuration
- `getConfig(): RankingConfig` - Get current configuration
- `resetPopularity(): void` - Reset popularity scores

### SuggestionsEngine

Autocomplete and query suggestions.

- `getSuggestions(query: string): Suggestion[]` - Get suggestions
- `addSuggestion(text: string, type: SuggestionType): void` - Add suggestion
- `indexDocuments(documents: SearchDocument[]): void` - Index for suggestions
- `recordQuery(query: string): void` - Record search query
- `getPopularQueries(limit: number): Suggestion[]` - Get popular queries
- `clear(): void` - Clear all suggestions
- `size(): number` - Get suggestion count

### FilterEngine

Content filtering with fluent API.

- `applyFilters(documents: SearchDocument[], filters: Filter[]): SearchDocument[]` - Apply filters
- `FilterEngine.builder(): FilterBuilder` - Create filter builder

### RecommendationEngine

Personalized content recommendations.

- `getRecommendations(userId: string, allDocuments: SearchDocument[]): Recommendation[]` - Get recommendations
- `recordInteraction(userId: string, documentId: string, type: InteractionType): void` - Record interaction
- `clearUserInteractions(userId: string): void` - Clear user data
- `clear(): void` - Clear all data

### CacheManager

Multi-strategy caching layer.

- `get(key: string): T | undefined` - Get cached value
- `set(key: string, value: T): void` - Set cached value
- `has(key: string): boolean` - Check if key exists
- `delete(key: string): boolean` - Delete cached value
- `clear(): void` - Clear all cache
- `getStats(): CacheStats` - Get cache statistics

### SearchAnalytics

Search behavior analytics.

- `recordSearch(event: SearchEvent): void` - Record search event
- `getPopularQueries(limit: number): Array<{query: string; count: number}>` - Get popular queries
- `getSearchTrends(days: number): Array<{date: string; count: number}>` - Get search trends
- `getZeroResultQueries(limit: number): Array<{query: string; count: number}>` - Get zero-result queries
- `getAverageResults(): number` - Get average results per search
- `getMostClickedDocuments(limit: number): Array<{documentId: string; clicks: number}>` - Get most clicked
- `getFilterUsage(): Array<{filter: string; count: number}>` - Get filter usage
- `clear(): void` - Clear all analytics
- `size(): number` - Get event count

## Configuration

### Ranking Configuration

```typescript
const rankingConfig = {
  weights: {
    title: 10,
    content: 1,
    tags: 5,
    metadata: 2,
    recency: 3,
    popularity: 4,
  },
  boostRecent: true,
  boostPopular: true,
};
```

### Cache Configuration

```typescript
const cacheConfig = {
  maxSize: 1000,
  ttl: 300000, // 5 minutes in milliseconds
  strategy: 'lru', // 'lru' | 'fifo' | 'lfu'
};
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Watch tests
npm run test:watch

# Lint
npm run lint

# Fix linting
npm run lint:fix
```

## Phase 2 Compliance

This repository follows Casuya Phase 2 constitution:

- **Feature Provider**: Provides search capabilities only
- **No Authentication**: User management handled by casuya-platform
- **No Synchronization**: Data sync handled by casuya-bridge
- **No Lesson Execution**: Runtime handled by casuya-runtime
- **Internet Resilient**: Caching and offline-first design
- **Weak Device Friendly**: Lightweight indexing and efficient algorithms
- **Extensible**: Modular design for new content types and search features

## Success Criteria

✅ Students find lessons within seconds  
✅ Supports subjects, topics, lessons, quizzes, and media  
✅ Configurable ranking algorithms  
✅ Personalized recommendations  
✅ Efficient caching for performance  
✅ Analytics for optimization

## License

MIT
