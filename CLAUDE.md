# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue Stripe Monorepo - A universal Vue.js library for Stripe Checkout and Elements supporting both Vue 2 and Vue 3 through `vue-demi`.

**Key Technologies:**
- **vue-demi**: Provides Vue 2/3 compatibility - all components and composables use `vue-demi` imports
- **pnpm**: Package manager with workspace support
- **Turborepo**: Monorepo build orchestration and caching
- **Vite**: Build tool and development server
- **Vitest**: Testing framework with jsdom environment
- **TypeScript**: Strict typing throughout

## Development Commands

### Setup
```bash
pnpm install                    # Install all dependencies
```

### Development
```bash
pnpm dev                        # Start all apps (docs + playground) in parallel
pnpm playground:dev             # Start playground only (for testing components)
pnpm docs:dev                   # Start documentation site only
```

### Building
```bash
pnpm build                      # Build all packages (uses Turborepo)
pnpm vue-stripe:build           # Build main library only
pnpm build:watch                # Watch mode for library development
```

### Testing
```bash
# All packages
pnpm test                       # Run all tests
pnpm test:watch                 # Run tests in watch mode

# Specific package
pnpm vue-stripe:test            # Test main library only

# Run single test file
cd packages/vue-stripe
pnpm vitest run tests/composables/useStripe.test.ts
```

### Testing Vue 2 vs Vue 3
```bash
# Switch to Vue 2 for compatibility testing
npx vue-demi-switch 2 vue2
pnpm test

# Switch back to Vue 3 (default)
npx vue-demi-switch 3
pnpm test
```

### Code Quality
```bash
pnpm lint                       # Lint all packages
pnpm lint:fix                   # Fix linting issues
pnpm typecheck                  # Type check all packages
```

### Release Management
Publishing is tag-driven via `.github/workflows/publish.yml` (no changesets):
```bash
# 1. Bump the version in packages/vue-stripe/package.json, then commit
git commit -am "chore: bump version to X.Y.Z"
# 2. Tag and push — pushing a v* tag triggers the publish workflow
git tag vX.Y.Z
git push origin vX.Y.Z
```
The workflow runs `pnpm test` + `pnpm build`, publishes `@vue-stripe/vue-stripe`
to npm, and creates a GitHub release with auto-generated notes. It can also be
run manually via `workflow_dispatch`.

## Architecture

### Monorepo Structure
```
packages/
  vue-stripe/          # Main library package (@vue-stripe/vue-stripe)
apps/
  docs/                # VitePress documentation site
  playground/          # Development/testing playground with Firebase functions backend
tools/
  eslint-config/       # Shared ESLint configuration
  typescript-config/   # Shared TypeScript configuration
```

### Library Architecture (`packages/vue-stripe/src/`)

**Provider Pattern:**
- `VueStripeProvider.vue`: Root component that loads Stripe.js and provides Stripe instance via Vue's provide/inject
- `VueStripeElements.vue`: Creates Stripe Elements instance and provides it to child components
- Uses `stripeInjectionKey` and `stripeElementsInjectionKey` for type-safe injection

**Component Hierarchy:**
```
VueStripeProvider (loads Stripe.js)
  └─ VueStripeElements (creates Elements instance)
      ├─ VueStripePaymentElement
      ├─ VueStripeCardElement
      ├─ VueStripeExpressCheckoutElement
      └─ Other element components
```

**Core Patterns:**

1. **Injection Keys** (`utils/injection-keys.ts`):
   - Type-safe provide/inject using InjectionKey
   - `stripeInjectionKey`: Provides Stripe instance
   - `stripeElementsInjectionKey`: Provides VueStripeElements instance

2. **Composables** (`composables/`):
   - `useStripe()`: Access Stripe instance (must be within VueStripeProvider)
   - `useStripeElements()`: Access Elements instance (must be within VueStripeElements)
   - `usePaymentIntent()`: Payment confirmation helpers
   - `useSetupIntent()`: Setup intent confirmation helpers
   - `useStripeCheckout()`: Checkout session helpers
   - All composables throw `VueStripeProviderError` if used outside proper context

