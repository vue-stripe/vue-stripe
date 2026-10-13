---
description: "Save a customer's payment method for later in Vue with a SetupIntent, the Payment Element and useSetupIntent, ready for off-session charges."
---

# Save a payment method for later

Save a customer's payment method without charging it, with a SetupIntent, the Payment Element and [`useSetupIntent()`](/api/composables/use-setup-intent). Stripe runs 3D Secure while the customer is present, so later off-session charges are less likely to fail. To decide between a SetupIntent and a PaymentIntent, see [Payment objects](/guide/payment-objects#paymentintent-or-setupintent).

## Before you begin

- Vue Stripe is installed and its stylesheet imported ([Install and set up](/guide/installation)).
- A Stripe Customer (`cus_...`) for the person whose payment method you save, stored with your user record. The server sample reads it from `req.user.stripeCustomerId`.
- Your app can reach your server's `/api` routes during development ([Send API requests to your server](/guide/installation#_5-send-api-requests-to-your-server)).

## 1. Create a SetupIntent on your server

```js
// Node.js (Express-style handler)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/create-setup-intent', async (req, res) => {
  const setupIntent = await stripe.setupIntents.create({
    customer: req.user.stripeCustomerId, // the signed-in customer, never an ID from the browser
    automatic_payment_methods: { enabled: true }
  })

  res.json({ clientSecret: setupIntent.client_secret })
})
```

## 2. Render the Payment Element with the SetupIntent

Pass the SetupIntent's client secret to `VueStripeElements`. The save button goes in a child component so it can use the composable.

```vue
<!-- SaveCardPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import SaveCardButton from './SaveCardButton.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const setupSecret = ref('')
const isComplete = ref(false)
const status = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')

onMounted(async () => {
  try {
    const response = await fetch('/api/create-setup-intent', { method: 'POST' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    setupSecret.value = (await response.json()).clientSecret
  } catch {
    status.value = 'error'
    errorMessage.value = 'Could not start saving your card. Please reload the page.'
  }
})
</script>

<template>
  <VueStripeProvider v-if="setupSecret" :publishable-key="publishableKey">
    <VueStripeElements :client-secret="setupSecret">
      <VueStripePaymentElement @change="(e) => (isComplete = e.complete)" />
      <SaveCardButton
        :client-secret="setupSecret"
        :disabled="!isComplete"
        @success="status = 'success'"
        @error="(msg) => { status = 'error'; errorMessage = msg }"
      />
    </VueStripeElements>
  </VueStripeProvider>

  <p v-if="status === 'success'">Card saved.</p>
  <p v-if="status === 'error'" class="error">{{ errorMessage }}</p>
</template>
```

## 3. Confirm the SetupIntent

`confirmSetup()` runs `elements.submit()` for you, then confirms; a validation error comes back as `result.error` like a confirmation error. Pass `skipSubmit: true` only if you already called `useStripeElements().submit()` yourself.

```vue
<!-- SaveCardButton.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { useSetupIntent } from '@vue-stripe/vue-stripe'
import type { SetupIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string; disabled: boolean }>()
const emit = defineEmits<{
  (e: 'success', setupIntent: SetupIntent): void
  (e: 'error', message: string): void
}>()

const { confirmSetup, loading } = useSetupIntent()

const handleSave = async () => {
  const result = await confirmSetup({
    clientSecret: props.clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/account/cards`
    },
    redirect: 'if_required'
  })

  if (result.error) {
    emit('error', result.error.message || 'Failed to save card')
  } else if (result.setupIntent?.status === 'succeeded') {
    emit('success', result.setupIntent)
  }
}
</script>

<template>
  <button :disabled="disabled || loading" @click="handleSave">
    {{ loading ? 'Saving...' : 'Save card' }}
  </button>
</template>
```

The succeeded SetupIntent's `payment_method` is attached to the customer. Store its ID with your customer record if you need it.

## 4. Charge the saved payment method later

On your server, create a PaymentIntent for the customer with the saved payment method and `off_session: true`:

```js
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  customer: 'cus_xxx',
  payment_method: paymentMethodId, // from the SetupIntent
  off_session: true,
  confirm: true
})
```

If the bank asks for authentication again, the charge fails with `authentication_required`; bring the customer back on-session to confirm it.

Test data: see [Test your integration](/guide/testing#saving-cards).

## See also

- [useSetupIntent API](/api/composables/use-setup-intent): confirm options and result
- [Card confirmers](/api/composables/confirm/cards): `useConfirmCardSetup` with the Card Element
- [Start a subscription](/guide/subscriptions)
- [Handle errors and declines](/guide/error-handling)
- [PaymentIntent or SetupIntent](/guide/payment-objects#paymentintent-or-setupintent)
- [Live demo](/live-demo/setup-intent)
- [Stripe docs: Save and reuse payment methods](https://docs.stripe.com/payments/save-and-reuse)
