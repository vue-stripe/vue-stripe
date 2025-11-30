# StripeLinkAuthenticationElement

Collects customer email and authenticates them with Stripe Link for faster checkout.

::: tip Pairing Requirement
**This element must be paired with `StripePaymentElement`** to create a complete checkout flow. It cannot process payments on its own—it only handles email collection and Link authentication.
:::

::: warning Requires clientSecret
StripeLinkAuthenticationElement requires a `clientSecret` from a PaymentIntent or SetupIntent. Ensure StripeElements has a valid clientSecret configured.
:::

## What This Element Does

| Capability | Description |
|------------|-------------|
| **Email Collection** | Validates and collects customer email address |
| **Link Detection** | Automatically checks if email has a saved Link account |
| **OTP Authentication** | Sends one-time password for Link account verification |
| **Auto-fill Trigger** | When authenticated, triggers auto-fill in PaymentElement |

## What This Element Does NOT Do

| Limitation | Explanation |
|------------|-------------|
| **Cannot process payments** | Must be paired with PaymentElement or other payment components |
| **Cannot collect payment info** | Only handles email, not card numbers or payment methods |
| **Cannot work standalone** | Requires StripeElements with a clientSecret |

## Usage

### Basic Usage (Paired with PaymentElement)

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <!-- Step 1: Email collection + Link detection -->
      <StripeLinkAuthenticationElement
        @change="onEmailChange"
      />

      <!-- Step 2: Payment method selection -->
      <StripePaymentElement
        @change="onPaymentChange"
      />

      <button :disabled="!canPay" @click="handleSubmit">
        Pay Now
      </button>
    </StripeElements>
  </StripeProvider>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeLinkAuthenticationElement,
  StripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend

const emailComplete = ref(false)
const paymentComplete = ref(false)

const canPay = computed(() => emailComplete.value && paymentComplete.value)

const onEmailChange = (event) => {
  emailComplete.value = event.complete
  if (event.complete) {
    console.log('Email:', event.value.email)
  }
}

