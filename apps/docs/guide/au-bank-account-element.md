# Accept BECS Direct Debit (Australia)

Collect an Australian BSB and account number with `VueStripeAuBankAccountElement` and confirm a BECS Direct Debit payment with [`useConfirmAuBecsDebitPayment()`](/api/composables/confirm/bank-debits). BECS takes Australian bank accounts and AUD only.

BECS Direct Debit does not succeed at once: the PaymentIntent goes to `processing` and settles or fails within three business days, so fulfil the order from a webhook, not from the confirm result. [Payments that settle later](/guide/payment-objects#payments-that-settle-later) explains the timing.

## Before you begin

- Vue Stripe is installed and its stylesheet imported ([Install and set up](/guide/installation)).
- BECS Direct Debit is enabled in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods).

## 1. Create a BECS PaymentIntent on your server

```ts
// POST /api/becs-intent (Node, stripe-node)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { amount } = await request.json()

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'aud', // BECS only supports AUD
    payment_method_types: ['au_becs_debit']
  })

  return Response.json({ clientSecret: paymentIntent.client_secret })
}
```

## 2. Render the providers

```vue
<!-- BecsPage.vue -->
<script setup lang="ts">
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import BecsForm from './BecsForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <BecsForm business-name="Example Pty Ltd" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

## 3. Render the form with the mandate and confirm

The customer must agree to the Direct Debit Request before you debit the account, so show Stripe's mandate text with your business name next to the form. Take the Stripe element from the component's exposed `element` through a template ref and pass it as `au_becs_debit`, with the account holder's name and email.

```vue
<!-- BecsForm.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeAuBankAccountElement, useConfirmAuBecsDebitPayment } from '@vue-stripe/vue-stripe'
import type { StripeAuBankAccountElementChangeEvent } from '@stripe/stripe-js'

defineProps<{ businessName: string }>()

const bankRef = ref<InstanceType<typeof VueStripeAuBankAccountElement> | null>(null)
const { confirmAuBecsDebitPayment, loading: processing } = useConfirmAuBecsDebitPayment()

const name = ref('')
const email = ref('')
const isComplete = ref(false)
const bankName = ref('')
const mandateAccepted = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

const handleChange = (event: StripeAuBankAccountElementChangeEvent) => {
  isComplete.value = event.complete
  bankName.value = event.bankName || ''
}

const handleSubmit = async () => {
  const account = bankRef.value?.element
  if (!account) return
  errorMessage.value = ''

  const response = await fetch('/api/becs-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1000 })
  })
  const { clientSecret } = await response.json()

  const { error, paymentIntent } = await confirmAuBecsDebitPayment(clientSecret, {
    payment_method: {
      au_becs_debit: account,
      billing_details: { name: name.value, email: email.value }
    }
  })

  if (error) {
    errorMessage.value = error.message || 'Failed to process payment'
  } else if (paymentIntent?.status === 'processing') {
    submitted.value = true
  }
}
</script>

<template>
  <p v-if="submitted">Payment submitted. BECS Direct Debit payments settle in a few business days.</p>

  <form v-else @submit.prevent="handleSubmit">
    <input v-model="name" placeholder="Account holder name" required />
    <input v-model="email" type="email" placeholder="Email" required />

    <label>Bank account (BSB and account number)</label>
    <VueStripeAuBankAccountElement ref="bankRef" @change="handleChange" />
    <p v-if="bankName">{{ bankName }}</p>

    <label class="mandate">
      <input v-model="mandateAccepted" type="checkbox" />
      <span>
        By providing your bank account details and confirming this payment, you agree to this
        Direct Debit Request and the
        <a href="https://stripe.com/au-becs-dd-service-agreement/legal" target="_blank">
          Direct Debit Request service agreement</a>, and authorise Stripe Payments Australia Pty
        Ltd ACN 160 180 343 Direct Debit User ID number 507156 ("Stripe") to debit your account
        through the Bulk Electronic Clearing System (BECS) on behalf of
        <strong>{{ businessName }}</strong> (the "Merchant") for any amounts separately
        communicated to you by the Merchant.
      </span>
    </label>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <button type="submit" :disabled="!isComplete || !mandateAccepted || processing">
      {{ processing ? 'Processing...' : 'Pay with BECS Direct Debit' }}
    </button>
  </form>
</template>
```

For colors and fonts, pass a Stripe `style` object in `options`; `iconStyle: 'solid'` and `hideIcon: true` change the bank icon ([Style elements](/guide/styling#_3-style-the-card-iban-and-becs-elements)).

## 4. Fulfil the order when the payment settles

Listen for `payment_intent.succeeded` and `payment_intent.payment_failed` on your server and fulfil or cancel the order there ([Fulfil orders with webhooks](/guide/webhooks)).

Test data: see [Test your integration](/guide/testing#becs-direct-debit-australia).

## See also

- [AU Bank Account Element API](/api/components/stripe-au-bank-account-element): props, events and options
- [Bank debit confirmers](/api/composables/confirm/bank-debits): `useConfirmAuBecsDebitPayment` and `useConfirmAuBecsDebitSetup`
- [Accept SEPA Direct Debit](/guide/iban-element)
- [Live demo](/live-demo/becs-payment)
