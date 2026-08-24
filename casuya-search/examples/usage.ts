/**
 * Casuya Search - Example Usage
 *
 * This file demonstrates how to use the casuya-search library
 * for educational content search and discovery.
 */

import { SearchAPI } from '../src/search-api/SearchAPI';
import { FilterEngine } from '../src/filters/FilterEngine';
import { SearchDocument } from '../src/types';

// Initialize the search API
const searchAPI = new SearchAPI({
  maxSize: 1000,
  ttl: 300000, // 5 minutes
  strategy: 'lru',
});

// Sample educational documents
const sampleDocuments: SearchDocument[] = [
  {
    id: 'math-001',
    type: 'lesson',
    title: 'Introduction to Algebra',
    content:
      'Learn the fundamentals of algebraic equations, variables, and expressions. This lesson covers basic operations, solving linear equations, and understanding algebraic notation.',
    metadata: {
      duration: 30,
      author: 'Dr. Smith',
      gradeLevel: '9-10',
    },
    tags: ['math', 'algebra', 'beginner', 'equations'],
    subject: 'Mathematics',
    topic: 'Algebra',
    difficulty: 'beginner',
    language: 'en',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'math-002',
    type: 'lesson',
    title: 'Advanced Calculus',
    content:
      'Deep dive into derivatives, integrals, and their applications. Understand the fundamental theorem of calculus and learn optimization techniques.',
    metadata: {
      duration: 45,
      author: 'Prof. Johnson',
      gradeLevel: '11-12',
    },
    tags: ['math', 'calculus', 'advanced', 'derivatives'],
    subject: 'Mathematics',
    topic: 'Calculus',
    difficulty: 'advanced',
    language: 'en',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'math-003',
    type: 'quiz',
    title: 'Algebra Practice Quiz',
    content:
      'Test your algebra knowledge with 20 questions covering linear equations, quadratic equations, and factoring.',
    metadata: {
      questions: 20,
      timeLimit: 30,
      passingScore: 70,
    },
    tags: ['math', 'algebra', 'quiz', 'practice'],
    subject: 'Mathematics',
    topic: 'Algebra',
    difficulty: 'intermediate',
    language: 'en',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'sci-001',
    type: 'lesson',
    title: 'Introduction to Physics',
    content:
      'Explore the basic principles of physics including motion, forces, energy, and waves. Perfect for beginners.',
    metadata: {
      duration: 35,
      author: 'Dr. Williams',
      gradeLevel: '9-10',
    },
    tags: ['science', 'physics', 'beginner', 'motion'],
    subject: 'Science',
    topic: 'Physics',
    difficulty: 'beginner',
    language: 'en',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'sci-002',
    type: 'media',
    title: 'Chemistry Lab Video',
    content:
      'Video demonstration of common chemistry experiments including titration, precipitation reactions, and acid-base chemistry.',
    metadata: {
      duration: 25,
      format: 'video',
      resolution: '1080p',
    },
    tags: ['science', 'chemistry', 'video', 'lab'],
    subject: 'Science',
    topic: 'Chemistry',
    difficulty: 'intermediate',
    language: 'en',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-25'),
  },
];

async function main(): Promise<void> {
  console.log('=== Casuya Search Example Usage ===\n');

  // 1. Index documents
  console.log('1. Indexing documents...');
  searchAPI.indexDocuments(sampleDocuments);
  console.log(`   Indexed ${sampleDocuments.length} documents\n`);

  // 2. Basic search
  console.log('2. Basic search for "algebra":');
  const basicResults = await searchAPI.search({
    query: 'algebra',
    limit: 5,
  });
  basicResults.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.document.title} (Score: ${result.score.toFixed(2)})`);
  });
  console.log();

  // 3. Search with type filter
  console.log('3. Search for "math" with type filter (lesson only):');
  const typeFilteredResults = await searchAPI.search({
    query: 'math',
    type: 'lesson',
    limit: 5,
  });
  typeFilteredResults.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.document.title} (${result.document.type})`);
  });
  console.log();

  // 4. Search with subject filter
  console.log('4. Search for "introduction" in Science:');
  const subjectFilteredResults = await searchAPI.search({
    query: 'introduction',
    subject: 'Science',
    limit: 5,
  });
  subjectFilteredResults.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.document.title} (${result.document.subject})`);
  });
  console.log();

  // 5. Get suggestions
  console.log('5. Autocomplete suggestions for "alg":');
  const suggestions = searchAPI.getSuggestions('alg');
  suggestions.forEach((suggestion, index) => {
    console.log(`   ${index + 1}. ${suggestion.text} (${suggestion.type})`);
  });
  console.log();

  // 6. Advanced filtering
  console.log('6. Advanced filtering (beginner difficulty, math subject):');
  const filterEngine = new FilterEngine();
  const filters = filterEngine.applyFilters(sampleDocuments, [
    { field: 'difficulty', operator: 'eq', value: 'beginner' },
    { field: 'subject', operator: 'eq', value: 'Mathematics' },
  ]);
  filters.forEach((doc, index) => {
    console.log(`   ${index + 1}. ${doc.title} (${doc.difficulty})`);
  });
  console.log();

  // 7. Record user interactions for recommendations
  console.log('7. Recording user interactions...');
  searchAPI.recordInteraction('user-123', 'math-001', 'view');
  searchAPI.recordInteraction('user-123', 'math-001', 'like');
  searchAPI.recordInteraction('user-123', 'math-003', 'view');
  searchAPI.recordInteraction('user-123', 'sci-001', 'view');
  console.log('   Recorded 4 interactions for user-123\n');

  // 8. Get recommendations
  console.log('8. Recommendations for user-123:');
  const recommendations = searchAPI.getRecommendations('user-123');
  recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. Document ID: ${rec.documentId}`);
    console.log(`      Reason: ${rec.reason}`);
    console.log(`      Score: ${rec.score.toFixed(2)}\n`);
  });

  // 9. Update popularity scores
  console.log('9. Updating popularity scores...');
  const popularityScores = new Map([
    ['math-001', 100],
    ['math-002', 75],
    ['math-003', 50],
    ['sci-001', 80],
    ['sci-002', 60],
  ]);
  searchAPI.updatePopularity(popularityScores);
  console.log('   Updated popularity scores for all documents\n');

  // 10. Get search statistics
  console.log('10. Search statistics:');
  const stats = searchAPI.getStats();
  console.log(`    Total documents: ${stats.totalDocuments}`);
  console.log(`    Total suggestions: ${stats.totalSuggestions}`);
  const cacheStats = stats.cacheStats as { size: number; maxSize: number };
  console.log(`    Cache size: ${cacheStats.size}/${cacheStats.maxSize}`);
  console.log();

  console.log('=== Example Complete ===');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };
