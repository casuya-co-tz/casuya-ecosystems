# Versioning Policy

This document defines the versioning strategy for all packages in the Casuya ecosystem.

## 📋 Table of Contents

- [Overview](#overview)
- [Semantic Versioning](#semantic-versioning)
- [Version Format](#version-format)
- [Pre-release Versions](#pre-release-versions)
- [Version Management](#version-management)
- [Breaking Changes](#breaking-changes)

---

## Overview

We follow Semantic Versioning (SemVer) for all packages in the Casuya ecosystem.

### Principles

1. **Predictable**: Version numbers convey meaning
2. **Stable**: Users can rely on version compatibility
3. **Transparent**: Version changes are documented
4. **Consistent**: Same rules apply to all packages

---

## Semantic Versioning

### Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

### Examples

```
1.0.0          # Stable release
1.0.1          # Bug fix
1.1.0          # New feature
2.0.0          # Breaking change
2.0.0-beta.1   # Pre-release
2.0.0+build.1  # Build metadata
```

### Version Numbers

| Component | Increment When                     | Example       |
| --------- | ---------------------------------- | ------------- |
| MAJOR     | Breaking changes                   | 1.0.0 → 2.0.0 |
| MINOR     | New features (backward compatible) | 1.0.0 → 1.1.0 |
| PATCH     | Bug fixes (backward compatible)    | 1.0.0 → 1.0.1 |

---

## Version Format

### Stable Releases

```
MAJOR.MINOR.PATCH
```

**Examples**:

- `1.0.0` - Initial stable release
- `1.0.1` - Bug fix
- `1.1.0` - New feature
- `2.0.0` - Breaking change

### Pre-release Releases

```
MAJOR.MINOR.PATCH-PRERELEASE.N
```

**Examples**:

- `1.0.0-alpha.1` - Alpha release
- `1.0.0-beta.1` - Beta release
- `1.0.0-rc.1` - Release candidate

### Build Metadata

```
MAJOR.MINOR.PATCH+BUILD.N
```

**Examples**:

- `1.0.0+build.1` - Build metadata
- `1.0.0+20240101` - Date-based build

---

## Pre-release Versions

### Stages

| Stage | Purpose           | Stability     |
| ----- | ----------------- | ------------- |
| Alpha | Internal testing  | Unstable      |
| Beta  | External testing  | Mostly stable |
| RC    | Release candidate | Stable        |

### Naming Convention

```
alpha.N   # Alpha releases (N = iteration number)
beta.N    # Beta releases
rc.N      # Release candidates
```

### Promotion

```
1.0.0-alpha.1 → 1.0.0-alpha.2 → 1.0.0-beta.1 → 1.0.0-rc.1 → 1.0.0
```

---

## Version Management

### Package Versions

Each package is versioned independently:

```json
{
  "name": "@casuya/platform",
  "version": "1.2.3"
}
```

### Inter-package Dependencies

```json
{
  "dependencies": {
    "@casuya/core": "^1.0.0",
    "@casuya/common": "^1.0.0"
  }
}
```

**Rules**:

- Use `^` for minor version updates (safe updates)
- Use `~` for patch version updates (bug fixes only)
- Pin exact versions for critical dependencies

### Monorepo Versioning

| Strategy    | When to Use                            |
| ----------- | -------------------------------------- |
| Independent | Packages with different release cycles |
| Fixed       | Packages that must be updated together |

**Default**: Independent versioning for all packages.

---

## Breaking Changes

### Definition

A breaking change is any change that:

1. **Removes** a public API
2. **Changes** a public API signature
3. **Changes** behavior of existing functionality
4. **Deprecates** existing functionality

### Examples

```typescript
// Breaking: Changed function signature
// Before
function getUser(id: string): User {}

// After
function getUser(id: string, options?: GetUserOptions): User {}

// Breaking: Changed return type
// Before
function getData(): string {}

// After
function getData(): Data {}

// Breaking: Changed behavior
// Before
function process(data: any): void {}

// After
function process(data: ProcessableData): void {}
```

### Migration Guide

For every major version bump, provide:

1. **Migration Guide**: Step-by-step upgrade instructions
2. **Code Examples**: Before and after comparisons
3. **Automated Tools**: Codemods when possible
4. **Deprecation Warnings**: In previous minor versions

---

## Version Decision Tree

```
Is this a breaking change?
├── Yes → MAJOR version bump
└── No
    ├── Is this a new feature?
    │   ├── Yes → MINOR version bump
    │   └── No
    │       └── Is this a bug fix?
    │           ├── Yes → PATCH version bump
    │           └── No → No version bump
```

### Examples

| Change                    | Version Bump | Example       |
| ------------------------- | ------------ | ------------- |
| Fix login bug             | PATCH        | 1.0.0 → 1.0.1 |
| Add new feature           | MINOR        | 1.0.1 → 1.1.0 |
| Change API signature      | MAJOR        | 1.1.0 → 2.0.0 |
| Remove deprecated feature | MAJOR        | 1.1.0 → 2.0.0 |
| Update documentation      | None         | 1.0.0 → 1.0.0 |
| Update dependencies       | PATCH        | 1.0.0 → 1.0.1 |

---

## Special Cases

### Initial Development

Before `1.0.0`:

```
0.1.0  # Initial development
0.1.1  # Bug fix during development
0.2.0  # New feature during development
```

### Long-Term Support (LTS)

| Version  | Support Level  | Duration         |
| -------- | -------------- | ---------------- |
| Current  | Full support   | Until next major |
| Previous | Security fixes | 6 months         |
| Older    | No support     | N/A              |

### Emergency Patches

For critical security issues:

```
1.0.0 → 1.0.1 (security patch)
```

---

## Tools

### Version Bumping

```bash
# Bump patch version
pnpm version patch

# Bump minor version
pnpm version minor

# Bump major version
pnpm version major

# Bump pre-release version
pnpm version prerelease --preid=beta
```

### Changelog Generation

We use `conventional-changelog` for automatic changelog generation:

```bash
# Generate changelog
pnpm changelog

# Generate changelog for specific version
pnpm changelog --version 1.2.3
```

### Release Automation

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Create Release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
```

---

## Version History

### Changelog Format

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added

- New feature X
- New feature Y

### Changed

- Improved performance of Z

### Fixed

- Fixed bug in A
- Fixed issue with B

### Deprecated

- Deprecated feature C (will be removed in 2.0.0)

### Removed

- Removed feature D (was deprecated in 1.1.0)

### Security

- Updated dependency E to fix vulnerability

## [1.1.0] - 2024-01-01

...
```

---

## FAQ

### Q: When should I bump the MAJOR version?

A: Whenever you make breaking changes that will require users to update their code.

### Q: Can I combine pre-release versions?

A: Yes, but follow the format: `MAJOR.MINOR.PATCH-alpha.N`.

### Q: How do I handle concurrent development?

A: Use feature flags and branch-based development.

### Q: What about version 0.x.x?

A: Before 1.0.0, the API is not considered stable. Breaking changes can occur in minor versions.

---

![Casuya](https://img.shields.io/badge/Casuya_©2024-Versioning_Policy-00D4FF?style=for-the-badge&labelColor=1a1a25&color=00D4FF)
