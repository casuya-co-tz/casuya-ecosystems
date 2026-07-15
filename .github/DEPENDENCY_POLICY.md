# Dependency Policy

This document defines the policy for managing dependencies in the Casuya ecosystem.

## 📋 Table of Contents

- [Overview](#overview)
- [Dependency Management](#dependency-management)
- [Security Requirements](#security-requirements)
- [Version Management](#version-management)
- [Audit Process](#audit-process)
- [Emergency Updates](#emergency-updates)

---

## Overview

Dependencies are critical components that our software relies on. Proper management ensures security, stability, and maintainability.

### Principles

1. **Security First**: Security vulnerabilities are addressed immediately
2. **Minimal Dependencies**: Only add dependencies that provide significant value
3. **Regular Updates**: Keep dependencies up to date
4. **Audit Regularly**: Regular security audits
5. **Document Changes**: Document all dependency changes

---

## Dependency Management

### Adding Dependencies

Before adding a new dependency, consider:

1. **Necessity**: Is this dependency truly needed?
2. **Alternatives**: Can we implement this ourselves?
3. **Maintenance**: Is it actively maintained?
4. **Security**: Does it have a good security track record?
5. **Bundle Size**: How much does it add to bundle size?
6. **License**: Is it compatible with our Apache 2.0 license?

### Approval Process

| Dependency Type          | Approval Required     |
| ------------------------ | --------------------- |
| Core dependencies        | Technical Lead        |
| Development dependencies | Repository Maintainer |
| New major version        | Technical Lead        |
| Security patch           | Automatic             |

### Documentation

All dependencies must be documented:

```markdown
## Dependencies

### Core Dependencies

- `react`: UI framework (18.x)
- `typescript`: Type safety (5.x)

### Development Dependencies

- `vitest`: Testing framework
- `eslint`: Code linting
```

---

## Security Requirements

### Vulnerability Scanning

- **Frequency**: Daily automated scans
- **Tools**: Snyk, npm audit, GitHub Dependabot
- **Reporting**: All vulnerabilities reported to security team

### Response Times

| Severity | Response Time | Resolution Time |
| -------- | ------------- | --------------- |
| Critical | 24 hours      | 48 hours        |
| High     | 48 hours      | 1 week          |
| Medium   | 1 week        | 2 weeks         |
| Low      | 2 weeks       | 1 month         |

### Security Patches

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit fix

# Fix with breaking changes (requires review)
pnpm audit fix --force
```

---

## Version Management

### Semantic Versioning

All dependencies should follow semantic versioning:

- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

### Pinning Versions

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "~5.3.0"
  }
}
```

**Rules**:

- Use `^` for minor version updates (safe updates)
- Use `~` for patch version updates (bug fixes only)
- Pin exact versions for critical dependencies

### Lock Files

- Always commit lock files (`pnpm-lock.yaml`, `package-lock.json`)
- Never modify lock files manually
- Regenerate lock files when updating dependencies

---

## Audit Process

### Regular Audits

| Audit Type         | Frequency | Responsibility        |
| ------------------ | --------- | --------------------- |
| Security scan      | Daily     | Automated             |
| Dependency review  | Weekly    | Repository Maintainer |
| License compliance | Monthly   | Technical Lead        |
| Bundle analysis    | Monthly   | Repository Maintainer |

### Audit Checklist

- [ ] Check for security vulnerabilities
- [ ] Review license compatibility
- [ ] Assess bundle size impact
- [ ] Verify maintenance status
- [ ] Test compatibility with existing code
- [ ] Document changes

### Tools

| Tool                | Purpose                         |
| ------------------- | ------------------------------- |
| `pnpm audit`        | Security vulnerability scanning |
| `license-checker`   | License compliance checking     |
| `bundlephobia`      | Bundle size analysis            |
| `npm-check-updates` | Dependency updates              |

---

## Emergency Updates

### Critical Vulnerabilities

For critical security vulnerabilities:

1. **Immediate Assessment**: Evaluate impact and severity
2. **Emergency Patch**: Create emergency update
3. **Fast-Track Review**: Expedited code review
4. **Immediate Deployment**: Deploy to production
5. **Post-Mortem**: Document lessons learned

### Process

```bash
# 1. Create emergency branch
git checkout -b emergency/security-patch

# 2. Update vulnerable dependency
pnpm update vulnerable-package@latest

# 3. Run tests
pnpm test

# 4. Create PR with emergency label
gh pr create --title "EMERGENCY: Security patch for vulnerable-package"

# 5. Get expedited review
# 6. Merge and deploy immediately
```

### Communication

- Notify security team immediately
- Document the vulnerability and fix
- Update security advisories
- Communicate to users if necessary

---

## Best Practices

### DO

- ✅ Keep dependencies up to date
- ✅ Run security audits regularly
- ✅ Document all changes
- ✅ Test thoroughly after updates
- ✅ Use lock files
- ✅ Review pull requests for dependency changes

### DON'T

- ❌ Add unnecessary dependencies
- ❌ Ignore security warnings
- ❌ Manually edit lock files
- ❌ Skip testing after updates
- ❌ Use deprecated packages
- ❌ Commit sensitive dependencies

---

## Monitoring

### Automated Monitoring

- Dependabot for automatic updates
- Snyk for security monitoring
- GitHub Alerts for vulnerability notifications

### Manual Review

- Weekly dependency review meetings
- Monthly security audit reviews
- Quarterly dependency policy reviews

---

## Appendix

### Dependency Sources

| Source   | Usage                          |
| -------- | ------------------------------ |
| npm      | JavaScript/TypeScript packages |
| PyPI     | Python packages                |
| GitHub   | Direct GitHub dependencies     |
| Internal | Casuya internal packages       |

### License Compatibility

| License      | Allowed         | Notes           |
| ------------ | --------------- | --------------- |
| MIT          | ✅ Yes          | Permissive      |
| Apache 2.0   | ✅ Yes          | Compatible      |
| BSD 2-Clause | ✅ Yes          | Permissive      |
| BSD 3-Clause | ✅ Yes          | Permissive      |
| GPL 2.0      | ❌ No           | Copyleft        |
| GPL 3.0      | ❌ No           | Copyleft        |
| LGPL         | ⚠️ Case by case | Review required |

---

![Casuya](https://img.shields.io/badge/Casuya_©2024-Dependency_Policy-00D4FF?style=for-the-badge&labelColor=1a1a25&color=00D4FF)
