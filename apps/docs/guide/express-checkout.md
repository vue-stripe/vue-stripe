# Express Checkout Element

The Express Checkout Element displays one-click payment buttons for Apple Pay, Google Pay, and Link. It provides the fastest checkout experience for customers with saved payment methods.

## Basic Setup

```vue
<script setup>
import { ref } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeExpressCheckoutElement,
  useStripe
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('pi_..._secret_...')

const handleConfirm = async (event) => {
  const { stripe } = useStripe()

  const { error } = await stripe.value.confirmPayment({
    elements: event.elements,
    confirmParams: {
      return_url: `${window.location.origin}/complete`
    }
  })

  if (error) {
    console.error(error.message)
  }
}
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripeExpressCheckoutElement @confirm="handleConfirm" />
    </StripeElements>
  </StripeProvider>
</template>
```

## How It Works

The Express Checkout Element:
1. Detects available payment methods (Apple Pay on Safari/iOS, Google Pay on Chrome/Android)
2. Shows only the buttons that are available for the customer
3. Handles the wallet authentication flow
4. Returns the payment result for you to confirm

::: warning HTTPS Required
Apple Pay and Google Pay only work over HTTPS, even in development. Use a tool like [ngrok](https://ngrok.com) or [localhost.run](https://localhost.run) for local testing.
:::

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@click` | `{ resolve }` | Button clicked, resolve with options |
| `@confirm` | `{ elements, expressPaymentType }` | User confirmed in wallet |
| `@cancel` | — | User cancelled the wallet flow |
| `@ready` | `{ availablePaymentMethods }` | Element ready, shows available methods |
| `@shippingaddresschange` | `{ address, resolve }` | Shipping address changed |
| `@shippingratechange` | `{ shippingRate, resolve }` | Shipping rate selected |

### Handling the Click Event

Use `@click` to customize the payment sheet:

```vue
<StripeExpressCheckoutElement
  @click="handleClick"
  @confirm="handleConfirm"
/>

<script setup>
const handleClick = ({ resolve }) => {
  // Customize what appears in the payment sheet
  resolve({
    // Business name shown in the sheet
    business: { name: 'My Store' },
    // Show/hide email field
    emailRequired: true,
    // Show/hide phone field
    phoneNumberRequired: false,
    // Enable shipping address collection
    shippingAddressRequired: true,
    // Allowed shipping countries
    allowedShippingCountries: ['US', 'CA', 'GB'],
    // Shipping options
    shippingRates: [
      {
        id: 'standard',
        displayName: 'Standard Shipping',
        amount: 500 // $5.00
      },
      {
        id: 'express',
        displayName: 'Express Shipping',
        amount: 1500 // $15.00
      }
    ]
  })
}
</script>
```

### Dynamic Shipping Rates

Update shipping rates when the address changes:

```vue
<script setup>
const handleShippingAddressChange = async ({ address, resolve }) => {
  // Fetch shipping rates for this address from your backend
  const rates = await fetchShippingRates(address)

  resolve({
    shippingRates: rates.map(rate => ({
      id: rate.id,
      displayName: rate.name,
      amount: rate.price,
      deliveryEstimate: {
        minimum: { unit: 'day', value: rate.minDays },
        maximum: { unit: 'day', value: rate.maxDays }
      }
    }))
  })
}
</script>

<template>
  <StripeExpressCheckoutElement
    @click="handleClick"
    @confirm="handleConfirm"
    @shippingaddresschange="handleShippingAddressChange"
  />
</template>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `object` | Element configuration |

### Options

```vue
<StripeExpressCheckoutElement
  :options="{
    buttonType: {
      applePay: 'buy',
      googlePay: 'buy'
    },
    buttonTheme: {
      applePay: 'black',
      googlePay: 'black'
    },
    buttonHeight: 48,
    layout: {
      maxColumns: 2,
      maxRows: 1
    },
    paymentMethods: {
      applePay: 'always',
      googlePay: 'always',
      link: 'auto'
    }
  }"
/>
```

### Button Types

| Type | Apple Pay | Google Pay |
|------|-----------|------------|
| `buy` | "Buy with Apple Pay" | "Buy with Google Pay" |
| `checkout` | "Check out with Apple Pay" | "Check out with GPay" |
| `donate` | "Donate with Apple Pay" | "Donate with GPay" |
| `plain` | Apple Pay logo only | Google Pay logo only |

### Button Themes

| Theme | Apple Pay | Google Pay |
|-------|-----------|------------|
| `black` | Black background | Black background |
| `white` | White background | White background |
| `white-outline` | White with border | White with border |

## Combining with Payment Element

A common pattern is to show Express Checkout above the Payment Element:

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <div class="checkout-form">
        <!-- Express Checkout at top -->
        <StripeExpressCheckoutElement
          @confirm="handleExpressConfirm"
          @ready="handleExpressReady"
        />

        <!-- Divider (only show if express checkout is available) -->
        <div v-if="hasExpressCheckout" class="divider">
          <span>Or pay with card</span>
        </div>

        <!-- Payment Element below -->
        <form @submit.prevent="handleSubmit">
          <StripePaymentElement />
          <button type="submit">Pay $20.00</button>
        </form>
      </div>
    </StripeElements>
  </StripeProvider>
</template>

<script setup>
const hasExpressCheckout = ref(false)

const handleExpressReady = ({ availablePaymentMethods }) => {
  // Check if any express payment methods are available
  hasExpressCheckout.value =
    availablePaymentMethods?.applePay ||
    availablePaymentMethods?.googlePay ||
    availablePaymentMethods?.link
}
</script>

<style scoped>
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 24px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e6e6e6;
}