3. **Components** (`components/`):
   - Each Stripe element has a corresponding Vue component
   - Components emit `ready` and `change` events
   - Components use element factory pattern for element creation
   - Modern elements: StripePaymentElement, VueStripeExpressCheckoutElement, VueStripeLinkAuthenticationElement, VueStripeAddressElement
   - Legacy elements: VueStripeCardElement, VueStripeCardNumberElement, VueStripeCardExpiryElement, VueStripeCardCvcElement
   - Checkout: StripeCheckout for embedded checkout sessions

4. **Element Factory** (`utils/element-factory.ts`):
   - Centralized logic for creating and mounting Stripe elements
   - Handles element lifecycle and event binding

5. **Plugin** (`plugin.ts`):
   - `createVueStripe()`: Alternative to VueStripeProvider component for app-wide Stripe configuration
   - Provides global stripe config and lazy-loaded stripe instance via `app.provide()`
   - Useful for SSR scenarios or when you want app-level configuration

### Build Configuration

**Vite Build** (`packages/vue-stripe/vite.config.ts`):
- Outputs three formats: ES modules (`dist/es/`), CommonJS (`dist/cjs/`), UMD (`dist/umd/`)
- External dependencies: `vue-demi`, `@stripe/stripe-js` (NOT `vue` - it's aliased)
- **Critical**: `vue` is aliased to `vue-demi` so compiled SFC templates use vue-demi - this is essential for Vue 2 compatibility
- Type declarations via `vite-plugin-dts` → `dist/types/`
- Uses `@` alias for `src/` directory

**Turborepo** (`turbo.json`):
- Build task depends on `^build` (builds dependencies first)
- Test task depends on `build` (requires built library)
- Lint/typecheck tasks depend on `^build`
- Caches build outputs in `dist/**`

### Type System

**Type Exports** (`src/types/index.ts`):
- Re-exports all Stripe.js types for convenience
- Adds Vue-specific interfaces: `VueStripeOptions`, `VueStripeElement`
- Component props: `VueStripeProviderProps`, `VueStripeElementsProps`
- Composable returns: `UseStripeReturn`, `UseElementsReturn`, etc.

### Testing

**Vitest Configuration** (`packages/vue-stripe/vitest.config.ts`):
- Environment: jsdom (for DOM testing)
- Globals enabled
- Setup file: `tests/setup.ts`
- Tests located in `tests/` directory (mirrors `src/` structure)

## Important Patterns

### Vue Demi Compatibility
- **Always import from `vue-demi`**, never directly from `vue`
- Use composition API style for Vue 2/3 compatibility
- Test both Vue 2 and Vue 3 when making changes to core functionality

### Provider Context Pattern
- Composables must validate context using injection keys
- Throw descriptive errors when used outside provider context
- Example:
  ```typescript
  const stripeInstance = inject(stripeInjectionKey)
  if (!stripeInstance) {
    throw new VueStripeProviderError('useStripe must be called within VueStripeProvider')
  }
  ```

### Async Stripe Loading
- Stripe.js loads asynchronously via `loadStripe()`
- Components expose `loading` state
- Handle null stripe/elements during loading phase

### Release Workflow
- Versioning is manual: bump `packages/vue-stripe/package.json`, commit, then tag `vX.Y.Z`
- Pushing a `v*` tag triggers `.github/workflows/publish.yml` (test → build → `npm publish`)
- Only `@vue-stripe/vue-stripe` is published; `playground`, `docs`, and `backend` apps are private

## Documentation

### Documentation Structure (`apps/docs/`)

```
apps/docs/
├── index.md                    # Homepage
├── guide/                      # Tutorial-style guides (progressive learning)
│   ├── index.md               # Learning path overview
│   ├── introduction.md        # What is Vue Stripe
│   ├── installation.md        # Framework-specific setup
│   ├── first-payment.md       # Step-by-step tutorial
│   ├── architecture.md        # Component hierarchy explained
│   └── [feature].md           # Feature guides (payment-element, checkout, etc.)
├── api/                        # Reference documentation
│   ├── index.md               # API overview
│   ├── components/            # Component API (props, events, slots)
│   ├── composables/           # Composable API (return values, options)
│   ├── plugin.md              # Vue plugin API
│   └── types/                 # TypeScript types
└── examples/                   # Complete code examples
```

### Documentation Types

| Type | Purpose | Location |
|------|---------|----------|
| **Guide Pages** | Tutorial-style, progressive learning, step-by-step | `guide/` |
| **API Reference** | Complete technical reference, all props/events/options | `api/` |
| **Examples** | Full working code samples | `examples/` |

### Key Documentation Patterns

- **Mermaid Diagrams**: Interactive diagrams for component hierarchies and data flow (via `vitepress-mermaid-renderer`)
- **Capability Tables**: `| Capability | Description |` format for features
- **Props/Events Tables**: Standard API documentation format
- **VitePress Containers**: `::: tip`, `::: warning`, `::: code-group`
- **See Also Links**: Cross-reference related docs at page end

See [`docs/DOCUMENTATION_PATTERNS.md`](./docs/DOCUMENTATION_PATTERNS.md) for complete templates and conventions.

## Common Workflows

### Adding a New Stripe Element Component
1. Create component in `src/components/Stripe[ElementName].vue`
2. Use `element-factory.ts` for element creation
3. Inject `stripeElementsInjectionKey` for Elements instance
4. Emit `ready` and `change` events
5. Export from `src/components/index.ts`
6. Add corresponding types to `src/types/index.ts` if needed

### Adding a New Composable
1. Create in `src/composables/use[Name].ts`
2. Use provide/inject for context access
3. Return readonly refs for reactive state
4. Export return type interface in `src/types/index.ts`
5. Export from `src/composables/index.ts`
6. Add tests in `tests/composables/use[Name].test.ts`

### Working on Documentation
```bash
pnpm docs:dev                   # Start VitePress dev server
# Edit files in apps/docs/
```

**Documentation Patterns:** See [`docs/DOCUMENTATION_PATTERNS.md`](./docs/DOCUMENTATION_PATTERNS.md) for:
- Guide page structure and templates
- API reference page structure and templates
- ASCII diagram conventions
- VitePress-specific features (code groups, containers)
- Naming conventions and checklists

### Testing Changes in Playground
```bash
pnpm dev                        # Starts both playground and docs
# Or just playground:
cd apps/playground && pnpm dev
# Make changes in packages/vue-stripe/src/
# Playground will hot-reload with library changes
```

## AI Skills & Agents

This project includes specialized skills and subagent configurations for AI-assisted development.

### Skills (`.claude/skills/`)

Invoke skills directly for common workflows:

| Skill | Purpose | Usage |
|-------|---------|-------|
| `/element` | Scaffold new Stripe element component | `/element AuBankAccount --stripe-type auBankAccount` |
| `/composable` | Create new composable | `/composable paymentMethod --context provider` |
| `/element-docs` | Generate component documentation | `/element-docs FpxBank --type both` |
| `/vue2-test` | Run Vue 2 compatibility tests | `/vue2-test --scope all` |
| `/release-check` | Pre-release validation | `/release-check --version minor` |

### Subagents (`.claude/agents/`)

Specialized agents for complex multi-step tasks:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `component-scaffold` | Generate component with patterns | Creating new Stripe elements |
| `test-scaffold` | Generate comprehensive tests | After creating components/composables |
| `docs-generator` | Create API + guide documentation | Documenting new features |
| `stripe-research` | Research Stripe APIs/types | Before implementing new elements |
| `playground-example` | Create playground demos | Adding interactive examples |
| `quality-assurance` | Validate code quality | Before PRs/releases |

### Orchestrated Workflows

**New Element Complete Workflow:**
```
stripe-research → component-scaffold → test-scaffold → docs-generator → playground-example → quality-assurance
```

**Documentation Update:**
```
stripe-research → docs-generator (API) + docs-generator (Guide) → quality-assurance
```

See `.claude/agents/README.md` for detailed agent documentation and orchestration patterns.

