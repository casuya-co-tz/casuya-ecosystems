# Casuya Search Examples

This directory contains example usage of the casuya-search library.

## Usage Example

The main example file demonstrates:

1. **Document Indexing**: How to index educational content
2. **Basic Search**: Simple full-text search
3. **Type Filtering**: Filter by content type (lesson, quiz, media)
4. **Subject Filtering**: Filter by subject area
5. **Autocomplete**: Get search suggestions
6. **Advanced Filtering**: Complex filter combinations
7. **User Interactions**: Record user behavior
8. **Recommendations**: Get personalized content
9. **Popularity Updates**: Update content popularity
10. **Statistics**: View search system metrics

## Running the Example

```bash
# Build the project first
npm run build

# Run the example
node dist/examples/usage.js
```

Or using ts-node:

```bash
npx ts-node examples/usage.ts
```

## Expected Output

```
=== Casuya Search Example Usage ===

1. Indexing documents...
   Indexed 5 documents

2. Basic search for "algebra":
   1. Introduction to Algebra (Score: 10.50)
   2. Algebra Practice Quiz (Score: 8.25)
   3. Advanced Calculus (Score: 3.10)

3. Search for "math" with type filter (lesson only):
   1. Introduction to Algebra (lesson)
   2. Advanced Calculus (lesson)

4. Search for "introduction" in Science:
   1. Introduction to Physics (Science)

5. Autocomplete suggestions for "alg":
   1. algebra (query)
   2. algebra (topic)

6. Advanced filtering (beginner difficulty, math subject):
   1. Introduction to Algebra (beginner)

7. Recording user interactions...
   Recorded 4 interactions for user-123

8. Recommendations for user-123:
   1. Document ID: math-001
      Reason: Based on your interest in Mathematics
      Score: 5.00

9. Updating popularity scores...
   Updated popularity scores for all documents

10. Search statistics:
    Total documents: 5
    Total suggestions: 15
    Cache size: 3/1000

=== Example Complete ===
```

## Custom Examples

Create your own examples by:

1. Copying `usage.ts` as a template
2. Modifying the sample documents
3. Adjusting search queries and filters
4. Adding custom ranking configurations
5. Testing different cache strategies

## Integration Examples

### With Express.js

```typescript
import express from 'express';
import { SearchAPI } from 'casuya-search';

const app = express();
const searchAPI = new SearchAPI();

app.get('/search', async (req, res) => {
  const { q, type, subject } = req.query;
  const results = await searchAPI.search({
    query: q as string,
    type: type as any,
    subject: subject as string,
  });
  res.json(results);
});

app.listen(3000);
```

### With React

```typescript
import { SearchAPI } from 'casuya-search';

const searchAPI = new SearchAPI();

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const searchResults = await searchAPI.search({ query });
    setResults(searchResults);
  };

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      <ul>
        {results.map((result) => (
          <li key={result.document.id}>{result.document.title}</li>
        ))}
      </ul>
    </div>
  );
}
```