.divider span {
  padding: 0 16px;
  color: #6b7280;
  font-size: 14px;
}
</style>
```

## Complete Example

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  StripeProvider,
  StripeElements,
  StripeExpressCheckoutElement,
  StripePaymentElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const hasExpressCheckout = ref(false)
const processing = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ amount: 2000 })
  })
  const data = await response.json()
  clientSecret.value = data.clientSecret
})

const handleExpressReady = ({ availablePaymentMethods }) => {
  hasExpressCheckout.value =
    availablePaymentMethods?.applePay ||
    availablePaymentMethods?.googlePay
}

const handleClick = ({ resolve }) => {
  resolve({
    business: { name: 'My Store' },
    shippingAddressRequired: true,
    shippingRates: [
      { id: 'free', displayName: 'Free Shipping', amount: 0 },
      { id: 'express', displayName: 'Express', amount: 1000 }
    ]
  })
}

const handleExpressConfirm = async (event) => {
  const { stripe } = useStripe()

  const { error } = await stripe.value.confirmPayment({
    elements: event.elements,
    confirmParams: {
      return_url: `${window.location.origin}/complete`
    }
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
  }
}

const handleSubmit = async () => {
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  if (!stripe.value || !elements.value) return

  processing.value = true

  const { error } = await stripe.value.confirmPayment({
    elements: elements.value,
    confirmParams: {
      return_url: `${window.location.origin}/complete`
    }
  })

  if (error) {
    errorMessage.value = error.message || 'Payment failed'
    processing.value = false
  }
}
</script>

<template>
  <div class="checkout">
    <StripeProvider :publishable-key="publishableKey">
      <StripeElements v-if="clientSecret" :client-secret="clientSecret">
        <!-- Express Checkout -->
        <StripeExpressCheckoutElement
          @ready="handleExpressReady"
          @click="handleClick"
          @confirm="handleExpressConfirm"
        />

        <!-- Divider -->
        <div v-if="hasExpressCheckout" class="divider">
          <span>Or pay with card</span>
        </div>

        <!-- Regular Payment Form -->
        <form @submit.prevent="handleSubmit">
          <StripePaymentElement />

          <div v-if="errorMessage" class="error">
            {{ errorMessage }}
          </div>

          <button type="submit" :disabled="processing">
            {{ processing ? 'Processing...' : 'Pay $20.00' }}
          </button>
        </form>
      </StripeElements>

      <div v-else>Loading...</div>
    </StripeProvider>
  </div>
</template>
```

## Testing

### Apple Pay
- Use Safari on macOS or iOS
- Must have a card in Apple Wallet
- Use test mode cards: Any card will work in test mode

### Google Pay
- Use Chrome
- Must have a card saved in Google Pay
- Works in test mode with any saved card

### Link
- Works in any browser
- Uses Stripe's Link service
- Auto-fills for returning customers

## Next Steps

- [Payment Element](/guide/payment-element) - The full payment form
- [Customization](/guide/customization) - Style your checkout
- [Error Handling](/guide/error-handling) - Handle edge cases
