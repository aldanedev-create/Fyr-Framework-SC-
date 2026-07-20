# Contributing to Fyr

Thanks for helping improve Fyr. This project is a 0.x prototype, so contributions that improve correctness, tests, documentation, accessibility, and security are especially valuable.

## Before you start

Search existing issues before opening a new one. For a security concern, do not file a public issue; follow [SECURITY.md](SECURITY.md).

For a bug report, include:

- a minimal reproduction
- expected and actual behavior
- browser and operating-system versions
- console output or screenshots when relevant

For a feature proposal, explain the user problem and how it fits Fyr's CDN-first, lightweight design.

## Development setup

~~~bash
git clone https://github.com/fyr-framework/fyr.git
cd fyr
npm install
npm run type-check
npm run lint
npm test
npm run build
~~~

The project requires Node 20 or newer. The full build also requires a Rust toolchain and the WebAssembly target when you change the Rust workspace.

## Project structure

~~~text
src/core/       Core runtime, compiler, directives, and HTTP client
src/python/     Optional Pyodide integration
src/wasm/       Optional WebAssembly utilities
src/router/     Optional routing utilities
src/socket/     Optional WebSocket client
src/ui/         Optional UI helpers and stylesheet
rust/           Rust WebAssembly source
tests/          Vitest test suite
docs/           User documentation
scripts/        Build verification and checksum scripts
~~~

## Pull requests

1. Create a focused branch.
2. Add or update tests for behavioral changes.
3. Run type-check, lint, test, and the relevant build command.
4. Update the user-facing documentation for API changes.
5. Describe the motivation, implementation, and verification in the pull request.

Keep unrelated formatting and refactors out of a feature or fix pull request. Do not commit generated local directories such as node_modules, coverage, or Rust target output.

## Coding guidelines

- Use TypeScript for runtime changes.
- Follow the existing ESLint and formatting configuration.
- Prefer small public APIs with clear errors and documented constraints.
- Preserve browser compatibility with the project's configured build target.
- Treat templates and browser inputs as untrusted at server boundaries.

## Documentation

Update the relevant guide in docs/ and README.md when changing installation, public APIs, directive behavior, build output, or security expectations. Examples must be runnable or clearly labeled as illustrative.

## Releases

Maintainers update the version and [CHANGELOG.md](CHANGELOG.md), run the full build and test suite, publish the package, and tag the corresponding release.
