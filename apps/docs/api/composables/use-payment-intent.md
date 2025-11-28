# usePaymentIntent

A composable for handling payment confirmations with Stripe's Payment Element.

::: tip Usage Context
This composable must be called within a component that is a descendant of both `StripeProvider` and optionally `StripeElements`. The elements instance is automatically injected if available.
:::

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const { confirmPayment, loading, error } = usePaymentIntent()

const handleSubmit = async (clientSecret: string) => {
  const result = await confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: window.location.href
    },
    redirect: 'if_required'
  })

  if (result.error) {
    console.error('Payment failed:', result.error.message)
  } else if (result.paymentIntent?.status === 'succeeded') {
    console.log('Payment successful!')
  }
}
</script>
```

## Return Value

```ts
interface UsePaymentIntentReturn {
  confirmPayment: (options: ConfirmPaymentOptions) => Promise<ConfirmPaymentResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `confirmPayment` | `Function` | Async function to confirm a payment |
| `loading` | `Readonly<Ref<boolean>>` | Whether a payment confirmation is in progress |
| `error` | `Readonly<Ref<string \| null>>` | Error message from the last confirmation attempt |

## confirmPayment Options

```ts
interface ConfirmPaymentOptions {
  /** Client secret from the PaymentIntent (required) */
  clientSecret: string

  /** Additional confirmation parameters */
  confirmParams?: {
    return_url?: string
    payment_method?: string
    payment_method_data?: {
      billing_details?: {
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
    shipping?: {
      name: string
      address: {
        line1: string
        line2?: string
        city?: string
        state?: string
        postal_code?: string
        country?: string
      }
    }
  }

  /** Redirect behavior */
  redirect?: 'if_required' | 'always'

  /** Override injected elements (optional) */
  elements?: StripeElements
}
```

## confirmPayment Result

```ts
interface ConfirmPaymentResult {
  paymentIntent?: {
    id: string
    status: 'succeeded' | 'processing' | 'requires_action' | 'requires_confirmation' | 'requires_payment_method' | 'canceled'
    client_secret: string
    // ... other PaymentIntent fields
  }
  error?: {
    type: string
    code?: string
    message: string
    decline_code?: string
    param?: string
  }
}
```

## Examples

### Basic Payment Confirmation

```vue
<script setup>
import { ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const { confirmPayment, loading, error } = usePaymentIntent()
const paymentStatus = ref<'idle' | 'success' | 'error'>('idle')

const handlePay = async () => {
  const result = await confirmPayment({
    clientSecret: 'pi_xxx_secret_xxx',
    confirmParams: {
      return_url: `${window.location.origin}/payment-complete`
    }
  })

  if (result.error) {
    paymentStatus.value = 'error'
  } else if (result.paymentIntent?.status === 'succeeded') {
    paymentStatus.value = 'success'
  }
}
</script>

<template>
  <div>
    <button @click="handlePay" :disabled="loading">
      {{ loading ? 'Processing...' : 'Pay Now' }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="paymentStatus === 'success'" class="success">Payment successful!</p>
  </div>
</template>
```

### Without Redirect (for embedded flows)

```vue
<script setup>
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const { confirmPayment, loading, error } = usePaymentIntent()

const handlePay = async (clientSecret: string) => {
  const result = await confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: window.location.href // Required but won't redirect
    },
    redirect: 'if_required' // Only redirect if 3D Secure is needed
  })

  if (result.paymentIntent?.status === 'succeeded') {
    // Handle success inline without redirect
    showSuccessMessage()
  }
}
</script>
```

### With Billing Details

```vue
<script setup>
import { ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const { confirmPayment } = usePaymentIntent()

const customerName = ref('')
const customerEmail = ref('')

const handlePay = async (clientSecret: string) => {
  const result = await confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: window.location.href,
      payment_method_data: {
        billing_details: {
          name: customerName.value,
          email: customerEmail.value
        }
      }
    },
    redirect: 'if_required'
  })

  if (result.error) {
    console.error(result.error.message)
  }
}
</script>
```

### With Shipping Information

```vue
<script setup>
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const { confirmPayment } = usePaymentIntent()

const handlePay = async (clientSecret: string) => {
  const result = await confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: window.location.href,
      shipping: {
        name: 'John Doe',
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94111',
          country: 'US'
        }
      }
    },
    redirect: 'if_required'
  })
}
</script>
```

### Complete Payment Form

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
const clientSecret = ref('') // From your backend

const isComplete = ref(false)
const paymentStatus = ref<'idle' | 'processing' | 'success' | 'error'>('idle')
const errorMessage = ref('')

// PaymentForm component (must be inside StripeElements)
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement @change="e => isComplete = e.complete" />
      <PaymentFormButton
        :client-secret="clientSecret"
        :disabled="!isComplete"
        @success="paymentStatus = 'success'"
        @error="msg => { paymentStatus = 'error'; errorMessage = msg }"
      />
    </StripeElements>
  </StripeProvider>

