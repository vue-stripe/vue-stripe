# StripeAddressElement

A complete address collection form with built-in autocomplete powered by Google Maps.

::: tip No Backend Required
StripeAddressElement works without a `clientSecret`. It only needs to be wrapped in `StripeProvider` and `StripeElements` to function.
:::

## Usage

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements>
      <StripeAddressElement
        :options="addressOptions"
        @ready="onReady"
        @change="onChange"
      />
      <button @click="handleSubmit">Continue</button>
    </StripeElements>
  </StripeProvider>
</template>

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

const onReady = () => {
  console.log('Address element ready')
}

const onChange = (event) => {
  if (event.complete) {
    console.log('Address complete:', event.value)
  }
}
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeAddressElementOptions` | No | Address element configuration (defaults to `{ mode: 'shipping' }`) |

### Options Object

```ts
interface StripeAddressElementOptions {
  mode: 'shipping' | 'billing'
  autocomplete?: {
    mode: 'automatic' | 'disabled'
  }
  allowedCountries?: string[]
  blockPoBox?: boolean
  contacts?: Array<{
    name: string
    address: AddressValue
  }>
  defaultValues?: {
    name?: string
    firstName?: string
    lastName?: string
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
  display?: {
    name?: 'full' | 'split' | 'organization'
  }
  fields?: {
    phone?: 'always' | 'never' | 'auto'
  }
  validation?: {
    phone?: {
      required?: 'always' | 'never' | 'auto'
    }
  }
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | - | Emitted when the element is fully rendered |
| `@change` | `StripeAddressElementChangeEvent` | Emitted when the address value changes |
| `@focus` | - | Emitted when any field gains focus |
| `@blur` | - | Emitted when any field loses focus |
| `@escape` | - | Emitted when the escape key is pressed |
| `@load-error` | `{ elementType: 'address', error: string }` | Emitted if the element fails to load |

### Change Event

```ts
interface StripeAddressElementChangeEvent {
  elementType: 'address'
  complete: boolean
  isNewAddress: boolean
  value: {
    name?: string
    firstName?: string
    lastName?: string
    phone?: string
    address: {
      line1: string
      line2: string | null
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
}
```

## Exposed Methods

Access these methods via template ref:

```vue
<script setup>
import { ref } from 'vue'

const addressRef = ref()

// Get current value programmatically
const validateAddress = async () => {
  const result = await addressRef.value?.getValue()
  if (result.complete) {
    console.log('Valid address:', result.value)
  } else {
    console.log('Address incomplete')
  }
}

// Focus the first field
const focusAddress = () => addressRef.value?.focus()

// Clear all fields
const clearAddress = () => addressRef.value?.clear()
</script>

<template>
  <StripeAddressElement ref="addressRef" />
  <button @click="validateAddress">Validate</button>
  <button @click="focusAddress">Focus</button>
  <button @click="clearAddress">Clear</button>
</template>
```

| Method | Returns | Description |
|--------|---------|-------------|
| `getValue()` | `Promise<{ complete, isNewAddress, value }>` | Get the current address data programmatically |
| `focus()` | `void` | Focus the first input field |
| `clear()` | `void` | Clear all address fields |

## Exposed Properties

| Property | Type | Description |
|----------|------|-------------|
| `element` | `Ref<StripeAddressElement \| null>` | The Stripe address element instance |

## Examples

### Shipping vs Billing Mode

```vue
<script setup>
import { ref } from 'vue'

const mode = ref('shipping')

const options = computed(() => ({
  mode: mode.value
}))
</script>

<template>
  <div>
    <button @click="mode = 'shipping'">Shipping</button>
    <button @click="mode = 'billing'">Billing</button>
  </div>
  <StripeAddressElement :key="mode" :options="options" />
</template>
```

### With Default Values (Pre-fill)

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

### With Phone Field

```vue
<script setup>
const options = {
  mode: 'shipping',
  fields: {
    phone: 'always'
  },
  validation: {
    phone: {
      required: 'always'
    }
  }
}
</script>

<template>
  <StripeAddressElement :options="options" />
</template>
```

### Limit Countries

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

### Block P.O. Boxes

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

### Using getValue() for Validation

```vue
<script setup>
import { ref } from 'vue'

const addressRef = ref()
const isValid = ref(false)
const addressData = ref(null)

const handleSubmit = async () => {
  if (!addressRef.value) return

  const result = await addressRef.value.getValue()

  if (result.complete) {
    isValid.value = true
    addressData.value = result.value
    // Proceed with checkout
    console.log('Shipping to:', addressData.value.address)
  } else {
    isValid.value = false
    alert('Please complete the address form')
  }
}
</script>

<template>
  <StripeAddressElement ref="addressRef" :options="{ mode: 'shipping' }" />
  <button @click="handleSubmit">Continue to Payment</button>

  <div v-if="addressData">
    <h4>Confirmed Address:</h4>
    <p>{{ addressData.name }}</p>
    <p>{{ addressData.address.line1 }}</p>
    <p>{{ addressData.address.city }}, {{ addressData.address.state }} {{ addressData.address.postal_code }}</p>
  </div>
</template>
```

### Integration with Payment Element

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

const addressRef = ref()
const step = ref('address')

const { stripe } = useStripe()
const { elements } = useStripeElements()

const handleContinue = async () => {
  const result = await addressRef.value?.getValue()
  if (result?.complete) {
    step.value = 'payment'
  }
}

const handlePayment = async (clientSecret) => {
  const addressResult = await addressRef.value?.getValue()

  const { error } = await stripe.value.confirmPayment({
    elements: elements.value,
    confirmParams: {
      return_url: window.location.origin + '/success',
      shipping: {
        name: addressResult.value.name,
        address: addressResult.value.address
      }
    }
  })

  if (error) {
    console.error(error)
  }
}
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :options="{ clientSecret }">
      <!-- Step 1: Address -->
      <div v-if="step === 'address'">
        <h3>Shipping Address</h3>
        <StripeAddressElement ref="addressRef" :options="{ mode: 'shipping' }" />
        <button @click="handleContinue">Continue to Payment</button>
      </div>

      <!-- Step 2: Payment -->
      <div v-if="step === 'payment'">
        <h3>Payment</h3>
        <StripePaymentElement />
        <button @click="handlePayment(clientSecret)">Pay Now</button>
        <button @click="step = 'address'">Back</button>
      </div>
    </StripeElements>
  </StripeProvider>
</template>
```

## TypeScript

```ts
import { ref } from 'vue'
import { StripeAddressElement } from '@vue-stripe/vue-stripe'
import type {
  StripeAddressElement as StripeAddressElementType,
  StripeAddressElementChangeEvent,
  StripeAddressElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripeAddressElementOptions = {
  mode: 'shipping',
  autocomplete: { mode: 'automatic' },
  fields: { phone: 'always' }
}

// Event handlers
const handleReady = () => {
  console.log('Address element ready')
}

const handleChange = (event: StripeAddressElementChangeEvent) => {
  console.log('Complete:', event.complete)
  console.log('Address:', event.value.address)
}

// Template ref with getValue()
const addressRef = ref<InstanceType<typeof StripeAddressElement>>()

const validateAddress = async () => {
  const result = await addressRef.value?.getValue()
  if (result?.complete) {
    // Type-safe address access
    const { line1, city, state, postal_code, country } = result.value.address
    console.log(`${line1}, ${city}, ${state} ${postal_code}, ${country}`)
  }
}
```

## Key Features

- **Google Maps Autocomplete**: Built-in address suggestions as you type
- **No clientSecret Required**: Works immediately with just StripeElements
- **International Support**: Handles addresses from all countries with proper formatting
- **Phone Number Support**: Optional phone field with country-aware formatting
- **Validation**: Built-in validation for complete addresses
- **Pre-fill Support**: Populate with existing customer data
- **P.O. Box Blocking**: Option to prevent P.O. Box addresses for physical delivery

## Use Cases

1. **Checkout shipping address** - Collect where to ship physical goods
2. **Billing address** - Collect for payment verification
3. **Customer profile** - Store addresses for future use
4. **Multi-step checkout** - Collect address before payment details

## See Also

- [StripeElements](/api/components/stripe-elements) - Parent container component
- [StripePaymentElement](/api/components/stripe-payment-element) - All-in-one payment UI
- [Address Element Guide](/guide/address-element) - Step-by-step guide
