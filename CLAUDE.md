# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Vue Stripe (`@vue-stripe/vue-stripe`) — a Vue library wrapping Stripe.js Elements and Checkout via components and composables. Vue 3-first, but compiled for **Vue 2 + 3 compatibility** through `vue-demi`. This is a pnpm + Turborepo monorepo.

## Commands

Run from the repo root (Turborepo orchestrates per-package tasks):

```bash
pnpm install              # bootstrap workspace
pnpm dev                  # run all apps (docs + playground + backend) in parallel
pnpm playground:dev       # playground only (best for testing components)
pnpm docs:dev             # VitePress docs only
pnpm build                # build everything
pnpm vue-stripe:build     # build the library only
pnpm test                 # all tests (depends on build)
pnpm vue-stripe:test      # library tests only
pnpm lint                 # eslint
pnpm lint:fix
pnpm typecheck            # vue-tsc --noEmit across packages
```

Library-scoped work — `cd packages/vue-stripe`, then:

```bash
pnpm test                            # vitest run
pnpm test:watch                      # vitest watch
pnpm test:coverage                   # enforces ratchet thresholds (see vitest.config.ts)
pnpm vitest run tests/components/VueStripePaymentElement.test.ts   # single test file
pnpm vitest run -t "name of test"    # single test by name
pnpm build                           # vite build + tsc (emits dist/{es,cjs,umd,types})
```

Before submitting changes, run `pnpm lint && pnpm typecheck && pnpm test`.

### Releasing

Releases are cut **manually** (the library is published from a git tag — there is no Changesets/automated-version pipeline):

1. Bump `version` in `packages/vue-stripe/package.json`.
2. Commit (`chore: bump version to X.Y.Z`) and push to `main`.
3. Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. The `publish.yml` workflow runs on the `v*` tag → `npm publish` + auto-generated GitHub Release notes (from merged PRs).

Use semver: additive/backwards-compatible work is a **minor** bump. Release notes live on [GitHub Releases](https://github.com/vue-stripe/vue-stripe/releases), not a hand-maintained changelog.

## Architecture

The library lives in `packages/vue-stripe/src`. Everything else (`apps/docs`, `apps/playground`, `apps/backend`, `tools/*`) supports it.

### Provide/inject context chain

State flows through three typed injection keys defined in `src/utils/injection-keys.ts` (`Symbol`-based, never string keys):

1. **`VueStripeProvider`** loads Stripe via `loadStripe`, then `provide`s `stripeInjectionKey` (the `Stripe` instance + loading/error refs) and `stripeConfigInjectionKey`. It renders loading/error/default slots and only mounts children once Stripe is ready.
2. **`VueStripeElements`** creates a `StripeElements` instance and `provide`s `stripeElementsInjectionKey`.
3. **Element components** and **composables** `inject` these keys. Injection failure throws a typed error (`VueStripeElementsError` / `VueStripeProviderError`) telling the user which wrapper is missing.

Composables (`useStripe`, `useStripeElements`, `usePaymentIntent`, `useSetupIntent`, `useStripeCheckout`) are thin `inject`-and-wrap functions. Note: `usePaymentIntent`/`useSetupIntent` automatically call `elements.submit()` before confirming (required by Stripe's Payment Element flow) unless `skipSubmit: true` is passed.

### Two element-component patterns — keep them consistent

- **Factory** (`src/utils/element-factory.ts`): `createStripeElement({ elementType, componentName })` builds simple elements (split-card number/expiry/cvc, etc.) with a render function. Use this for elements that only need the standard `ready`/`change`/`focus`/`blur`/`escape` lifecycle.
- **Standalone `.vue` SFC** (e.g. `VueStripePaymentElement.vue`): used when an element needs extra events or markup (Payment Element adds `loaderstart`/`loaderstop`/`loaderror`).

Both follow the same lifecycle contract: create the element from the injected `elements` instance, attach **named** event handlers (so they can be detached), `mount`, `watch(props.options)` to call `element.update()`, and on `onUnmounted` detach every handler and `destroy()`. `defineExpose`/`expose` exposes `{ element, loading, error, focus, blur, clear }` for parent access. When adding or changing an element, mirror this exact pattern.

### Vue 2/3 compatibility (vue-demi)

- All Vue imports in source come from `vue-demi`, never `vue`.
- `vite.config.ts` aliases `vue` → `vue-demi` and externalizes `vue-demi` + `@stripe/stripe-js`. Do not externalize `vue` directly — the alias is what makes compiled SFC templates Vue-2 safe.
- Build emits ES, CJS, and UMD formats plus `.d.ts` types.

### Tests

Vitest + `@vue/test-utils` in a `jsdom` environment; setup in `tests/setup.ts`. Coverage uses **ratchet thresholds** in `vitest.config.ts` — set just below current levels to prevent regressions; raise them as coverage improves rather than lowering.

`tests/docs-contract.test.ts` is a guard test: it extracts each component's real `defineEmits` surface and fails if `apps/docs/api/components/*.md` doesn't document those events. **When you add/remove a component event, update the matching docs page** or this test fails (set `DOCS_CONTRACT_STRICT=0` only to temporarily downgrade to warnings).

## Conventions

- Public API surface is `src/index.ts` — new components/composables/types must be exported there (and components also via `src/components/index.ts`). `tests/public-exports.test.ts` guards this.
- Support backwards-compatible prop aliases where the existing code does (e.g. `VueStripeProvider` accepts both `publishableKey` and `stripeKey`).
- Errors use the typed classes in `src/utils/errors.ts`; prefix console output with `[Vue Stripe]`.
- `node >=20`, `pnpm >=8`. Husky + lint-staged run eslint/prettier on commit.
