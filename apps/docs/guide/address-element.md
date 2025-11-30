# Address Element

The Address Element provides a complete address collection form with built-in autocomplete powered by Google Maps. Use it to collect shipping or billing addresses in your checkout flow.

## Why Use Address Element?

| Feature | Benefit |
|---------|---------|
| **Google Maps Autocomplete** | Customers find addresses faster with suggestions |
| **International Support** | Handles addresses from all countries with proper formatting |
| **Validation** | Built-in validation ensures complete, valid addresses |
| **No Backend Required** | Works immediately without a clientSecret |

## Basic Usage

```vue
<script setup>
import {
  StripeProvider,
  StripeElements,
  StripeAddressElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const addressOptions = {
  mode: 'shipping',
  autocomplete: { mode: 'automatic' }
}

const onChange = (event) => {
  if (event.complete) {
    console.log('Address complete:', event.value)
  }
}
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements>
      <StripeAddressElement
        :options="addressOptions"
        @change="onChange"
      />
      <button>Continue</button>
    </StripeElements>
  </StripeProvider>
</template>
```

::: tip No clientSecret Required
Unlike Payment Element, Address Element works without a `clientSecret`. It only needs to be wrapped in `StripeProvider` and `StripeElements` to function.
:::

## Shipping vs Billing Mode

The `mode` option changes the form's behavior and labels:

```vue
<script setup>
import { ref, computed } from 'vue'

const mode = ref('shipping')

const options = computed(() => ({
  mode: mode.value
}))
</script>

<template>
  <div class="mode-selector">
    <button @click="mode = 'shipping'">Shipping</button>
    <button @click="mode = 'billing'">Billing</button>
  </div>
  <!-- Key forces re-render when mode changes -->
  <StripeAddressElement :key="mode" :options="options" />
</template>
```

| Mode | Use Case |
|------|----------|
| `shipping` | Physical delivery addresses |
| `billing` | Payment verification addresses |

## Pre-filling Addresses

For returning customers, pre-fill their saved address:

```vue
<script setup>
const options = {
  mode: 'shipping',
  defaultValues: {
    name: 'John Doe',
    phone: '+1 555-123-4567',
    address: {
      line1: '123 Main Street',
      line2: 'Apt 4B',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94102',
      country: 'US'
    }
  }
}
</script>

<template>
  <StripeAddressElement :options="options" />
</template>
```

## Adding Phone Number

```vue
<script setup>
const options = {
  mode: 'shipping',
  fields: {
    phone: 'always'  // 'always' | 'never' | 'auto'
  },
  validation: {
    phone: {
      required: 'always'  // Make phone required
    }
  }
}
</script>

<template>
  <StripeAddressElement :options="options" />
</template>
```

## Limiting Countries

Restrict addresses to specific countries:

```vue
<script setup>
const options = {
  mode: 'shipping',
  allowedCountries: ['US', 'CA', 'GB', 'AU']
}
</script>

<template>
  <StripeAddressElement :options="options" />
</template>
```

## Blocking P.O. Boxes

For physical deliveries that require a street address:

```vue
<script setup>
const options = {
  mode: 'shipping',
  blockPoBox: true
}
</script>

<template>
  <StripeAddressElement :options="options" />
</template>
```

## Getting Address Data

### Via Events

```vue
<script setup>
import { ref } from 'vue'

const address = ref(null)
const isComplete = ref(false)

const handleChange = (event) => {
  isComplete.value = event.complete
  if (event.complete) {
    address.value = event.value
  }
}
</script>

<template>
  <StripeAddressElement @change="handleChange" />

  <div v-if="address">
    <p>{{ address.name }}</p>
    <p>{{ address.address.line1 }}</p>
    <p>{{ address.address.city }}, {{ address.address.state }}</p>
  </div>
</template>
```

### Via Template Ref (Programmatic)

```vue
<script setup>
import { ref } from 'vue'

const addressRef = ref()

const handleSubmit = async () => {
  const result = await addressRef.value?.getValue()

  if (result.complete) {
    console.log('Valid address:', result.value)
    // Proceed with checkout
  } else {
    alert('Please complete the address form')
  }
}
</script>

<template>
  <StripeAddressElement ref="addressRef" />
  <button @click="handleSubmit">Continue</button>
</template>
```

## Integration with Payment Element

A common pattern is collecting address before payment:

```vue
<script setup>
import { ref } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeAddressElement,
  StripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend

const addressRef = ref()
const step = ref('address')

const handleContinue = async () => {
  const result = await addressRef.value?.getValue()
  if (result?.complete) {
    step.value = 'payment'
  }
}
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <!-- Step 1: Address -->
      <div v-if="step === 'address'">
        <h3>Shipping Address</h3>
        <StripeAddressElement
          ref="addressRef"
          :options="{ mode: 'shipping' }"
        />
        <button @click="handleContinue">Continue to Payment</button>
      </div>

      <!-- Step 2: Payment -->
      <div v-if="step === 'payment'">
        <h3>Payment</h3>
        <StripePaymentElement />
        <button @click="step = 'address'">Back</button>
        <button>Pay Now</button>
      </div>
    </StripeElements>
  </StripeProvider>
</template>
```

## Use Cases

1. **Checkout shipping** — Collect where to ship physical goods
2. **Billing address** — Collect for payment verification
3. **Customer profile** — Store addresses for future use
4. **Multi-step checkout** — Collect address before payment

## Next Steps

- [Payment Element](/guide/payment-element) — Add payment collection
- [Link Authentication](/guide/link-authentication) — Faster checkout with Stripe Link
- [API Reference](/api/components/stripe-address-element) — Full API documentation
