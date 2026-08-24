# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do not** create a public issue
2. Send an email to: security@casuya.co.tz
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

### Response Timeline

- **Initial response**: Within 48 hours
- **Investigation**: Within 7 days
- **Resolution**: As soon as feasible, based on severity

## Security Best Practices

### Exam Security

- Copy protection rules prevent right-click and copy-paste during exams
- Proctoring events track tab switches and suspicious activity
- Attempt limits prevent brute-force retaking
- Security rules are configurable and extensible

### Data Protection

- No authentication data stored (delegated to casuya-platform)
- No user management (delegated to casuya-platform)
- No synchronization (delegated to casuya-bridge)

### Verification

- Certificates include unique verification codes
- Results are immutable once finalized
- Grading operations are logged with timestamps

## Dependencies

Dependencies are monitored for vulnerabilities. Run `npm audit` regularly to check for known issues.
