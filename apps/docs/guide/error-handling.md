---
description: "Handle Stripe errors in a Vue app: Stripe.js load failures, validation errors, card declines and error codes, the return page and Checkout errors."
---

# Handle errors and declines

Show customers a clear message when a payment cannot go through, and keep your app working when Stripe.js, an element or your server fails.

Errors reach your app at these points, each covered by a step below:

| Where | Example | Where you see it |
|-------|---------|------------------|
| Loading Stripe.js | Network blocked, a secret key passed as the publishable key | Provider `#error` slot and `@error` event |
| First request to Stripe | Invalid publishable key (Stripe.js only checks it when it calls the API) | "Invalid API Key provided" from the `@loaderror` / `#error` of the Payment, Express Checkout or Link Authentication element (or of the Address or Payment Method Messaging element in a group with a `clientSecret` or `mode`), or the first composable call's `error` (the Card, IBAN and BECS elements render normally and fail only at confirm) |
| Typing in an element | Incomplete card number, invalid IBAN | Inside the Payment Element's iframe; `@change` and the `#error` slot of the Card, IBAN and BECS elements |
| Confirming | Card declined, 3D Secure failed | `{ error }` result of the composable, and its `error` ref |
| After confirming | A bank debit fails days later | Webhooks on your server |
| A request that never answers | A client-secret route that hangs, a Stripe.js download a proxy holds open | Nothing: the loading state stays until you set a time limit |
| Integration mistakes | A composable outside its provider | A thrown `VueStripeProviderError` / `VueStripeElementsError` / `VueStripeCheckoutError` |

To produce each error on purpose, use the cards in [Test your integration](/guide/testing#declines-and-errors).

## 1. Show Stripe.js load failures

`VueStripeProvider` renders its `#error` slot instead of its children when Stripe.js cannot load, and emits `@error` with an `Error`:

```vue
<script setup lang="ts">
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import CheckoutForm from './CheckoutForm.vue' // your payment form

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const reportLoadError = (error: Error) => {
  // Send it to your error monitoring
  console.error('Stripe.js failed to load', error)
}
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey" @error="reportLoadError">
    <template #error>
      <p>Payments are unavailable right now. Check your connection and reload the page.</p>
    </template>
    <CheckoutForm />
  </VueStripeProvider>
</template>
```

With the [plugin](/guide/plugin) there is no provider: `VueStripeElements` shows the load error in its own `#error` slot, and `useStripe().error` holds the message.

::: info What the library logs
Vue Stripe logs a load or creation failure as a `[Vue Stripe]` `console.error` only when nothing in your app handles it. Once you listen for the component's error event (`@error`, or `@loaderror` on an element) or render its `#error` slot, the library leaves reporting to you, so the console and any error monitoring that collects `console.error` see each failure once. This applies to the providers, `VueStripeElements`, the element components, `VueStripePricingTable`, `VueStripeCheckout`, `VueStripeEmbeddedCheckout` and the disclosures. The plugin has no event to listen to, so it always logs a Stripe.js load failure.
:::

## 2. Show validation errors while the customer types

Elements validate their fields as the customer types. Where the message appears depends on the element:

| Element | Validation message | `@change` payload |
|---------|--------------------|-------------------|
| Payment, Address, Link Authentication, Tax ID | Shown by Stripe inside the iframe | `complete`, no `error` |
| Card, split card (number, expiry, CVC), IBAN, AU BECS | In the element's `#error` slot | `complete` and `error` |

Use `complete` to enable the pay button. With the Card Element, also show the message from the `#error` slot:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeCardElement } from '@vue-stripe/vue-stripe'
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js'

const complete = ref(false)
const onChange = (event: StripeCardElementChangeEvent) => {
  complete.value = event.complete
}
</script>

<template>
  <VueStripeCardElement @change="onChange">
    <template #error="{ error }">
      <p class="field-error" role="alert">{{ error }}</p>
    </template>
  </VueStripeCardElement>
  <button type="submit" :disabled="!complete">Pay</button>
