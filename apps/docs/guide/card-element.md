# Accept card payments with the Card Element

Collect card details with `VueStripeCardElement`, or with separate number, expiry and CVC fields, and confirm with [`useConfirmCardPayment()`](/api/composables/confirm/cards). The Card Element takes cards only; to decide between it and the Payment Element, see [Choosing an integration](/guide/approaches).

## Before you begin

- Vue Stripe is installed and its stylesheet imported ([Install and set up](/guide/installation)).
- Your server has an endpoint that creates a PaymentIntent and returns its `client_secret`.

## 1. Render the providers

The Card Element needs no client secret on `VueStripeElements`; you pass it to the confirm call instead.

```vue
<!-- CardPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import CardForm from './CardForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const props = defineProps<{ clientSecret: string }>() // from your server
const success = ref(false)
</script>

<template>
  <p v-if="success">Payment successful.</p>
  <VueStripeProvider v-else :publishable-key="publishableKey">
    <VueStripeElements>
      <CardForm :client-secret="props.clientSecret" @success="success = true" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

## 2. Render the Card Element and confirm

Take the Stripe element from the component's exposed `element` through a template ref and pass it to `confirmCardPayment()`. Stripe runs 3D Secure when the card needs it.

```vue
<!-- CardForm.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeCardElement, useConfirmCardPayment } from '@vue-stripe/vue-stripe'
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js'

const props = defineProps<{ clientSecret: string }>()
const emit = defineEmits<{ success: [] }>()

const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
const { confirmCardPayment, loading: processing } = useConfirmCardPayment()

const cardComplete = ref(false)
const errorMessage = ref('')

const handleChange = (event: StripeCardElementChangeEvent) => {
  cardComplete.value = event.complete
  errorMessage.value = event.error?.message || ''
}

const handleSubmit = async () => {
  const card = cardRef.value?.element
  if (!card) return
  errorMessage.value = ''

  const { error, paymentIntent } = await confirmCardPayment(props.clientSecret, {
    payment_method: {
      card,
      billing_details: { name: 'Jenny Rosen' }
    }
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
  } else if (paymentIntent?.status === 'succeeded') {
    emit('success')
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <label>Card details</label>
    <VueStripeCardElement
      ref="cardRef"
      :options="{ hidePostalCode: true }"
      @change="handleChange"
    />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <button type="submit" :disabled="processing || !cardComplete">
      {{ processing ? 'Processing...' : 'Pay' }}
    </button>
  </form>
</template>
```

## Use separate number, expiry and CVC fields

For a custom layout, render the three split elements in the same `VueStripeElements` group. Confirm with the card number element; Stripe reads expiry and CVC from the other two.

```vue
<!-- SplitCardForm.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeCardNumberElement,
  VueStripeCardExpiryElement,
  VueStripeCardCvcElement,
  useConfirmCardPayment
} from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const numberRef = ref<InstanceType<typeof VueStripeCardNumberElement> | null>(null)
const { confirmCardPayment, loading, error } = useConfirmCardPayment()

const handleSubmit = async () => {
  const card = numberRef.value?.element
  if (!card) return
  await confirmCardPayment(props.clientSecret, { payment_method: { card } })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <label>Card number</label>
    <VueStripeCardNumberElement ref="numberRef" />
    <div class="row">
      <div>
        <label>Expiry</label>
        <VueStripeCardExpiryElement />
      </div>
      <div>
        <label>CVC</label>
        <VueStripeCardCvcElement />
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <button type="submit" :disabled="loading">Pay</button>
  </form>
</template>
```

## Style the input

Card elements take a Stripe `style` object in `options`; the wrapper `div` gets the `vue-stripe-card-element` class for borders and focus rings:

```vue
<VueStripeCardElement
  :options="{
    style: {
      base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
      invalid: { color: '#9e2146', iconColor: '#9e2146' }
    }
  }"
/>
```

Test data: see Test your integration.

## See also

- [Card Element API](/api/components/stripe-card-element): props, events and options
- [Split card elements API](/api/components/stripe-split-card-elements)
- [Card confirmers](/api/composables/confirm/cards): `useConfirmCardPayment` and `useConfirmCardSetup`
- [Live demo](/live-demo/card-element)
