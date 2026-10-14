---
description: "Add Stripe Link to a Vue Payment Element checkout with VueStripeLinkAuthenticationElement, so returning customers pay with their saved details."
---

# Add Link to a Payment Element checkout

Collect the customer's email with `VueStripeLinkAuthenticationElement` so customers with a [Stripe Link](https://docs.stripe.com/payments/link) account can sign in and pay with their saved details. Link checks the email, verifies a returning customer with a one-time code and fills in the Payment Element; new customers can save their details for next time.

## Before you begin

- A working Payment Element checkout ([Accept a payment with the Payment Element](/guide/payment-element)). The Link Authentication Element only collects the email; the Payment Element takes the payment.
- Link enabled in the [Stripe Dashboard](https://dashboard.stripe.com/settings/link).
- A PaymentIntent or SetupIntent client secret from your server.

## 1. Add the element above the Payment Element

Both elements go in the same `VueStripeElements` group. Track `complete` from each `@change` event to enable the pay button.

```vue
<!-- CheckoutForm.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  VueStripeLinkAuthenticationElement,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import type { StripeLinkAuthenticationElementChangeEvent } from '@stripe/stripe-js'
import PayButton from './PayButton.vue'

defineProps<{ clientSecret: string }>()

const email = ref('')
const emailComplete = ref(false)
const paymentComplete = ref(false)
const canPay = computed(() => emailComplete.value && paymentComplete.value)

const onEmailChange = (event: StripeLinkAuthenticationElementChangeEvent) => {
  emailComplete.value = event.complete
  email.value = event.value.email
}
</script>

<template>
  <form @submit.prevent>
    <label>Email</label>
    <VueStripeLinkAuthenticationElement @change="onEmailChange" />

    <label>Payment</label>
    <VueStripePaymentElement @change="(e) => (paymentComplete = e.complete)" />

    <PayButton :client-secret="clientSecret" :email="email" :disabled="!canPay" />
  </form>
</template>
```

## 2. Confirm the payment

Confirm with [`usePaymentIntent()`](/api/composables/use-payment-intent). Pass the email as `receipt_email` if you want Stripe to send a receipt.

```vue
<!-- PayButton.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string; email: string; disabled: boolean }>()

const { confirmPayment, loading } = usePaymentIntent()
const errorMessage = ref('')
const paid = ref(false)

const pay = async () => {
  const { error, paymentIntent } = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/complete`,
      receipt_email: props.email
    },
    redirect: 'if_required'
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
  } else if (paymentIntent?.status === 'succeeded') {
    // A succeeded PaymentIntent cannot be confirmed again
    paid.value = true
  }
}
</script>

<template>
  <p v-if="paid">Payment received.</p>
  <template v-else>
    <button type="button" :disabled="disabled || loading" @click="pay">Pay now</button>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </template>
</template>
```

## Pre-fill the email of a signed-in customer

```vue
<VueStripeLinkAuthenticationElement :options="{ defaultValues: { email: user.email } }" />
```

## Collect a shipping address too

Add `VueStripeAddressElement` in shipping mode to the same group; Link fills it for returning customers. See [Collect a shipping or billing address](/guide/address-element).

```vue
<VueStripeLinkAuthenticationElement @change="onEmailChange" />
<VueStripeAddressElement :options="{ mode: 'shipping' }" />
<VueStripePaymentElement />
```

## Checklist

- `VueStripeProvider` with your publishable key
- `VueStripeElements` with the client secret
- `VueStripeLinkAuthenticationElement` for the email
- `VueStripePaymentElement` for the payment method
- `usePaymentIntent()` in a child component to confirm
- Link enabled in the Dashboard

## See also

- [Link Authentication Element API](/api/components/stripe-link-authentication-element): props, events and options
- [Live demo](/live-demo/link-authentication)
