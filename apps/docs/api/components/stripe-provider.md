# VueStripeProvider

The root component that loads Stripe.js and provides the Stripe instance to all descendant components.

## What is StripeProvider?

StripeProvider is the foundation of any Vue Stripe integration. It handles:

| Capability | Description |
|------------|-------------|
| **Stripe.js Loading** | Asynchronously loads Stripe.js from Stripe's CDN |
| **Instance Management** | Creates and manages the Stripe instance lifecycle |
| **Context Provision** | Makes Stripe available to all child components via Vue's provide/inject |
| **Error Handling** | Catches and exposes loading errors for graceful degradation |

## How It Works

```mermaid
flowchart TD
    A["StripeProvider mounts with publishableKey"] --> B["Calls loadStripe() from @stripe/stripe-js<br/>(Shows #loading slot while waiting)"]
    B --> C{Result?}
    C -->|Success| D["<b>SUCCESS</b><br/>1. Store Stripe in ref<br/>2. provide() to tree<br/>3. Emit @load event<br/>4. Render #default"]
    C -->|Failure| E["<b>FAILURE</b><br/>1. Store error message<br/>2. Emit @error event<br/>3. Show #error slot"]
    D --> F["Child components access Stripe via<br/>useStripe() composable or inject<br/>stripeInjectionKey directly"]
    E --> F
```

## Usage

```vue
<template>
  <VueStripeProvider
    :publishable-key="publishableKey"
    @load="onLoad"
    @error="onError"
  >
    <!-- Your payment components -->
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const onLoad = (stripe) => {
  console.log('Stripe loaded!', stripe)
}

const onError = (error) => {
  console.error('Failed to load Stripe:', error)
}
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `publishableKey` | `string` | Yes* | Your Stripe publishable key |
| `stripeKey` | `string` | Yes* | Alias for `publishableKey` (backwards compatibility) |
| `stripeAccount` | `string` | No | Connected account ID for Stripe Connect |
| `apiVersion` | `string` | No | Override Stripe API version |
| `locale` | `string` | No | Locale for Stripe.js (e.g., 'en', 'es', 'fr') |
| `options` | `object` | No | Additional Stripe initialization options |

\* Either `publishableKey` or `stripeKey` is required.

### Options Object

The `options` prop accepts the following shape. This is illustrative only — `StripeProviderOptions` is not an exported type:

```ts
// Illustrative shape (not an exported type)
{
  stripeAccount?: string
  apiVersion?: string
  locale?: string
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@load` | `Stripe` | Emitted when Stripe.js loads successfully |
| `@error` | `Error` | Emitted when Stripe.js fails to load |

## Slots

### Default Slot

Rendered when Stripe is ready:

```vue
<VueStripeProvider :publishable-key="key">
  <MyPaymentForm />
</VueStripeProvider>
```

### Loading Slot

Rendered while Stripe.js is loading:

```vue
<VueStripeProvider :publishable-key="key">
  <template #loading>
    <div class="spinner">Loading payment form...</div>
  </template>

  <MyPaymentForm />
</VueStripeProvider>
```

### Error Slot

Rendered when Stripe.js fails to load:

```vue
<VueStripeProvider :publishable-key="key">
  <template #error="{ error }">
    <div class="error">
      Failed to load payment form: {{ error }}
    </div>
  </template>

  <MyPaymentForm />
</VueStripeProvider>
```

## Provides

StripeProvider uses Vue's `provide` to expose a single object under the `stripeInjectionKey` symbol. That object groups the Stripe state together:

| Property | Type | Description |
|----------|------|-------------|
| `stripe` | `Ref<Stripe \| null>` | The Stripe instance |
| `loading` | `Ref<boolean>` | Whether Stripe is loading |
| `error` | `Ref<string \| null>` | Error message if loading failed |

Access this object using the [useStripe](/api/composables/use-stripe) composable, which injects `stripeInjectionKey` and returns `{ stripe, loading, error }`.

StripeProvider also provides the resolved configuration (`publishableKey`, `stripeAccount`, `apiVersion`, `locale`) as a separate object under the `stripeConfigInjectionKey` symbol, used internally by descendant components.

## Examples

### Basic Usage

```vue
<VueStripeProvider :publishable-key="pk_test_...">
  <VueStripeElements :client-secret="secret">
    <VueStripePaymentElement />
  </VueStripeElements>
</VueStripeProvider>
```

### With Stripe Connect

```vue
<VueStripeProvider
  :publishable-key="pk_test_..."
  stripe-account="acct_1234567890"
>
  <!-- Payments go to connected account -->
</VueStripeProvider>
```

### With Custom Locale

```vue
<VueStripeProvider
  :publishable-key="pk_test_..."
  locale="es"
>
  <!-- Stripe Elements will be in Spanish -->
</VueStripeProvider>
```

### With All Slots

```vue
<VueStripeProvider
  :publishable-key="publishableKey"
  @load="onStripeLoad"
  @error="onStripeError"
>
  <template #loading>
    <LoadingSpinner message="Connecting to payment provider..." />
  </template>

  <template #error="{ error }">
    <ErrorMessage
      :message="error"
      @retry="retryLoad"
    />
  </template>

  <PaymentForm />
</VueStripeProvider>
```

## Error Handling

StripeProvider handles these error cases:

| Error | Cause | Solution |
|-------|-------|----------|
| Missing key | No `publishableKey` or `stripeKey` provided | Provide a valid key |
| Network error | Failed to load Stripe.js from CDN | Check network, use `@error` to show retry option |

An invalid publishable key is not validated up front; it surfaces as a load failure through the `@error` event.

```vue
<script setup>
const handleError = (error) => {
  if (error.message.includes('network')) {
    // Show retry button
  } else {
    // Load failed (e.g. invalid key) - log to monitoring
  }
}
</script>
```

## TypeScript

```ts
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import type { Stripe } from '@stripe/stripe-js'

const onLoad = (stripe: Stripe) => {
  // stripe is fully typed
}
```

## See Also

- [useStripe](/api/composables/use-stripe) - Access Stripe instance in child components
- [StripeElements](/api/components/stripe-elements) - Create Elements instance
- [Architecture Guide](/guide/architecture) - Understand the component hierarchy
