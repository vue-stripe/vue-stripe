---
title: "usePricing: Stripe Pricing SDK in Vue (beta)"
description: "usePricing reference: explicitly initialize Stripe's beta Pricing SDK for currency selection, localized prices and pricing tokens in Vue 3 and Vue 2.7."
---

# usePricing

Initialize Stripe's beta Pricing SDK for price localization and currency selection. Wraps `stripe.initializePricing(options)` and exposes the returned `Pricing` instance without wrapping its methods.

Call `usePricing()` in a component's setup within a `<VueStripeProvider>` or an app using [`createVueStripe()`](/api/plugin). No `<VueStripeElements>` or Checkout provider is needed. This is separate from the Dashboard-configured [`VueStripePricingTable`](/api/components/stripe-pricing-table) and the Checkout Session's [`VueStripeCurrencySelectorElement`](/api/components/stripe-currency-selector-element).

::: warning Stripe beta; not verified end to end
The Pricing SDK requires beta access. Contact [Stripe support](https://support.stripe.com/) for access and pricing policy configuration. Its types are available in `@stripe/stripe-js` 10.2.1 and later; types alone do not grant access. Vue Stripe has no beta-access sandbox for this feature, so successful initialization and SDK operations have **not** been verified against Stripe. See [what is not yet verified](/coverage#not-yet-verified-end-to-end).
:::

## Usage

Initialization is explicit: calling `usePricing()` does not initialize the Pricing SDK. Call `initializePricing()` when your app is ready, with a pricing policy configured for your integration.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usePricing } from '@vue-stripe/vue-stripe'

const props = defineProps<{ pricingPolicy: string; priceId: string }>()
const { pricing, initializePricing, loading, error } = usePricing()
const displayAmount = ref<string | null>(null)
const operationError = ref<string | null>(null)

const loadPrice = async () => {
  displayAmount.value = null
  operationError.value = null
  const sdk = await initializePricing({ pricingPolicy: props.pricingPolicy })
  if (!sdk) return // initialization failed; error is set

  // SDK operations reject normally: handle them separately from initialization.
  try {
    const price = await sdk.resolvePrice(props.priceId)
    displayAmount.value = price.unitAmount?.amount ?? null
  } catch (cause) {
    operationError.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <button :disabled="loading" @click="loadPrice">Load localized price</button>
  <p v-if="error">{{ error }}</p>
  <p v-if="operationError">{{ operationError }}</p>
  <p v-if="pricing && displayAmount">{{ displayAmount }}</p>
</template>
```

`loading` tracks initialization only, not `resolvePrice()` or any other operation on the returned SDK. Track operation state separately if you need to disable controls while those calls run.

## Return Value

```ts
import type { Ref } from 'vue'
import type { InitializePricingOptions, Pricing } from '@stripe/stripe-js'

interface UsePricingReturn {
  pricing: Readonly<Ref<Pricing | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  initializePricing: (options: InitializePricingOptions) => Promise<Pricing | null>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `pricing` | `Readonly<Ref<Pricing \| null>>` | The latest successfully initialized SDK, initially `null`. Cleared when a new initialization starts. |
| `initializePricing` | `(options: InitializePricingOptions) => Promise<Pricing \| null>` | Waits for the provider's Stripe.js load, then initializes the SDK. Resolves to the SDK or `null` on initialization failure. |
| `loading` | `Readonly<Ref<boolean>>` | `true` while initialization is pending, including the wait for Stripe.js. |
| `error` | `Readonly<Ref<string \| null>>` | Initialization error message, or `null`. Cleared when a new initialization starts. SDK operation failures do not set it. |

The ref is read-only, not the SDK: `pricing.value` and the resolved return value are the original Stripe SDK instance. A shallow ref and computed exposure preserve its identity and method behavior in Vue 3 and Vue 2.7; Vue does not deeply proxy or make the SDK read-only.

### Overlapping calls and reinitialization

- Calls made while initialization is pending share the first initialization. **The first call's options win**, including while waiting for the provider to load Stripe.js.
- Once that initialization settles, another call starts a new initialization, even with the same options. It is not a permanent cache.
- Each new initialization clears the previous `pricing` and `error` immediately. On failure, `pricing` stays `null`, `error` contains the message, and the call resolves to `null` rather than rejecting.
- Only initialization failures are caught. Methods on the returned SDK retain Stripe's normal promise rejection behavior and do not update the composable's `loading` or `error`.

## Options

`InitializePricingOptions` comes from `@stripe/stripe-js`:

| Field | Type | Description |
|-------|------|-------------|
| `pricingPolicy` | `string` | Required pricing policy for the SDK. Obtain the value through your Stripe beta integration. |
| `detectedCurrencyOverride` | `string` | Optional override for the detected currency. |

## Pricing SDK methods

These are Stripe.js 10.2.1's signatures on the returned `Pricing` instance, not additional composable methods:

```ts
getAvailableCurrencies(): Promise<CurrencyInfo[]>
getSelectedCurrency(): Promise<CurrencyInfo>
setSelectedCurrency(currency: string): Promise<void>
resolvePrice(price: string): Promise<ResolvedPrice>
createPricingToken(): Promise<PricingToken>

on(eventType: 'change', handler: (event: PricingChangeEvent) => void): this
once(eventType: 'change', handler: (event: PricingChangeEvent) => void): this
off(eventType: 'change', handler?: ((event: PricingChangeEvent) => void) | null): this
```

`CurrencyInfo` is `{ currency: string }`; `PricingToken` is `{ id: string }`. `ResolvedPrice` contains `currency`, `unitAmount`, `unitAmountDecimal` and `minorUnitsAmountDivisor`. Both amount fields can be `null`; otherwise each is `{ amount: string; minorUnitsAmount: number }`.

### Change events and cleanup

`PricingChangeEvent` is `Record<string, never>`: it carries no currency or price data. Read the current state through the SDK methods when needed, handling their rejections yourself.

The caller owns event listeners. Remove them with `off()` when the component unmounts and before replacing an SDK. For example, in the same setup that called `usePricing()`:

```ts
import { watch } from 'vue'
import type { PricingChangeEvent } from '@stripe/stripe-js'

watch(pricing, (sdk, _previous, onCleanup) => {
  if (!sdk) return

  const handleChange = (_event: PricingChangeEvent) => {
    // Refresh your UI; catch rejections from any SDK calls made here.
  }

  sdk.on('change', handleChange)
  onCleanup(() => sdk.off('change', handleChange))
})
```

A watcher created synchronously in setup is stopped on unmount, which runs this cleanup. It also removes the old SDK's listener when `pricing` changes during reinitialization. `once('change', handler)` listens for one event; still remove it on unmount if that event has not fired. Prefer passing your handler to `off()` so you do not remove another consumer's listeners.

## See Also

- [useStripe](/api/composables/use-stripe) - The provider's Stripe instance and readiness
- [Compatibility](/api/#compatibility) - Required peer versions
- [Stripe.js coverage](/coverage) - Supported APIs and verification limits
