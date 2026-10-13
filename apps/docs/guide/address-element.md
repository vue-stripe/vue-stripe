---
description: "Collect a shipping or billing address in Vue with VueStripeAddressElement: country-aware fields, validation and address autocomplete from Stripe."
---

# Collect a shipping or billing address

Collect a full address with `VueStripeAddressElement`. It formats the form for each country, validates it and can suggest addresses as the customer types.

## Before you begin

- Vue Stripe is installed and its stylesheet imported ([Install and set up](/guide/installation)).
- No client secret is needed: the Address Element works in a `VueStripeElements` group without one. If you take a payment on the same page, put it in the same group as the Payment Element.

## 1. Render the element

Pick the form with `mode`: `'shipping'` (the default) or `'billing'`.

```vue
<!-- AddressPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeAddressElement
} from '@vue-stripe/vue-stripe'
import type { StripeAddressElementChangeEvent } from '@stripe/stripe-js'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const address = ref<StripeAddressElementChangeEvent['value'] | null>(null)

const onChange = (event: StripeAddressElementChangeEvent) => {
  address.value = event.complete ? event.value : null
}
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <VueStripeAddressElement :options="{ mode: 'shipping' }" @change="onChange" />
      <button :disabled="!address">Continue</button>
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

Stripe rejects a `mode` change on a mounted element. To switch between shipping and billing, give the component a `:key` bound to the mode so it is created again.

```vue
<VueStripeAddressElement :key="mode" :options="{ mode }" />
```

## 2. Read the address

Read it from the `@change` event, as in step 1, or call the exposed `getValue()` through a template ref when the customer continues:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeAddressElement } from '@vue-stripe/vue-stripe'

const addressRef = ref<InstanceType<typeof VueStripeAddressElement>>()
const errorMessage = ref('')

const handleContinue = async () => {
  const result = await addressRef.value?.getValue()
  if (result?.complete) {
    // Save result.value on your server or move to the next step
  } else {
    errorMessage.value = 'Complete the address to continue.'
  }
}
</script>

<template>
  <VueStripeAddressElement ref="addressRef" />
  <p v-if="errorMessage">{{ errorMessage }}</p>
  <button @click="handleContinue">Continue</button>
</template>
```

Since Stripe.js Dahlia, `value.address.state` is in Latin script by default. Pass `getValue({ format: 'localized' })` for the local form.

## Pre-fill a saved address

```vue
<VueStripeAddressElement
  :options="{
    mode: 'shipping',
    defaultValues: {
      name: 'Jenny Rosen',
      address: {
        line1: '354 Oyster Point Blvd',
        city: 'South San Francisco',
        state: 'CA',
        postal_code: '94080',
        country: 'US'
      }
    }
  }"
/>
```

## Ask for a phone number

```vue
<VueStripeAddressElement
  :options="{
    mode: 'shipping',
    fields: { phone: 'always' },
    validation: { phone: { required: 'always' } }
  }"
/>
```

## Limit the countries

```vue
<VueStripeAddressElement :options="{ mode: 'shipping', allowedCountries: ['US', 'CA', 'GB', 'AU'] }" />
```

## Block P.O. boxes

For deliveries that need a street address:

```vue
<VueStripeAddressElement :options="{ mode: 'shipping', blockPoBox: true }" />
```

## Collect the address before the payment

Put both elements in the same group, which needs the PaymentIntent client secret. Hide the address step with `v-show` rather than `v-if`, so the element keeps its value while the customer pays.

```vue
<!-- CheckoutSteps.vue: rendered inside VueStripeElements with a clientSecret -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeAddressElement, VueStripePaymentElement } from '@vue-stripe/vue-stripe'

const addressRef = ref<InstanceType<typeof VueStripeAddressElement>>()
const step = ref<'address' | 'payment'>('address')

const handleContinue = async () => {
  const result = await addressRef.value?.getValue()
  if (result?.complete) step.value = 'payment'
}
</script>

<template>
  <section v-show="step === 'address'">
    <h3>Shipping address</h3>
    <VueStripeAddressElement ref="addressRef" :options="{ mode: 'shipping' }" />
    <button @click="handleContinue">Continue to payment</button>
  </section>

  <section v-show="step === 'payment'">
    <h3>Payment</h3>
    <VueStripePaymentElement />
    <button @click="step = 'address'">Back</button>
    <!-- Confirm with usePaymentIntent(), as in "Accept a payment with the Payment Element" -->
  </section>
</template>
```

Confirm the payment as in [Accept a payment with the Payment Element](/guide/payment-element).

## See also

- [Address Element API](/api/components/stripe-address-element): props, events, options and `getValue()`
- [Add Link to a Payment Element checkout](/guide/link-authentication)
- [Live demo](/live-demo/address-element)
