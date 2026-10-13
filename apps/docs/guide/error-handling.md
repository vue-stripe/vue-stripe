---
description: "Handle Stripe errors in a Vue app: Stripe.js load failures, validation errors, card declines and error codes, the return page and Checkout errors."
---

# Handle errors and declines

Show customers a clear message when a payment cannot go through, and keep your app working when Stripe.js, an element or your server fails.

Errors reach your app at five points, each covered by a step below:

| Where | Example | Where you see it |
|-------|---------|------------------|
| Loading Stripe.js | Network blocked, invalid publishable key | Provider `#error` slot and `@error` event |
| Typing in an element | Incomplete card number, invalid IBAN | Inside the Payment Element's iframe; `@change` and the `#error` slot of the Card, IBAN and BECS elements |
| Confirming | Card declined, 3D Secure failed | `{ error }` result of the composable, and its `error` ref |
| After confirming | A bank debit fails days later | Webhooks on your server |
| Integration mistakes | A composable outside its provider | A thrown `VueStripeProviderError` / `VueStripeElementsError` / `VueStripeCheckoutError` |

To produce each error on purpose, use the cards in [Test your integration](/guide/testing#declines-and-errors).

## 1. Show Stripe.js load failures

`VueStripeProvider` renders its `#error` slot instead of its children when Stripe.js cannot load, and emits `@error` with an `Error`:

```vue
<script setup>
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const reportLoadError = (error) => {
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

## 2. Show validation errors while the customer types

Elements validate their fields as the customer types. Where the message appears depends on the element:

| Element | Validation message | `@change` payload |
|---------|--------------------|-------------------|
| Payment, Address, Link Authentication, Tax ID | Shown by Stripe inside the iframe | `complete`, no `error` |
| Card, split card (number, expiry, CVC), IBAN, AU BECS | In the element's `#error` slot | `complete` and `error` |

Use `complete` to enable the pay button. With the Card Element, also show the message from the `#error` slot:

```vue
<script setup>
import { ref } from 'vue'
import { VueStripeCardElement } from '@vue-stripe/vue-stripe'

const complete = ref(false)
const onChange = (event) => {
  complete.value = event.complete
}
</script>

<template>
  <VueStripeCardElement @change="onChange">
    <template #error="{ error }">
      <p class="field-error" role="alert">{{ error }}</p>
    </template>
  </VueStripeCardElement>
  <PayButton :disabled="!complete" />
</template>
```

With the Payment Element, nothing reaches the `#error` slot while the customer types; the fields show their own messages. It also checks its fields when you confirm: `usePaymentIntent` and `useSetupIntent` call `elements.submit()` first and resolve to `{ error }` (type `validation_error`) without contacting your server when a field is incomplete.

If an element fails to load (for example, the Payment Element without a client secret or `mode`), it emits `@loaderror` and shows the message in the same `#error` slot.

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
    message.value = 'Card saved.'
    return
  }
  // Stripe errors carry a `code`; the composable's own errors only a `message`
  const code = 'code' in error ? error.code : undefined
  message.value = (code && messages[code]) || error.message || 'The card could not be saved.'
}
</script>

<template>
  <button :disabled="loading" @click="save">Save card</button>
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

For a SetupIntent, read `setup_intent_client_secret` and call `retrieveSetupIntent()` from `useSetupIntent`. Use this page to inform the customer only; fulfil orders from [webhooks](/guide/webhooks), because a payment can still fail after `processing` and a customer can close the tab before the redirect.

## 5. Handle Checkout errors

| Component or composable | Failure | How it reports it |
|-------------------------|---------|-------------------|
| `VueStripeCheckout` | Clicked without a session URL | `@error` with a `VueStripeCheckoutError` |
| `useStripeCheckout().redirectToCheckout()` | Called without a URL | Rejects with a `VueStripeCheckoutError` and sets the `error` ref |
| `VueStripeEmbeddedCheckout` | The page could not be created | `@error` with the message, `#error` slot |
| `VueStripeCheckoutElementsProvider` | The session could not be initialized or its actions failed to load | `@error` with the message, `#error` slot |
| `useCheckoutSession().confirm()` | Declined, validation error, expired session | Resolves to `{ type: 'error', error }` |
| `VueStripePricingTable` | Stripe's pricing table script failed to load | `@error` with an `Error`, `#error` slot |

Problems with a hosted Checkout Session itself (expired, already paid) are shown by Stripe on its page. What remains for you is your own endpoint that creates the session: check `response.ok` before you render the button or the provider, and show your own message when it fails.

```vue
<script setup>
import { onMounted, ref } from 'vue'
import { VueStripeCheckout } from '@vue-stripe/vue-stripe'

const sessionUrl = ref('')
const failed = ref(false)

onMounted(async () => {
  const response = await fetch('/api/create-checkout-session', { method: 'POST' })
  if (!response.ok) {
    failed.value = true
    return
  }
  sessionUrl.value = (await response.json()).url
})

// VueStripeCheckoutError: clicked before the session URL arrived
const onCheckoutError = (error) => console.error(error.message)
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
<script setup>
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

## 6. Fix integration errors

Vue Stripe throws a typed error during setup when a component or composable is used in the wrong place: `VueStripeProviderError` (no provider or plugin above it, no publishable key), `VueStripeElementsError` (an element outside `VueStripeElements`) or `VueStripeCheckoutError` (`useCheckoutSession` outside its provider). These are programming mistakes, not runtime conditions to handle: the message names the missing wrapper. [Troubleshoot common problems](/guide/troubleshooting) lists each one with its fix.

## Result

Customers see a message they can act on for every failed payment, load and validation failures show your own UI, and payments that fail after confirmation are caught by your webhook handler.
