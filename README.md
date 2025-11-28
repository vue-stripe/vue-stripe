# Vue Stripe Monorepo

This is the official monorepo for Vue Stripe - a universal Vue.js library for Stripe Checkout and Elements supporting both Vue 2 and Vue 3.

## 📦 Packages

- **[@vue-stripe/vue-stripe](./packages/vue-stripe)** - Main library package
- **[@vue-stripe/docs](./apps/docs)** - VitePress documentation
- **[@vue-stripe/playground](./apps/playground)** - Development playground

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev
```

### Available Scripts

```bash
# Development
pnpm dev                    # Start all apps in development mode
pnpm playground:dev         # Start playground only
pnpm docs:dev              # Start documentation only

# Building
pnpm build                 # Build all packages
pnpm vue-stripe:build      # Build main library only

# Testing
pnpm test                  # Run all tests
pnpm vue-stripe:test       # Test main library only

# Linting
pnpm lint                  # Lint all packages
pnpm lint:fix              # Fix linting issues
```

## 🏗️ Project Structure

```
vue-stripe/
├── apps/
│   ├── docs/              # VitePress documentation
│   └── playground/        # Development playground
├── packages/
│   ├── vue-stripe/        # Main library
│   └── shared/            # Shared utilities
├── tools/
│   ├── eslint-config/     # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript config
└── turbo.json             # Turborepo configuration
```

## 🔧 Development Workflow

### Making Changes

1. **Work on the library**: Edit files in `packages/vue-stripe/src/`
2. **Test changes**: Use the playground app at `apps/playground/`
3. **Update docs**: Modify documentation in `apps/docs/`
4. **Run tests**: Execute `pnpm test` to ensure everything works

### Building

The project uses Turborepo for efficient builds:

```bash
# Build everything with dependency resolution
pnpm build

# Build specific package
pnpm vue-stripe:build
```

### Testing Vue 2 vs Vue 3

The library uses `vue-demi` for compatibility. Test both versions:

```bash
# Switch to Vue 2 for testing
npx vue-demi-switch 2 vue2
pnpm test

# Switch back to Vue 3
npx vue-demi-switch 3
pnpm test
```

## 📚 Documentation

- **Local Development**: `pnpm docs:dev`
- **Production**: [https://vue-stripe.github.io/vue-stripe/](https://vue-stripe.github.io/vue-stripe/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## 📄 License

[MIT](LICENSE) License © 2024 Vue Stripe Contributors