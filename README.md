# Fyr

**Fyr** (pronounced "fire") is a CDN-first web framework that turns ordinary HTML into reactive applications. No build tools, no package managers, no compilation - just a script tag and HTML.

## Quick Start

Add one script tag to your HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <script defer src="https://cdn.jsdelivr.net/npm/fyr-framework@0.1.0/dist/fyr.min.js"></script>
</head>
<body>
    <div fyr-controller="counter">
        <p fyr-text="count"></p>
        <button fyr-click="increase()">+1</button>
    </div>

    <script>
        Fyr.controller("counter", {
            state: { count: 0 },
            methods: {
                increase() { this.count++; }
            }
        });
    </script>
</body>
</html>
```
Features
Zero Setup - No npm, Node.js, or build tools required

Reactive State - UI updates automatically when data changes

HTML Directives - fyr-text, fyr-click, fyr-model, fyr-for, and more

HTTP Client - Simple Fyr.http.get() and Fyr.http.post()

Server Actions - Call backend operations with Fyr.action()

Browser Python - Optional Pyodide integration for Python in the browser

Rust WebAssembly - Load and run precompiled WASM modules

Backend Agnostic - Works with Flask, FastAPI, Django, Node.js, PHP, or any JSON API

Lightweight - Core under 35KB, optional plugins load only when needed

Open Source - MIT license

Installation
CDN (Recommended)
html
<script defer src="https://cdn.jsdelivr.net/npm/fyr-framework@0.1.0/dist/fyr.min.js"></script>
Self-Hosted
Download the dist/ folder and serve it yourself:

html
<script defer src="/fyr/fyr.min.js"></script>
Documentation
Getting Started

API Reference

Examples

Contributing

Examples
Check out the examples/ directory:

counter/ - Simple counter demo

production-dashboard/ - Full-stack FastAPI + SQLite application

Development
bash
# Clone the repository
git clone https://github.com/fyr-framework/fyr.git

# Install dependencies
npm install

# Build the framework
npm run build

# Run tests
npm run test

# Run the demo application
cd examples/production-dashboard
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
Requirements
Modern browser (Chrome, Firefox, Safari, Edge)

No server-side requirements (static hosting works)

License
MIT License - see LICENSE for details.

Contributing
We welcome contributions! Please see CONTRIBUTING.md for guidelines.

Security
Report security vulnerabilities to security@fyr.dev - see SECURITY.md.

text

---

## LICENSE

```markdown
MIT License

Copyright (c) 2026 Fyr Framework Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
CHANGELOG.md
markdown
# Changelog

All notable changes to Fyr will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Core reactive engine with Proxy-based state
- HTML directives: fyr-text, fyr-click, fyr-model, fyr-show, fyr-for
- HTTP client with fetch API
- Server actions support
- Controller system with methods and lifecycle hooks
- Toast notification system
- Python plugin (Pyodide integration)
- WASM plugin (WebAssembly loader)
- Production dashboard example
- MIT license
- Contribution guidelines

### Changed
- Nothing yet

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Initial security model established

## [0.1.0] - 2026-07-19

### Added
- First prototype release
- Working reactive framework
- Production dashboard demo
- Browser Python support
- Rust WebAssembly support
- Backend examples

### Notes
- Expression evaluator uses Function() - will be replaced with safe parser in 0.2.0
- Core under 35KB compressed
- Full test suite included
CONTRIBUTING.md
markdown
# Contributing to Fyr

Thank you for your interest in contributing to Fyr! We welcome contributions from everyone.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/fyr-framework/fyr/issues)
2. If not, create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and version
   - Any relevant code or screenshots

### Suggesting Features

1. Check if the feature has been requested before
2. Open an issue with:
   - Clear description of the feature
   - Use case and motivation
   - Any implementation ideas

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Update documentation if needed
6. Commit with descriptive message
7. Push to your fork
8. Open a Pull Request

### Pull Request Guidelines