const onPaymentChange = (event) => {
  paymentComplete.value = event.complete
}
</script>
```

## How Link Authentication Works

```
┌─────────────────────────────────────────────────────────────┐
│  Customer enters email                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Stripe checks: Does this email have a Link account?        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│  YES - Link Account     │     │  NO - New Customer          │
│                         │     │                             │
│  1. OTP sent to phone   │     │  Continue to PaymentElement │
│  2. User enters code    │     │  Enter card details manually│
│  3. Payment auto-fills! │     │                             │
└─────────────────────────┘     └─────────────────────────────┘
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeLinkAuthenticationElementOptions` | No | Element configuration options |

### Options Object

```ts
interface StripeLinkAuthenticationElementOptions {
  defaultValues?: {
    email?: string  // Pre-fill email for logged-in users
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
  complete: boolean        // true when email is valid
  value: {
    email: string         // The entered email address
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

// User from your auth system
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

### Complete Checkout Flow with Link

This example shows the recommended pattern for integrating Link Authentication:

```vue
<script setup>
import { ref, computed, defineComponent, h } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeLinkAuthenticationElement,
  StripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('pi_xxx_secret_xxx') // Fetch from backend

// Track form state
const customerEmail = ref('')
const emailComplete = ref(false)
const paymentComplete = ref(false)
const isProcessing = ref(false)
const paymentError = ref('')

const canSubmit = computed(() =>
  emailComplete.value && paymentComplete.value && !isProcessing.value
)

const onEmailChange = (event) => {
  emailComplete.value = event.complete
  if (event.complete) {
    customerEmail.value = event.value.email
  }
}

const onPaymentChange = (event) => {
  paymentComplete.value = event.complete
}

// Submit button component (needs StripeElements context)
const SubmitButton = defineComponent({
  props: ['clientSecret', 'disabled', 'email'],
  emits: ['success', 'error'],
  setup(props, { emit }) {
    const { stripe } = useStripe()
    const { elements } = useStripeElements()

    const handleSubmit = async () => {
      if (!stripe.value || !elements.value) return

      isProcessing.value = true
      paymentError.value = ''

      const { error } = await elements.value.submit()
      if (error) {
        emit('error', error.message)
        isProcessing.value = false
        return
      }

      const { error: confirmError, paymentIntent } = await stripe.value.confirmPayment({
        elements: elements.value,
        clientSecret: props.clientSecret,
        confirmParams: {
          return_url: window.location.href,
          receipt_email: props.email
        },
        redirect: 'if_required'
      })

      if (confirmError) {
        emit('error', confirmError.message)
      } else {
        emit('success', paymentIntent)
      }
      isProcessing.value = false
    }

    return () => h('button', {
      disabled: props.disabled,
      onClick: handleSubmit,
      class: 'pay-button'
    }, isProcessing.value ? 'Processing...' : 'Pay Now')
  }
})
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <div class="checkout-form">
        <!-- Email + Link Authentication -->
        <div class="form-section">
          <label>Email</label>
          <StripeLinkAuthenticationElement @change="onEmailChange" />
        </div>

        <!-- Payment Methods -->
        <div class="form-section">
          <label>Payment</label>
          <StripePaymentElement @change="onPaymentChange" />
        </div>

        <!-- Error Display -->
        <div v-if="paymentError" class="error">
          {{ paymentError }}
        </div>

        <!-- Submit Button -->
        <SubmitButton
          :client-secret="clientSecret"
          :disabled="!canSubmit"
          :email="customerEmail"
          @error="paymentError = $event"
        />
      </div>
    </StripeElements>
  </StripeProvider>
</template>
```

### Email-Only Demo (Testing the Element)

If you just want to test the element's email collection without payment:

```vue
<script setup>
import { ref } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeLinkAuthenticationElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx'

const linkAuthRef = ref()
const collectedEmail = ref('')
const isComplete = ref(false)

const handleChange = (event) => {
  isComplete.value = event.complete
  collectedEmail.value = event.value.email
}
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <div class="email-demo">
        <label>Email</label>
        <StripeLinkAuthenticationElement
          ref="linkAuthRef"
          @change="handleChange"
        />

        <div class="controls">
          <button @click="linkAuthRef?.focus()">Focus</button>
          <button @click="linkAuthRef?.blur()">Blur</button>
          <button @click="linkAuthRef?.clear()">Clear</button>
        </div>

        <div class="status">
          <p>Status: {{ isComplete ? '✅ Valid' : '⏳ Incomplete' }}</p>
          <p v-if="collectedEmail">Email: {{ collectedEmail }}</p>
        </div>
      </div>
    </StripeElements>
  </StripeProvider>
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

Stripe Link is a one-click checkout solution that saves customer payment information across all Stripe merchants:

| Feature | Benefit |
|---------|---------|
| **Cross-merchant** | Saved once, works everywhere that accepts Stripe |
| **Secure** | OTP verification, no passwords stored |
| **Fast** | Returning customers checkout in seconds |
| **Higher conversion** | Less friction = more completed purchases |

### The Link Experience

**For returning customers (has Link account):**
1. Enter email → Stripe detects Link account
2. Receive OTP on phone → Enter code
3. Payment details auto-fill → One-click checkout!

**For new customers (no Link account):**
1. Enter email → Continue normally
2. Fill payment details manually
3. Option to save to Link for next time

## Requirements

| Requirement | Details |
|-------------|---------|
| **clientSecret** | From PaymentIntent or SetupIntent |
| **Link enabled** | In [Stripe Dashboard](https://dashboard.stripe.com/settings/link) |
| **Paired element** | Must use with PaymentElement for payments |

## Integration Checklist

- StripeProvider with publishable key
- StripeElements with clientSecret
- StripeLinkAuthenticationElement for email
- StripePaymentElement for payment methods
- Submit button with payment confirmation logic
- Link enabled in Stripe Dashboard

## Related Components

| Component | Relationship |
|-----------|--------------|
| [StripeElements](/api/components/stripe-elements) | **Required parent** - Provides Elements context |
| [StripePaymentElement](/api/components/stripe-payment-element) | **Required pair** - Handles payment method selection |
| [StripeAddressElement](/api/components/stripe-address-element) | Optional - Add shipping/billing address collection |

## See Also

- [StripeElements](/api/components/stripe-elements) - Parent container component
- [StripePaymentElement](/api/components/stripe-payment-element) - All-in-one payment UI
- [Stripe Link Documentation](https://stripe.com/docs/payments/link) - Official Stripe Link docs
