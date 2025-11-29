# StripeLinkAuthenticationElement

Collects customer email and authenticates them with Stripe Link for faster checkout.

::: warning Requires clientSecret
StripeLinkAuthenticationElement requires a `clientSecret` from a PaymentIntent or SetupIntent. Ensure StripeElements has a valid clientSecret configured.
:::

## Usage

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripeLinkAuthenticationElement
        :options="options"
        @ready="onReady"
        @change="onChange"
      />
      <StripePaymentElement />
      <button @click="handleSubmit">Pay</button>
    </StripeElements>
  </StripeProvider>
</template>

<script setup>
import {
  StripeProvider,
  StripeElements,
  StripeLinkAuthenticationElement,
  StripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend

const options = {
  defaultValues: {
    email: 'customer@example.com'
  }
}

const onReady = (element) => {
  console.log('Link Authentication element ready')
}

const onChange = (event) => {
  if (event.complete) {
    console.log('Email:', event.value.email)
  }
}
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeLinkAuthenticationElementOptions` | No | Element configuration options |

### Options Object

```ts
interface StripeLinkAuthenticationElementOptions {
  defaultValues?: {
    email?: string
  }
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeLinkAuthenticationElement` | Emitted when the element is mounted and ready |
| `@change` | `StripeLinkAuthenticationElementChangeEvent` | Emitted when the email value changes |

### Change Event

```ts
interface StripeLinkAuthenticationElementChangeEvent {
  elementType: 'linkAuthentication'
  complete: boolean
  value: {
    email: string
  }
}
```

## Exposed Methods

Access these methods via template ref:

```vue
<script setup>
import { ref } from 'vue'

const linkAuthRef = ref()

// Focus the email input
const focusEmail = () => linkAuthRef.value?.focus()

// Remove focus
const blurEmail = () => linkAuthRef.value?.blur()

// Clear the email input
const clearEmail = () => linkAuthRef.value?.clear()
</script>

<template>
  <StripeLinkAuthenticationElement ref="linkAuthRef" />
  <button @click="focusEmail">Focus</button>
  <button @click="blurEmail">Blur</button>
  <button @click="clearEmail">Clear</button>
</template>
```

| Method | Returns | Description |
|--------|---------|-------------|
| `focus()` | `void` | Focus the email input |
| `blur()` | `void` | Remove focus from the email input |
| `clear()` | `void` | Clear the email input |

## Exposed Properties

| Property | Type | Description |
|----------|------|-------------|
| `element` | `Ref<StripeLinkAuthenticationElement \| null>` | The Stripe element instance |

## Examples

### Pre-fill Email for Logged-in Users

```vue
<script setup>
import { computed } from 'vue'

const user = { email: 'john@example.com' }

const options = computed(() => ({
  defaultValues: {
    email: user.email
  }
}))
</script>

<template>
  <StripeLinkAuthenticationElement :options="options" />
</template>
```

### Complete Checkout with Link Authentication

```vue
<script setup>
import { ref } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeLinkAuthenticationElement,
  StripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('') // Fetch from your backend

const email = ref('')
const isEmailComplete = ref(false)

const handleEmailChange = (event) => {
  isEmailComplete.value = event.complete
  email.value = event.value.email
}

const handleSubmit = async () => {
  // Payment confirmation handled by PaymentElement
}
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <div class="checkout-form">
        <label>Email</label>
        <StripeLinkAuthenticationElement @change="handleEmailChange" />

        <label>Payment</label>
        <StripePaymentElement />

        <button :disabled="!isEmailComplete" @click="handleSubmit">
          Pay Now
        </button>
      </div>
    </StripeElements>
  </StripeProvider>
</template>
```

### Collecting Email Separately

```vue
<script setup>
import { ref, watch } from 'vue'

const linkAuthRef = ref()
const customerEmail = ref('')

const collectEmail = async () => {
  // Focus the element for user input
  linkAuthRef.value?.focus()
}

const handleChange = (event) => {
  if (event.complete) {
    customerEmail.value = event.value.email
    console.log('Customer email collected:', customerEmail.value)
  }
}
</script>

<template>
  <StripeLinkAuthenticationElement
    ref="linkAuthRef"
    @change="handleChange"
  />
  <p v-if="customerEmail">Email: {{ customerEmail }}</p>
</template>
```

## TypeScript

```ts
import { ref } from 'vue'
import { StripeLinkAuthenticationElement } from '@vue-stripe/vue-stripe'
import type {
  StripeLinkAuthenticationElement as StripeLinkAuthenticationElementType,
  StripeLinkAuthenticationElementChangeEvent,
  StripeLinkAuthenticationElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripeLinkAuthenticationElementOptions = {
  defaultValues: {
    email: 'user@example.com'
  }
}

// Event handlers
const handleReady = (element: StripeLinkAuthenticationElementType) => {
  console.log('Element ready:', element)
}

const handleChange = (event: StripeLinkAuthenticationElementChangeEvent) => {
  console.log('Complete:', event.complete)
  console.log('Email:', event.value.email)
}

// Template ref
const linkAuthRef = ref<InstanceType<typeof StripeLinkAuthenticationElement>>()

const focusEmail = () => {
  linkAuthRef.value?.focus()
}
```

## What is Stripe Link?

Stripe Link is a one-click checkout solution that securely saves and autofills customer payment and shipping information. When a customer enters an email associated with a Link account:

1. They receive a one-time password (OTP) to their phone
2. After verification, their saved payment methods are available
3. Checkout is completed in seconds

## Key Features

- **Email Collection**: Validates email format automatically
- **Link Detection**: Automatically detects if email has a Link account
- **OTP Authentication**: Secure phone verification for Link users
- **Pre-fill Support**: Set default email for logged-in customers
- **Seamless Integration**: Works alongside PaymentElement

## Requirements

1. **clientSecret Required**: Must have a PaymentIntent or SetupIntent clientSecret
2. **Link Enabled**: Link must be enabled in your [Stripe Dashboard](https://dashboard.stripe.com/settings/link)
3. **Payment Methods**: Works best with card and Link payment methods

## Integration Pattern

For the best user experience, place StripeLinkAuthenticationElement above StripePaymentElement:

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <!-- Email first - enables Link autofill -->
      <StripeLinkAuthenticationElement @change="onEmailChange" />

      <!-- Payment methods - will use Link if authenticated -->
      <StripePaymentElement />

      <button @click="submit">Complete Payment</button>
    </StripeElements>
  </StripeProvider>
</template>
```

## See Also

- [StripeElements](/api/components/stripe-elements) - Parent container component
- [StripePaymentElement](/api/components/stripe-payment-element) - All-in-one payment UI
- [Stripe Link Documentation](https://stripe.com/docs/payments/link) - Official Stripe Link docs
