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