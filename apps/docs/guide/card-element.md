# Card Element

The Card Element provides card-specific payment collection. Use it when you only need to accept card payments or want maximum control over the card input UI.

## Choosing Between Card Elements

| Component | Use Case |
|-----------|----------|
| `StripeCardElement` | Single input for card number, expiry, and CVC |
| Split elements | Separate inputs for custom layouts |

## Single Card Element

The simplest way to collect card details:

```vue
<script setup>
import { ref } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeCardElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('pi_..._secret_...')

const handleSubmit = async () => {
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  const cardElement = elements.value?.getElement('card')

  const { error, paymentIntent } = await stripe.value.confirmCardPayment(
    clientSecret.value,
    {
      payment_method: {
        card: cardElement
      }
    }
  )

  if (error) {
    console.error(error.message)
  } else if (paymentIntent.status === 'succeeded') {
    console.log('Payment succeeded!')
  }
}
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements>
      <form @submit.prevent="handleSubmit">
        <StripeCardElement />
        <button type="submit">Pay</button>
      </form>
    </StripeElements>
  </StripeProvider>
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
  StripeProvider,
  StripeElements,
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement
} from '@vue-stripe/vue-stripe'
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements>
      <div class="card-form">
        <div class="field">
          <label>Card number</label>
          <StripeCardNumberElement />
        </div>
        <div class="row">
          <div class="field">
            <label>Expiry</label>
            <StripeCardExpiryElement />
          </div>
          <div class="field">
            <label>CVC</label>
            <StripeCardCvcElement />
          </div>
        </div>
      </div>
    </StripeElements>
  </StripeProvider>
</template>
```

### Confirming with Split Elements

When using split elements, reference the card number element:

```js
const handleSubmit = async () => {
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  // Get the card number element (expiry and CVC are linked automatically)
  const cardNumberElement = elements.value?.getElement('cardNumber')

  const { error, paymentIntent } = await stripe.value.confirmCardPayment(
    clientSecret.value,
    {
      payment_method: {
        card: cardNumberElement
      }
    }
  )
}
```

## Props

All card elements accept these props:

| Prop | Type | Description |
|------|------|-------------|
| `options` | `object` | Element configuration options |

### Options

```vue
<StripeCardElement
  :options="{
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#9e2146'
      }
    },
    hidePostalCode: true,
    disabled: false
  }"
/>
```

### Styling Options

```js
{
  style: {
    base: {
      // Normal state
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      // Invalid input state
      color: '#fa755a',
      iconColor: '#fa755a'
    },
    complete: {
      // Valid input state
      color: '#00d66b'
    }
  }
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `Element` | Element mounted |
| `@change` | `{ complete, empty, error, value }` | Input changed |
| `@focus` | — | Element focused |
| `@blur` | — | Element blurred |
| `@escape` | — | Escape key pressed |

```vue
<StripeCardElement
  @ready="onReady"
  @change="onChange"
  @focus="onFocus"
  @blur="onBlur"
/>

<script setup>
const cardComplete = ref(false)
const cardError = ref('')

const onChange = (event) => {
  cardComplete.value = event.complete
  cardError.value = event.error?.message || ''
}
</script>
```

## Exposed Methods

Access element methods via template refs:

```vue
<script setup>
import { ref } from 'vue'

const cardRef = ref()

const focusCard = () => {
  cardRef.value?.focus()
}

const clearCard = () => {
  cardRef.value?.clear()
}
</script>

<template>
  <StripeCardElement ref="cardRef" />
  <button @click="focusCard">Focus</button>
  <button @click="clearCard">Clear</button>
</template>
```

Available methods:
- `focus()` - Focus the element
- `blur()` - Blur the element
- `clear()` - Clear the input
- `element` - Access the underlying Stripe element

## Complete Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeCardElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_..._secret_...' // From your backend

const processing = ref(false)
const cardComplete = ref(false)
const errorMessage = ref('')
const success = ref(false)

const handleChange = (event: { complete: boolean; error?: { message: string } }) => {
  cardComplete.value = event.complete
  errorMessage.value = event.error?.message || ''
}

const handleSubmit = async () => {
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  if (!stripe.value || !elements.value) return

  processing.value = true
  errorMessage.value = ''

  const cardElement = elements.value.getElement('card')

  const { error, paymentIntent } = await stripe.value.confirmCardPayment(
    clientSecret,
    {
      payment_method: {
        card: cardElement!,
        billing_details: {
          name: 'Customer Name'
        }
      }
    }
  )

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
    processing.value = false
  } else if (paymentIntent?.status === 'succeeded') {
    success.value = true
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
  <div class="card-form">
    <div v-if="success" class="success">
      Payment successful!
    </div>

    <StripeProvider v-else :publishable-key="publishableKey">
      <StripeElements>
        <form @submit.prevent="handleSubmit">
          <div class="card-field">
            <label>Card details</label>
            <StripeCardElement
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
      </StripeElements>
    </StripeProvider>
  </div>
</template>

<style scoped>
.card-form {
  max-width: 400px;
  margin: 0 auto;
}

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

.success {
  color: #00d66b;
  padding: 20px;
  text-align: center;
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

- [Payment Element](/guide/payment-element) - For multi-method support
- [Express Checkout](/guide/express-checkout) - Add Apple Pay and Google Pay
- [Customization](/guide/customization) - Style your elements
