# Contributing to Casuya Exams

Thank you for your interest in contributing to Casuya Exams! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Development Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/casuya-exams.git
cd casuya-exams
```

### 2. Create a Branch

Branch naming convention:

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring
- `test/test-improvement` - Test improvements

### 3. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(question-bank): add bulk question import
fix(grading): handle edge case in essay scoring
docs(readme): update API examples
test(sessions): add timeout boundary tests
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `build`, `ci`

Allowed scopes: `question-bank`, `exam-builder`, `scheduling`, `sessions`, `grading`, `reports`, `certificates`, `analytics`, `security`, `utils`, `tests`, `docs`

### 4. Development Setup

```bash
npm install
npm run build
npm test
```

### 5. Run Tests

```bash
npm test                 # Run all tests
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
npm run test:coverage    # Run with coverage
npm run lint             # Lint code
npm run typecheck        # TypeScript check
```

### 6. Submit a Pull Request

1. Push your branch to your fork
2. Create a PR against `main`
3. Fill out the PR template
4. Ensure all CI checks pass

## Coding Standards

- TypeScript with strict mode
- Prettier for formatting (100 char width)
- ESLint for linting
- Jest for testing
- No unused variables or parameters
- Public API exported from `src/index.ts`

## Phase 2 Compliance Checklist

Before submitting any code, verify:

- [ ] Does this code belong in this repository?
- [ ] Will it work on low-end Android devices?
- [ ] Will it work on unreliable internet?
- [ ] Is it extensible?
- [ ] Is it modular?
- [ ] Is it backward compatible?
- [ ] Does it avoid increasing server costs?
- [ ] Does it avoid duplicating Phase 1 responsibilities?
- [ ] Can new educational features be added without restructuring?
- [ ] Will future developers immediately understand its purpose?
