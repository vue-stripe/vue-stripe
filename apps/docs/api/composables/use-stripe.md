---
title: "useStripe: access the Stripe.js instance"
description: "useStripe reference: get the Stripe instance and its loading and error state in any Vue component under VueStripeProvider or the createVueStripe plugin."
---

# useStripe

Returns the `Stripe` instance and its loading and error state. Call it in a component rendered inside [`VueStripeProvider`](/api/components/stripe-provider), or anywhere in an app that installs [`createVueStripe()`](/api/plugin). [How Vue Stripe works](/guide/architecture#why-composables-must-run-inside-the-providers) explains why it must run inside the provider.

## Usage

```vue
<!-- StripeStatus.vue, rendered inside VueStripeProvider -->
<script setup>
import { computed } from 'vue'
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe, loading, error } = useStripe()

const ready = computed(() => !loading.value && !error.value && stripe.value !== null)
</script>

<template>
  <p v-if="loading">Loading Stripe...</p>
  <p v-else-if="error">{{ error }}</p>
  <slot v-else-if="ready" />
</template>
```

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `stripe` | `Readonly<Ref<Stripe \| null>>` | The Stripe instance |
| `loading` | `Readonly<Ref<boolean>>` | True while Stripe.js is loading |
| `error` | `Readonly<Ref<string \| null>>` | Error message if loading failed |
| `initialize` | `() => Promise<void>` | No-op kept for API consistency; initialization is handled by the provider. |

All return values are **readonly refs** - you can read their `.value` but cannot modify them.

## Behaviour

- **Throws outside a provider.** Called outside `VueStripeProvider` in an app that does not install `createVueStripe()`, `useStripe()` throws a `VueStripeProviderError`: `useStripe must be called within a VueStripeProvider component or an app using createVueStripe()`. Calling it in the same component that renders the provider counts as outside: call it in a child component. [Troubleshoot common problems](/guide/troubleshooting#providers-and-composables) shows the fix.
- **Calling Stripe.js.** Every Stripe.js method has a wrapping composable ([`usePaymentIntent`](/api/composables/use-payment-intent), [`useSetupIntent`](/api/composables/use-setup-intent), [`useCreatePaymentMethod`](/api/composables/use-create-payment-method), the [`useConfirm*` composables](/api/composables/confirm/), ...). They inject the same instance, track `loading` / `error`, and handle the not-yet-loaded case, so use `useStripe()` for readiness and state rather than for calling `stripe.value.<method>()` yourself.

## TypeScript

```ts
import { useStripe } from '@vue-stripe/vue-stripe'
import type { UseStripeReturn } from '@vue-stripe/vue-stripe'

const { stripe, loading, error }: UseStripeReturn = useStripe()

// stripe.value is typed as Stripe | null
```

## See Also

- [VueStripeProvider](/api/components/stripe-provider) - The provider component
- [createVueStripe](/api/plugin) - Provide Stripe app-wide
- [useStripeElements](/api/composables/use-stripe-elements) - Access the Elements instance
- [How Vue Stripe works](/guide/architecture) - The provider chain
- [How Stripe.js is loaded](/guide/stripe-js-loading) - When the instance becomes available
- [Troubleshoot common problems](/guide/troubleshooting#providers-and-composables) - Provider and composable errors
