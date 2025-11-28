# Split Card Elements

Three separate input components for card number, expiration, and CVC. Use these when you need more control over layout and per-field validation.

::: tip When to Use
Use Split Card Elements when you need:
- Custom form layouts (horizontal, multi-column)
- Different styling per field
- Per-field validation display
- Better accessibility with separate labels

For simpler integration, consider [StripeCardElement](/api/components/stripe-card-element) instead.
:::

## Components

- **StripeCardNumberElement** - Card number input with brand detection
- **StripeCardExpiryElement** - MM/YY expiration date input
- **StripeCardCvcElement** - 3 or 4 digit security code input

## Usage

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements>
      <div class="card-form">
        <div class="field">
          <label>Card Number</label>
          <StripeCardNumberElement
            :options="elementStyle"
            @change="onNumberChange"
          />
        </div>

        <div class="row">
          <div class="field">
            <label>Expiration</label>
            <StripeCardExpiryElement
              :options="elementStyle"
              @change="onExpiryChange"
            />
          </div>

          <div class="field">
            <label>CVC</label>
            <StripeCardCvcElement
              :options="elementStyle"
              @change="onCvcChange"
            />
          </div>
        </div>

        <button :disabled="!allComplete">Pay</button>
      </div>
    </StripeElements>
  </StripeProvider>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const numberComplete = ref(false)
const expiryComplete = ref(false)
const cvcComplete = ref(false)

const allComplete = computed(() =>
  numberComplete.value && expiryComplete.value && cvcComplete.value
)

const elementStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d'
    }
  }
}

const onNumberChange = (event) => {
  numberComplete.value = event.complete
}

const onExpiryChange = (event) => {
  expiryComplete.value = event.complete
}

const onCvcChange = (event) => {
  cvcComplete.value = event.complete
}
</script>
```

## Props

All three components share the same props interface:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | No | Element configuration options |

### Options Object

```ts
interface SplitCardElementOptions {
  style?: {
    base?: StripeElementStyle
    complete?: StripeElementStyle
    empty?: StripeElementStyle
    invalid?: StripeElementStyle
  }
  disabled?: boolean
  // CardNumber specific:
  showIcon?: boolean        // Show card brand icon
  iconStyle?: 'default' | 'solid'
}
```

## Events

All three components emit the same events:

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeElement` | Emitted when the element is fully rendered |
| `@change` | `ChangeEvent` | Emitted when the element value changes |
| `@focus` | - | Emitted when the element gains focus |
| `@blur` | - | Emitted when the element loses focus |
| `@escape` | - | Emitted when the escape key is pressed |

### Change Event Differences

**StripeCardNumberElement**
```ts
interface CardNumberChangeEvent {
  elementType: 'cardNumber'
  empty: boolean
  complete: boolean
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | 'unknown'
  error?: { message: string }
}
```

**StripeCardExpiryElement**
```ts
interface CardExpiryChangeEvent {
  elementType: 'cardExpiry'
  empty: boolean
  complete: boolean
  error?: { message: string }
}
```

**StripeCardCvcElement**
```ts
interface CardCvcChangeEvent {
  elementType: 'cardCvc'
  empty: boolean
  complete: boolean
  error?: { message: string }
}
```

## Exposed Methods

Access via template ref on each component:

```vue
<script setup>
import { ref } from 'vue'

const numberRef = ref()
const expiryRef = ref()
const cvcRef = ref()

const focusNumber = () => numberRef.value?.focus()
const clearAll = () => {
  numberRef.value?.clear()
  expiryRef.value?.clear()
  cvcRef.value?.clear()
}
</script>

<template>
  <StripeCardNumberElement ref="numberRef" />
  <StripeCardExpiryElement ref="expiryRef" />
  <StripeCardCvcElement ref="cvcRef" />
</template>
```

| Method | Description |
|--------|-------------|
| `focus()` | Focus the input |
| `blur()` | Blur the input |
| `clear()` | Clear the input value |

## Examples

### Horizontal Layout

```vue
<template>
  <div class="horizontal-card-form">
    <StripeCardNumberElement class="number-field" />
    <StripeCardExpiryElement class="expiry-field" />
    <StripeCardCvcElement class="cvc-field" />
  </div>
</template>

<style scoped>
.horizontal-card-form {
  display: flex;
  gap: 1rem;
}

.number-field {
  flex: 2;
}

.expiry-field,
.cvc-field {
  flex: 1;
}
</style>
```

### With Per-Field Errors

