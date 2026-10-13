# Add Apple Pay, Google Pay and Link buttons

Show one-click wallet buttons with `VueStripeExpressCheckoutElement` and confirm the payment with [`usePaymentIntent()`](/api/composables/use-payment-intent). The element shows only the wallets the customer's browser and device support.

## Before you begin

- A page that already loads Stripe and creates a PaymentIntent, as in [Accept a payment with the Payment Element](/guide/payment-element).
- Apple Pay, Google Pay and Link enabled in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods).
- HTTPS. Apple Pay and Google Pay only render over HTTPS, also in development; use a tunnel such as [ngrok](https://ngrok.com) to test locally. Apple Pay also needs your domain [registered with Stripe](https://dashboard.stripe.com/settings/payment_method_domains).

## 1. Wrap the buttons in the providers

```vue
<!-- ExpressPage.vue -->
<script setup lang="ts">
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import ExpressPay from './ExpressPay.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const props = defineProps<{ clientSecret: string }>() // from your server
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="props.clientSecret">
      <ExpressPay :client-secret="props.clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

## 2. Render the element and confirm on `@confirm`

The `confirm` event has no `elements` field. `usePaymentIntent()` uses the Elements group from `VueStripeElements` and calls `elements.submit()` first, so call it in a component rendered inside that wrapper.

```vue
<!-- ExpressPay.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeExpressCheckoutElement, usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const { confirmPayment } = usePaymentIntent()
const errorMessage = ref('')

const handleConfirm = async () => {
  const { error } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/complete`
    },
    redirect: 'always'
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
  }
}
</script>

<template>
  <VueStripeExpressCheckoutElement @confirm="handleConfirm" />
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
```

## 3. Configure the payment sheet on `@click`

If you listen to `@click`, call `resolve()` within one second, or the sheet does not open. Pass the sheet options there:

```ts
import type { StripeExpressCheckoutElementClickEvent } from '@stripe/stripe-js'

const handleClick = ({ resolve }: StripeExpressCheckoutElementClickEvent) => {
  resolve({
    business: { name: 'My Store' },
    emailRequired: true,
    shippingAddressRequired: true,
    allowedShippingCountries: ['US', 'CA', 'GB'],
    shippingRates: [
      { id: 'standard', displayName: 'Standard shipping', amount: 500 },
      { id: 'express', displayName: 'Express shipping', amount: 1500 }
    ]
  })
}
```

```vue
<VueStripeExpressCheckoutElement @click="handleClick" @confirm="handleConfirm" />
```

## Update shipping rates when the address changes

Listen to `@shippingaddresschange`, fetch rates for the address and pass them to `resolve()`:

```ts
import type { StripeExpressCheckoutElementShippingAddressChangeEvent } from '@stripe/stripe-js'

const handleShippingAddressChange = async ({
  address,
  resolve
}: StripeExpressCheckoutElementShippingAddressChangeEvent) => {
  const rates = await fetchShippingRates(address) // your server
  resolve({
    shippingRates: rates.map((rate) => ({
      id: rate.id,
      displayName: rate.name,
      amount: rate.price
    }))
  })
}
```

```vue
<VueStripeExpressCheckoutElement
  @click="handleClick"
  @confirm="handleConfirm"
  @shippingaddresschange="handleShippingAddressChange"
/>
```

## Show the buttons above the Payment Element

Both elements confirm the same PaymentIntent. Use `@ready` to show the "Or pay with card" divider only when a wallet is available.

```vue
<!-- CheckoutForm.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeExpressCheckoutElement,
  VueStripePaymentElement,
  usePaymentIntent
} from '@vue-stripe/vue-stripe'
import type { StripeExpressCheckoutElementReadyEvent } from '@stripe/stripe-js'

const props = defineProps<{ clientSecret: string }>()

const { confirmPayment, loading: processing } = usePaymentIntent()
const hasWallet = ref(false)
const errorMessage = ref('')

const handleReady = ({ availablePaymentMethods }: StripeExpressCheckoutElementReadyEvent) => {
  hasWallet.value = Boolean(availablePaymentMethods)
}

const pay = async () => {
  errorMessage.value = ''
  const { error } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: `${window.location.origin}/complete` },
    redirect: 'always'
  })
  if (error) errorMessage.value = error.message || 'Payment failed'
}
</script>

<template>
  <VueStripeExpressCheckoutElement @ready="handleReady" @confirm="pay" />

  <p v-if="hasWallet" class="divider">Or pay with card</p>

  <form @submit.prevent="pay">
    <VueStripePaymentElement />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <button type="submit" :disabled="processing">
      {{ processing ? 'Processing...' : 'Pay $20.00' }}
    </button>
  </form>
</template>
```

## Use the buttons on a Checkout Session

Inside [`VueStripeCheckoutElementsProvider`](/api/components/stripe-checkout-provider) the element is created from the Checkout Session. The session owns line items and shipping, so `@click`, `@shippingaddresschange` and `@shippingratechange` never fire. Confirm with [`useCheckoutSession()`](/api/composables/use-checkout-session):

```vue
<script setup lang="ts">
import { VueStripeExpressCheckoutElement, useCheckoutSession } from '@vue-stripe/vue-stripe'
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js'

const { confirm } = useCheckoutSession()

const handleConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
  const result = await confirm({ expressCheckoutConfirmEvent: event })
  if (result.type === 'error') {
    // Show result.error.message
  }
}
</script>

<template>
  <VueStripeExpressCheckoutElement @confirm="handleConfirm" />
</template>
```

Test data: see [Test your integration](/guide/testing#wallets-apple-pay-and-google-pay).

## See also

- [Express Checkout Element API](/api/components/stripe-express-checkout-element): props, events and options
- [Accept a payment with the Payment Element](/guide/payment-element)
- [Live demo](/live-demo/express-checkout)
