# Vue Stripe Testing & Learning Guide

This document serves as an anchor for testing sessions and learning the implementation. Reference this when continuing component testing across multiple sessions.

## Quick Start: Setting Up Your Stripe Keys

**Important:** Use your own Stripe test keys! This lets you see payments in your Dashboard and understand the complete flow.

### Step 1: Start the Playground

```bash
pnpm dev  # Starts playground at http://localhost:3000
```

### Step 2: Add Your Stripe Key

1. Click the **"🔑 Add Key"** button in the playground header
2. Enter your **Publishable key** (starts with `pk_test_`)
   - Get it from [Stripe Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)
   - Make sure you're in **Test mode** (toggle in Dashboard header)
3. Click **"Save & Reload"**

Your key is stored in your browser's localStorage and persists across sessions. Click **"⚙️ Change"** to update it or **"Reset All"** to clear it.

### Later Phases (When Needed)

For Payment Element and payment processing, you'll need secrets from your backend:

| Phase | What You Need | How to Get It |
|-------|---------------|---------------|
| Phase 1-2 | Publishable Key only | Dashboard → API Keys |
| Phase 3+ | PaymentIntent clientSecret | Create via API or [Dashboard](https://dashboard.stripe.com/test/payments) → + Create → Payment |
| Phase 5 | SetupIntent clientSecret | Create via API for saving cards |
| Phase 6 | Checkout Session ID | Create via API |

> **Tip:** For quick testing, you can create a PaymentIntent directly in the Dashboard:
> Payments → + Create payment → Copy the `pi_xxx_secret_xxx` from the URL or API response

---

## Testing Philosophy

1. **Test one component/composable at a time** - Verify it works in the playground before moving on
2. **Understand the implementation** - Read the source code, understand the patterns
3. **Document learnings** - Capture insights for future maintenance
4. **Build incrementally** - Each component builds on the previous ones

## Component Hierarchy & Dependencies

```
StripeProvider (ROOT - loads Stripe.js)
    │
    ├── useStripe() - Access Stripe instance (reactive)
    │
    └── StripeElements (creates Elements instance)
            │
            ├── useStripeElements() - Access Elements instance (reactive)
            │
            ├── StripePaymentElement
            ├── StripeCardElement
            ├── StripeCardNumberElement
            ├── StripeCardExpiryElement
            ├── StripeCardCvcElement
            ├── StripeExpressCheckoutElement
            ├── StripeAddressElement (can also work standalone)
            └── StripeLinkAuthenticationElement
```

## Core Pattern: Provider + Composable

This library follows a consistent pattern across all components:

### 1. Provider Component (e.g., StripeProvider)
- Loads/initializes a resource asynchronously
- Uses Vue's `provide()` to share state with descendants
- Exposes reactive state: `loading`, `error`, and the main resource
- Emits events: `@load`, `@error`
- Provides slots: `#default`, `#loading`, `#error`

### 2. Composable (e.g., useStripe)
- Uses `inject()` to access the provided state
- Returns **readonly reactive refs** - prevents accidental mutation
- Throws descriptive error if used outside provider context
- Can be called from any descendant component

### 3. Access Patterns

**Pattern A: Event-based (one-time notification)**
```vue
<StripeProvider @load="onReady" @error="onError">
  <ChildComponent />
</StripeProvider>
```
Use for: Logging, analytics, one-time initialization

**Pattern B: Composable (reactive, recommended)**
```vue
<!-- Inside any child component -->
<script setup>
const { stripe, loading, error } = useStripe()

// stripe.value is reactive - use in templates or watchers
</script>
```
Use for: Building payment forms, conditional rendering, any reactive UI

**Pattern C: Automatic (child components)**
```vue
<StripeProvider>
  <StripeElements>
    <!-- These inject automatically -->
    <StripePaymentElement />
  </StripeElements>
</StripeProvider>
```
Use for: Using the pre-built Stripe element components

## Testing Progress Tracker

### Phase 1: Foundation (No Backend Required)
| Component | Status | Playground | Unit Tests | API Doc | Notes |
|-----------|--------|------------|------------|---------|-------|
| StripeProvider | ✅ Done | ✅ `/stripe-provider` | ✅ 10 tests | ✅ Complete | Loads Stripe.js, provides instance via inject |
| useStripe() | ✅ Done | ✅ `/use-stripe` | ✅ 3 tests | ✅ Complete | Returns reactive refs: stripe, loading, error |
| StripeAddressElement | ✅ Done | ✅ `/stripe-address-element` | ✅ 19 tests | ✅ Complete | Address collection with autocomplete, exposes getValue/focus/clear |

### Phase 2: Elements Container (Can test without clientSecret for CardElement)
| Component | Status | Playground | Unit Tests | API Doc | Notes |
|-----------|--------|------------|------------|---------|-------|
| StripeElements | ✅ Done | ✅ `/stripe-elements` | ✅ 10 tests | ✅ Complete | Creates Elements instance, provides via inject |
| useStripeElements() | ✅ Done | ✅ (via ElementsConsumer) | ✅ 7 tests | ✅ Complete | Returns reactive refs: elements, loading, error |

### Phase 3: Card Elements (Classic)
| Component | Status | Playground | Unit Tests | API Doc | Notes |
|-----------|--------|------------|------------|---------|-------|
| StripeCardElement | ✅ Done | ✅ `/stripe-card-element` | ✅ 16 tests | ✅ Complete | Single unified card input with styling options |
| Split Card Elements | ✅ Done | ✅ `/stripe-split-card` | ✅ 18 tests | ✅ Complete | Number + Expiry + CVC separate inputs |

### Phase 4: Modern Payment
| Component | Status | Playground | Unit Tests | API Doc | Notes |
|-----------|--------|------------|------------|---------|-------|
| StripePaymentElement | ✅ Done | ✅ `/stripe-payment-element` | ✅ 20 tests | ✅ Complete | All-in-one payment UI |
| usePaymentIntent() | ✅ Done | ✅ (via PaymentElement) | ✅ 13 tests | ✅ Complete | Confirm payments |

### Phase 5: Advanced Features
| Component | Status | Playground | Unit Tests | API Doc | Notes |
|-----------|--------|------------|------------|---------|-------|
| StripeLinkAuthenticationElement | ✅ Done | ✅ `/stripe-link-authentication` | ✅ 10 tests | ✅ Complete | Stripe Link email authentication, exposes focus/blur/clear |
| StripeExpressCheckoutElement | ⬜ Pending | ⬜ | ⬜ | ⬜ | Apple/Google Pay |
| useSetupIntent() | ⬜ Pending | ⬜ | ⬜ | ⬜ | Save payment methods |

### Phase 6: Checkout Flow
| Component | Status | Playground | Unit Tests | API Doc | Notes |
|-----------|--------|------------|------------|---------|-------|
| StripeCheckout | ⬜ Pending | ⬜ | ⬜ | ⬜ | Redirect to hosted checkout |
| useStripeCheckout() | ⬜ Pending | ⬜ | ⬜ | ⬜ | Programmatic redirect |

### Test Summary
- **Total Unit Tests**: 126 passing (10 test files)
- **Playground Views**: 9 complete (`/stripe-provider`, `/use-stripe`, `/stripe-elements`, `/stripe-card-element`, `/stripe-split-card`, `/stripe-payment-element`, `/stripe-address-element`, `/stripe-link-authentication`, `/`)
- **API Docs**: 10 complete (StripeProvider, StripeElements, StripeCardElement, Split Card Elements, StripePaymentElement, StripeAddressElement, StripeLinkAuthenticationElement, useStripe, useStripeElements, usePaymentIntent)

### Documentation Checklist

When completing a component, ensure the following are updated:

1. **Playground View** - Interactive test page at `apps/playground/src/views/`
2. **Unit Tests** - Test file at `packages/vue-stripe/tests/components/`
3. **API Doc** - Documentation at `apps/docs/api/components/`
4. **VitePress Sidebar** - Add to `apps/docs/.vitepress/config.ts`
5. **This Guide** - Update progress tracker above
6. **READMEs** - Update root `README.md` and `packages/vue-stripe/README.md` with new features

## Key Implementation Details

### Injection Keys (`src/utils/injection-keys.ts`)
```typescript
// Type-safe injection keys for Vue's provide/inject
export const stripeInjectionKey: InjectionKey<StripeContext>
export const stripeElementsInjectionKey: InjectionKey<StripeElementsContext>
```

### Context Types (`src/types/index.ts`)
```typescript
interface StripeContext {
  stripe: Ref<Stripe | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}

interface StripeElementsContext {
  elements: Ref<StripeElements | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}
```

### Error Classes (`src/utils/errors.ts`)
- `StripeProviderError` - Thrown when composable used outside provider
- `StripeElementsError` - Thrown when element used outside StripeElements

## Stripe.js Type Compatibility Notes

The `@stripe/stripe-js` v7.x types are strict and have complex overloads. When encountering type errors:

1. **Element event handlers** - Use type assertions for events not in base types
2. **confirmPayment API** - Changed signature in v7, requires clientSecret in options
3. **Elements creation** - Use `any` assertion for options due to union type complexity
4. **Locale types** - Import from StripeConstructorOptions, not plain string

## Playground Configuration

The playground uses **localStorage** to store your Stripe configuration. No `.env` files needed!

### How It Works
- Click **"🔑 Add Key"** in the playground header to configure
- Keys are stored in `localStorage` under `vue-stripe-playground-config`
- Configuration persists across browser sessions
- Click **"⚙️ Change"** to modify or **"Reset All"** to clear

### Storage Details
```javascript
// localStorage key
'vue-stripe-playground-config'

// Stored structure
{
  publishableKey: 'pk_test_...',   // Required for all tests
  clientSecret: 'pi_..._secret_...', // Phase 3+ (PaymentIntent)
  setupSecret: 'seti_..._secret_...', // Phase 5 (SetupIntent)
  sessionId: 'cs_test_...'           // Phase 6 (Checkout Session)
}
```

### Getting Test Values
1. **Publishable Key**: [Stripe Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)
2. **Client Secret**: Create PaymentIntent via Dashboard or API
3. **Setup Secret**: Create SetupIntent via Dashboard or API
4. **Session ID**: Create Checkout Session via Dashboard or API

## Resuming a Testing Session

When continuing testing in a new session:

1. Check this guide for current progress (Phase X, Component Y)
2. Read the component source: `packages/vue-stripe/src/components/[Name].vue`
3. Read the composable source: `packages/vue-stripe/src/composables/use[Name].ts`
4. Start the playground: `pnpm dev`
5. Your Stripe key should already be in localStorage (check header banner)
6. Navigate to the test page or create one if needed
7. Update progress in this guide when verified

## Questions to Answer for Each Component

1. **What does it do?** - Core purpose
2. **What props does it accept?** - Configuration options
3. **What events does it emit?** - Lifecycle notifications
4. **What slots does it provide?** - Customization points
5. **What does it provide/inject?** - Context sharing
6. **What are the error cases?** - What can go wrong
7. **How do developers use it?** - Practical code examples
