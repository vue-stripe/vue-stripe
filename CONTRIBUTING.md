# Contributing to Vue Stripe

Thank you for your interest in contributing to Vue Stripe! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to help us maintain a welcoming community.

## Getting Started

### Prerequisites

- Node.js 22+ (24 recommended, see `.nvmrc`)
- pnpm 12+ (`corepack enable`)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vue-stripe.git
   cd vue-stripe
   ```
3. Install dependencies (this also installs the Husky git hooks):
   ```bash
   pnpm install
   ```
   If your clone predates Husky and has an old `yorkie` hook, remove it first: `rm .git/hooks/pre-commit`.
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

CI fails on any ESLint warning, unformatted file or type error in any workspace.

```bash
pnpm lint           # eslint --max-warnings 0 in every workspace
pnpm lint:fix
pnpm format:check   # prettier --check (pnpm format to fix)
pnpm typecheck      # vue-tsc / tsc --noEmit in every workspace
```

Git hooks (Husky): `pre-commit` runs lint-staged (ESLint + Prettier on staged files) and `commit-msg` runs commitlint.

### Commit messages

Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`, with an optional scope (`feat(checkout): ...`) and `!` for breaking changes (`feat!: ...`). PRs are squash-merged, so the PR title becomes the commit on `main` and the release note; CI checks both the commits (`pnpm lint:commits`) and the title.

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
5. Ensure all checks pass:
   ```bash
   pnpm lint && pnpm format:check && pnpm typecheck && pnpm test
   ```
6. Submit your PR with:
   - Clear title and description
   - Reference to related issue(s)
   - Screenshots/videos for UI changes

## Coding Standards

### General Guidelines

- Write TypeScript with strict typing
- Use Composition API for Vue components
- Follow existing code patterns and conventions
- Keep components focused and single-purpose
- Write Conventional Commit messages (see above)
- No emoji in code, docs, UI copy or commit messages

### Component Guidelines

- Import from `vue-demi` for Vue compatibility
- Use provide/inject with typed injection keys
- Emit `ready` and `change` events consistently
- Handle loading and error states appropriately

### Documentation

- Update relevant docs when changing APIs
- Include code examples for new features
- Keep examples simple and focused

## Releases

Releases are cut manually by a maintainer — you do **not** need to bump versions or add changelog entries in your PR. After PRs are merged, a maintainer bumps `packages/vue-stripe/package.json`, tags `vX.Y.Z`, and pushes the tag; the `publish.yml` workflow then publishes to npm and creates a GitHub Release with notes generated from the merged PRs. Write clear PR titles — they become the release notes.

## Questions?

- Open a [GitHub Discussion](https://github.com/vue-stripe/vue-stripe/discussions)
- Check the [Documentation](https://vue-stripe.github.io/vue-stripe/)

Thank you for contributing!