  <div v-if="paymentStatus === 'success'" class="success">
    Payment successful!
  </div>
  <div v-if="paymentStatus === 'error'" class="error">
    {{ errorMessage }}
  </div>
</template>
```

```vue
<!-- PaymentFormButton.vue -->
<script setup lang="ts">
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps<{
  clientSecret: string
  disabled: boolean
}>()

const emit = defineEmits<{
  success: []
  error: [message: string]
}>()

const { confirmPayment, loading } = usePaymentIntent()

const handleSubmit = async () => {
  const result = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: {
      return_url: window.location.href
    },
    redirect: 'if_required'
  })

  if (result.error) {
    emit('error', result.error.message || 'Payment failed')
  } else if (result.paymentIntent?.status === 'succeeded') {
    emit('success')
  }
}
</script>

<template>
  <button
    @click="handleSubmit"
    :disabled="disabled || loading"
    class="pay-button"
  >
    {{ loading ? 'Processing...' : 'Pay Now' }}
  </button>
</template>
```

### Custom Elements Override

```vue
<script setup>
import { usePaymentIntent, useStripeElements } from '@vue-stripe/vue-stripe'

const { confirmPayment } = usePaymentIntent()
const { elements } = useStripeElements()

// Use a different elements instance if needed
const customElements = createCustomElements()

const handlePay = async (clientSecret: string) => {
  const result = await confirmPayment({
    clientSecret,
    elements: customElements, // Override the injected elements
    confirmParams: {
      return_url: window.location.href
    }
  })
}
</script>
```

## TypeScript

```ts
import { usePaymentIntent } from '@vue-stripe/vue-stripe'
import type {
  PaymentIntent,
  StripeError
} from '@stripe/stripe-js'

const { confirmPayment, loading, error } = usePaymentIntent()

// Type-safe result handling
const handlePayment = async (clientSecret: string) => {
  const result = await confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: window.location.href
    },
    redirect: 'if_required'
  })

  // result.paymentIntent is typed as PaymentIntent | undefined
  // result.error is typed as StripeError | undefined

  if (result.paymentIntent) {
    const { id, status, amount, currency } = result.paymentIntent
    console.log(`Payment ${id}: ${status}`)
  }
}
```

## Error Handling

The composable handles errors in two ways:

1. **Stripe API errors** - Returned in `result.error` and stored in `error.value`
2. **Exceptions** - Caught internally and returned as `{ error: { message: string } }`

```vue
<script setup>
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const { confirmPayment, error } = usePaymentIntent()

const handlePay = async (clientSecret: string) => {
  const result = await confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: window.location.href
    }
  })

  if (result.error) {
    // Check error type
    switch (result.error.type) {
      case 'card_error':
        // Card was declined
        console.error('Card declined:', result.error.message)
        break
      case 'validation_error':
        // Invalid parameters
        console.error('Validation error:', result.error.message)
        break
      default:
        console.error('Payment error:', result.error.message)
    }
  }
}
</script>
```

## Common Error Codes

| Code | Description |
|------|-------------|
| `card_declined` | The card was declined |
| `expired_card` | The card has expired |
| `incorrect_cvc` | The CVC is incorrect |
| `insufficient_funds` | Insufficient funds |
| `processing_error` | Processing error |
| `authentication_required` | 3D Secure authentication required |

## See Also

- [StripePaymentElement](/api/components/stripe-payment-element) - Payment UI component
- [StripeElements](/api/components/stripe-elements) - Elements container
- [useSetupIntent](/api/composables/use-setup-intent) - For saving payment methods
- [Payment Element Guide](/guide/payment-element) - Step-by-step guide
