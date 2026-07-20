# Changelog

All notable changes to Fyr will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Nothing yet.

## [0.1.2] - 2026-07-20

### Added
- Complete working implementations for every example directory, including a Flask mini-classroom application.
- API reference, example guide, and classroom deployment guidance.

### Fixed
- Computed values now update when their reactive dependencies change.

## [0.1.1] - 2026-07-20

### Added
- Complete README and user documentation for the current 0.1.0 runtime
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