```vue
<script setup>
import { ref } from 'vue'

const numberError = ref('')
const expiryError = ref('')
const cvcError = ref('')

const onNumberChange = (event) => {
  numberError.value = event.error?.message || ''
}

const onExpiryChange = (event) => {
  expiryError.value = event.error?.message || ''
}

const onCvcChange = (event) => {
  cvcError.value = event.error?.message || ''
}
</script>

<template>
  <div class="field">
    <label>Card Number</label>
    <StripeCardNumberElement @change="onNumberChange" />
    <span v-if="numberError" class="error">{{ numberError }}</span>
  </div>

  <div class="field">
    <label>Expiration</label>
    <StripeCardExpiryElement @change="onExpiryChange" />
    <span v-if="expiryError" class="error">{{ expiryError }}</span>
  </div>

  <div class="field">
    <label>CVC</label>
    <StripeCardCvcElement @change="onCvcChange" />
    <span v-if="cvcError" class="error">{{ cvcError }}</span>
  </div>
</template>
```

### Card Brand Detection

```vue
<script setup>
import { ref, computed } from 'vue'

const cardBrand = ref('unknown')

const brandIcon = computed(() => {
  const icons = {
    visa: 'https://js.stripe.com/v3/fingerprinted/img/visa-365725566f9578a9589553aa9296d178.svg',
    mastercard: 'https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg',
    amex: 'https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg',
    unknown: null
  }
  return icons[cardBrand.value] || null
})

const onNumberChange = (event) => {
  cardBrand.value = event.brand
}
</script>

<template>
  <div class="card-number-field">
    <StripeCardNumberElement @change="onNumberChange" />
    <img v-if="brandIcon" :src="brandIcon" class="brand-icon" />
  </div>
</template>
```

### Payment Submission

```vue
<script setup>
import { ref } from 'vue'
import { useStripe, useStripeElements } from '@vue-stripe/vue-stripe'

const { stripe } = useStripe()
const { elements } = useStripeElements()

const processing = ref(false)

const handleSubmit = async (clientSecret) => {
  if (!stripe.value || !elements.value) return

  processing.value = true

  // Get the card number element
  const cardNumberElement = elements.value.getElement('cardNumber')

  const { error, paymentIntent } = await stripe.value.confirmCardPayment(
    clientSecret,
    {
      payment_method: {
        card: cardNumberElement,
        billing_details: {
          name: 'Customer Name'
        }
      }
    }
  )

  processing.value = false

  if (error) {
    console.error(error.message)
  } else if (paymentIntent.status === 'succeeded') {
    console.log('Payment successful!')
  }
}
</script>
```

## TypeScript

```ts
import { ref } from 'vue'
import {
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement
} from '@vue-stripe/vue-stripe'
import type {
  StripeCardNumberElement as StripeCardNumberElementType,
  StripeCardNumberElementChangeEvent,
  StripeCardNumberElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripeCardNumberElementOptions = {
  style: {
    base: { fontSize: '16px' }
  },
  showIcon: true
}

// Event handlers
const handleNumberChange = (event: StripeCardNumberElementChangeEvent) => {
  console.log('Brand:', event.brand)
  console.log('Complete:', event.complete)
}

// Template refs
const numberRef = ref<InstanceType<typeof StripeCardNumberElement>>()
const expiryRef = ref<InstanceType<typeof StripeCardExpiryElement>>()
const cvcRef = ref<InstanceType<typeof StripeCardCvcElement>>()
```

## Test Cards

Use these test card numbers in test mode:

| Card | Number |
|------|--------|
| Visa | `4242 4242 4242 4242` |
| Visa (debit) | `4000 0566 5566 5556` |
| Mastercard | `5555 5555 5555 4444` |
| American Express | `3782 822463 10005` |
| Discover | `6011 1111 1111 1117` |
| Declined | `4000 0000 0000 0002` |

Use any future expiration date and any 3-digit CVC (4-digit for Amex).

## Comparison: Split vs Unified

| Feature | Split Elements | Unified CardElement |
|---------|----------------|---------------------|
| Layout Control | Full control | Limited |
| Per-field Styling | Yes | Shared styles |
| Per-field Errors | Yes | Single error |
| Accessibility | Better (separate labels) | Basic |
| Implementation | More code | Simpler |
| Brand Detection | Via change event | Via change event |

## See Also

- [StripeCardElement](/api/components/stripe-card-element) - Unified card input
- [StripeElements](/api/components/stripe-elements) - Parent container
- [useStripeElements](/api/composables/use-stripe-elements) - Access elements