</template>
```

With the Payment Element, nothing reaches the `#error` slot while the customer types; the fields show their own messages. It also checks its fields when you confirm: `usePaymentIntent` and `useSetupIntent` call `elements.submit()` first and resolve to `{ error }` (type `validation_error`) without contacting your server when a field is incomplete.

If an element fails to load (for example, the Payment Element or the Express Checkout Element without a client secret or `mode`), it emits `@loaderror` and shows the message in the same `#error` slot.

## 3. Handle confirmation errors

`confirmPayment()` and `confirmSetup()` resolve to `{ error }` when the payment fails; they never reject. Stripe's error carries a `type`, a `code` and, for declines, a `decline_code`.

Show Stripe's `message` for errors the customer can fix (`card_error`, `validation_error`); its text is written for customers and localized. A failed 3D Secure challenge is also customer-fixable but arrives as an `invalid_request_error` with the code `payment_intent_authentication_failure`, so check that code as well. For anything else, show a generic message and log the details:

```vue
<!-- PayButton.vue: rendered inside <VueStripeElements> -->
<script setup lang="ts">
import { ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { confirmPayment, loading } = usePaymentIntent()
const message = ref('')

const pay = async () => {
  message.value = ''
  const { error, paymentIntent } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/complete` },
    redirect: 'if_required'
  })

  if (error) {
    const type = 'type' in error ? error.type : undefined
    const code = 'code' in error ? error.code : undefined
    if (type === 'card_error' || type === 'validation_error') {
      message.value = error.message ?? 'Your payment details were declined.'
    } else if (code === 'payment_intent_authentication_failure') {
      message.value = 'Authentication failed. Try again or use another card.'
    } else {
      message.value = 'Something went wrong. Please try again.'
      console.error('Payment failed', error)
    }
    return
  }

  if (paymentIntent?.status === 'succeeded') message.value = 'Payment received. Thank you!'
  else if (paymentIntent?.status === 'processing') message.value = 'Payment is processing.'
}
</script>

<template>
  <button :disabled="loading" @click="pay">{{ loading ? 'Paying...' : 'Pay' }}</button>
  <p v-if="message" role="alert">{{ message }}</p>
