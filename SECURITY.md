
---

## SECURITY.md

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Yes    |
| 0.x.x   | ⚠️ Limited |
| < 0.1.0 | ❌ No     |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, email us at: **security@fyr.dev**

### What to Include

- Type of vulnerability
- Affected version
- Steps to reproduce
- Impact and severity
- Any potential fixes

### Response Timeline

| Response | Timeframe |
|----------|-----------|
| Acknowledgment | 24 hours |
| Preliminary report | 3 days |
| Fix development | Varies |
| Public disclosure | 30 days after fix |

## Security Model

### Browser Code is Untrusted

Fyr is designed with the understanding that:

- JavaScript is visible to users
- Python in browser is inspectable
- WebAssembly can be analyzed
- Network requests can be modified

### Server Code is Trusted

These must stay on the server:

- Authentication logic
- Authorization checks
- Database credentials
- API keys and secrets
- Business rules
- Payment processing

### What Fyr Protects Against

| Threat | Mitigation |
|--------|------------|
| XSS | Escaped text output |
| Expression injection | Restricted parser |
| Prototype pollution | Safe path handling |
| CSRF | Cookie security, tokens |

### What Fyr Does NOT Protect Against

| Threat | Responsibility |
|--------|----------------|
| Secrets in browser | Developer |
| Server vulnerabilities | Developer |
| Database injection | Developer |
| Business logic flaws | Developer |

## Security Best Practices

### For Fyr Users

1. **Never put secrets in browser code**
2. **Use HTTPS in production**
3. **Use HTTP-only cookies for auth**
4. **Validate all inputs on server**
5. **Implement rate limiting**
6. **Keep dependencies updated**
7. **Use Subresource Integrity for CDN**

### For Fyr Developers

1. **Review all PRs for security**
2. **Run security audits regularly**
3. **Test for common vulnerabilities**
4. **Keep dependencies updated**
5. **Minimize core dependencies**

## Responsible Disclosure

We follow responsible disclosure practices:

1. Reporter finds vulnerability
2. Reporter emails security@fyr.dev
3. We acknowledge within 24 hours
4. We investigate and fix
5. We release patch
6. Reporter is credited (if desired)

## Public Issues

**Do not** report security issues in public GitHub issues.

Use security@fyr.dev for all security concerns.