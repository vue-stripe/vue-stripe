# Card Element

The Card Element provides card-specific payment collection. Use it when you only need to accept card payments or want maximum control over the card input UI.

## Choosing Between Card Elements

| Component | Use Case |
|-----------|----------|
| `VueStripeCardElement` | Single input for card number, expiry, and CVC |
| Split elements | Separate inputs for custom layouts |

## Single Card Element

The simplest way to collect card details. The page renders the providers; the form inside them confirms with [`useConfirmCardPayment()`](/api/composables/confirm/cards) and looks the element up with [`useStripeElements().getElement()`](/api/composables/use-stripe-elements):

```vue
<!-- CardPage.vue -->
<script setup lang="ts">
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import CardForm from './CardForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_..._secret_...' // From your backend
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <CardForm :client-secret="clientSecret" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

```vue
<!-- CardForm.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import {
  VueStripeCardElement,
  useConfirmCardPayment,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const { getElement } = useStripeElements()
const { confirmCardPayment } = useConfirmCardPayment()

const handleSubmit = async () => {
  const cardElement = getElement('card')
  if (!cardElement) return

  const { error, paymentIntent } = await confirmCardPayment(props.clientSecret, {
    payment_method: {
      card: cardElement
    }
  })

  if (error) {
    console.error(error.message)
  } else if (paymentIntent?.status === 'succeeded') {
    console.log('Payment succeeded!')
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <VueStripeCardElement />
    <button type="submit">Pay</button>
  </form>
</template>
```

::: tip No clientSecret required
Unlike Payment Element, Card Element can work without a `clientSecret` on StripeElements. You pass the secret directly to `confirmCardPayment`.
:::

## Split Card Elements

For custom layouts, use separate elements for each field:

```vue
<script setup>
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeCardNumberElement,
  VueStripeCardExpiryElement,
  VueStripeCardCvcElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <div class="card-form">
        <div class="field">
          <label>Card number</label>
          <VueStripeCardNumberElement />
        </div>
        <div class="row">
          <div class="field">
            <label>Expiry</label>
            <VueStripeCardExpiryElement />
          </div>
          <div class="field">
            <label>CVC</label>
            <VueStripeCardCvcElement />
          </div>
        </div>
      </div>
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

### Confirming with Split Elements

When using split elements, reference the card number element. In a component inside `VueStripeElements`:

```js
import { useConfirmCardPayment, useStripeElements } from '@vue-stripe/vue-stripe'

const { getElement } = useStripeElements()
const { confirmCardPayment } = useConfirmCardPayment()

const handleSubmit = async () => {
  // Get the card number element (expiry and CVC are linked automatically)
  const cardNumberElement = getElement('cardNumber')
  if (!cardNumberElement) return

  const { error, paymentIntent } = await confirmCardPayment(props.clientSecret, {
    payment_method: {
      card: cardNumberElement
    }
  })
}
```

## Complete Example

```vue
<!-- CardPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import CardForm from './CardForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_..._secret_...' // From your backend
const success = ref(false)
</script>

<template>
  <div class="card-page">
    <div v-if="success" class="success">
      Payment successful!
    </div>

    <VueStripeProvider v-else :publishable-key="publishableKey">
      <VueStripeElements>
        <CardForm :client-secret="clientSecret" @success="success = true" />
      </VueStripeElements>
    </VueStripeProvider>
  </div>
</template>

<style scoped>
.card-page {
  max-width: 400px;
  margin: 0 auto;
}

.success {
  color: #00d66b;
  padding: 20px;
  text-align: center;
}
</style>
```

```vue
<!-- CardForm.vue: rendered inside VueStripeElements -->
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeCardElement,
  useConfirmCardPayment,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const emit = defineEmits<{ success: [] }>()

const { getElement } = useStripeElements()
const { confirmCardPayment, loading: processing } = useConfirmCardPayment()

const cardComplete = ref(false)
const errorMessage = ref('')

const handleChange = (event: { complete: boolean; error?: { message: string } }) => {
  cardComplete.value = event.complete
  errorMessage.value = event.error?.message || ''
}

const handleSubmit = async () => {
  const cardElement = getElement('card')
  if (!cardElement) return

  errorMessage.value = ''

  const { error, paymentIntent } = await confirmCardPayment(props.clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'Customer Name'
      }
    }
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
  } else if (paymentIntent?.status === 'succeeded') {
    emit('success')
  }
}

const cardStyles = {
  base: {
    fontSize: '16px',
    color: '#424770',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    '::placeholder': {
      color: '#aab7c4'
    }
  },
  invalid: {
    color: '#9e2146',
    iconColor: '#9e2146'
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="card-field">
      <label>Card details</label>
      <VueStripeCardElement
        :options="{ style: cardStyles, hidePostalCode: true }"
        @change="handleChange"
      />
    </div>

    <div v-if="errorMessage" class="error">
      {{ errorMessage }}
    </div>

    <button
      type="submit"
      :disabled="processing || !cardComplete"
    >
      {{ processing ? 'Processing...' : 'Pay' }}
    </button>
  </form>
</template>

<style scoped>
.card-field {
  margin-bottom: 16px;
}

.card-field label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

:deep(.vue-stripe-card-element) {
  padding: 12px;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  background: white;
}

:deep(.vue-stripe-card-element:focus-within) {
  border-color: #5469d4;
  box-shadow: 0 0 0 1px #5469d4;
}

button {
  width: 100%;
  background: #5469d4;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #9e2146;
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

## Card Element vs Payment Element

| Feature | Card Element | Payment Element |
|---------|--------------|-----------------|
| Payment methods | Cards only | 40+ methods |
| Layout control | High | Medium |
| Setup complexity | Lower | Higher |
| Automatic updates | No | Yes |
| clientSecret requirement | Optional | Required |

## When to Use Card Element

- You only accept card payments
- You need precise control over field layout
- You want to match an existing design system
- You're building a POS-style interface

## Next Steps

- [Payment Element](/guide/payment-element) — For multi-method support
- [Express Checkout](/guide/express-checkout) — Add Apple Pay and Google Pay
- [Appearance API](/api/components/stripe-elements#appearance-api) — Style your elements
- [API Reference](/api/components/stripe-card-element) — Full props, events, and options
