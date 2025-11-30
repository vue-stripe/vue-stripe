# Contributing to Vue Stripe

Thank you for your interest in contributing to Vue Stripe! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to help us maintain a welcoming community.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vue-stripe.git
   cd vue-stripe
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Monorepo Structure

This project uses pnpm workspaces and Turborepo:

```
vue-stripe/
├── packages/
│   └── vue-stripe/        # Main library (@vue-stripe/vue-stripe)
├── apps/
│   ├── docs/              # VitePress documentation
│   └── playground/        # Development playground
└── tools/
    ├── eslint-config/     # Shared ESLint config
    └── typescript-config/ # Shared TypeScript config
```

## Development Workflow

### Running the Development Environment

```bash
# Start all apps (docs + playground)
pnpm dev

# Start playground only (for testing components)
pnpm playground:dev

# Start documentation site only
pnpm docs:dev
```

### Building

```bash
# Build all packages
pnpm build

# Build main library only
pnpm vue-stripe:build

# Watch mode for library development
pnpm build:watch
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Test main library only
pnpm vue-stripe:test
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check all packages
pnpm typecheck
```

## How to Contribute

### Reporting Bugs

1. Search existing [issues](https://github.com/vue-stripe/vue-stripe/issues) to avoid duplicates
2. Create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Vue version, browser, etc.)
   - Minimal reproduction if possible

### Suggesting Features

1. Check existing issues and discussions for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case and motivation
   - Proposed API or implementation (if applicable)

### Submitting Pull Requests

1. Ensure your PR addresses an existing issue or create one first
2. Follow the coding standards (run `pnpm lint`)
3. Write/update tests for your changes
4. Update documentation if needed
5. Create a changeset for version tracking:
   ```bash
   pnpm changeset
   ```
6. Ensure all checks pass:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```
7. Submit your PR with:
   - Clear title and description
   - Reference to related issue(s)
   - Screenshots/videos for UI changes

## Coding Standards

### General Guidelines

- Write TypeScript with strict typing
- Use Composition API for Vue components
- Follow existing code patterns and conventions
- Keep components focused and single-purpose
- Write meaningful commit messages

### Component Guidelines

- Import from `vue-demi` for Vue compatibility
- Use provide/inject with typed injection keys
- Emit `ready` and `change` events consistently
- Handle loading and error states appropriately

### Documentation

- Update relevant docs when changing APIs
- Include code examples for new features
- Keep examples simple and focused

## Changesets

We use [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Create a changeset after making changes
pnpm changeset

# Follow the prompts to describe your changes
```

## Questions?

- Open a [GitHub Discussion](https://github.com/vue-stripe/vue-stripe/discussions)
- Check the [Documentation](https://vue-stripe.github.io/vue-stripe/)

Thank you for contributing!
