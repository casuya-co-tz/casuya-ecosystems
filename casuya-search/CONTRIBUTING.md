# Contributing to Casuya Search

Thank you for your interest in contributing to Casuya Search! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/casuya-search.git
cd casuya-search
```

### 2. Create a Branch

Branch naming convention:

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring
- `test/test-improvement` - Test improvements

```bash
git checkout -b feature/your-feature-name
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Make Changes

- Follow the existing code style
- Write tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 5. Commit Changes

Follow conventional commits:

```
type(scope): subject

body

footer
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

Examples:

```bash
git commit -m "feat(search): add fuzzy search support"
git commit -m "fix(ranking): resolve popularity score calculation bug"
git commit -m "docs(api): update SearchAPI documentation"
```

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Create a pull request on GitHub with:

- Clear title and description
- Reference related issues
- Describe changes made
- Add screenshots if applicable

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Provide type annotations for function returns
- Avoid `any` type when possible
- Use interfaces for object shapes

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Maximum line length: 100 characters
- Use meaningful variable and function names

### Testing

- Write unit tests for all new functions
- Aim for >80% code coverage
- Use descriptive test names
- Test edge cases and error conditions

### Documentation

- Add JSDoc comments for public APIs
- Update README.md for user-facing changes
- Update ARCHITECTURE.md for structural changes
- Keep examples up to date

## Project Structure

```
casuya-search/
├── src/              # Source code
├── tests/            # Test files
├── examples/         # Usage examples
├── dist/             # Compiled output (generated)
└── docs/             # Documentation
```

## Phase 2 Compliance

All contributions must comply with Casuya Phase 2 constitution:

- **No Authentication**: User management belongs to casuya-platform
- **No Synchronization**: Data sync belongs to casuya-bridge
- **No Lesson Execution**: Runtime belongs to casuya-runtime
- **Internet Resilient**: Features should work offline
- **Weak Device Friendly**: Optimize for low-end devices
- **Extensible**: Design for future requirements

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Building

```bash
# Build the project
npm run build

# Watch for changes
npm run dev
```

## Linting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Getting Help

- Open an issue for bugs or feature requests
- Join discussions in GitHub Discussions
- Check existing documentation first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
