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
pnpm lint                 # eslint --max-warnings 0 in every workspace (one root eslint.config.js)
pnpm format:check         # prettier --check in every workspace + root files (pnpm format to fix)
pnpm typecheck            # vue-tsc / tsc --noEmit in every workspace
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

Before submitting changes, run `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`. CI runs the same gates on Node 22 and 24; a single ESLint warning, unformatted file or type error in any workspace fails the build. `no-explicit-any` is an error outside `tests/`, and library `src/` may not import from `'vue'`.

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

Vitest + `@vue/test-utils` in a `jsdom` environment; setup in `tests/setup.ts`. Coverage thresholds in `vitest.config.ts` **ratchet themselves**: `autoUpdate` rewrites them upward whenever coverage rises (commit the change), and `perFile` floors (80/70/60/80) make every `src` file meet a minimum on its own, so a new untested file fails CI. Never edit a threshold downward; a PR that lowers one is rejected. CI comments the coverage summary on each PR.

`tests/docs-contract.test.ts` is a guard test: it extracts each component's real `defineEmits` surface and fails if `apps/docs/api/components/*.md` doesn't document those events. **When you add/remove a component event, update the matching docs page** or this test fails (set `DOCS_CONTRACT_STRICT=0` only to temporarily downgrade to warnings).

## Conventions

- Public API surface is `src/index.ts` — new components/composables/types must be exported there (and components also via `src/components/index.ts`). `tests/public-exports.test.ts` guards this.
- Support backwards-compatible prop aliases where the existing code does (e.g. `VueStripeProvider` accepts both `publishableKey` and `stripeKey`).
- Errors use the typed classes in `src/utils/errors.ts`; prefix console output with `[Vue Stripe]`.
- `node >=22` (`.nvmrc`: 24), `pnpm >=12` (via corepack; dependency build scripts are allow-listed under `allowBuilds` in `pnpm-workspace.yaml`). Husky + lint-staged run eslint/prettier on commit.

### Rules enforced by `packages/vue-stripe/tests/conventions.test.ts`

Each rule fails the build with `file:line`; each also has a negative fixture in the same test.

1. No `.vue` files under `packages/vue-stripe/src` (render-function components only).
2. Vue APIs are imported from `vue-demi`, never from `'vue'`.
3. Every file in `src/components/` is a `createStripeElement(...)` definition, unless it is on the test's allow-list (providers, `VueStripeCheckout`, `VueStripePricingTable`, `VueStripe*Disclosure`, ...). Growing the allow-list needs a review.
4. `console.error` / `console.warn` messages start with `[Vue Stripe]`; `console.log` / `info` / `debug` are not allowed.
5. Only the typed error classes from `src/utils/errors.ts` are thrown.
6. No `as any`, no `@ts-ignore`; `@ts-expect-error` only with a trailing `-- reason`.
7. Every component and composable module is exported from its `index.ts`.
8. An element definition's `events` list only contains events the installed `@stripe/stripe-js` `.d.ts` declares for that element type.
9. Every exported component and composable has an API page under `apps/docs/api/`.
10. **No emoji anywhere** in docs, the playground, the backend UI, library source or READMEs (maintainer rule). Write words instead: "Yes" / "No" in tables, "Correct" / "Wrong" in code comments, text labels for status. Do not propose emoji in docs or UI copy.