</template>
```

- The composable's `error` ref holds the last message too. Bind it in the template when you don't need to branch on the type.
- If Stripe.js has not loaded, or Stripe.js throws, `usePaymentIntent`, `useSetupIntent`, `useCreatePaymentMethod`, `useHandleNextAction`, `useFinancialConnections` and `useIdentity` resolve to `{ error: { message } }`, with no `type` or `code`; hence the `'type' in error` and `'code' in error` checks.
- The method confirmers (`useConfirmCardPayment`, `useConfirmSepaDebitPayment`, ...), `useCreateToken`, `useCreateConfirmationToken` and `useVerifyMicrodeposits*` behave like the Stripe.js method they wrap: a declined payment resolves to `{ error }`, but a thrown error rejects. Wrap those calls in `try` / `catch`. See [Return value](/api/composables/confirm/#return-value), and [How confirming works](/guide/confirming-payments#two-error-styles) for why there are two styles.
- With `useSetupIntent`, check `setup_intent_authentication_failure` instead.
- After a decline or a failed authentication the PaymentIntent is back in `requires_payment_method`. Keep the form mounted and let the customer try again with the same client secret.

### Common error codes

| `code` / `decline_code` | Tell the customer |
|--------------------------|-------------------|
| `card_declined` / `generic_decline` | The card was declined. Use another card or contact your bank. |
| `card_declined` / `insufficient_funds` | The card has insufficient funds. |
| `card_declined` / `lost_card`, `stolen_card` | The card was declined. Don't reveal the reason. |
| `expired_card` | The card has expired. |
| `incorrect_cvc` | The security code is incorrect. |
| `processing_error` | The card could not be processed. Try again. |
| `payment_intent_authentication_failure` | Authentication failed. Try again or use another card. |
| `setup_intent_authentication_failure` | Authentication failed while saving the card. |

Stripe documents every [error code](https://docs.stripe.com/error-codes) and [decline code](https://docs.stripe.com/declines/codes).

To use your own wording, branch on `code`. The same check works for `confirmSetup()` when you save a card:

```vue
<!-- SaveCardButton.vue: rendered inside <VueStripeElements> -->
<script setup lang="ts">
import { ref } from 'vue'
import { useSetupIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { confirmSetup, loading } = useSetupIntent()
const message = ref('')
const saved = ref(false)

const messages: Record<string, string> = {
  card_declined: 'Your card was declined. Please try another card.',
  expired_card: 'Your card has expired.',
  incorrect_cvc: 'The security code is incorrect.',
  setup_intent_authentication_failure: 'Authentication failed. Please try again.'
}

const save = async () => {
  message.value = ''
  const { error } = await confirmSetup({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/account/cards` },
    redirect: 'if_required'
  })
  if (!error) {
    saved.value = true // a SetupIntent is confirmed once; a second click would fail
    message.value = 'Card saved.'
    return
  }
  // Stripe errors carry a `code`; the composable's own errors only a `message`
  const code = 'code' in error ? error.code : undefined
  message.value = (code && messages[code]) || error.message || 'The card could not be saved.'
}
</script>

<template>
  <button v-if="!saved" :disabled="loading" @click="save">Save card</button>
  <p v-if="message" role="alert">{{ message }}</p>
</template>
```

## 4. Check the result on the return page

Payment methods that redirect (and `redirect: 'always'`) send the customer to your `return_url` with `payment_intent_client_secret` and `redirect_status` in the query string. Read the outcome there with `retrievePaymentIntent()`:

```vue
<!-- CompletePage.vue: rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const { retrievePaymentIntent } = usePaymentIntent()
const status = ref('')

onMounted(async () => {
  const clientSecret = new URLSearchParams(window.location.search).get(
    'payment_intent_client_secret'
  )
  if (!clientSecret) return
  const { paymentIntent, error } = await retrievePaymentIntent(clientSecret)
  status.value = error ? 'unknown' : (paymentIntent?.status ?? 'unknown')
})
</script>

<template>
  <p v-if="status === 'succeeded'">Payment received.</p>
  <p v-else-if="status === 'processing'">Your payment is processing. We will email you when it completes.</p>
  <p v-else-if="status === 'requires_payment_method'">The payment failed. Please try another payment method.</p>
  <p v-else-if="status">We could not check the payment status. Please contact us.</p>
</template>
```

The return page is a route of its own, so it needs a `VueStripeProvider` of its own (or the [plugin](/guide/plugin)): [Show the result on the return page](/guide/payment-element#_4-show-the-result-on-the-return-page) shows the wrapper. For a SetupIntent, read `setup_intent_client_secret` and call `retrieveSetupIntent()` from `useSetupIntent`. Use this page to inform the customer only; fulfil orders from [webhooks](/guide/webhooks), because a payment can still fail after `processing` and a customer can close the tab before the redirect.

## 5. Handle Checkout errors

| Component or composable | Failure | How it reports it |
|-------------------------|---------|-------------------|
| `VueStripeCheckout` | Clicked without a session URL | `@error` with a `VueStripeCheckoutError` |
| `useStripeCheckout().redirectToCheckout()` | Called without a URL | Rejects with a `VueStripeCheckoutError` and sets the `error` ref |
| `VueStripeEmbeddedCheckout` | The page could not be created | `@error` with the message, `#error` slot |
| `VueStripeCheckoutElementsProvider` | The session could not be initialized or its actions failed to load | `@error` with the message, `#error` slot |
| `useCheckoutSession().confirm()` | Declined, validation error, expired session | Resolves to `{ type: 'error', error }` |
| `VueStripePricingTable` | Stripe's pricing table script failed to load | `@error` with an `Error`, `#error` slot |

Problems with a hosted Checkout Session itself (expired, already paid) are shown by Stripe on its page. What remains for you is your own endpoint that creates the session: check `response.ok` before you render the button or the provider, catch a `fetch()` that rejects (server down, customer offline), and show your own message in both cases.

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { VueStripeCheckout } from '@vue-stripe/vue-stripe'

const sessionUrl = ref('')
const failed = ref(false)

onMounted(async () => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      signal: AbortSignal.timeout(15000) // give up on a request that never answers (step 6)
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    sessionUrl.value = (await response.json()).url
  } catch {
    // An error answer, no answer at all (server down, offline) or no answer in time
    failed.value = true
  }
})

// VueStripeCheckoutError: clicked before the session URL arrived
const onCheckoutError = (error: Error) => console.error(error.message)
</script>

<template>
  <p v-if="failed">Checkout is unavailable right now. Please try again.</p>
  <VueStripeCheckout
    v-else
    :session-url="sessionUrl"
    :disabled="!sessionUrl"
    @error="onCheckoutError"
  />
</template>
```


To retry the pricing table after a load error, remount it by changing its `key`:

```vue
<!-- PricingPage.vue: rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripePricingTable } from '@vue-stripe/vue-stripe'

const attempt = ref(0)
</script>

<template>
  <VueStripePricingTable :key="attempt" pricing-table-id="prctbl_...">
    <template #error>
      <p>Pricing could not be loaded. <button @click="attempt++">Try again</button></p>
    </template>
  </VueStripePricingTable>
</template>
```

## 6. Set a time limit on requests that never answer

A request can also hang: your server accepts the connection and never answers, or a proxy holds the Stripe.js download open. Neither is an error, so nothing reaches `@error` or `#error`. The components wait as long as the browser does, and the customer sees a loading state with no way out. Set your own time limit.

For your own requests, pass `signal: AbortSignal.timeout()` to `fetch()`. When the time is up the browser aborts the request, and `fetch()` rejects with a `TimeoutError`, the same path as a server that is down:

- A page that fetches in `onMounted`, such as the Payment Element page or the hosted Checkout page in step 5, shows its message from the `catch`.
- A `fetch-client-secret` function (Embedded Checkout, Checkout Elements and Checkout Form providers) passes the rejection to the component, which emits `@error` and renders its `#error` slot.

```ts
const fetchClientSecret = () =>
  fetch('/api/embedded-checkout-session', {
    method: 'POST',
    signal: AbortSignal.timeout(15000) // 15 seconds
  })
    .then((response) => response.json())
    .then((data: { clientSecret: string }) => data.clientSecret)
```

The `#error` slot then receives the browser's own message ("signal timed out" in Chrome), so write your own text in the slot rather than showing `error` alone.

Stripe.js has no time limit either: while its download is pending, the provider shows its `#loading` slot. Start a timer, and change what the slot says when the download is slow. Keep the provider mounted, so the page carries on if the script arrives late:

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import CheckoutForm from './CheckoutForm.vue' // your payment form

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const slow = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  timer = setTimeout(() => (slow.value = true), 15000)
})
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <template #loading>
      <p v-if="slow">Payments are taking a long time to load. Check your connection and reload the page.</p>
      <p v-else>Loading payments...</p>
    </template>
    <CheckoutForm />
  </VueStripeProvider>
</template>
```

Ask for a reload rather than remounting the provider: a remounted provider waits for the download that is already pending.

## 7. Fix integration errors

Vue Stripe throws a typed error during setup when a component or composable is used in the wrong place: `VueStripeProviderError` (no provider or plugin above it, no publishable key), `VueStripeElementsError` (an element outside `VueStripeElements`) or `VueStripeCheckoutError` (`useCheckoutSession` outside its provider). These are programming mistakes, not runtime conditions to handle: the message names the missing wrapper. [Troubleshoot common problems](/guide/troubleshooting) lists each one with its fix.

## Result

Customers see a message they can act on for every failed payment, load and validation failures show your own UI, requests that never answer end in your own message instead of an endless loading state, and payments that fail after confirmation are caught by your webhook handler.
