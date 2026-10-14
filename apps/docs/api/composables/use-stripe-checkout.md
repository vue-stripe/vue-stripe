---
description: "useStripeCheckout reference: redirect the browser to a hosted Stripe Checkout Session URL from Vue, with loading and error refs and no Stripe.js load."
---

# useStripeCheckout

Redirects the browser to a hosted Stripe Checkout Session's `url`, and tracks `loading` and `error`. It is also exported as `useCheckout`. No Stripe instance is involved, so it works with or without `VueStripeProvider` and needs no `VueStripeElements`. [Redirect to Stripe Checkout](/guide/checkout) has the server code, and [the Checkout redirect: component or composable](/guide/approaches#the-checkout-redirect-component-or-composable) compares it with [`VueStripeCheckout`](/api/components/stripe-checkout).

::: warning URL-only since v6
Stripe.js removed `stripe.redirectToCheckout()` in Stripe.js Clover, so the client can no longer start Checkout from a session ID, price IDs or line items. Your server creates the Checkout Session and returns `session.url`; the composable redirects to that URL. See [Stripe.js versions](/guide/stripe-js-versions#clover).
:::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useStripeCheckout } from '@vue-stripe/vue-stripe'

const { redirectToCheckout, loading, error } = useStripeCheckout()
const failed = ref(false)

const checkout = async () => {
  failed.value = false
  const response = await fetch('/api/create-checkout-session', { method: 'POST' })
  if (!response.ok) {
    failed.value = true
    return
  }
  const { url } = await response.json() // your server returns session.url
  try {
    await redirectToCheckout({ url })
  } catch {
    // The response had no url: error.value holds the message
  }
}
</script>

<template>
  <button :disabled="loading" @click="checkout">
    {{ loading ? 'Redirecting...' : 'Checkout' }}
  </button>
  <p v-if="failed">Could not start checkout. Please try again.</p>
  <p v-else-if="error">{{ error }}</p>
</template>
```

## Return Value

```ts
interface UseStripeCheckoutReturn {
  redirectToCheckout: (options: CheckoutRedirectOptions) => Promise<void>
  redirectToUrl: (url: string) => void
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

interface CheckoutRedirectOptions {
  /** Hosted Checkout URL (session.url) returned by your server. */
  url: string
}
```

| Property | Type | Description |
|----------|------|-------------|
| `redirectToCheckout` | `({ url }: CheckoutRedirectOptions) => Promise<void>` | Redirect to the session URL. Rejects with `VueStripeCheckoutError` when `url` is empty |
| `redirectToUrl` | `(url: string) => void` | Redirect to the session URL without validation |
| `loading` | `Readonly<Ref<boolean>>` | `true` once a redirect has started (stays `true` while the page navigates away) |
| `error` | `Readonly<Ref<string \| null>>` | Error message from the last `redirectToCheckout` call |

## Behaviour

- Both functions navigate with `window.location.replace(url)`, so the current page is replaced in the browser history.
- `redirectToCheckout` only fails when no URL is given: it sets `error.value` to ``useStripeCheckout: `url` is required (Checkout Session URL from your server)`` and rejects with a `VueStripeCheckoutError`. Errors from Stripe itself (an expired or invalid session) are shown on Stripe's hosted page after the redirect.
- Don't treat the return to your `success_url` as proof of payment; fulfil orders from Stripe's webhook events ([Fulfil orders with webhooks](/guide/webhooks)). [The browser can't be trusted with the outcome](/guide/security#the-browser-can-t-be-trusted-with-the-outcome) explains why.

## TypeScript

```vue
<script setup lang="ts">
import { useStripeCheckout, VueStripeCheckoutError } from '@vue-stripe/vue-stripe'
import type { CheckoutRedirectOptions, UseStripeCheckoutReturn } from '@vue-stripe/vue-stripe'

const props = defineProps<{ sessionUrl: string }>()
const { redirectToCheckout, loading }: UseStripeCheckoutReturn = useStripeCheckout()

const checkout = async (url: string) => {
  const options: CheckoutRedirectOptions = { url }
  try {
    await redirectToCheckout(options)
  } catch (err) {
    if (err instanceof VueStripeCheckoutError) {
      // The server did not return a URL
    }
  }
}
</script>

<template>
  <button :disabled="loading" @click="checkout(props.sessionUrl)">Checkout</button>
</template>
```

## See Also

- [VueStripeCheckout](/api/components/stripe-checkout) - Ready-made redirect button
- [useCheckoutSession](/api/composables/use-checkout-session) - Checkout Sessions with embedded Elements
- [Redirect to Stripe Checkout](/guide/checkout) - Step-by-step guide with the server code
- [Choosing an integration](/guide/approaches#choosing-among-the-checkout-options) - Hosted, embedded or custom Checkout
- [Stripe Checkout docs](https://docs.stripe.com/payments/checkout)