- One feature or fix per PR
- Include tests for new features
- Update documentation
- Keep code consistent with project style
- PR description should explain the change

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/fyr.git

# Install dependencies
npm install

# Build the framework
npm run build

# Run tests
npm run test

# Run type checking
npm run type-check

# Lint code
npm run lint
Project Structure
text
fyr/
├── packages/
│   ├── core/          # Main framework
│   ├── python/        # Pyodide plugin
│   ├── wasm/          # WASM plugin
│   └── router/        # Router plugin (future)
├── examples/          # Example applications
├── rust-engine/       # Rust WASM source
├── dist/              # Built files
├── tests/             # Test files
└── docs/              # Documentation
Coding Standards
Use TypeScript

Follow ESLint configuration

Write tests for new features

Use meaningful variable names

Add JSDoc comments for public APIs

Keep core lightweight (< 35KB)

Testing
Run the test suite:

bash
npm test
Run specific tests:

bash
npm test -- core/reactivity
Documentation
Update documentation when:

Adding new features

Changing existing APIs

Fixing bugs that affect usage

Release Process
Update version in package.json

Update CHANGELOG.md

Create release PR

Merge after review

Tag release: git tag vX.Y.Z

Publish to npm: npm publish

Deploy documentation

Questions?
Open an issue or reach out to maintainers.

Thank you for contributing!

text

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
ROADMAP.md
markdown
# Fyr Roadmap

## Version 0.1.0 - Prototype ✅

**Completed:**
- Core reactive engine (Proxy-based)
- HTML directives (text, click, model, show, for)
- HTTP client
- Server actions
- Controller system
- Toast notifications
- Python plugin (Pyodide)
- WASM plugin
- Production dashboard example
- Basic test suite

---

## Version 0.2.0 - Hardening

**Goals:**
- Replace Function() with safe expression parser
- Add computed values
- Add watchers
- Improve error messages
- Memory leak fixes
- Better TypeScript types

**Target:** September 2026

---

## Version 0.3.0 - Components

**Goals:**
- Reusable components
- Props system
- Slots
- Component events
- Lifecycle hooks
- Scoped styling

**Target:** October 2026

---

## Version 0.4.0 - Router

**Goals:**
- Hash routing
- History routing
- Route parameters
- Route guards
- Lazy loading
- Not-found routes
- Navigation utilities

**Target:** November 2026

---

## Version 0.5.0 - Production Features

**Goals:**
- CSRF protection
- Request interceptors
- File uploads
- Better form handling
- WebSocket client
- Service worker caching
- Offline support

**Target:** December 2026

---

## Version 0.6.0 - Ecosystem

**Goals:**
- npm package
- PyPI package
- Documentation site
- More examples
- Third-party plugins
- Migration guides

**Target:** January 2027

---

## Version 1.0.0 - Stable

**Goals:**
- Stable API
- Production-ready
- Security audit completed
- Performance benchmarks
- Full documentation
- Backward compatibility guarantee

**Target:** March 2027

---

## Future Ideas

### Post 1.0

- Mobile app support (native wrappers)
- Server-side rendering
- Desktop app support (Tauri)
- Visual builder
- Component marketplace
- IDE extensions
- Dev tools
- Performance profiling

### Community

- Website
- Documentation portal
- Community forum
- Blog
- User showcase

---

## Timeline

| Phase | Dates | Status |
|-------|-------|--------|
| 0.1.0 Prototype | Jul 2026 | ✅ Complete |
| 0.2.0 Hardening | Sep 2026 | 🔄 In Progress |
| 0.3.0 Components | Oct 2026 | 📋 Planned |
| 0.4.0 Router | Nov 2026 | 📋 Planned |
| 0.5.0 Production | Dec 2026 | 📋 Planned |
| 0.6.0 Ecosystem | Jan 2027 | 📋 Planned |
| 1.0.0 Stable | Mar 2027 | 📋 Planned |

---

## Contributing

We need help with all areas:

- Core development
- Documentation
- Examples
- Testing
- Security review
- Community management
- Design

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help.
