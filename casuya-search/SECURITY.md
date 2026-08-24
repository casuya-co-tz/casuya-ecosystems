# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do not** create a public issue
2. Send an email to: security@casuya.org
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

### Response Timeline

- **Initial response**: Within 48 hours
- **Investigation**: Within 7 days
- **Resolution**: As soon as feasible, based on severity

### Security Best Practices

When contributing to this project, follow these security guidelines:

- Never commit sensitive data (API keys, passwords, tokens)
- Use environment variables for configuration
- Validate and sanitize all user inputs
- Keep dependencies updated
- Follow the principle of least privilege
- Implement proper error handling without exposing sensitive information

### Dependency Security

We regularly audit and update dependencies. To check for vulnerabilities:

```bash
npm audit
npm audit fix
```

## Security Features

This project includes:

- Input validation and sanitization
- Type safety with TypeScript
- No hardcoded credentials
- Secure default configurations
- Regular dependency updates

## Disclosure Policy

We follow responsible disclosure:

1. Acknowledge receipt of report
2. Investigate and validate the vulnerability
3. Develop and test a fix
4. Coordinate release with reporter
5. Public disclosure after fix is deployed

## Acknowledgments

We thank security researchers who help us keep Casuya Search safe.
