# StripePaymentElement

Stripe's recommended all-in-one payment component that supports cards, wallets (Apple Pay, Google Pay), bank transfers, and more.

::: tip Recommended
This is Stripe's recommended component for accepting payments. It automatically displays the most relevant payment methods based on the customer's location and transaction.
:::

## What is Payment Element?

Payment Element is Stripe's modern, unified payment interface that:

| Capability | Description |
|------------|-------------|
| **40+ Payment Methods** | Cards, wallets, bank transfers, BNPL, and regional methods |
| **Dynamic Display** | Automatically shows relevant methods based on customer location |
| **Built-in Validation** | Real-time error handling and input validation |
| **Responsive Design** | Adapts to any screen size and device |
| **Localization** | Automatic translation based on customer's locale |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Customer lands on checkout page                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PaymentElement renders inside StripeElements               │
│  (Receives Elements instance + clientSecret from context)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Stripe determines available payment methods based on:      │
│  - PaymentIntent currency and amount                        │
│  - Customer's location and device                           │
│  - Your Dashboard payment method settings                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Customer fills payment details                             │
│  (Emits @change with { complete, value } on each input)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  On submit: Call stripe.confirmPayment()                    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│  SUCCESS                │     │  REQUIRES ACTION            │
│                         │     │                             │
│  PaymentIntent status:  │     │  Redirect to 3D Secure,     │
│  "succeeded"            │     │  bank auth, or other flow   │
│                         │     │  then return to return_url  │
└─────────────────────────┘     └─────────────────────────────┘
```

## Usage

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement
        :options="paymentOptions"
        @ready="onReady"
        @change="onChange"
      />
      <button @click="handleSubmit" :disabled="!isComplete">
        Pay
      </button>
    </StripeElements>
  </StripeProvider>
</template>

<script setup>
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  usePaymentIntent
} from '@vue-stripe/vue-stripe'
import { ref } from 'vue'

const publishableKey = 'pk_test_...'
const clientSecret = 'pi_xxx_secret_xxx' // From your backend

const isComplete = ref(false)

const paymentOptions = {
  layout: 'tabs'
}

const onReady = (element) => {
  console.log('Payment element ready', element)
}

const onChange = (event) => {
  isComplete.value = event.complete
}
</script>
```

## Requirements

The Payment Element requires a `clientSecret` from a PaymentIntent. You can:

1. **Create via your backend** - Recommended for production
2. **Create via Stripe Dashboard** - For testing:
   - Go to [Stripe Dashboard → Payments](https://dashboard.stripe.com/test/payments)
   - Click **"+ Create"** → **"Create payment"**
   - Enter an amount and copy the `client_secret`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripePaymentElementOptions` | No | Payment element configuration |

### Options Object

```ts
interface StripePaymentElementOptions {
  layout?: 'tabs' | 'accordion' | 'auto' | {
    type: 'tabs' | 'accordion'
    defaultCollapsed?: boolean
    radios?: boolean
    spacedAccordionItems?: boolean
  }
  defaultValues?: {
    billingDetails?: {
      name?: string
      email?: string
      phone?: string
      address?: {
        line1?: string
        line2?: string
        city?: string
        state?: string
        postal_code?: string
        country?: string
      }
    }
  }
  business?: {
    name?: string
  }
  paymentMethodOrder?: string[]
  fields?: {
    billingDetails?: 'auto' | 'never' | {
      name?: 'auto' | 'never'
      email?: 'auto' | 'never'
      phone?: 'auto' | 'never'
      address?: 'auto' | 'never' | {
        line1?: 'auto' | 'never'
        line2?: 'auto' | 'never'
        city?: 'auto' | 'never'
        state?: 'auto' | 'never'
        postal_code?: 'auto' | 'never'
        country?: 'auto' | 'never'
      }
    }
  }
  wallets?: {
    applePay?: 'auto' | 'never'
    googlePay?: 'auto' | 'never'
  }
  terms?: {
    card?: 'auto' | 'always' | 'never'
    auBecsDebit?: 'auto' | 'always' | 'never'
    bancontact?: 'auto' | 'always' | 'never'
    ideal?: 'auto' | 'always' | 'never'
    sepaDebit?: 'auto' | 'always' | 'never'
    sofort?: 'auto' | 'always' | 'never'
    usBankAccount?: 'auto' | 'always' | 'never'
  }
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripePaymentElement` | Emitted when the element is fully rendered |
| `@change` | `StripePaymentElementChangeEvent` | Emitted when the element value changes |
| `@focus` | - | Emitted when the element gains focus |
| `@blur` | - | Emitted when the element loses focus |
| `@escape` | - | Emitted when the escape key is pressed |
| `@loaderstart` | - | Emitted when the element starts loading |
| `@loaderstop` | - | Emitted when the element finishes loading |

### Change Event

```ts
interface StripePaymentElementChangeEvent {
  elementType: 'payment'
  empty: boolean
  complete: boolean
  collapsed?: boolean
  value: {
    type: string // e.g., 'card', 'ideal', 'sepa_debit'
  }
}
```

## Slots

### Loading Slot

Rendered while the payment element is initializing:

```vue
<StripePaymentElement>
  <template #loading>
    <div class="skeleton-loader">Loading payment form...</div>
  </template>
</StripePaymentElement>
```

### Error Slot

Rendered when there's an error during element creation:

```vue
<StripePaymentElement>
  <template #error="{ error }">
    <div class="payment-error">{{ error }}</div>
  </template>
</StripePaymentElement>
```

## Exposed Properties

| Property | Type | Description |
|----------|------|-------------|
| `element` | `Ref<StripePaymentElement \| null>` | The Stripe payment element instance |
| `loading` | `Ref<boolean>` | Whether the element is loading |
| `error` | `Ref<string \| null>` | Current error message |

## Examples

### Tabs Layout

```vue
<StripePaymentElement
  :options="{ layout: 'tabs' }"
/>
```

### Accordion Layout

```vue
<StripePaymentElement
  :options="{
    layout: {
      type: 'accordion',
      defaultCollapsed: false,
      radios: true,
      spacedAccordionItems: true
    }
  }"
/>
```

### Pre-fill Billing Details

```vue
<script setup>
const options = {
  defaultValues: {
    billingDetails: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      address: {
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94111',
        country: 'US'
      }
    }
  }
}
</script>

