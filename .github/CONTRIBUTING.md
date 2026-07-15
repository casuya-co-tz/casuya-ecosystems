# Contributing to Casuya Ecosystem

Thank you for your interest in contributing to the Casuya ecosystem! This document provides guidelines and information for contributors.

## 🎯 Our Mission

We're building an offline-first, package-driven, highly scalable educational ecosystem designed to make interactive digital learning accessible everywhere. Every contribution helps us achieve this goal.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [How to Contribute](#-how-to-contribute)
- [Development Process](#-development-process)
- [Pull Request Process](#-pull-request-process)
- [Coding Standards](#-coding-standards)
- [Commit Guidelines](#-commit-guidelines)
- [Reporting Issues](#-reporting-issues)
- [Community](#-community)

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (for JavaScript/TypeScript projects)
- **Python** 3.9+ (for Python projects)
- **pnpm** 8+ (package manager)
- **Git** 2.30+

### Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/REPOSITORY_NAME.git
cd REPOSITORY_NAME

# Add upstream remote
git remote add upstream https://github.com/casuya-co-tz/REPOSITORY_NAME.git

# Install dependencies
pnpm install
```

### Development Environment

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run linter
pnpm lint

# Build project
pnpm build
```

---

## 🤝 How to Contribute

### Types of Contributions

| Type              | Description           | Good for beginners |
| ----------------- | --------------------- | ------------------ |
| **Bug Fixes**     | Fix reported issues   | ✅ Yes             |
| **Documentation** | Improve or add docs   | ✅ Yes             |
| **Tests**         | Add or improve tests  | ✅ Yes             |
| **Features**      | Add new functionality | ⚠️ Medium          |
| **Architecture**  | Major design changes  | ❌ No              |

### Finding Issues

- Look for issues labeled `good first issue` for beginners
- Check issues labeled `help wanted` for more complex tasks
- Review the [Roadmap](https://github.com/casuya-co-tz/.github/blob/main/profile/README.md) for planned features

---

## 🔄 Development Process

### 1. Choose an Issue

```bash
# Comment on the issue to let others know you're working on it
"I'd like to work on this issue. I'll have a PR ready by [date]"
```

### 2. Create a Branch

```bash
# Create a feature branch from main
git checkout -b feature/issue-number-short-description

# Examples:
git checkout -b feature/123-add-user-authentication
git checkout -b fix/456-fix-login-bug
git checkout -b docs/789-update-readme
```

### 3. Make Changes

- Follow our [Coding Standards](#coding-standards)
- Write tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run linter
pnpm lint

# Type check (if applicable)
pnpm typecheck
```

### 5. Commit Changes

```bash
# Stage your changes
git add .

# Commit with a meaningful message
git commit -m "feat: add user authentication module

- Implement JWT token generation
- Add password hashing with bcrypt
- Create user registration endpoint

Closes #123"
```

### 6. Push and Create PR

```bash
# Push to your fork
git push origin feature/issue-number-short-description

# Create a Pull Request on GitHub
```

---

## 📝 Pull Request Process

### PR Title Format

```
<type>(<scope>): <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code refactoring
- test: Adding or updating tests
- chore: Maintenance tasks

Examples:
- feat(auth): add OAuth2 login support
- fix(api): resolve timeout issue on slow connections
- docs(readme): update installation instructions
```

### PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests have been added/updated
- [ ] Documentation has been updated
- [ ] All tests pass locally
- [ ] No console errors or warnings
- [ ] No security vulnerabilities introduced
- [ ] PR title follows the format above
- [ ] Related issue is linked

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues

Closes #issue_number

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

[Add screenshots here]

## Additional Notes

[Any additional information]
```

---

## 🎨 Coding Standards

### General Principles

1. **Offline-First**: All code must work without internet connectivity
2. **Low-End Devices**: Optimize for devices with limited resources
3. **Accessibility**: Follow WCAG 2.1 AA standards
4. **Performance**: Optimize for speed and efficiency

### JavaScript/TypeScript

```javascript
// ✅ Good
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ❌ Bad
function calculateTotal(items) {
  var sum = 0;
  for (var i = 0; i < items.length; i++) {
    sum += items[i].price;
  }
  return sum;
}
```

### Python

```python
# ✅ Good
def calculate_total(items: list[dict]) -> float:
    """Calculate total price of items."""
    return sum(item["price"] for item in items)

# ❌ Bad
def calculate_total(items):
    sum = 0
    for item in items:
        sum += item["price"]
    return sum
```

### CSS/SCSS

```scss
// ✅ Good - Mobile-first approach
.card {
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
}

// ❌ Bad - Desktop-first
.card {
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
}
```

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description              |
| ---------- | ------------------------ |
| `feat`     | New feature              |
| `fix`      | Bug fix                  |
| `docs`     | Documentation changes    |
| `style`    | Code style changes       |
| `refactor` | Code refactoring         |
| `test`     | Adding/updating tests    |
| `chore`    | Maintenance tasks        |
| `perf`     | Performance improvements |
| `ci`       | CI/CD changes            |

### Examples

```bash
# Simple commit
git commit -m "feat(auth): add login endpoint"

# Detailed commit
git commit -m "fix(api): resolve timeout issue on slow connections

- Increase default timeout to 30s
- Add retry mechanism for failed requests
- Update error handling

Closes #123"
```

### Breaking Changes

```bash
git commit -m "feat!: change authentication method

BREAKING CHANGE: JWT tokens now expire after 1 hour instead of 24 hours"
```

---

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Environment details**
   - OS and version
   - Browser/device (if applicable)
   - Node.js version
   - Package version

2. **Steps to reproduce**
   - Clear, numbered steps
   - Minimal reproduction if possible

3. **Expected behavior**
   - What you expected to happen

4. **Actual behavior**
   - What actually happened

5. **Screenshots/logs**
   - If applicable

### Feature Requests

When suggesting features:

1. **Problem statement**
   - What problem does this solve?

2. **Proposed solution**
   - How should it work?

3. **Alternatives considered**
   - Other approaches you've thought about

4. **Additional context**
   - Mockups, examples, etc.

---

## 🌍 Community

### Communication Channels

- **GitHub Discussions**: For questions and general discussion
- **Issues**: For bug reports and feature requests
- **Pull Requests**: For code contributions

### Getting Help

1. Check existing documentation
2. Search existing issues/discussions
3. Create a new discussion or issue

### Recognition

Contributors are recognized in:

- The project's Contributors list
- Release notes for significant contributions
- Special thanks in documentation

---

## 📚 Additional Resources

- [Repository Standards](REPOSITORY_STANDARDS.md)
- [Architecture Principles](ARCHITECTURE_PRINCIPLES.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

---

## 🙏 Thank You

Thank you for contributing to Casuya! Your efforts help make digital learning accessible to everyone, everywhere.

![Casuya](https://img.shields.io/badge/Casuya_©2024-Contributors-00D4FF?style=for-the-badge&labelColor=1a1a25&color=00D4FF)
