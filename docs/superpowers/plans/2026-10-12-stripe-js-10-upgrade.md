# Stripe.js 10 (Endive) Upgrade — v6.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `@vue-stripe/vue-stripe` from `@stripe/stripe-js` 7.5.0 to **10.0.0 (Endive)**, make the advertised Vue 2 support actually work (Vue 2.7), refresh every dependency to its latest secure version, and bring the docs, playground and backend in line — shipped as **v6.0.0**. Additive parity work (Embedded Checkout, Checkout Form, more elements) is scoped to **v6.1.0**.

**Architecture:** Every component becomes a render-function `.ts` component built by one factory (`createStripeElement`) so the published bundle only imports Vue APIs that exist in both Vue 2.7 and Vue 3 (today the bundle imports 13 Vue-3-only helpers — `openBlock`, `createElementBlock`, `resolveComponent`, … — because all 16 `.vue` files are template-compiled; only the 4 factory components work on Vue 2). The factory resolves the element creator from either the Elements context (`stripe.elements()`) or the new Checkout Elements SDK context (`stripe.initCheckoutElementsSdk()`), which replaces `initCheckout`. A private `packages/vue2-smoke` workspace mounts the built library under Vue 2.7.16 in CI so the compatibility claim is tested, not assumed.

**Tech Stack:** Vue 3.5 / Vue 2.7 via `vue-demi` 0.14, `@stripe/stripe-js` 10.0.0, Vite 8, Vitest 5, TypeScript 5.9 (TS 7 is the Go-native compiler and is not supported by `vue-tsc`; stay on 5.9.3), pnpm 12, Turborepo 2.11, Node 22/24, VitePress 1.6, Next.js 16, stripe-node 23.

---

## 0. What changed in Stripe.js between 7.5.0 and 10.0.0 (research summary)

Sources: `@stripe/stripe-js` GitHub releases v7.5.0 → v10.0.0 (45 releases), the 7.5.0 vs 10.0.0 `.d.ts` diff, and Stripe's changelog pages for **Clover (2025-09-30)**, **Dahlia (2026-03-25)** and **Endive (2026-09-30)**. `@stripe/stripe-js` 8.x = Clover, 9.x = Dahlia, 10.x = Endive. React Stripe.js 7.0.0 (peer `>=10.0.0 <11`) is the parity reference.

