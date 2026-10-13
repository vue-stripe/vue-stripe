---
description: "Accept SEPA Direct Debit payments in Vue with VueStripeIbanElement and useConfirmSepaDebitPayment, including the mandate text and settlement timing."
---

# Accept SEPA Direct Debit

Collect an IBAN with `VueStripeIbanElement` and confirm a SEPA Direct Debit payment with [`useConfirmSepaDebitPayment()`](/api/composables/confirm/bank-debits). The element formats and validates the IBAN as the customer types and reports the bank and country.

SEPA Direct Debit does not succeed at once: the PaymentIntent goes to `processing` and settles or fails after a few business days, so fulfil the order from a webhook, not from the confirm result. [Payments that settle later](/guide/payment-objects#payments-that-settle-later) explains the timing.

## Before you begin

- Vue Stripe is installed and its stylesheet imported ([Install and set up](/guide/installation)).
- SEPA Direct Debit is enabled in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods).
- You show the SEPA mandate text next to the form. Stripe gives the required wording in its [SEPA Direct Debit guide](https://docs.stripe.com/payments/sepa-debit/accept-a-payment).

## 1. Create a SEPA PaymentIntent on your server

```ts
// POST /api/sepa-debit-intent (Node, stripe-node)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { amount } = await request.json()

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    allowed_payment_method_types: ['sepa_debit']
  })

  return Response.json({ clientSecret: paymentIntent.client_secret })
}
```

## 2. Render the providers

`VueStripeElements` needs no client secret for the IBAN Element.

```vue
<!-- SepaPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import SepaForm from './SepaForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const submitted = ref(false)
</script>

<template>
  <p v-if="submitted">Payment submitted. It is processed within a few business days.</p>
  <VueStripeProvider v-else :publishable-key="publishableKey">
    <VueStripeElements>
      <SepaForm @submitted="submitted = true" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

## 3. Render the IBAN Element and confirm

Take the Stripe element from the component's exposed `element` through a template ref and pass it as `sepa_debit`. SEPA needs the account holder's name and email in `billing_details`.

```vue
<!-- SepaForm.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeIbanElement, useConfirmSepaDebitPayment } from '@vue-stripe/vue-stripe'
import type { StripeIbanElementChangeEvent } from '@stripe/stripe-js'

const emit = defineEmits<{ submitted: [] }>()

const ibanRef = ref<InstanceType<typeof VueStripeIbanElement> | null>(null)
const { confirmSepaDebitPayment, loading: processing } = useConfirmSepaDebitPayment()

const name = ref('')
const email = ref('')
const ibanComplete = ref(false)
const bankName = ref('')
const errorMessage = ref('')

const handleChange = (event: StripeIbanElementChangeEvent) => {
  ibanComplete.value = event.complete
  bankName.value = event.bankName || ''
  errorMessage.value = event.error?.message || ''
}

const handleSubmit = async () => {
  const iban = ibanRef.value?.element
  if (!iban) return
  errorMessage.value = ''

  const response = await fetch('/api/sepa-debit-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1000 })
  })
  if (!response.ok) {
    errorMessage.value = 'Could not start the payment. Please try again.'
    return
  }
  const { clientSecret } = await response.json()

  const { error, paymentIntent } = await confirmSepaDebitPayment(clientSecret, {
    payment_method: {
      sepa_debit: iban,
      billing_details: { name: name.value, email: email.value }
    }
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
  } else if (paymentIntent?.status === 'processing') {
    emit('submitted')
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="name" placeholder="Account holder name" required />
    <input v-model="email" type="email" placeholder="Email" required />

    <label>IBAN</label>
    <VueStripeIbanElement
      ref="ibanRef"
      :options="{ supportedCountries: ['SEPA'], placeholderCountry: 'DE' }"
      @change="handleChange"
    />
    <p v-if="bankName">Bank: {{ bankName }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <!-- Your SEPA mandate text goes here -->

    <button type="submit" :disabled="!ibanComplete || processing">
      {{ processing ? 'Processing...' : 'Pay with SEPA Direct Debit' }}
    </button>
  </form>
</template>
```

`placeholderCountry` picks the IBAN format of the placeholder, for example `DE00 0000 0000 0000 0000 00` for `'DE'`. For colors and fonts, pass a Stripe `style` object in `options` ([Style elements](/guide/styling#_3-style-the-card-iban-and-becs-elements)).

## 4. Fulfil the order when the payment succeeds

Listen for `payment_intent.succeeded` and `payment_intent.payment_failed` on your server and fulfil or cancel the order there ([Fulfil orders with webhooks](/guide/webhooks)).

Test data: see [Test your integration](/guide/testing#sepa-direct-debit-iban).

## See also

- [IBAN Element API](/api/components/stripe-iban-element): props, events and options
- [Bank debit confirmers](/api/composables/confirm/bank-debits): `useConfirmSepaDebitPayment` and `useConfirmSepaDebitSetup`
- [Live demo](/live-demo/iban-element)
- For iDEAL, P24, EPS and other bank payments, use the [Payment Element](/guide/payment-element); Stripe removed their standalone elements.
