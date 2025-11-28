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
```bash
pnpm changeset                  # Create a changeset for versioning
pnpm version-packages           # Update versions based on changesets
pnpm release                    # Build and publish to npm
```

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
- `StripeProvider.vue`: Root component that loads Stripe.js and provides Stripe instance via Vue's provide/inject
- `StripeElements.vue`: Creates Stripe Elements instance and provides it to child components
- Uses `stripeInjectionKey` and `stripeElementsInjectionKey` for type-safe injection

**Component Hierarchy:**
```
StripeProvider (loads Stripe.js)
  └─ StripeElements (creates Elements instance)
      ├─ StripePaymentElement
      ├─ StripeCardElement
      ├─ StripeExpressCheckoutElement
      └─ Other element components
```

**Core Patterns:**

1. **Injection Keys** (`utils/injection-keys.ts`):
   - Type-safe provide/inject using InjectionKey
   - `stripeInjectionKey`: Provides Stripe instance
   - `stripeElementsInjectionKey`: Provides StripeElements instance

2. **Composables** (`composables/`):
   - `useStripe()`: Access Stripe instance (must be within StripeProvider)
   - `useStripeElements()`: Access Elements instance (must be within StripeElements)
   - `usePaymentIntent()`: Payment confirmation helpers
   - `useSetupIntent()`: Setup intent confirmation helpers
   - `useStripeCheckout()`: Checkout session helpers
   - All composables throw `StripeProviderError` if used outside proper context

3. **Components** (`components/`):
   - Each Stripe element has a corresponding Vue component
   - Components emit `ready` and `change` events
   - Components use element factory pattern for element creation
   - Modern elements: StripePaymentElement, StripeExpressCheckoutElement, StripeLinkAuthenticationElement, StripeAddressElement
   - Legacy elements: StripeCardElement, StripeCardNumberElement, StripeCardExpiryElement, StripeCardCvcElement
   - Checkout: StripeCheckout for embedded checkout sessions

4. **Element Factory** (`utils/element-factory.ts`):
   - Centralized logic for creating and mounting Stripe elements
   - Handles element lifecycle and event binding

5. **Plugin** (`plugin.ts`):
   - `createVueStripe()`: Alternative to StripeProvider component for app-wide Stripe configuration
   - Provides global stripe config and lazy-loaded stripe instance via `app.provide()`
   - Useful for SSR scenarios or when you want app-level configuration

### Build Configuration

**Vite Build** (`packages/vue-stripe/vite.config.ts`):
- Outputs three formats: ES modules (`dist/es/`), CommonJS (`dist/cjs/`), UMD (`dist/umd/`)
- External dependencies: `vue`, `vue-demi`, `@stripe/stripe-js`
- Type declarations via `vite-plugin-dts` → `dist/types/`
- Uses `@` alias for `src/` directory

**Turborepo** (`turbo.json`):
- Build task depends on `^build` (builds dependencies first)
- Test task depends on `build` (requires built library)
- Caches build outputs in `dist/**`

### Type System

**Type Exports** (`src/types/index.ts`):
- Re-exports all Stripe.js types for convenience
- Adds Vue-specific interfaces: `VueStripeOptions`, `VueStripeElement`
- Component props: `StripeProviderProps`, `StripeElementsProps`
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
    throw new StripeProviderError('useStripe must be called within StripeProvider')
  }
  ```

### Async Stripe Loading
- Stripe.js loads asynchronously via `loadStripe()`
- Components expose `loading` state
- Handle null stripe/elements during loading phase

### Changesets Workflow
- Use `pnpm changeset` to create version bumps
- Changesets are linked: all `@vue-stripe/*` packages version together
- `playground` and `docs` apps are ignored from publishing

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

### Testing Changes in Playground
```bash
pnpm dev                        # Starts both playground and docs
# Or just playground:
cd apps/playground && pnpm dev
# Make changes in packages/vue-stripe/src/
# Playground will hot-reload with library changes
```

## Component Testing & Learning

**See `docs/TESTING_GUIDE.md`** for:
- Testing progress tracker (which components are verified)
- Core patterns (Provider + Composable architecture)
- Implementation details and type compatibility notes
- Environment setup for each testing phase
- Questions to answer when verifying each component

When resuming component testing across sessions, always check `docs/TESTING_GUIDE.md` first for current progress and context.