| Change | Release | Effect on vue-stripe |
|---|---|---|
| `stripe.initCheckout()` is **synchronous**, takes `clientSecret: string \| Promise<string>` (not `fetchClientSecret`), session methods move to `await checkout.loadActions()`, `session()` → `actions.getSession()` | Clover | `VueStripeCheckoutProvider`, `useCheckoutSession`, `stripeCheckoutInjectionKey`, mocks, docs — all break (#450) |
| `initCheckout` **renamed** `initCheckoutElementsSdk`; new `initCheckoutFormSdk` (`ui_mode: 'form'`) | Dahlia | Same as above + new Checkout Form surface (v6.1) |
| `initEmbeddedCheckout` renamed `createEmbeddedCheckoutPage` | Dahlia | Never wrapped; wrap in v6.1 (#379) |
| `redirectToCheckout` **removed** (types + runtime) | Clover | `VueStripeCheckout` (`sessionId`/`priceId` paths), `useStripeCheckout` legacy path, `LegacyCheckoutOptions` |
| Elements **removed**: `idealBank`, `p24Bank`, `epsBank`, `fpxBank`, `affirmMessage`, `afterpayClearpayMessage` → use Payment Element / Payment Method Messaging | Clover | Delete 4 components, tests, docs pages, guides, live demos, playground views, backend routes |
| `paymentRequestButton` removed (`elements.create('paymentRequestButton')` throws) → Express Checkout Element | Endive | Never wrapped; mark removed in coverage data |
| `paymentMethodTypes` option removed from `stripe.elements()` / `elements.update()` → `allowedPaymentMethodTypes` or Dashboard | Endive | Remove `paymentMethodTypes` prop from `VueStripeElements` + types + docs |
| `elements.update()` returns `Promise<void>` | Dahlia | Await/catch in `VueStripeElements` |
| `StripeElementsOptions` is a discriminated union (clientSecret vs mode) | Clover | Replace `as any` with the union type |
| Address Element `state` defaults to Latin formatting; `getValue({ format: 'localized' })` | Dahlia | Pass `getValue` options through; doc note |
| `createSource` / `retrieveSource` / `handleCardPayment` / `confirmPaymentIntent` / `handleFpxPayment` / `handleCardSetup` / `confirmSetupIntent` removed | Dahlia | Not used |
| New element types: `taxId`, `currencySelector` (GA), `contactDetails`, `terms`, `linkSignup`, `paymentForm`, `issuingAddToWalletButton` (beta flags noted in `.d.ts`) | 8.x–9.x | Tax ID + Currency Selector in v6.0 (#382, #383); rest in v6.1 |
| Checkout Elements SDK actions gained `validateElements`, `addOptionalLineItem`, `removeOptionalLineItem`; options gained `adaptivePricing`, `defaultValues`, `elementsOptions.savedPaymentMethod`, `syncAddressCheckbox` | 8.x–9.x | Expose through provider props and `useCheckoutSession` |
| Saved payment methods in Checkout Sessions enabled by default client-side | Clover | Doc note (`elementsOptions.savedPaymentMethod`) |
| Tax ID Element requires a `betas` flag on `loadStripe` | 7.6+ | Add `betas` prop to `VueStripeProvider` |

Current state of the repo that this plan fixes along the way: Turbo `test` cache reads `test/**` (folder is `tests/`) and ignores `.vue`; `dist/vue-stripe.css` is built but not exported; root `pnpm lint` fails (`next lint` with no config); `.size-limit.json` points at non-existent files; `.eslintrc.js` and `@vue-stripe/eslint-config` are dead; types are generated twice; Node 20 in CI is end-of-life; `pnpm audit` reports 12 critical / 103 high advisories, almost all transitive via `@turbo/gen` (unused), `vitest` 3, `next` 15 and `vite` 7.

---

## 1. Milestones and ordering

- **Milestone v6.0.0 — Stripe.js 10 (Endive)** (GitHub milestone #6): Phases 1–8 below. Breaking.
- **Milestone v6.1.0 — Stripe.js 10 parity** (GitHub milestone #7): Phase 9. Additive.

Phase order matters: toolchain first (so every later task is tested on the new Vitest/Vite), then the stripe-js bump (which breaks the build until Phase 2 finishes), then the Vue 2 rewrite (which touches every component once), then docs/apps, then release.

Each task = one PR. Branch names: `feat/6.0-<task-id>-<slug>`. Every PR must pass `pnpm lint && pnpm typecheck && pnpm test` from the repo root.

---

## 2. File map (v6.0.0)

**Created**
- `src/utils/h.ts` — Vue 2/3 vnode-props adapter (`hx`).
- `src/styles.css` — all component CSS (replaces every `<style scoped>`); shipped as `dist/vue-stripe.css`, exported as `./style.css`.
- `src/components/VueStripeCurrencySelectorElement.ts`, `src/components/VueStripeTaxIdElement.ts`.
- `src/components/VueStripeCheckoutElementsProvider.ts` (canonical name; `VueStripeCheckoutProvider` kept as an alias export).
- `packages/vue2-smoke/**` — private workspace: Vue 2.7.16 runtime tests against `dist/`.
- `.github/dependabot.yml`.
- `apps/docs/guide/migration-v6.md`, `apps/docs/guide/custom-checkout.md`, `apps/docs/guide/payment-method-messaging.md`, `apps/docs/api/components/stripe-tax-id-element.md`, `apps/docs/api/components/stripe-currency-selector-element.md`, `apps/docs/live-demo/custom-checkout.md`, `apps/docs/.vitepress/theme/components/examples/CustomCheckoutExample.vue`.

**Rewritten (`.vue` → `.ts`, same public name)**
- `src/utils/element-factory.ts` (generalised), and every component in `src/components/`.

**Deleted**
- `src/components/VueStripe{IdealBank,P24Bank,EpsBank,FpxBank}Element.vue` + tests, docs, guides, live demos, examples, playground views, backend routes/pages.
- `src/utils/errors.ts`: `VueStripeLoadError`, `createVueStripeError` (#380).
- `packages/vue-stripe/.eslintrc.js`, `packages/vue-stripe/.size-limit.json`, `tools/eslint-config/`, root dep `@turbo/gen`.
- Stale planning docs: `docs/vue-stripe-feature-roadmap.md`, `docs/vuestripe-vs-stripejs-gap-analysis.md ` (trailing-space filename), `docs/v8-migration.md`, `docs/pricing-table-plan.md` (superseded by this plan + milestones).

**Modified (key)**
- `packages/vue-stripe/package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.build.json`, `tests/setup.ts`, `tests/docs-contract.test.ts`, `tests/public-exports.test.ts`, `tests/coverage-matrix.test.ts`.
- `turbo.json`, root `package.json`, `.github/workflows/{ci,docs,publish}.yml`, `CLAUDE.md`.
- `apps/docs/.vitepress/config.ts`, `apps/docs/.vitepress/theme/data/stripe-coverage.ts`, many `apps/docs/**/*.md`.
- `apps/playground/src/router.ts`, `App.vue`, `views/CheckoutView.vue`, `views/CustomCheckoutView.vue`, `components/ui/*.vue` (radix-vue → reka-ui).
- `apps/backend/src/app/api/checkout-session/route.ts`, `apps/backend/src/lib/stripe.ts`, `apps/backend/package.json`, `apps/backend/eslint.config.mjs`.

---

## Phase 1 — Toolchain and dependency refresh (no library behaviour change)

### Task 1.1: Fix Turbo cache inputs, remove dead tooling, drop `@turbo/gen`

**Files:**
- Modify: `turbo.json:13-17`
- Modify: root `package.json` (devDependencies)
- Delete: `packages/vue-stripe/.eslintrc.js`, `packages/vue-stripe/.size-limit.json`, `tools/eslint-config/` (whole folder)
- Modify: `packages/vue-stripe/package.json` (remove `@vue-stripe/eslint-config` devDependency)

- [ ] **Step 1: Prove the stale-cache bug**

```bash
pnpm vue-stripe:test            # populates cache
echo "// touch" >> packages/vue-stripe/tests/setup.ts
pnpm vue-stripe:test            # expected today: "cache hit, replaying logs" (BUG)
git checkout packages/vue-stripe/tests/setup.ts
```
Expected: second run prints `cache hit` — tests did not re-run.

- [ ] **Step 2: Fix the inputs**

Replace `turbo.json` lines 13–17 with:

```json
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "tests/**", "*.config.ts", "package.json"],
      "env": ["NODE_ENV"]
    },
```

- [ ] **Step 3: Remove dead tooling**

```bash
git rm packages/vue-stripe/.eslintrc.js packages/vue-stripe/.size-limit.json
git rm -r tools/eslint-config
```
In root `package.json` remove `"@turbo/gen"` and `"@vue-stripe/eslint-config"` from `devDependencies`. In `packages/vue-stripe/package.json` remove `"@vue-stripe/eslint-config": "workspace:*"`. Then `pnpm install`.

- [ ] **Step 4: Verify**

```bash
pnpm install && pnpm vue-stripe:test && echo "// touch" >> packages/vue-stripe/tests/setup.ts && pnpm vue-stripe:test; git checkout packages/vue-stripe/tests/setup.ts
pnpm audit --audit-level critical 2>&1 | tail -3
```
Expected: second test run prints `cache miss, executing`; critical advisories from `handlebars`/`basic-ftp` (via `@turbo/gen`) are gone.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: fix turbo test inputs, remove dead eslint/size-limit config and @turbo/gen"
```

### Task 1.2: Node 22/24, pnpm 12, Turborepo 2.11, root tooling bumps

**Files:**
- Modify: root `package.json` (`engines`, `packageManager`, devDependencies)
- Create: `.nvmrc`
- Modify: `.github/workflows/ci.yml`, `.github/workflows/docs.yml`, `.github/workflows/publish.yml` (`node-version`)

- [ ] **Step 1: Pin versions**

Root `package.json`:
```json
  "engines": { "node": ">=22", "pnpm": ">=12" },
  "packageManager": "pnpm@12.11.2",
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^17.6.0",
    "prettier": "^3.9.10",
    "prettier-plugin-organize-imports": "^4.3.0",
    "turbo": "^2.11.7",
    "typescript": "^5.9.3",
    "vite": "^8.3.4",
    "vitest": "^5.0.3"
  }
```
`.nvmrc`: `24`

- [ ] **Step 2: CI matrix**

In `ci.yml` replace the single job's `node-version: 20` with a matrix:
```yaml
    strategy:
      matrix:
        node: [22, 24]
    steps:
      # ...
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: pnpm
```
In `docs.yml` and `publish.yml` set `node-version: 24`.

- [ ] **Step 3: Verify locally**

```bash
corepack enable && corepack prepare pnpm@12.11.2 --activate && pnpm -v   # 12.11.2
pnpm install && pnpm build && pnpm vue-stripe:test
```
Expected: all green (library tests still on Vitest 3 inside the package — bumped in Task 1.3).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: node 22/24 matrix, pnpm 12, turbo 2.11, root tooling bumps"
```

### Task 1.3: Library devDependencies to latest (Vite 8, Vitest 5, jsdom 30, ESLint 10)

**Files:**
- Modify: `packages/vue-stripe/package.json`
- Modify: `packages/vue-stripe/eslint.config.js`
- Modify: `packages/vue-stripe/vitest.config.ts` (coverage thresholds)

- [ ] **Step 1: Bump**

```json
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@stripe/stripe-js": "^7.5.0",
    "@vitejs/plugin-vue": "^6.0.10",
    "@vitest/coverage-v8": "^5.0.3",
    "@vue-stripe/typescript-config": "workspace:*",
    "@vue/test-utils": "^2.5.1",
    "eslint": "^10.12.0",
    "eslint-plugin-vue": "^10.11.1",
    "jsdom": "^30.1.2",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.71.1",
    "vite": "^8.3.4",
    "vite-plugin-dts": "^5.1.2",
    "vitest": "^5.0.3",
    "vue": "^3.5.43",
    "vue-tsc": "^3.3.13"
  }
```
(`@stripe/stripe-js` stays at 7.5.0 here on purpose — it is bumped in Task 2.1 together with the code that it breaks.)

- [ ] **Step 2: Raise coverage ratchet to today's numbers**

`vitest.config.ts` thresholds → `statements: 87, branches: 73, functions: 65, lines: 87`.

- [ ] **Step 3: Verify**

```bash
cd packages/vue-stripe && pnpm install && pnpm lint && pnpm type-check && pnpm test:coverage && pnpm build
```
Expected: 335 tests pass under Vitest 5; thresholds met; `dist/` produced by Vite 8. Fix any Vitest 5 breaking changes surfaced (most likely: `vi.mock` hoisting messages, `environment` option casing) — record each in the PR description.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(vue-stripe): bump vite 8, vitest 5, jsdom 30, eslint 10; raise coverage ratchet"
```

### Task 1.4: `apps/backend` — Next 16, stripe-node 23, React 19.3, working lint

**Files:**
- Modify: `apps/backend/package.json`
- Create: `apps/backend/eslint.config.mjs`
- Modify: `apps/backend/src/lib/stripe.ts`

- [ ] **Step 1: Bump**

```json
  "dependencies": {
    "@radix-ui/react-label": "^2.1.17",
    "@radix-ui/react-select": "^2.4.0",
    "@radix-ui/react-separator": "^1.2.0",
    "@radix-ui/react-slot": "^1.5.0",
    "@radix-ui/react-tabs": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.4.0",
    "@vercel/analytics": "^2.0.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.55.0",
    "next": "16.4.0",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "stripe": "^23.0.0",
    "tailwind-merge": "^3.7.0"
  },
  "devDependencies": {
    "@types/node": "^24.19.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.6.1",
    "eslint": "^10.12.0",
    "eslint-config-next": "16.4.0",
    "postcss": "^8.5.29",
    "tailwindcss": "^3.4.18",
    "typescript": "^5.9.3"
  },
  "scripts": { "dev": "next dev -p 3002", "build": "next build", "start": "next start -p 3002", "lint": "eslint ." }
```
(Tailwind 4 is a separate, optional v6.1 task — it rewrites config files and is unrelated to Stripe.)

- [ ] **Step 2: ESLint flat config (Next 16 removed `next lint`)**

`apps/backend/eslint.config.mjs`:
```js
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default [...nextVitals, ...nextTs, { ignores: ['.next/**', 'node_modules/**'] }]
```

- [ ] **Step 3: Pin the Stripe API version to the Endive train**

`apps/backend/src/lib/stripe.ts` — pass `apiVersion: '2026-09-30.endive'` to `new Stripe(key, { apiVersion })` (stripe-node 23's pinned version; keeps server and Stripe.js on the same release train as Stripe recommends).

- [ ] **Step 4: Verify**

```bash
pnpm --filter @vue-stripe/backend install && pnpm --filter @vue-stripe/backend lint && pnpm --filter @vue-stripe/backend build
pnpm lint    # root — must now complete without an interactive prompt
```
Expected: lint and build pass. Next 16 may flag `params`/`searchParams` as Promises in `page.tsx` files — await them.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore(backend): next 16, stripe-node 23 (endive), react 19.3, eslint flat config"
```

### Task 1.5: `apps/playground` — vue-router 5, reka-ui only, latest Vite/Vue

**Files:**
- Modify: `apps/playground/package.json`
- Modify: `apps/playground/src/components/ui/{tabs-list,tabs,dialog-content,scroll-area,label}.vue` (imports `radix-vue` → `reka-ui`)

- [ ] **Step 1: Bump and drop `radix-vue`** (`reka-ui` is `radix-vue`'s renamed successor; both are installed today)

```json
  "dependencies": {
    "@stripe/stripe-js": "^10.0.0",
    "@unhead/vue": "^3.4.2",
    "@vercel/analytics": "^2.0.1",
    "@vue-stripe/vue-stripe": "workspace:*",
    "@vueuse/core": "^15.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-vue-next": "^1.0.0",
    "reka-ui": "^2.11.0",
    "tailwind-merge": "^3.7.0",
    "tailwindcss-animate": "^1.0.7",
    "vite-ssg": "^28.3.0",
    "vue": "^3.5.43",
    "vue-router": "^5.4.0"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.20",
    "@vitejs/plugin-vue": "^6.0.10",
    "autoprefixer": "^10.6.1",
    "postcss": "^8.5.29",
    "tailwindcss": "^3.4.18",
    "typescript": "^5.9.3",
    "vite": "^8.3.4",
    "vue-tsc": "^3.3.13"
  }
```

- [ ] **Step 2: Replace imports**

```bash
grep -rl "from 'radix-vue'" apps/playground/src | xargs sed -i '' "s/from 'radix-vue'/from 'reka-ui'/"
```
Check each of the 5 files compiles (`reka-ui` renamed nothing these files use: `TabsList`, `TabsRoot`, `DialogContent`, `ScrollAreaRoot`, `Label`).

- [ ] **Step 3: Verify**

```bash
pnpm --filter @vue-stripe/playground install && pnpm --filter @vue-stripe/playground exec vue-tsc --noEmit && pnpm --filter @vue-stripe/playground build
```
Expected: `vite-ssg build` succeeds (vite-ssg 28.3 accepts vue-router 5 and vite 8). Note: `@stripe/stripe-js` 10 here is fine because the playground only passes it through to the library; the library's own migration is Phase 2.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(playground): vue-router 5, reka-ui only, vite 8, latest deps"
```

### Task 1.6: `apps/docs` deps, dead-link enforcement, Dependabot config, audit overrides

**Files:**
- Modify: `apps/docs/package.json`, `apps/docs/.vitepress/config.ts:363`
- Create: `.github/dependabot.yml`
- Modify: root `package.json` (`pnpm.overrides` written by `pnpm audit --fix`)

- [ ] **Step 1: Bump docs deps** (`vitepress` 1.6.4 and `@nolebase/vitepress-plugin-og-image` 2.18.2 are already the latest)

```json
  "devDependencies": {
    "@nolebase/vitepress-plugin-og-image": "^2.18.2",
    "vitepress": "^1.6.4",
    "vitepress-mermaid-renderer": "^1.2.2",
    "vue": "^3.5.43"
  }
```

- [ ] **Step 2: Enforce dead links** — change `ignoreDeadLinks: true` to `ignoreDeadLinks: false` in `apps/docs/.vitepress/config.ts`. Run `pnpm docs:build`; fix every reported dead link (expected: a handful in `guide/checkout.md` and `api/index.md`).

- [ ] **Step 3: Dependabot**

`.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    groups:
      dev-tooling: { dependency-type: development }
      apps: { patterns: ['next', 'react*', 'stripe', 'vue-router', 'vitepress*', 'reka-ui', '@vueuse/*', '@unhead/*'] }
    ignore:
      - dependency-name: '@stripe/stripe-js'
        update-types: ['version-update:semver-major']   # majors are planned releases
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: monthly }
```

- [ ] **Step 4: Transitive advisories**

```bash
pnpm audit --fix        # writes pnpm.overrides for patchable transitive deps (dompurify, js-yaml, lodash-es, minimatch, brace-expansion, …)
pnpm install && pnpm build && pnpm test
pnpm audit --audit-level high 2>&1 | tail -5
```
Expected: remaining high/critical advisories are only those with no patched version (e.g. `ip-address`); list them in the PR.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore(docs): latest deps, fail on dead links; add dependabot config and audit overrides"
```

---

## Phase 2 — Library migration to `@stripe/stripe-js` 10.0.0

### Task 2.1: Bump stripe-js to 10.0.0 and update the test mock factory

**Files:**
- Modify: `packages/vue-stripe/package.json` (`devDependencies["@stripe/stripe-js"]: "^10.0.0"`, `peerDependencies["@stripe/stripe-js"]: "^10.0.0"`)
- Modify: `packages/vue-stripe/tests/setup.ts`

- [ ] **Step 1: Bump and list the breakage**

```bash
cd packages/vue-stripe && pnpm add -D @stripe/stripe-js@10.0.0 && pnpm type-check 2>&1 | grep -E "error TS" | sed 's/(.*//' | sort | uniq -c
```
Expected failing files (this is the work list for Tasks 2.2–2.9): `VueStripeCheckoutProvider.vue`, `useCheckoutSession.ts`, `types/index.ts`, `utils/injection-keys.ts`, `VueStripe{IdealBank,P24Bank,EpsBank,FpxBank}Element.vue`, `tests/setup.ts`.

- [ ] **Step 2: Rewrite the Checkout mock for the 10.x shape**

In `tests/setup.ts` replace `MockStripeCheckout`, `makeMockCheckout` and the `initCheckout` entries with:

```ts
export interface MockStripeCheckoutActions {
  getSession: MockFn
  confirm: MockFn
  applyPromotionCode: MockFn
  removePromotionCode: MockFn
  updateEmail: MockFn
  updatePhoneNumber: MockFn
  updateBillingAddress: MockFn
  updateShippingAddress: MockFn
  updateLineItemQuantity: MockFn
  updateShippingOption: MockFn
  updateTaxIdInfo: MockFn
  runServerUpdate: MockFn
  validateElements: MockFn
  addOptionalLineItem: MockFn
  removeOptionalLineItem: MockFn
}

export interface MockStripeCheckout {
  on: MockFn
  loadActions: MockFn
  changeAppearance: MockFn
  loadFonts: MockFn
  createPaymentElement: MockFn
  createBillingAddressElement: MockFn
  createShippingAddressElement: MockFn
  createExpressCheckoutElement: MockFn
  createCurrencySelectorElement: MockFn
  createTaxIdElement: MockFn
}

export function makeMockCheckoutActions(): MockStripeCheckoutActions {
  const ok = (session = makeMockCheckoutSession()) => Promise.resolve({ type: 'success', session })
  return {
    getSession: vi.fn(() => makeMockCheckoutSession()),
    confirm: vi.fn(() => ok()),
    applyPromotionCode: vi.fn(() => ok()),
    removePromotionCode: vi.fn(() => ok()),
    updateEmail: vi.fn(() => ok()),
    updatePhoneNumber: vi.fn(() => ok()),
    updateBillingAddress: vi.fn(() => ok()),
    updateShippingAddress: vi.fn(() => ok()),
    updateLineItemQuantity: vi.fn(() => ok()),
    updateShippingOption: vi.fn(() => ok()),
    updateTaxIdInfo: vi.fn(() => ok()),
    runServerUpdate: vi.fn(() => ok()),
    validateElements: vi.fn(() => Promise.resolve({ type: 'success' })),
    addOptionalLineItem: vi.fn(() => ok()),
    removeOptionalLineItem: vi.fn(() => ok())
  }
}

export function makeMockCheckout(actions = makeMockCheckoutActions()): MockStripeCheckout {
  return {
    on: vi.fn(),
    loadActions: vi.fn(() => Promise.resolve({ type: 'success', actions })),
    changeAppearance: vi.fn(),
    loadFonts: vi.fn(),
    createPaymentElement: vi.fn(() => makeMockElement()),
    createBillingAddressElement: vi.fn(() => makeMockElement()),
    createShippingAddressElement: vi.fn(() => makeMockElement()),
    createExpressCheckoutElement: vi.fn(() => makeMockElement()),
    createCurrencySelectorElement: vi.fn(() => makeMockElement()),
    createTaxIdElement: vi.fn(() => makeMockElement())
  }
}
```
and in `MockStripe` / `makeMockStripe` replace `initCheckout` with:
```ts
    initCheckoutElementsSdk: vi.fn(() => makeMockCheckout()),
    createEmbeddedCheckoutPage: vi.fn(() => Promise.resolve({ mount: vi.fn(), unmount: vi.fn(), destroy: vi.fn() })),
```
Also make `makeMockElements().update` return `Promise.resolve()` (Dahlia) and add `getValue` to element mocks already present.

- [ ] **Step 3: Commit (build is red until Task 2.5 — allowed on the feature branch, not on main; Tasks 2.1–2.5 ship as one PR)**

```bash
git add -A && git commit -m "feat!: bump @stripe/stripe-js to 10.0.0; mocks for Checkout Elements SDK"
```

### Task 2.2: Remove the four bank elements Stripe deleted

**Files:**
- Delete: `src/components/VueStripe{IdealBank,P24Bank,EpsBank,FpxBank}Element.vue`, `tests/components/VueStripe{IdealBank,P24Bank,EpsBank,FpxBank}Element.test.ts`
- Modify: `src/components/index.ts:19-23,37-38`, `tests/docs-contract.test.ts` (MAP rows), `apps/docs/.vitepress/theme/data/stripe-coverage.ts:62-70`

- [ ] **Step 1: Write the guard test first** — append to `tests/public-exports.test.ts`:

```ts
  it('does not export elements removed in Stripe.js 8+ (Clover)', () => {
    const removed = ['VueStripeIdealBankElement', 'VueStripeP24BankElement', 'VueStripeEpsBankElement', 'VueStripeFpxBankElement']
    for (const name of removed) expect((VueStripe as Record<string, unknown>)[name]).toBeUndefined()
  })
```
Run: `pnpm vitest run tests/public-exports.test.ts` → FAIL (they are still exported).

- [ ] **Step 2: Delete**

```bash
git rm src/components/VueStripe{IdealBank,P24Bank,EpsBank,FpxBank}Element.vue tests/components/VueStripe{IdealBank,P24Bank,EpsBank,FpxBank}Element.test.ts
```
Remove the four `export { default as … }` lines from `src/components/index.ts`, the four MAP rows from `tests/docs-contract.test.ts`, and in `stripe-coverage.ts` replace the four bank entries with:
```ts
      { name: 'iDEAL / P24 / EPS / FPX bank elements', api: "create('idealBank' | 'p24Bank' | 'epsBank' | 'fpxBank')", status: 'deprecated' }
```
(`deprecated` = "removed by Stripe; use the Payment Element" — update the comment at the top of the file to say so.)

- [ ] **Step 3: Verify** — `pnpm vitest run tests/public-exports.test.ts tests/coverage-matrix.test.ts` → PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat!: remove iDEAL/P24/EPS/FPX bank elements (deleted in Stripe.js Clover)"
```

### Task 2.3: Remove `paymentMethodTypes` from `VueStripeElements`

**Files:**
- Modify: `src/components/VueStripeElements.vue:75-79,154-156`, `src/types/index.ts:123-127`, `tests/components/VueStripeElements.test.ts`

- [ ] **Step 1: Test first** — in `tests/components/VueStripeElements.test.ts` add:

```ts
  it('never forwards paymentMethodTypes (removed in Stripe.js Endive)', async () => {
    const stripe = makeMockStripe()
    mountWithStripe(stripe, { mode: 'payment', currency: 'usd', amount: 1000, options: { paymentMethodTypes: ['card'] } })
    await flushPromises()
    const passed = stripe.elements.mock.calls[0][0]
    expect(passed).not.toHaveProperty('paymentMethodTypes')
  })
```
(use the file's existing mount helper name). Run → FAIL.

- [ ] **Step 2: Implement** — delete the prop, its doc comment and the `if (props.paymentMethodTypes)` block; in `createElements()` add `delete elementsOptions['paymentMethodTypes']` after spreading `props.options` with the comment `// Removed in Stripe.js Endive; Stripe throws if present. Use options.allowedPaymentMethodTypes.`; remove `paymentMethodTypes` from `VueStripeElementsProps`.

- [ ] **Step 3: Verify and commit**

```bash
pnpm vitest run tests/components/VueStripeElements.test.ts
git add -A && git commit -m "feat!: drop paymentMethodTypes prop (removed in Stripe.js Endive)"
```

### Task 2.4: Remove every `redirectToCheckout` code path

**Files:**
- Modify: `src/components/VueStripeCheckout.vue` (props/logic), `src/composables/useStripeCheckout.ts`, `src/index.ts:62-67`, `tests/components/VueStripeCheckout.test.ts`, `tests/composables/useStripeCheckout.test.ts`, `tests/public-exports.test.ts:3-9,33-42`

- [ ] **Step 1: Tests first**

In `tests/composables/useStripeCheckout.test.ts` replace the legacy-path tests with:
```ts
  it('redirectToCheckout({ url }) replaces the location', async () => {
    const replace = vi.spyOn(window.location, 'replace').mockImplementation(() => {})
    const { redirectToCheckout } = useStripeCheckout()
    await redirectToCheckout({ url: 'https://checkout.stripe.com/c/pay/cs_test' })
    expect(replace).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test')
  })
  it('throws a typed error when url is missing', async () => {
    const { redirectToCheckout } = useStripeCheckout()
    await expect(redirectToCheckout({} as never)).rejects.toBeInstanceOf(VueStripeCheckoutError)
  })
```
In `tests/components/VueStripeCheckout.test.ts` delete `sessionId`/`priceId` cases; keep/add: renders default button, custom slot gets `{ checkout, loading, disabled }`, click with `sessionUrl` emits `checkout` → `before-redirect` → `success`, missing `sessionUrl` emits `error`. In `tests/public-exports.test.ts` remove `LegacyCheckoutOptions` from the import and the compile-time check.

- [ ] **Step 2: Implement `useStripeCheckout`**

```ts
import { ref, readonly, type Ref } from 'vue-demi'
import { VueStripeCheckoutError } from '../utils/errors'

export interface CheckoutRedirectOptions {
  /** Hosted Checkout URL (`session.url`) returned by your server. */
  url: string
}

export interface UseStripeCheckoutReturn {
  redirectToCheckout: (options: CheckoutRedirectOptions) => Promise<void>
  redirectToUrl: (url: string) => void
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

/**
 * Hosted Checkout redirect helper. Stripe.js removed `redirectToCheckout` in
 * Clover (8.x); create the Checkout Session server-side and redirect to its URL.
 */
export function useStripeCheckout(): UseStripeCheckoutReturn {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const redirectToUrl = (url: string): void => {
    loading.value = true
    error.value = null
    window.location.replace(url)
  }

  const redirectToCheckout = async ({ url }: CheckoutRedirectOptions): Promise<void> => {
    if (!url) {
      error.value = 'useStripeCheckout: `url` is required (Checkout Session URL from your server)'
      throw new VueStripeCheckoutError(error.value)
    }
    redirectToUrl(url)
  }

  return { redirectToCheckout, redirectToUrl, loading: readonly(loading), error: readonly(error) }
}
```
(no Stripe instance needed, so this composable no longer requires `<VueStripeProvider>`).

`VueStripeCheckout.vue`: keep only props `sessionUrl: string`, `buttonText`, `loadingText`, `disabled`, `buttonClass`; emits `checkout`, `before-redirect`, `success`, `error`; `handleSubmit` = emit `checkout` → if no `sessionUrl` emit `error(new VueStripeCheckoutError('sessionUrl is required'))` → else emit `before-redirect({url})`, `window.location.replace(url)`, emit `success`. Remove the `useStripe` import. (This file is converted to `.ts` in Task 3.4 — keep the template for now.)

Remove `LegacyCheckoutOptions` from `src/index.ts`.

- [ ] **Step 3: Verify and commit**

```bash
pnpm vitest run tests/components/VueStripeCheckout.test.ts tests/composables/useStripeCheckout.test.ts tests/public-exports.test.ts
git add -A && git commit -m "feat!: remove redirectToCheckout paths; VueStripeCheckout/useStripeCheckout are URL-only"
```

### Task 2.5: Rewrite the Custom Checkout provider for the Checkout Elements SDK

**Files:**
- Modify: `src/utils/injection-keys.ts:2,16-21`
- Rewrite: `src/components/VueStripeCheckoutProvider.vue` (contents; file becomes `.ts` in Task 3.4)
- Rewrite: `src/composables/useCheckoutSession.ts`
- Modify: `src/types/index.ts:12-15,46-52,147-165,253-278`
- Modify: `tests/components/VueStripeCheckoutProvider.test.ts`, `tests/composables/useCheckoutSession.test.ts`

- [ ] **Step 1: Tests first** — rewrite `tests/components/VueStripeCheckoutProvider.test.ts` around these cases (each using `makeMockStripe()` whose `initCheckoutElementsSdk` returns `makeMockCheckout()`):

```ts
  it('calls initCheckoutElementsSdk synchronously with a clientSecret string', ...)      // expect(stripe.initCheckoutElementsSdk).toHaveBeenCalledWith({ clientSecret: 'cs_test_secret' })
  it('accepts a Promise<string> clientSecret and passes it through untouched', ...)
  it('wraps fetchClientSecret() into the clientSecret option', ...)                       // expect(call.clientSecret).toBeInstanceOf(Promise)
  it('forwards elementsOptions, adaptivePricing and defaultValues', ...)
  it('renders the default slot immediately (before loadActions resolves)', ...)          // Stripe wants elements mounted early for skeletons
  it('provides actions + session after loadActions resolves and emits ready(actions)', ...)
  it('emits error and renders #error when loadActions resolves {type:"error"}', ...)
  it('updates session and emits change on checkout "change" events', ...)
  it('emits error when neither clientSecret nor fetchClientSecret is given', ...)
  it('ignores change/loadActions results after unmount', ...)
```
Run → FAIL (`initCheckoutElementsSdk` not called).

- [ ] **Step 2: Injection key**

```ts
import type {
  Stripe, StripeElements, StripeCheckoutElementsSdk, StripeCheckoutLoadActionsSuccess, StripeCheckoutSession
} from '@stripe/stripe-js'

export interface StripeCheckoutInstance {
  /** Checkout Elements SDK (synchronous handle). */
  checkout: Ref<StripeCheckoutElementsSdk | null>
  /** Session actions, available once `loadActions()` resolves. */
  actions: Ref<StripeCheckoutLoadActionsSuccess | null>
  session: Ref<StripeCheckoutSession | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}
```

- [ ] **Step 3: Provider `<script setup>` body** (template unchanged except the default slot now renders when `checkout` is set, and passes `actions`):

```ts
import { provide, ref, inject, watch, onUnmounted, markRaw } from 'vue-demi'
import type {
  StripeCheckoutElementsSdk, StripeCheckoutElementsSdkOptions, StripeCheckoutElementsOptions,
  StripeCheckoutLoadActionsSuccess, StripeCheckoutSession
} from '@stripe/stripe-js'
import { stripeInjectionKey, stripeCheckoutInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'

interface Props {
  /** Checkout Session client secret (`ui_mode: 'elements'`), or a Promise resolving to it. */
  clientSecret?: string | Promise<string> | undefined
  /** Alternative: a function returning the client secret Promise (kept for 5.x compatibility). */
  fetchClientSecret?: (() => Promise<string>) | undefined
  elementsOptions?: StripeCheckoutElementsOptions | undefined
  adaptivePricing?: StripeCheckoutElementsSdkOptions['adaptivePricing'] | undefined
  defaultValues?: StripeCheckoutElementsSdkOptions['defaultValues'] | undefined
}
const props = defineProps<Props>()
const emit = defineEmits<{
  ready: [actions: StripeCheckoutLoadActionsSuccess]
  change: [session: StripeCheckoutSession]
  error: [error: string]
}>()

const stripeInstance = inject(stripeInjectionKey)
if (!stripeInstance) throw new VueStripeProviderError('VueStripeCheckoutElementsProvider must be used within VueStripeProvider')

const checkout = ref<StripeCheckoutElementsSdk | null>(null)
const actions = ref<StripeCheckoutLoadActionsSuccess | null>(null)
const session = ref<StripeCheckoutSession | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let started = false
let unmounted = false

const fail = (message: string) => {
  error.value = message
  loading.value = false
  console.error('[Vue Stripe] Checkout init error:', message)
  emit('error', message)
}

const start = () => {
  const stripe = stripeInstance.stripe.value
  if (started || !stripe) return
  const clientSecret = props.fetchClientSecret ? props.fetchClientSecret() : props.clientSecret
  if (!clientSecret) return fail('VueStripeCheckoutElementsProvider requires a `clientSecret` (string | Promise) or `fetchClientSecret` prop')
  started = true
  try {
    const options: StripeCheckoutElementsSdkOptions = { clientSecret }
    if (props.elementsOptions) options.elementsOptions = props.elementsOptions
    if (props.adaptivePricing) options.adaptivePricing = props.adaptivePricing
    if (props.defaultValues) options.defaultValues = props.defaultValues
    const sdk = stripe.initCheckoutElementsSdk(options)   // synchronous since Clover
    checkout.value = markRaw(sdk)
    sdk.on('change', (next) => {
      if (unmounted) return
      session.value = markRaw(next)
      emit('change', next)
    })
    sdk.loadActions().then((result) => {
      if (unmounted) return
      if (result.type === 'error') return fail(result.error.message)
      actions.value = markRaw(result.actions)
      session.value = markRaw(result.actions.getSession())
      loading.value = false
      emit('ready', result.actions)
    })
  } catch (err) {
    started = false
    fail(err instanceof Error ? err.message : 'Failed to initialize Checkout')
  }
}

watch(() => stripeInstance.stripe.value, (s) => { if (s) start() }, { immediate: true })
onUnmounted(() => { unmounted = true; checkout.value = null; actions.value = null; session.value = null; started = false })
provide(stripeCheckoutInjectionKey, { checkout, actions, session, loading, error })
```
Template: `v-if="error"` → error slot; `v-else-if="!checkout"` → loading slot; `v-else` → `<slot :checkout="checkout" :actions="actions" :session="session" :loading="loading" />`.

- [ ] **Step 4: `useCheckoutSession`** — forward through `ctx.actions`:

```ts
import { inject, readonly } from 'vue-demi'
import type { Appearance, CssFontSource, CustomFontSource, StripeCheckoutLoadActionsSuccess, StripeCheckoutSession } from '@stripe/stripe-js'
import type { UseCheckoutSessionReturn } from '../types'
import { stripeCheckoutInjectionKey } from '../utils/injection-keys'
import { VueStripeCheckoutError } from '../utils/errors'

export function useCheckoutSession(): UseCheckoutSessionReturn {
  const ctx = inject(stripeCheckoutInjectionKey)
  if (!ctx) throw new VueStripeCheckoutError('useCheckoutSession must be used within a VueStripeCheckoutElementsProvider component')

  // Forward an action by name; before loadActions() resolves, return Stripe's error-result shape.
  const call = <K extends keyof StripeCheckoutLoadActionsSuccess>(name: K): StripeCheckoutLoadActionsSuccess[K] => {
    const wrapped = (...args: unknown[]) => {
      const fn = ctx.actions.value?.[name]
      if (typeof fn !== 'function') {
        return Promise.resolve({ type: 'error', error: { message: 'Checkout session is not ready yet', code: null } })
      }
      return (fn as (...a: unknown[]) => unknown).apply(ctx.actions.value, args)
    }
    return wrapped as StripeCheckoutLoadActionsSuccess[K]
  }

  return {
    checkout: readonly(ctx.checkout) as UseCheckoutSessionReturn['checkout'],
    actions: readonly(ctx.actions) as UseCheckoutSessionReturn['actions'],
    session: readonly(ctx.session) as UseCheckoutSessionReturn['session'],
    loading: readonly(ctx.loading),
    error: readonly(ctx.error),
    getSession: (): StripeCheckoutSession | null => ctx.actions.value?.getSession() ?? null,
    confirm: call('confirm'),
    applyPromotionCode: call('applyPromotionCode'),
    removePromotionCode: call('removePromotionCode'),
    updateEmail: call('updateEmail'),
    updatePhoneNumber: call('updatePhoneNumber'),
    updateBillingAddress: call('updateBillingAddress'),
    updateShippingAddress: call('updateShippingAddress'),
    updateLineItemQuantity: call('updateLineItemQuantity'),
    updateShippingOption: call('updateShippingOption'),
    updateTaxIdInfo: call('updateTaxIdInfo'),
    runServerUpdate: call('runServerUpdate'),
    validateElements: call('validateElements'),
    addOptionalLineItem: call('addOptionalLineItem'),
    removeOptionalLineItem: call('removeOptionalLineItem'),
    changeAppearance: (appearance: Appearance) => ctx.checkout.value?.changeAppearance(appearance),
    loadFonts: (fonts: Array<CssFontSource | CustomFontSource>) => ctx.checkout.value?.loadFonts(fonts)
  } satisfies UseCheckoutSessionReturn
}
```

- [ ] **Step 5: Types** — in `src/types/index.ts` import/re-export `StripeCheckoutElementsSdk`, `StripeCheckoutElementsSdkOptions`, `StripeCheckoutLoadActionsSuccess`, `StripeCheckoutLoadActionsResult` (drop `StripeCheckout`, `StripeCheckoutOptions`); `VueStripeCheckoutProviderProps` gets the five props above; `UseCheckoutSessionReturn` becomes:

```ts
export interface UseCheckoutSessionReturn {
  checkout: Readonly<Ref<StripeCheckoutElementsSdk | null>>
  actions: Readonly<Ref<StripeCheckoutLoadActionsSuccess | null>>
  session: Readonly<Ref<StripeCheckoutSession | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  getSession: () => StripeCheckoutSession | null
  confirm: StripeCheckoutLoadActionsSuccess['confirm']
  applyPromotionCode: StripeCheckoutLoadActionsSuccess['applyPromotionCode']
  removePromotionCode: StripeCheckoutLoadActionsSuccess['removePromotionCode']
  updateEmail: StripeCheckoutLoadActionsSuccess['updateEmail']
  updatePhoneNumber: StripeCheckoutLoadActionsSuccess['updatePhoneNumber']
  updateBillingAddress: StripeCheckoutLoadActionsSuccess['updateBillingAddress']
  updateShippingAddress: StripeCheckoutLoadActionsSuccess['updateShippingAddress']
  updateLineItemQuantity: StripeCheckoutLoadActionsSuccess['updateLineItemQuantity']
  updateShippingOption: StripeCheckoutLoadActionsSuccess['updateShippingOption']
  updateTaxIdInfo: StripeCheckoutLoadActionsSuccess['updateTaxIdInfo']
  runServerUpdate: StripeCheckoutLoadActionsSuccess['runServerUpdate']
  validateElements: StripeCheckoutLoadActionsSuccess['validateElements']
  addOptionalLineItem: StripeCheckoutLoadActionsSuccess['addOptionalLineItem']
  removeOptionalLineItem: StripeCheckoutLoadActionsSuccess['removeOptionalLineItem']
  changeAppearance: StripeCheckoutElementsSdk['changeAppearance']
  loadFonts: StripeCheckoutElementsSdk['loadFonts']
}
```

- [ ] **Step 6: Alias export** — in `src/components/index.ts`:
```ts
export { default as VueStripeCheckoutElementsProvider } from './VueStripeCheckoutProvider.vue'
/** @deprecated renamed to VueStripeCheckoutElementsProvider (mirrors Stripe's initCheckoutElementsSdk); removed in v7. */
export { default as VueStripeCheckoutProvider } from './VueStripeCheckoutProvider.vue'
```

- [ ] **Step 7: Verify and commit**

```bash
pnpm type-check && pnpm vitest run tests/components/VueStripeCheckoutProvider.test.ts tests/composables/useCheckoutSession.test.ts
git add -A && git commit -m "feat!: Checkout provider on initCheckoutElementsSdk + loadActions (fixes #450)"
```
Open the PR for Tasks 2.1–2.5 now; CI must be green.

### Task 2.6: Elements work inside the Checkout Elements context (factory dual-context)

**Files:**
- Modify: `src/utils/element-factory.ts`
- Test: `tests/components/VueStripePaymentElement.test.ts` (+ Address, ExpressCheckout)

This task lands the *logic*; the full factory rewrite for Vue 2 (Task 3.2) keeps it. If Task 3.2 is done in the same PR series, fold this in there.

- [ ] **Step 1: Test first** — add to `tests/components/VueStripePaymentElement.test.ts`:

```ts
  it('inside VueStripeCheckoutElementsProvider it uses checkout.createPaymentElement()', async () => {
    const checkout = makeMockCheckout()
    const stripe = makeMockStripe(); stripe.initCheckoutElementsSdk.mockReturnValue(checkout)
    mountInCheckout(stripe, VueStripePaymentElement, { options: { layout: 'tabs' } })   // helper: Provider > CheckoutElementsProvider > component
    await flushPromises()
    expect(checkout.createPaymentElement).toHaveBeenCalledWith({ layout: 'tabs' })
    expect(stripe.elements).not.toHaveBeenCalled()
  })
```
Run → FAIL (throws "must be used within VueStripeElements").

- [ ] **Step 2: Implement** — in the factory, replace the single `inject(stripeElementsInjectionKey)` with:

```ts
const elementsCtx = inject(stripeElementsInjectionKey, null)
const checkoutCtx = inject(stripeCheckoutInjectionKey, null)
if (!elementsCtx && !checkoutCtx) {
  throw new VueStripeElementsError(`${componentName} must be used within VueStripeElements or VueStripeCheckoutElementsProvider`)
}
// Nearest provider wins; Elements takes precedence when both are present.
const createRaw = (options: Record<string, unknown>): StripeElementLike | null => {
  if (elementsCtx?.elements.value) return (elementsCtx.elements.value as unknown as { create: (t: string, o: unknown) => StripeElementLike }).create(elementType, options)
  const sdk = checkoutCtx?.checkout.value
  if (!sdk) return null
  if (!def.checkout) throw new VueStripeElementsError(`${componentName} is not available inside Checkout Sessions; use it within VueStripeElements`)
  return def.checkout(sdk, options)
}
```
and watch `() => elementsCtx?.elements.value ?? checkoutCtx?.checkout.value` to trigger creation. Per-element `checkout` creators (used by Task 3.3 definitions):

```ts
payment:          (sdk, o) => sdk.createPaymentElement(o)
expressCheckout:  (sdk, o) => sdk.createExpressCheckoutElement(o)
address:          (sdk, o) => (o.mode === 'billing' ? sdk.createBillingAddressElement(o) : sdk.createShippingAddressElement(o))
currencySelector: (sdk)    => sdk.createCurrencySelectorElement()
taxId:            (sdk, o) => sdk.createTaxIdElement(o)
```

- [ ] **Step 3: Verify and commit**

```bash
pnpm vitest run tests/components
git add -A && git commit -m "feat: Payment/Address/ExpressCheckout elements work inside the Checkout Elements provider"
```

### Task 2.7: `VueStripeCurrencySelectorElement` and `VueStripeTaxIdElement` (#382, #383)

**Files:**
- Create: `src/components/VueStripeCurrencySelectorElement.ts`, `src/components/VueStripeTaxIdElement.ts`
- Create: `tests/components/VueStripeCurrencySelectorElement.test.ts`, `tests/components/VueStripeTaxIdElement.test.ts`
- Modify: `src/components/index.ts`, `src/types/index.ts` (re-export `StripeTaxIdElement`, `StripeTaxIdElementOptions`, `StripeTaxIdElementChangeEvent`, `StripeCurrencySelectorElement`), `tests/docs-contract.test.ts` MAP, `apps/docs/.vitepress/theme/data/stripe-coverage.ts:93-94` (→ `covered`)

- [ ] **Step 1: Tests first**

```ts
// tests/components/VueStripeTaxIdElement.test.ts
describe('VueStripeTaxIdElement', () => {
  it('creates via checkout.createTaxIdElement inside the Checkout provider', ...)   // toHaveBeenCalledWith({ verification: { taxId: { mode: 'if_supported' } } })
  it('creates via elements.create("taxId") inside VueStripeElements', ...)
  it('emits change with the Stripe event and tracks error state', ...)
  it('exposes getValue() which proxies element.getValue()', ...)
  it('detaches handlers and destroys on unmount', ...)
})
// tests/components/VueStripeCurrencySelectorElement.test.ts — same shape; create is called with no options in Checkout context.
```
Run → FAIL (modules missing).

- [ ] **Step 2: Implement (factory one-liners; shape finalised in Task 3.2)**

```ts
// src/components/VueStripeTaxIdElement.ts
import { createStripeElement } from '../utils/element-factory'
export default createStripeElement({
  elementType: 'taxId',
  componentName: 'VueStripeTaxIdElement',
  events: ['ready', 'change', 'focus', 'blur', 'escape', 'loaderror'],
  checkout: (sdk, options) => sdk.createTaxIdElement(options),
  expose: (el) => ({ getValue: () => el.value?.getValue() })
})
```
```ts
// src/components/VueStripeCurrencySelectorElement.ts
import { createStripeElement } from '../utils/element-factory'
export default createStripeElement({
  elementType: 'currencySelector',
  componentName: 'VueStripeCurrencySelectorElement',
  events: ['ready', 'change', 'focus', 'blur', 'escape', 'loaderror'],
  checkout: (sdk) => sdk.createCurrencySelectorElement()
})
```
Export both from `src/components/index.ts` under `// Checkout Sessions elements (v6.0.0)`. Coverage data: both `status: 'covered'` with artifacts.

- [ ] **Step 3: Verify and commit**

```bash
pnpm vitest run tests/components/VueStripeTaxIdElement.test.ts tests/components/VueStripeCurrencySelectorElement.test.ts tests/coverage-matrix.test.ts tests/docs-contract.test.ts
git add -A && git commit -m "feat: VueStripeTaxIdElement and VueStripeCurrencySelectorElement (closes #382, #383)"
```

### Task 2.8: `elements.update()` Promise, typed `stripe.elements()` options, Address `getValue(format)`

**Files:**
- Modify: `src/components/VueStripeElements.vue:7-8,169-170,217-231`, `src/components/VueStripeAddressElement.vue:109-114`
- Test: `tests/components/VueStripeElements.test.ts`, `tests/components/VueStripeAddressElement.test.ts`

- [ ] **Step 1: Tests first**

```ts
  it('surfaces a rejected elements.update() as error + emits error', async () => {
    const stripe = makeMockStripe(); const elements = makeMockElements()
    elements.update.mockRejectedValueOnce(new Error('bad appearance')); stripe.elements.mockReturnValue(elements)
    const w = mountWithStripe(stripe, { clientSecret: 'pi_x_secret_y', appearance: { theme: 'stripe' } })
    await flushPromises(); await w.setProps({ appearance: { theme: 'night' } }); await flushPromises()
    expect(w.emitted('error')?.[0]).toEqual(['bad appearance'])
  })
  // Address
  it('getValue forwards the format option', async () => { ...; await vm.getValue({ format: 'localized' }); expect(el.getValue).toHaveBeenCalledWith({ format: 'localized' }) })
```

- [ ] **Step 2: Implement**

`VueStripeElements`: `type ElementsOptions = Record<string, unknown>`; create with `stripeInstance.stripe.value.elements(elementsOptions as StripeElementsOptions)` (import the type); the appearance/locale watcher becomes:
```ts
      Promise.resolve(elements.value.update(updateOptions as StripeElementsUpdateOptions)).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'elements.update() failed'
        error.value = message
        emit('error', message)
      })
```
`VueStripeAddressElement`: `getValue = (options?: { format?: 'localized' | 'latin' }) => elementRef.value.getValue(options)`.

- [ ] **Step 3: Verify and commit**

```bash
pnpm vitest run tests/components/VueStripeElements.test.ts tests/components/VueStripeAddressElement.test.ts
git add -A && git commit -m "fix: await elements.update() (Dahlia), typed StripeElementsOptions, Address getValue(format)"
```

### Task 2.9: Type hygiene — remove `as any`, dead error helpers, stale re-exports

**Files:**
- Modify: `src/utils/errors.ts:22-42` (delete `VueStripeLoadError`, `createVueStripeError`), `src/index.ts:76-82`, `src/types/index.ts`, `src/composables/{usePaymentIntent,useSetupIntent,useCreatePaymentMethod,useHandleNextAction}.ts` (`as any` on `stripe.value`), `src/components/VueStripeProvider.vue:52` (`options: StripeConstructorOptions`)
- Test: `tests/public-exports.test.ts`, `tests/errors.test.ts` (new, covers all 3 remaining error classes)

- [ ] **Step 1: Test first** — `tests/errors.test.ts`:
```ts
import { VueStripeProviderError, VueStripeElementsError, VueStripeCheckoutError } from '../src'
it.each([[VueStripeProviderError, 'VueStripeProviderError'], [VueStripeElementsError, 'VueStripeElementsError'], [VueStripeCheckoutError, 'VueStripeCheckoutError']])(
  '%s has name %s and is an Error', (Ctor, name) => { const e = new Ctor('x'); expect(e).toBeInstanceOf(Error); expect(e.name).toBe(name); expect(e.message).toBe('x') })
it('no longer exports VueStripeLoadError / createVueStripeError', async () => {
  const mod = await import('../src') as Record<string, unknown>
  expect(mod.VueStripeLoadError).toBeUndefined(); expect(mod.createVueStripeError).toBeUndefined()
})
```

- [ ] **Step 2: Implement** — delete the two dead exports (#380); replace every `(stripe.value as any).method(` with `stripe.value.method(` (the ref is already `Ref<Stripe | null>`); type Provider's `options` as `StripeConstructorOptions`; in `src/types/index.ts` and `src/index.ts` drop re-exports of types removed in 10 (none of the remaining ones are) and add `StripeCheckoutElementsSdk`, `StripeCheckoutLoadActionsSuccess`, `StripeCheckoutElementsSdkOptions`, `StripeTaxIdElement`, `StripeTaxIdElementOptions`, `StripeTaxIdElementChangeEvent`, `StripeCurrencySelectorElement`.

- [ ] **Step 3: Verify and commit**

```bash
pnpm lint && pnpm type-check && pnpm test
git add -A && git commit -m "refactor!: drop dead error helpers (#380), remove any-casts, refresh re-exported Stripe types"
```

### Task 2.10: Coverage matrix for Stripe.js 10

**Files:**
- Modify: `apps/docs/.vitepress/theme/data/stripe-coverage.ts`

- [ ] **Step 1: Edit entries**
  - `Payment Request Button` → `status: 'deprecated'` (removed in Endive; Express Checkout replaces it).
  - `Affirm Message`, `Afterpay/Clearpay Message` → `status: 'deprecated'` (removed in Clover).
  - `Redirect to Checkout` → `name: 'Hosted Checkout redirect', api: 'session.url redirect'`.
  - `Embedded Checkout` → `api: 'stripe.createEmbeddedCheckoutPage()'`, `status: 'planned', issue: 492`.
  - `Custom Checkout` → `name: 'Elements with Checkout Sessions', api: 'stripe.initCheckoutElementsSdk()', artifact: 'VueStripeCheckoutElementsProvider'`.
  - Add `{ name: 'Checkout Form', api: 'stripe.initCheckoutFormSdk()', status: 'planned', issue: 493 }`, `{ name: 'Contact Details', api: "create('contactDetails')", status: 'planned', issue: 494 }`, `{ name: 'Terms', api: "create('terms')", status: 'planned', issue: 494 }`, `{ name: 'Link Signup', api: "create('linkSignup')", status: 'planned', issue: 494 }`, `{ name: 'Add to Wallet (Issuing)', api: "create('issuingAddToWalletButton')", status: 'accessible' }`; Financial Connections / Identity → `issue: 496`.
- [ ] **Step 2: Verify** — `pnpm vitest run tests/coverage-matrix.test.ts` and `pnpm docs:build`.
- [ ] **Step 3: Commit** — `git commit -am "docs: coverage matrix reflects Stripe.js 10 (Endive)"`.

---

## Phase 3 — Real Vue 2.7 compatibility

### Task 3.1: Vue 2.7 smoke-test workspace (fails first, proving the bug)

**Files:**
- Create: `packages/vue2-smoke/package.json`, `packages/vue2-smoke/vitest.config.ts`, `packages/vue2-smoke/tests/setup.ts`, `packages/vue2-smoke/tests/imports.test.ts`, `packages/vue2-smoke/tests/mount.test.ts`
- Modify: `turbo.json` (test depends on `^build` so the smoke test sees `dist/`), `.github/workflows/ci.yml` (new job)

- [ ] **Step 1: Package**

```json
{
  "name": "@vue-stripe/vue2-smoke",
  "private": true,
  "type": "module",
  "scripts": { "test": "vitest run" },
  "devDependencies": {
    "@stripe/stripe-js": "^10.0.0",
    "@vue-stripe/vue-stripe": "workspace:*",
    "@vue/test-utils": "1.3.6",
    "jsdom": "^30.1.2",
    "vitest": "^5.0.3",
    "vue": "2.7.16",
    "vue-demi": "^0.14.10",
    "vue-template-compiler": "2.7.16"
  }
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

// Force the Vue 2.7 build of vue-demi for everything in this package, including
// the published library bundle (inlined so the alias applies to it).
export default defineConfig({
  resolve: { alias: { 'vue-demi': require.resolve('vue-demi/lib/v2.7/index.mjs') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    server: { deps: { inline: ['@vue-stripe/vue-stripe', 'vue-demi'] } }
  }
})
```

`tests/setup.ts`:
```ts
import { vi } from 'vitest'
export const element = { mount: vi.fn(), unmount: vi.fn(), destroy: vi.fn(), on: vi.fn(), off: vi.fn(), update: vi.fn(), focus: vi.fn(), blur: vi.fn(), clear: vi.fn() }
export const elements = { create: vi.fn(() => element), submit: vi.fn(), update: vi.fn(() => Promise.resolve()) }
export const stripe = { elements: vi.fn(() => elements), registerAppInfo: vi.fn(), initCheckoutElementsSdk: vi.fn() }
vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn(() => Promise.resolve(stripe)) }))
export const flush = () => new Promise((r) => setTimeout(r, 0))
```

`tests/imports.test.ts` — static guard, independent of runtime behaviour:
```ts
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import * as Vue2 from 'vue'
const require = createRequire(import.meta.url)

it('the published ESM bundle only imports vue-demi names that Vue 2.7 exports', () => {
  const bundle = readFileSync(require.resolve('@vue-stripe/vue-stripe').replace(/cjs[\\/]index\.js$/, 'es/index.js'), 'utf8')
  const imported = [...bundle.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]vue-demi['"]/g)]
    .flatMap((m) => m[1].split(',')).map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean)
  const available = new Set(Object.keys(Vue2))
  const missing = imported.filter((n) => !available.has(n))
  expect(missing, `Vue-3-only imports in dist: ${missing.join(', ')}`).toEqual([])
})
```

`tests/mount.test.ts`:
```ts
import { mount } from '@vue/test-utils'
import { VueStripeProvider, VueStripeElements, VueStripeCardElement, VueStripeCardNumberElement } from '@vue-stripe/vue-stripe'
import { elements, flush } from './setup'

const tree = (Leaf: unknown) => ({
  render(h: (...a: unknown[]) => unknown) {
    return h(VueStripeProvider, { props: { publishableKey: 'pk_test_x' } }, [
      h(VueStripeElements, { props: { clientSecret: 'pi_x_secret_y' } }, [h(Leaf)])
    ])
  }
})

it('factory element mounts under Vue 2.7', async () => {
  const w = mount(tree(VueStripeCardNumberElement))
  await flush(); await flush(); await flush()
  expect(elements.create).toHaveBeenCalledWith('cardNumber', expect.anything())
  expect(w.find('.vue-stripe-cardNumber-element-mount').exists()).toBe(true)
})

it('card element mounts under Vue 2.7', async () => {
  const w = mount(tree(VueStripeCardElement))
  await flush(); await flush(); await flush()
  expect(elements.create).toHaveBeenCalledWith('card', expect.anything())
  expect(w.find('.vue-stripe-card-element-mount').exists()).toBe(true)
})
```

- [ ] **Step 2: Run it against today's bundle — it must fail**

```bash
pnpm install && pnpm vue-stripe:build && pnpm --filter @vue-stripe/vue2-smoke test
```
Expected: `imports.test.ts` FAILS listing `createCommentVNode createElementBlock createElementVNode createTextVNode createVNode Fragment normalizeClass openBlock renderSlot resolveComponent toDisplayString vShow withDirectives`; `card element mounts` FAILS (`openBlock is not a function`); `factory element mounts` PASSES. This is the baseline the rest of Phase 3 turns green.

- [ ] **Step 3: Wire CI** — add to `ci.yml`:
```yaml
  vue2-smoke:
    name: Vue 2.7 compatibility
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @vue-stripe/vue-stripe build
      - run: pnpm --filter @vue-stripe/vue2-smoke test
```
In `turbo.json` the `test` task already `dependsOn: ["build"]`; add `"^build"` too so `vue2-smoke`'s test waits for the library build.

- [ ] **Step 4: Commit (red test allowed on this branch; the PR for Phase 3 merges only when green)**

```bash
git add -A && git commit -m "test: Vue 2.7 smoke workspace proving the bundle imports Vue-3-only helpers"
```

### Task 3.2: Factory v2 — generic, Vue 2/3-safe render, shared stylesheet

**Files:**
- Create: `src/utils/h.ts`, `src/styles.css`
- Rewrite: `src/utils/element-factory.ts`
- Modify: `packages/vue-stripe/package.json` (`exports["./style.css"]`, `sideEffects`), `vite.config.ts` (`build.cssFileName` / `lib.cssFileName: 'vue-stripe'`)
- Test: `tests/utils/element-factory.test.ts` (new)

- [ ] **Step 1: Tests first** — `tests/utils/element-factory.test.ts`:

```ts
import { createStripeElement } from '../../src/utils/element-factory'
describe('createStripeElement', () => {
  it('attaches exactly the configured events and detaches them on unmount', ...)        // events: ['ready','click'] → on called 2x, off 2x, destroy 1x
  it('applies defaultOptions under user options', ...)                                 // defaultOptions: () => ({ supportedCountries: ['SEPA'] })
  it('sets error from change events and clears it', ...)
  it('sets error from loaderror events', ...)
  it('calls element.update(options) when options change (deep)', ...)
  it('exposes element/loading/error/focus/blur/clear plus expose() extras', ...)
  it('renders #error and #loading slots', ...)
  it('uses the Checkout creator when only the checkout context is present', ...)
  it('throws VueStripeElementsError when no context is present', ...)
})
```

- [ ] **Step 2: `src/utils/h.ts`**

```ts
import { h, isVue2 } from 'vue-demi'

type Props = Record<string, unknown>
type Children = unknown

// ponytail: tiny Vue 2/3 vnode-data adapter. Vue 3 takes flat props; Vue 2 wants
// { class, style, ref, attrs: {...}, on: {...} }. Only the keys this library uses.
export function hx(tag: string | object, props: Props = {}, children?: Children) {
  if (!isVue2) return h(tag as string, props, children as never)
  const data: Props = {}
  const attrs: Props = {}
  const on: Props = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class' || key === 'style' || key === 'key' || key === 'ref') data[key] = value
    else if (/^on[A-Z]/.test(key)) on[key[2].toLowerCase() + key.slice(3)] = value
    else attrs[key] = value
  }
  if (Object.keys(attrs).length) data.attrs = attrs
  if (Object.keys(on).length) data.on = on
  return h(tag as string, data, children as never)
}
```

- [ ] **Step 3: `src/utils/element-factory.ts`**

```ts
import { defineComponent, ref, inject, onMounted, onUnmounted, watch, getCurrentInstance, type PropType, type Ref } from 'vue-demi'
import type { StripeCheckoutElementsSdk } from '@stripe/stripe-js'
import { stripeElementsInjectionKey, stripeCheckoutInjectionKey } from './injection-keys'
import { VueStripeElementsError } from './errors'
import { hx } from './h'

export interface StripeElementLike {
  mount(domElement: HTMLElement | string): void
  unmount(): void
  destroy(): void
  on(eventType: string, handler: (...args: unknown[]) => void): unknown
  off?(eventType: string, handler?: (...args: unknown[]) => void): unknown
  update?(options: Record<string, unknown>): unknown
  focus?(): void
  blur?(): void
  clear?(): void
  getValue?(...args: unknown[]): Promise<unknown>
}

export const BASE_EVENTS = ['ready', 'change', 'focus', 'blur', 'escape'] as const

export interface ElementDefinition {
  elementType: string
  componentName: string
  /** Stripe events to forward as Vue events. Defaults to BASE_EVENTS. */
  events?: readonly string[]
  /** Options merged under `props.options` (e.g. IBAN supportedCountries). */
  defaultOptions?: () => Record<string, unknown>
  /** Creator when mounted inside VueStripeCheckoutElementsProvider. Omit if Checkout Sessions don't support this element. */
  checkout?: (sdk: StripeCheckoutElementsSdk, options: Record<string, unknown>) => StripeElementLike
  /** Extra members for defineExpose (e.g. getValue). */
  expose?: (element: Ref<StripeElementLike | null>) => Record<string, unknown>
  loadingText?: string
}

export function createStripeElement(def: ElementDefinition) {
  const { elementType, componentName, events = BASE_EVENTS, loadingText = `Loading ${elementType}...` } = def
  const className = `vue-stripe-${elementType}-element`

  return defineComponent({
    name: componentName,
    props: { options: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) } },
    emits: [...events],
    setup(props, { emit, expose, slots }) {
      const element = ref<StripeElementLike | null>(null)
      const loading = ref(true)
      const error = ref<string | null>(null)
      const instance = getCurrentInstance()

      const elementsCtx = inject(stripeElementsInjectionKey, null)
      const checkoutCtx = inject(stripeCheckoutInjectionKey, null)
      if (!elementsCtx && !checkoutCtx) {
        throw new VueStripeElementsError(`${componentName} must be used within VueStripeElements or VueStripeCheckoutElementsProvider`)
      }

      // String ref: works identically for Vue 2 ($refs) and Vue 3 setup render functions.
      const mountPoint = () => (instance?.proxy as { $refs: Record<string, HTMLElement | undefined> } | null)?.$refs.mount ?? null

      const handlers: Record<string, (...args: unknown[]) => void> = {}
      for (const name of events) {
        handlers[name] = (...args: unknown[]) => {
          const event = args[0] as { error?: { message?: string } } | undefined
          if (name === 'ready') loading.value = false
          if (name === 'change') error.value = event?.error?.message ?? null
          if (name === 'loaderror') { error.value = event?.error?.message ?? 'Element failed to load'; loading.value = false }
          emit(name, ...(name === 'ready' ? [element.value] : args))
        }
      }

      const mergedOptions = () => ({ ...(def.defaultOptions?.() ?? {}), ...props.options })

      const createRaw = (options: Record<string, unknown>): StripeElementLike | null => {
        if (elementsCtx?.elements.value) {
          return (elementsCtx.elements.value as unknown as { create: (t: string, o: unknown) => StripeElementLike }).create(elementType, options)
        }
        const sdk = checkoutCtx?.checkout.value
        if (!sdk) return null
        if (!def.checkout) throw new VueStripeElementsError(`${componentName} is not available inside Checkout Sessions; use it within VueStripeElements`)
        return def.checkout(sdk, options)
      }

      const create = () => {
        const target = mountPoint()
        if (element.value || !target) return
        try {
          error.value = null
          loading.value = true
          const created = createRaw(mergedOptions())
          if (!created) return
          element.value = created
          for (const name of events) created.on(name, handlers[name])
          created.mount(target)
        } catch (err) {
          error.value = err instanceof Error ? err.message : `Failed to create ${elementType} element`
          loading.value = false
          console.error(`[Vue Stripe] ${componentName} creation error:`, error.value)
        }
      }

      watch(() => props.options, (next) => { if (next) element.value?.update?.({ ...next }) }, { deep: true })
      watch(() => elementsCtx?.elements.value ?? checkoutCtx?.checkout.value, () => create())
      onMounted(create)
      onUnmounted(() => {
        const el = element.value
        if (!el) return
        for (const name of events) el.off?.(name, handlers[name])
        el.destroy()
        element.value = null
      })

      expose({
        element,
        loading,
        error,
        focus: () => element.value?.focus?.(),
        blur: () => element.value?.blur?.(),
        clear: () => element.value?.clear?.(),
        ...(def.expose?.(element) ?? {})
      })

      return () =>
        hx('div', { class: className }, [
          error.value &&
            hx('div', { class: `${className}-error vue-stripe-element-error` }, slots.error?.({ error: error.value }) ?? [hx('div', { class: 'vue-stripe-error-message' }, error.value)]),
          hx('div', { ref: 'mount', class: { [`${className}-mount`]: true, 'vue-stripe-element-mount': true, 'vue-stripe-element-loading': loading.value } }),
          loading.value &&
            hx('div', { class: `${className}-loader vue-stripe-element-loader` }, slots.loading?.() ?? [hx('div', { class: 'vue-stripe-loading-message' }, loadingText)])
        ])
    }
  })
}
```

- [ ] **Step 4: `src/styles.css`** — move every rule from the components' `<style scoped>` blocks here, keyed on the existing `vue-stripe-*` class names (they are already unique); add generic `.vue-stripe-element-error`, `.vue-stripe-element-mount`, `.vue-stripe-element-loading { opacity: .5 }`, `.vue-stripe-element-loader`. Import it from `src/index.ts` (`import './styles.css'`). In `vite.config.ts` set `build.lib.cssFileName: 'vue-stripe'`. In `package.json`:
```json
  "sideEffects": ["*.css"],
  "exports": {
    ".": { "types": "./dist/types/index.d.ts", "import": "./dist/es/index.js", "require": "./dist/cjs/index.js" },
    "./style.css": "./dist/vue-stripe.css",
    "./package.json": "./package.json"
  },
```

- [ ] **Step 5: Verify and commit**

```bash
pnpm vitest run tests/utils/element-factory.test.ts tests/components/SplitCardElements.test.ts tests/components/VueStripePaymentMethodMessagingElement.test.ts && pnpm build && ls dist/vue-stripe.css
git add -A && git commit -m "feat: generic Vue 2/3-safe element factory, shared stylesheet exported as ./style.css"
```

### Task 3.3: Convert the seven element SFCs to factory definitions

**Files:**
- Delete: `src/components/VueStripe{Card,Iban,AuBankAccount,LinkAuthentication,Address,Payment,ExpressCheckout}Element.vue`
- Create: same names with `.ts`
- Modify: `src/components/index.ts` (import paths), `tests/docs-contract.test.ts` (MAP → `.ts`, read `events:` arrays), existing component tests (class names and `loaderror` casing)

- [ ] **Step 1: Keep the existing component tests as the spec.** Update only: Address now emits `loaderror` (was `loadError`) and renders a mount/loader/error wrapper; Payment/ExpressCheckout classes unchanged. Run the seven test files → they fail only on the renamed `loadError` assertions before implementation; fix those assertions first.

- [ ] **Step 2: Definitions**

```ts
// VueStripeCardElement.ts
export default createStripeElement({ elementType: 'card', componentName: 'VueStripeCardElement', loadingText: 'Loading card form...' })
// VueStripeIbanElement.ts
export default createStripeElement({ elementType: 'iban', componentName: 'VueStripeIbanElement', defaultOptions: () => ({ supportedCountries: ['SEPA'] }) })
// VueStripeAuBankAccountElement.ts
export default createStripeElement({ elementType: 'auBankAccount', componentName: 'VueStripeAuBankAccountElement' })
// VueStripeLinkAuthenticationElement.ts
export default createStripeElement({ elementType: 'linkAuthentication', componentName: 'VueStripeLinkAuthenticationElement', events: ['ready', 'change', 'focus', 'blur', 'escape', 'loaderror'] })
// VueStripeAddressElement.ts
export default createStripeElement({
  elementType: 'address', componentName: 'VueStripeAddressElement',
  events: ['ready', 'change', 'focus', 'blur', 'escape', 'loaderror'],
  defaultOptions: () => ({ mode: 'shipping' }),
  checkout: (sdk, o) => (o.mode === 'billing' ? sdk.createBillingAddressElement(o) : sdk.createShippingAddressElement(o)),
  expose: (el) => ({ getValue: (options?: { format?: 'localized' | 'latin' }) => el.value?.getValue?.(options) })
})
// VueStripePaymentElement.ts
export default createStripeElement({
  elementType: 'payment', componentName: 'VueStripePaymentElement',
  events: ['ready', 'change', 'focus', 'blur', 'escape', 'loaderstart', 'loaderstop', 'loaderror'],
  checkout: (sdk, o) => sdk.createPaymentElement(o), loadingText: 'Loading payment form...'
})
// VueStripeExpressCheckoutElement.ts
export default createStripeElement({
  elementType: 'expressCheckout', componentName: 'VueStripeExpressCheckoutElement',
  events: ['ready', 'click', 'confirm', 'cancel', 'shippingaddresschange', 'shippingratechange', 'loaderror'],
  checkout: (sdk, o) => sdk.createExpressCheckoutElement(o)
})
```
Each file starts with `import { createStripeElement } from '../utils/element-factory'`. Also convert the four already-factory components (`CardNumber`, `CardExpiry`, `CardCvc`, `PaymentMethodMessaging`) from `.vue` to `.ts` (they are `.vue` wrappers today).

- [ ] **Step 3: docs-contract test** — MAP entries use `.ts` names; `extractEmits` also reads `events:\s*\[([^\]]*)\]`, and falls back to `BASE_EVENTS` when a definition has no `events`.

- [ ] **Step 4: Verify and commit**

```bash
pnpm lint && pnpm type-check && pnpm test && pnpm build && pnpm --filter @vue-stripe/vue2-smoke test
git add -A && git commit -m "refactor!: element components are factory definitions (Vue 2.7-safe); Address emits loaderror"
```
Expected: smoke `mount.test.ts` passes; `imports.test.ts` still fails on names imported by the five remaining SFCs (fixed in 3.4).

### Task 3.4: Convert Provider, Elements, CheckoutElementsProvider, Checkout, PricingTable to render functions

**Files:**
- Delete `.vue` / create `.ts` for each; update `src/components/index.ts`

- [ ] **Step 1: Existing tests are the spec**; run them after each conversion.

- [ ] **Step 2: Shared "status shell" helper** in `src/utils/status-shell.ts` (the three providers render the same error / loading / default structure):

```ts
import type { Slots } from 'vue-demi'
import { hx } from './h'

export function statusShell(prefix: string, state: { error: string | null; loading: boolean }, slots: Slots, slotProps: Record<string, unknown>, loadingText: string) {
  if (state.error) {
    return hx('div', { class: `${prefix}-error` }, slots.error?.({ error: state.error }) ?? [hx('div', { class: 'vue-stripe-error-message' }, state.error)])
  }
  if (state.loading) {
    return hx('div', { class: `${prefix}-loading` }, slots.loading?.() ?? [hx('div', { class: 'vue-stripe-loading-message' }, loadingText)])
  }
  return hx('div', {}, slots.default?.(slotProps))
}
```

- [ ] **Step 3: `VueStripeProvider.ts`** — `defineComponent({ name, props: { publishableKey: String, stripeKey: String, stripeAccount: String, apiVersion: String, locale: String, betas: Array as PropType<string[]>, options: Object as PropType<StripeConstructorOptions> }, emits: ['load', 'error'], setup(props, { emit, slots }) { …same logic as today, `betas` forwarded…; return () => statusShell('vue-stripe', { error: error.value, loading: loading.value }, slots, {}, 'Loading Stripe...') } })`. `betas` is new (needed for the Tax ID element beta header).

- [ ] **Step 4: `VueStripeElements.ts`**, **`VueStripeCheckoutElementsProvider.ts`** — same approach; the Checkout provider's default slot renders when `checkout.value` is set (`loading` here means "actions not yet loaded", passed as a slot prop). Delete `VueStripeCheckoutProvider.vue`; keep the alias export pointing at the new file.

- [ ] **Step 5: `VueStripeCheckout.ts`**

```ts
return () => slots.default
  ? hx('span', { class: 'vue-stripe-checkout-wrapper', onClick: handleSubmit }, slots.default({ checkout: handleSubmit, loading: loading.value, disabled: props.disabled }))
  : hx('button', { class: props.buttonClass, disabled: loading.value || props.disabled, onClick: handleSubmit },
      loading.value ? [hx('span', { class: 'vue-stripe-loading-spinner' }), ` ${props.loadingText}`] : props.buttonText)
```

- [ ] **Step 6: `VueStripePricingTable.ts`** — `hx('stripe-pricing-table', { 'pricing-table-id': props.pricingTableId, 'publishable-key': publishableKey, 'customer-email': props.customerEmail, 'customer-session-client-secret': props.customerSessionClientSecret, 'client-reference-id': props.clientReferenceId, style: { display: loading.value || error.value ? 'none' : undefined } })`. Render-function string tags are never resolved as components, which also fixes the "Failed to resolve component: stripe-pricing-table" warning (#395).

- [ ] **Step 7: Verify — this is the moment the Vue 2 claim becomes true**

```bash
pnpm lint && pnpm type-check && pnpm test && pnpm build && pnpm --filter @vue-stripe/vue2-smoke test
grep -oE "import \{[^}]+\} from ['\"]vue-demi['\"]" packages/vue-stripe/dist/es/index.js
```
Expected: smoke `imports.test.ts` and `mount.test.ts` pass; the bundle import list contains none of the 13 Vue-3-only names.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "refactor!: providers, checkout button and pricing table as render functions — bundle is Vue 2.7-safe"
```

### Task 3.5: Build pipeline without SFC tooling; single type generator

**Files:**
- Modify: `packages/vue-stripe/vite.config.ts`, `vitest.config.ts`, `tsconfig.build.json`, `tsconfig.json`, `package.json` (scripts + devDeps), `eslint.config.js`

- [ ] **Step 1:** Remove `@vitejs/plugin-vue`, `vite-plugin-dts`, `vue-tsc`, `eslint-plugin-vue` from devDependencies. `vite.config.ts`: drop the `vue()` and `dts()` plugins and the `'vue': 'vue-demi'` alias (no SFC output remains; source imports `vue-demi` directly). `vitest.config.ts`: drop `vue()`. `tsconfig.build.json`: `include: ["src/**/*.ts"]`, `declarationMap: false`, add `"incremental": false`. Scripts: `"type-check": "tsc --noEmit -p tsconfig.json"`, `"typecheck"` same; `"build": "vite build && tsc -p tsconfig.build.json"`. `eslint.config.js`: remove `pluginVue` and `files: ['**/*.vue']`.
- [ ] **Step 2: Verify** — `pnpm lint && pnpm type-check && pnpm test:coverage && pnpm build && /bin/ls dist/types` (no `.tsbuildinfo`, no `.d.ts.map`) and `pnpm --filter @vue-stripe/vue2-smoke test`.
- [ ] **Step 3: Commit** — `git commit -am "build: drop SFC tooling and duplicate d.ts generation"`.

### Task 3.6: Peer range `vue ^2.7.0 || ^3.0.0`, docs for Vue 2.7

**Files:**
- Modify: `packages/vue-stripe/package.json` (`peerDependencies.vue`), `apps/docs/guide/installation.md`, `CLAUDE.md`

- [ ] **Step 1:** `"vue": "^2.7.0 || ^3.0.0"` (Vue 2.6 needs `@vue/composition-api`, lacks `expose`/`useSlots`, and is end-of-life — dropped; say so in the migration guide).
- [ ] **Step 2:** `installation.md`: a "Vue 2.7" section — `npm i @vue-stripe/vue-stripe @stripe/stripe-js vue@2.7`, `import '@vue-stripe/vue-stripe/style.css'`, usage with `h()`/templates (components are plain `defineComponent` objects), note that `vue-demi` picks the runtime automatically. Update the requirements line to `@stripe/stripe-js ^10.0.0` and `Vue 2.7 or Vue 3`.
- [ ] **Step 3:** `CLAUDE.md`: replace the "Two element-component patterns" section with "One pattern: factory definitions in `.ts`; no `.vue` files in `src/`; Vue 2.7 compatibility is enforced by `packages/vue2-smoke`"; mention `./style.css`.
- [ ] **Step 4: Commit** — `git commit -am "docs: Vue 2.7 support, stylesheet import, peer ranges for v6"`.

---

## Phase 4 — Workflow hardening

### Task 4.1: `publish.yml` provenance, tag guard, coverage; `docs.yml` triggers; action pins

**Files:**
- Modify: `.github/workflows/publish.yml`, `.github/workflows/docs.yml`

- [ ] **Step 1: publish.yml**
```yaml
permissions:
  contents: write
  id-token: write
jobs:
  publish:
    if: startsWith(github.ref, 'refs/tags/v')      # manual runs must still be from a tag
    steps:
      # …
      - name: Test (coverage thresholds + doc-contract)
        run: pnpm --filter @vue-stripe/vue-stripe test:coverage
      - name: Vue 2.7 smoke
        run: pnpm --filter @vue-stripe/vue-stripe build && pnpm --filter @vue-stripe/vue2-smoke test
      - name: Verify tag matches package version
        run: test "v$(node -p "require('./packages/vue-stripe/package.json').version")" = "$GITHUB_REF_NAME"
      - name: Publish to npm
        working-directory: packages/vue-stripe
        run: npm publish --access public --provenance
```
- [ ] **Step 2: docs.yml** — `paths: ['apps/docs/**', 'packages/vue-stripe/**', '.github/workflows/docs.yml']` so library changes redeploy the live demos.
- [ ] **Step 3: Verify** — `act` is optional; at minimum `pnpm --filter @vue-stripe/vue-stripe test:coverage` passes locally and YAML lints (`npx yaml-lint .github/workflows/*.yml`).
- [ ] **Step 4: Commit** — `git commit -am "ci: provenance publish, tag/version guard, coverage + vue2 smoke on release, docs redeploy on lib changes"`.

---

## Phase 5 — Documentation (`apps/docs`)

### Task 5.1: Remove bank-element pages and examples

**Files:**
- Delete: `api/components/stripe-{ideal,p24,eps,fpx}-bank-element.md`, `guide/{ideal,p24,eps,fpx}-bank-element.md`, `live-demo/{ideal-payment,p24-payment,eps-payment,fpx-payment}.md`, `.vitepress/theme/components/examples/{IdealPaymentExample,P24ElementExample,EpsElementExample,FpxPaymentExample}.vue`
- Modify: `.vitepress/config.ts` (sidebar groups "European Elements", "APAC Elements", "Regional Payment Methods", "APAC Payments"), `api/index.md`, `live-demo/index.md`, `guide/approaches.md`

- [ ] **Step 1:** `git rm` the files; remove the sidebar entries; in `api/index.md` and `live-demo/index.md` remove the rows; in each remaining page that linked to them, point to the Payment Element page with the sentence "Stripe removed the standalone iDEAL, P24, EPS and FPX elements in Stripe.js Clover (8.0); collect these payment methods with the Payment Element."
- [ ] **Step 2: Verify** — `pnpm docs:build` passes with `ignoreDeadLinks: false`.
- [ ] **Step 3: Commit** — `git commit -am "docs!: remove iDEAL/P24/EPS/FPX pages (elements removed by Stripe)"`.

### Task 5.2: Update changed API pages

**Files:**
- Modify: `api/components/stripe-elements.md` (remove `paymentMethodTypes` row; add "`options.allowedPaymentMethodTypes`" tip; note `elements.update()` is async and failures surface via `@error`), `api/components/stripe-checkout.md` + `api/composables/use-stripe-checkout.md` (`sessionUrl` only; server creates the session), `api/components/stripe-checkout-provider.md` (rename heading to `VueStripeCheckoutElementsProvider`, alias note, props `clientSecret: string | Promise<string>`, `fetchClientSecret`, `elementsOptions`, `adaptivePricing`, `defaultValues`; events `ready(actions)`, `change(session)`, `error`; slot props), `api/composables/use-checkout-session.md` (new `actions`, `validateElements`, `addOptionalLineItem`, `removeOptionalLineItem`, `loadFonts`; "not ready" sentinel), `api/components/stripe-address-element.md` (`@loaderror`, `getValue({ format })`, Latin `state` default, `#loading`/`#error` slots), `api/components/stripe-provider.md` (`betas` prop), `api/components/stripe-pricing-table.md` (remove the `isCustomElement` workaround if present — no longer needed; keep a Nuxt note), `api/components/*.md` for Card/IBAN/AU/Link/Payment/Express (mention `#loading`/`#error` slots are uniform; `loaderror` casing), `api/types.md` (new re-exported types), `guide/checkout.md`, `guide/approaches.md`, `guide/installation.md`.
- [ ] **Step 1:** Edit; keep `tests/docs-contract.test.ts` green (`DOCS_CONTRACT_STRICT=1 pnpm vitest run tests/docs-contract.test.ts`).
- [ ] **Step 2:** `pnpm docs:build`.
- [ ] **Step 3: Commit** — `git commit -am "docs: API pages for Stripe.js 10 (Checkout Elements SDK, URL-only checkout, Elements options)"`.

### Task 5.3: New pages — Tax ID, Currency Selector, Custom Checkout guide + demo, Payment Method Messaging guide

**Files:**
- Create: `api/components/stripe-tax-id-element.md`, `api/components/stripe-currency-selector-element.md`, `guide/custom-checkout.md`, `guide/payment-method-messaging.md`, `live-demo/custom-checkout.md`, `.vitepress/theme/components/examples/CustomCheckoutExample.vue`
- Modify: `.vitepress/config.ts` sidebar (add under "Element Components", "Core Concepts"/"Advanced", "Live Demo › One-Time Payments"), `api/index.md`, `live-demo/index.md`

- [ ] **Step 1:** Each API page follows `DOCUMENTATION_PATTERNS.md`: Props (`options`), Events (`@ready`, `@change`, `@focus`, `@blur`, `@escape`, `@loaderror`), Exposed (`element`, `loading`, `error`, `focus`, `blur`, `clear`, Tax ID: `getValue`), Slots (`#loading`, `#error`), "Requires `<VueStripeCheckoutElementsProvider>`; Tax ID also requires `betas` on the provider — see Stripe's Tax ID docs", example with `useCheckoutSession().updateTaxIdInfo`.
- [ ] **Step 2:** `guide/custom-checkout.md` walks: server creates session with `ui_mode: 'elements'` + `return_url` (backend Task 7.1) → `<VueStripeCheckoutElementsProvider :client-secret="promise">` → `<VueStripePaymentElement>` + `<VueStripeAddressElement :options="{ mode: 'billing' }">` + optional Tax ID / Currency Selector → `const { confirm, session, loading } = useCheckoutSession()` → `confirm({ returnUrl })`; mention saved payment methods default (Clover) and `elementsOptions.savedPaymentMethod`.
- [ ] **Step 3:** `CustomCheckoutExample.vue` uses the backend `POST /api/checkout-session { uiMode: 'elements' }` and is embedded by `live-demo/custom-checkout.md` like the other 14-line demo pages.
- [ ] **Step 4:** `pnpm vitest run tests/docs-contract.test.ts && pnpm docs:build`.
- [ ] **Step 5: Commit** — `git commit -am "docs: Tax ID + Currency Selector API, Custom Checkout guide/demo, Payment Method Messaging guide"`.

### Task 5.4: Migration guide v5 → v6 and stale planning docs

**Files:**
- Create: `apps/docs/guide/migration-v6.md` (sidebar: Getting Started)
- Delete: `docs/vue-stripe-feature-roadmap.md`, `docs/vuestripe-vs-stripejs-gap-analysis.md ` (note the trailing space: `git rm "docs/vuestripe-vs-stripejs-gap-analysis.md "`), `docs/v8-migration.md`, `docs/pricing-table-plan.md`

- [ ] **Step 1: Write the guide** with this table (every row is a real change in this plan):

| v5.x | v6.0 | Why |
|---|---|---|
| `@stripe/stripe-js ^7.5 \|\| ^8.5` | `^10.0.0` | Endive |
| `vue ^2.6 \|\| ^3` | `^2.7 \|\| ^3` | `expose`/`useSlots`; 2.6 EOL |
| `VueStripeIdealBankElement`, `…P24…`, `…Eps…`, `…Fpx…` | `VueStripePaymentElement` | removed by Stripe (Clover) |
| `<VueStripeElements :payment-method-types>` | `:options="{ allowedPaymentMethodTypes }"` or Dashboard | removed by Stripe (Endive) |
| `<VueStripeCheckout :session-id / :price-id>` | `<VueStripeCheckout :session-url>` | `redirectToCheckout` removed (Clover) |
| `useStripeCheckout().redirectToCheckout({ sessionId })`, `LegacyCheckoutOptions` | `redirectToUrl(url)` / `redirectToCheckout({ url })` | same |
| `<VueStripeCheckoutProvider :fetch-client-secret>` | `<VueStripeCheckoutElementsProvider :client-secret="stringOrPromise">` (old name kept as alias; `fetchClientSecret` still accepted) | `initCheckoutElementsSdk` |
| `useCheckoutSession().checkout` is `StripeCheckout` | `checkout` is `StripeCheckoutElementsSdk`; methods come from `actions` | `loadActions()` |
| `@loadError` on Address | `@loaderror` | consistent with Stripe/other elements |
| Component styles inlined | `import '@vue-stripe/vue-stripe/style.css'` | render-function components |
| `VueStripeLoadError`, `createVueStripeError` | removed | dead code |
| Address `state` locale-formatted | Latin by default; `getValue({ format: 'localized' })` | Dahlia |

- [ ] **Step 2:** `git rm` the stale planning docs (their open items are now GitHub issues in milestones #6/#7).
- [ ] **Step 3: Commit** — `git commit -am "docs: v5→v6 migration guide; remove stale planning docs"`.

---

## Phase 6 — Playground (`apps/playground`)

### Task 6.1: Remove bank views; URL-only checkout view

**Files:**
- Delete: `src/views/{IdealBank,P24Bank,EpsBank,FpxBank}ElementView.vue`
- Modify: `src/router.ts` (imports + 4 routes), `src/App.vue` (nav items), `src/views/CheckoutView.vue` (use `sessionUrl` from `POST /api/checkout-session`)

- [ ] **Step 1:** Delete/edit; `pnpm --filter @vue-stripe/playground exec vue-tsc --noEmit && pnpm --filter @vue-stripe/playground build`.
- [ ] **Step 2: Commit** — `git commit -am "chore(playground): remove bank-element views; checkout view uses session URL"`.

### Task 6.2: Custom Checkout view on the new provider; Tax ID + Currency Selector demos; stylesheet

**Files:**
- Modify: `src/views/CustomCheckoutView.vue`, `src/main.ts` (`import '@vue-stripe/vue-stripe/style.css'`)
- Modify: `src/router.ts` (route meta description)

- [ ] **Step 1:** View requests `POST /api/checkout-session { uiMode: 'elements', returnUrl }` → passes the `clientSecret` Promise directly to `<VueStripeCheckoutElementsProvider :client-secret="clientSecretPromise">`; renders `<VueStripePaymentElement>`, `<VueStripeAddressElement :options="{ mode: 'billing' }">`, `<VueStripeCurrencySelectorElement>`, `<VueStripeTaxIdElement>`; shows `session.total.total.amount`, `canConfirm`; button calls `confirm({ returnUrl, redirect: 'if_required' })`.
- [ ] **Step 2:** `pnpm --filter @vue-stripe/playground build`; manual check with `pnpm dev` against the backend (test keys) — card `4242 4242 4242 4242` confirms.
- [ ] **Step 3: Commit** — `git commit -am "feat(playground): custom checkout on Checkout Elements SDK with Tax ID and Currency Selector"`.

---

## Phase 7 — Backend (`apps/backend`)

### Task 7.1: Checkout Session route supports `uiMode`; remove bank-intent routes/pages

**Files:**
- Modify: `src/app/api/checkout-session/route.ts`
- Delete: `src/app/api/{eps,fpx,ideal,p24}-intent/route.ts`, `src/app/{eps,fpx,ideal,p24}-intent/page.tsx`
- Modify: `src/app/page.tsx` (endpoint list)

- [ ] **Step 1: Route** — after computing `lineItems`:

```ts
    const uiMode = (body.uiMode as 'hosted' | 'elements' | 'embedded_page' | 'form' | undefined) ?? 'hosted'
    const returnUrl = body.returnUrl || `${FRONTEND_URL}/custom-checkout?result=success&session_id={CHECKOUT_SESSION_ID}`

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: body.mode || 'payment',
      ...(uiMode === 'hosted'
        ? {
            success_url: body.successUrl || `${FRONTEND_URL}/stripe-checkout?result=success`,
            cancel_url: body.cancelUrl || `${FRONTEND_URL}/stripe-checkout?result=cancel`,
          }
        : { ui_mode: uiMode, return_url: returnUrl }),
      ...(body.customerEmail && { customer_email: body.customerEmail }),
      ...(body.taxIdCollection && { tax_id_collection: { enabled: true } }),
      ...(body.metadata && { metadata: body.metadata }),
    })

    return NextResponse.json({ url: session.url, sessionId: session.id, clientSecret: session.client_secret })
```
Document `uiMode`, `returnUrl`, `taxIdCollection` in the `GET` health-check `parameters`.

- [ ] **Step 2:** `git rm` the four intent routes and pages; remove their cards from `page.tsx`.
- [ ] **Step 3: Verify** — `pnpm --filter @vue-stripe/backend lint && pnpm --filter @vue-stripe/backend build`; with test keys: `curl -X POST localhost:3002/api/checkout-session -d '{"uiMode":"elements"}' -H 'content-type: application/json'` returns a `clientSecret` starting with `cs_test_`.
- [ ] **Step 4: Commit** — `git commit -am "feat(backend): checkout-session uiMode (hosted|elements|embedded_page|form); remove bank-intent routes"`.

---

## Phase 8 — Release v6.0.0

### Task 8.1: Version, release notes, README, CLAUDE.md, close-out

**Files:**
- Modify: `packages/vue-stripe/package.json` (`version: 6.0.0`), `packages/vue-stripe/README.md` + root `README.md` (peer table, Vue 2.7 note, `style.css`, removed components), `CLAUDE.md` (architecture section: factory-only, `packages/vue2-smoke`, Stripe.js 10 naming), `packages/vue-stripe/CHANGELOG.md` (one "6.0.0" entry linking the migration guide; detailed notes are auto-generated on the GitHub Release)

- [ ] **Step 1:** Final gate from the repo root: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm --filter @vue-stripe/vue2-smoke test && pnpm audit --audit-level critical`.
- [ ] **Step 2:** Commit `chore: bump version to 6.0.0`, merge to `main`, `git tag v6.0.0 && git push origin v6.0.0` (publish workflow runs with provenance).
- [ ] **Step 3:** Verify `npm view @vue-stripe/vue-stripe@6.0.0 peerDependencies` shows `@stripe/stripe-js ^10.0.0` and `vue ^2.7.0 || ^3.0.0`; the GitHub Release body links `guide/migration-v6`.
- [ ] **Step 4:** Close milestone #6.

---

## Phase 9 — v6.1.0 parity (milestone #7, additive, each its own PR)

All element tasks are factory definitions + a test file + an API doc page + a coverage-matrix row + a playground route; providers follow Task 2.5's shape.

### Task 9.1: `VueStripeEmbeddedCheckout` (`createEmbeddedCheckoutPage`) — closes #379
- Props: `clientSecret?: string`, `fetchClientSecret?: () => Promise<string>`, `onShippingDetailsChange?`, `onLineItemsChange?` (function props because Stripe expects a `Promise<ResultAction>` return). Emits: `ready(checkout)`, `complete`, `analytics(event)`, `error(message)`. Lifecycle: `await stripe.createEmbeddedCheckoutPage(opts)` → `mount(el)` → `onUnmounted: destroy()`; Stripe allows one instance per page — guard with a module-level flag and a clear error. Tests: mount/destroy, `onComplete` → `complete`, rejects when neither secret prop given, second instance errors. Docs: `api/components/stripe-embedded-checkout.md`, `guide/embedded-checkout.md`, live demo via backend `uiMode: 'embedded_page'`.

### Task 9.2: Checkout Form SDK — `VueStripeCheckoutFormProvider`, `VueStripeCheckoutForm`, `useCheckoutForm`
- Provider: `stripe.initCheckoutFormSdk({ clientSecret, appearance, loader, fonts, savedPaymentMethod, defaultValues })`, `loadActions()`, provide `{ checkout, actions, session, loading, error }` under a new `stripeCheckoutFormInjectionKey`. `VueStripeCheckoutForm`: `sdk.createForm(options)`, events `ready`, `change`, `confirm(event)`, `loaderror`; exposes `getValue`, `setView`. `useCheckoutForm()` returns the form-SDK action subset (`StripeCheckoutFormLoadActionsSuccess`) + `confirm({ formConfirmEvent })`. Mark "beta — requires Stripe access" in docs (per the `.d.ts`). Backend: `uiMode: 'form'` already supported by Task 7.1.

### Task 9.3: `VueStripeContactDetailsElement`, `VueStripeTermsElement`, `VueStripeLinkSignupElement`
- Factory definitions with `checkout` creators (`createContactDetailsElement`, `createTermsElement`, `createLinkSignupElement`); `contactDetails` and `linkSignup` also work under `stripe.elements()`. Terms/Link Signup flagged beta in docs.

### Task 9.4: Issuing elements — closes #392
- Six definitions: `issuingCardNumberDisplay`, `issuingCardCvcDisplay`, `issuingCardExpiryDisplay`, `issuingCardPinDisplay`, `issuingCardCopyButton`, `issuingAddToWalletButton` (events: `ready`, `loaderror`, plus `change` for display elements). One shared doc page `api/components/stripe-issuing-elements.md` + `guide/issuing.md` (requires `createEphemeralKeyNonce` server flow — document, no composable).

### Task 9.5: `useFinancialConnections` and `useIdentity` — closes #393
- Thin wrappers over `stripe.collectFinancialConnectionsAccounts`, `collectBankAccountForPayment/Setup`, `verifyIdentity` with `loading`/`error` refs, mirroring `useHandleNextAction`.

### Task 9.6: Plugin as global provider — closes #424
- `createVueStripe()` loads Stripe once and `app.provide(stripeInjectionKey, …)` so `useStripe()` / `<VueStripeElements>` work without `<VueStripeProvider>`; provider still wins when present. Vue 2.7 path via `Vue.mixin({ provide })` guarded by `isVue2`.

### Task 9.7: docs-contract test covers props and exposed members
- Extend `tests/docs-contract.test.ts` to parse `props:` keys and `expose({ … })` keys from the factory definitions and assert each appears in the API page's Props/Exposed tables (removes the TODO at line 18).

### Task 9.8 (optional): Tailwind 4 for `apps/backend` and `apps/playground`
- Independent of Stripe; do last.

---

## Self-review

- **Spec coverage:** every row in §0 maps to a task (Checkout rename → 2.5; `redirectToCheckout` → 2.4; bank elements → 2.2/5.1/6.1/7.1; `paymentMethodTypes` → 2.3; `update()` Promise + Address → 2.8; PRB/messaging → 2.10; new elements → 2.7/9.3/9.4; Embedded/Form → 9.1/9.2; `betas` → 3.4; peer ranges → 2.1/3.6). User asks: Stripe docs comparison (§0), close/replace issues (milestones #6/#7 + issue map below), tests + acceptance criteria per issue (in each GitHub issue), docs plan (Phase 5), supporting apps (Phases 6–7), granular tasks (one PR each), dependency refresh to latest secure (Phase 1 + `pnpm audit --fix`), Vue 2 compatibility (Phase 3 with an enforcing CI job).
- **Placeholder scan:** none; `<v6.1 issue number>` in Task 2.10 is filled from the issue map below.
- **Type consistency:** `StripeCheckoutInstance` = `{ checkout, actions, session, loading, error }` is used identically in 2.5, 2.6, 3.2, 3.4; `ElementDefinition.events/defaultOptions/checkout/expose` names match 2.7, 3.2, 3.3; `hx` signature `(tag, props, children)` matches 3.2–3.4; `createStripeElement` export name unchanged.

## Issue map

Each task has exactly one GitHub issue; the issue carries the acceptance criteria and the test list.

**Milestone v6.0.0 — Stripe.js 10 (Endive)** ([#6](https://github.com/vue-stripe/vue-stripe/milestone/6))

| Task | Issue | Task | Issue | Task | Issue |
|---|---|---|---|---|---|
| 1.1 | #461 | 2.5 | #471 | 3.5 | #481 |
| 1.2 | #462 | 2.6 | #472 | 3.6 | #482 |
| 1.3 | #463 | 2.7 | #473 | 4.1 | #483 |
| 1.4 | #464 | 2.8 | #474 | 5.1 | #484 |
| 1.5 | #465 | 2.9 | #475 | 5.2 | #485 |
| 1.6 | #466 | 2.10 | #476 | 5.3 | #486 |
| 2.1 | #467 | 3.1 | #477 | 5.4 | #487 |
| 2.2 | #468 | 3.2 | #478 | 6.1 | #488 |
| 2.3 | #469 | 3.3 | #479 | 6.2 | #489 |
| 2.4 | #470 | 3.4 | #480 | 7.1 | #490 |
| | | | | 8.1 | #491 |

**Milestone v6.1.0 — Stripe.js 10 parity** ([#7](https://github.com/vue-stripe/vue-stripe/milestone/7))

| Task | Issue |
|---|---|
| 9.1 Embedded Checkout | #492 |
| 9.2 Checkout Form SDK | #493 |
| 9.3 Contact Details / Terms / Link Signup | #494 |
| 9.4 Issuing elements | #495 |
| 9.5 useFinancialConnections / useIdentity | #496 |
| 9.6 Plugin as global provider | #497 |
| 9.7 docs-contract props + expose | #498 |
| 9.8 Tailwind 4 (optional) | #499 |

**Superseded and closed by this plan:** PR #451 (built for 8.x `initCheckout`, which no longer exists in 10.x), Dependabot PRs #456–#460 (replaced by #463–#466), issues #377, #379, #380, #381, #382, #383, #384, #387, #391, #392, #393, #395, #407, #413, #421, #422, #424, #449, #450.
