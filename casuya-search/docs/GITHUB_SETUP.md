# GitHub Repository Setup Guide

This document describes the automated GitHub metadata filling for the casuya-search repository.

## Automated Metadata

The repository has automated workflows to populate GitHub metadata:

### Description

```
Educational content search and discovery system for the Casuya platform. Full-text search, ranking algorithms, autocomplete, filtering, recommendations, caching, and analytics.
```

### Website

```
https://casuya.co.tz
```

### Topics

- search
- education
- full-text-search
- lunr
- typescript
- ranking
- recommendations
- autocomplete
- caching
- analytics
- educational-content

## Manual Update Script

To manually update GitHub repository metadata:

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_github_token

# Run the update script
npm run update:github
```

## GitHub Actions Workflow

The `.github/workflows/update-metadata.yml` workflow automatically updates repository metadata when:

- Code is pushed to the main branch
- Workflow is manually triggered

## Repository Features Enabled

- **Issues**: Enabled for bug tracking and feature requests
- **Projects**: Enabled for project management
- **Wiki**: Disabled (documentation is in the repository)
- **Downloads**: Enabled for release assets

## Social Preview

A placeholder social preview image is included at `.github/social-preview.png`. Replace this with:

- A 1280x640px PNG image
- Your project logo and tagline
- Consistent branding with Casuya platform

## Verification

After setup, verify the repository metadata at:
<https://github.com/casuya-co-tz/casuya-search>

The repository should show:

- ✓ Description populated
- ✓ Website link
- ✓ Topics displayed
- ✓ Social preview image