<template>
  <StripePaymentElement :options="options" />
</template>
```

### Hide Billing Fields

```vue
<StripePaymentElement
  :options="{
    fields: {
      billingDetails: 'never'
    }
  }"
/>
```

### Control Payment Method Order

```vue
<StripePaymentElement
  :options="{
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'ideal']
  }"
/>
```

### Disable Wallet Payments

```vue
<StripePaymentElement
  :options="{
    wallets: {
      applePay: 'never',
      googlePay: 'never'
    }
  }"
/>
```

### Complete Payment Form with usePaymentIntent

```vue
<script setup>
import { ref } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  usePaymentIntent
} from '@vue-stripe/vue-stripe'

const publishableKey = 'pk_test_...'
const clientSecret = 'pi_xxx_secret_xxx'

const isComplete = ref(false)
const status = ref('')

// This component must be inside StripeProvider
// Using a child component for the form is recommended
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement @change="e => isComplete = e.complete" />
      <PaymentFormButton :client-secret="clientSecret" :disabled="!isComplete" />
    </StripeElements>
  </StripeProvider>
</template>
```

```vue
<!-- PaymentFormButton.vue - child component -->
<script setup>
import { ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{
  clientSecret: string
  disabled: boolean
}>()

const { confirmPayment, loading, error } = usePaymentIntent()

const handleSubmit = async () => {
  const result = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: {
      return_url: window.location.href
    },
    redirect: 'if_required'
  })

  if (result.error) {
    console.error(result.error.message)
  } else if (result.paymentIntent?.status === 'succeeded') {
    console.log('Payment successful!')
  }
}
</script>

<template>
  <div>
    <button @click="handleSubmit" :disabled="disabled || loading">
      {{ loading ? 'Processing...' : 'Pay Now' }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
```

### With Appearance Customization

```vue
<script setup>
const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#635bff',
    colorBackground: '#ffffff',
    colorText: '#1a1a2e',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px'
  },
  rules: {
    '.Input': {
      border: '1px solid #e0e0e0',
      boxShadow: 'none'
    },
    '.Input:focus': {
      border: '1px solid #635bff',
      boxShadow: '0 0 0 3px rgba(99, 91, 255, 0.1)'
    }
  }
}
</script>

<template>
  <StripeElements
    :client-secret="clientSecret"
    :options="{ appearance }"
  >
    <StripePaymentElement />
  </StripeElements>
</template>
```

## TypeScript

```ts
import { ref } from 'vue'
import { StripePaymentElement } from '@vue-stripe/vue-stripe'
import type {
  StripePaymentElement as StripePaymentElementType,
  StripePaymentElementChangeEvent,
  StripePaymentElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripePaymentElementOptions = {
  layout: 'tabs',
  defaultValues: {
    billingDetails: {
      email: 'customer@example.com'
    }
  }
}

// Event handlers
const handleReady = (element: StripePaymentElementType) => {
  console.log('Ready:', element)
}

const handleChange = (event: StripePaymentElementChangeEvent) => {
  console.log('Complete:', event.complete)
  console.log('Payment type:', event.value.type)
}

// Template ref
const paymentRef = ref<InstanceType<typeof StripePaymentElement>>()
```

## Test Cards

Use these test card numbers in test mode:

| Card | Number |
|------|--------|
| Visa (success) | `4242 4242 4242 4242` |
| Visa (declined) | `4000 0000 0000 0002` |
| Requires 3D Secure | `4000 0025 0000 3155` |
| Insufficient funds | `4000 0000 0000 9995` |

Use any future expiration date and any 3-digit CVC.

## Advantages Over Card Element

| Feature | Payment Element | Card Element |
|---------|----------------|--------------|
| Multiple payment methods | Yes | Cards only |
| Wallets (Apple/Google Pay) | Built-in | Separate component |
| Bank transfers | Yes | No |
| Buy Now Pay Later | Yes | No |
| Dynamic optimization | Yes | No |
| Localization | Automatic | Manual |

## See Also

- [StripeElements](/api/components/stripe-elements) - Parent container component
- [usePaymentIntent](/api/composables/use-payment-intent) - Confirm payments
- [Payment Element Guide](/guide/payment-element) - Step-by-step guide
- [Stripe Payment Element Docs](https://stripe.com/docs/payments/payment-element) - Official documentation
