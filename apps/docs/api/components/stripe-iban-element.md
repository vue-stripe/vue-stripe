# VueStripeIbanElement

A secure IBAN input field for collecting International Bank Account Numbers for SEPA Direct Debit payments.

::: tip When to Use
Use VueStripeIbanElement for SEPA Direct Debit payments across Europe. For card-based payments, use [VueStripePaymentElement](/api/components/stripe-payment-element) instead.
:::

## What is IBAN Element?

IBAN Element collects bank account information for SEPA payments:

| Capability | Description |
|------------|-------------|
| **IBAN Validation** | Real-time format and checksum validation |
| **Bank Detection** | Automatically identifies the bank from IBAN |
| **Country Detection** | Extracts country code from IBAN prefix |
| **SEPA Support** | Supports all 36 SEPA member countries |
| **Auto-formatting** | Formats IBAN with spaces for readability |

## How It Works

```mermaid
flowchart TD
    A["IbanElement mounts inside StripeElements"] --> B["Renders secure IBAN input<br/>Emits @ready when mounted"]
    B --> C["Customer enters IBAN<br/>• Auto-formats with spaces<br/>• Validates checksum"]
    C --> D["Emits @change on each keystroke<br/>{ complete, empty, country, bankName, error }"]
    D --> E{IBAN Valid?}
    E -->|Yes| F["COMPLETE<br/>1. Bank name available<br/>2. Country detected<br/>3. Ready for payment"]
    E -->|No| G["INVALID<br/>1. Error message shown<br/>2. Submit disabled"]
```

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <VueStripeIbanElement
        :options="ibanOptions"
        @ready="onReady"
        @change="onChange"
      />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeIbanElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const ibanOptions = {
  supportedCountries: ['SEPA'],
  placeholderCountry: 'DE'
}

const onReady = (element) => {
  console.log('IBAN element ready', element)
}

const onChange = (event) => {
  console.log('Complete:', event.complete)
  console.log('Bank:', event.bankName)
  console.log('Country:', event.country)
}
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeIbanElementOptions` | No | IBAN element configuration |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`.
:::

### Options Object

```ts
interface StripeIbanElementOptions {
  supportedCountries?: string[]  // Default: ['SEPA']
  placeholderCountry?: string    // Default: none
  style?: {
    base?: StripeElementStyle
    complete?: StripeElementStyle
    empty?: StripeElementStyle
    invalid?: StripeElementStyle
  }
  disabled?: boolean
  iconStyle?: 'default' | 'solid'
}
```

### Supported Countries

The `supportedCountries` option accepts:

| Value | Description |
|-------|-------------|
| `['SEPA']` | All 36 SEPA countries (default) |
| `['DE', 'FR', 'NL']` | Specific country codes |

### Placeholder Country

The `placeholderCountry` option sets the placeholder format:

| Country | Placeholder Format |
|---------|-------------------|
| `DE` | `DE00 0000 0000 0000 0000 00` |
| `FR` | `FR00 0000 0000 0000 0000 0000 000` |
| `NL` | `NL00 AAAA 0000 0000 00` |
| `AT` | `AT00 0000 0000 0000 0000` |

### Style Properties

```ts
interface StripeElementStyle {
  color?: string
  fontFamily?: string
  fontSize?: string
  fontSmoothing?: string
  fontStyle?: string
  fontWeight?: string
  iconColor?: string
  lineHeight?: string
  letterSpacing?: string
  textAlign?: string
  '::placeholder'?: { color?: string }
  ':focus'?: StripeElementStyle
  ':hover'?: StripeElementStyle
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeIbanElement` | Emitted when the element is fully rendered |
| `@change` | `StripeIbanElementChangeEvent` | Emitted when the element value changes |
| `@focus` | - | Emitted when the element gains focus |
| `@blur` | - | Emitted when the element loses focus |
| `@escape` | - | Emitted when the user presses the Escape key |

### Change Event

```ts
interface StripeIbanElementChangeEvent {
  elementType: 'iban'
  empty: boolean
  complete: boolean
  country?: string          // e.g., 'DE', 'FR', 'NL'
  bankName?: string         // e.g., 'Deutsche Bank'
  error?: {
    type: string
    code: string
    message: string
  }
}
```

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading (default: "Loading IBAN form...") |
| `#error` | `{ error: string }` | Rendered when the element has an error: the validation message from `@change` or a creation error |

```vue
<VueStripeIbanElement>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripeIbanElement>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeIbanElement \| null>` | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the element emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (validation, load or creation error) |
| `focus()` | `() => void` | Focus the element |
| `blur()` | `() => void` | Blur the element |
| `clear()` | `() => void` | Clear the element's value |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

Refs are unwrapped on the template ref, so `ibanRef.value.element` is a `StripeIbanElement | null`. Type the template ref with the component type and the element with the Stripe type:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeIbanElement } from '@vue-stripe/vue-stripe'
import type { StripeIbanElement } from '@stripe/stripe-js'

const ibanRef = ref<InstanceType<typeof VueStripeIbanElement> | null>(null)

const focus = () => ibanRef.value?.focus()
const clear = () => ibanRef.value?.clear()
const stripeElement = (): StripeIbanElement | null => ibanRef.value?.element ?? null
</script>

<template>
  <VueStripeIbanElement ref="ibanRef" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-iban-element vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-iban-element-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-iban-element-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-iban-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-iban-element-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Target `.vue-stripe-element*` to style every element at once, or `.vue-stripe-iban-element*` for this one.

## Examples

### Basic Usage

```vue
<VueStripeIbanElement
  @ready="(el) => console.log('Ready')"
  @change="(e) => console.log('Complete:', e.complete)"
/>
```

### With Custom Options

```vue
<script setup>
const options = {
  supportedCountries: ['SEPA'],
  placeholderCountry: 'DE',
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
  }
}
</script>

<template>
  <VueStripeIbanElement :options="options" />
</template>
```

### Tracking Bank Information

```vue
<script setup>
import { ref } from 'vue'

const bankName = ref('')
const country = ref('')
const isComplete = ref(false)

const handleChange = (event) => {
  isComplete.value = event.complete
  bankName.value = event.bankName || ''
  country.value = event.country || ''
}
</script>

<template>
  <VueStripeIbanElement @change="handleChange" />
  <div v-if="bankName">
    Bank: {{ bankName }} ({{ country }})
  </div>
  <button :disabled="!isComplete">Continue</button>
</template>
```

### Complete SEPA Payment Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeIbanElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const ibanComplete = ref(false)
const bankName = ref('')
const processing = ref(false)

const handleChange = (event: any) => {
  ibanComplete.value = event.complete
  bankName.value = event.bankName || ''
}

// In a child component inside the provider:
const confirmPayment = async (clientSecret: string) => {
  const { stripe } = useStripe()
  const { elements } = useStripeElements()

  const ibanElement = elements.value?.getElement('iban')

  const { error, paymentIntent } = await stripe.value.confirmSepaDebitPayment(
    clientSecret,
    {
      payment_method: {
        sepa_debit: ibanElement,
        billing_details: {
          name: 'Customer Name',
          email: 'customer@example.com'
        }
      }
    }
  )

  if (error) {
    console.error(error.message)
  } else {
    console.log('Payment status:', paymentIntent.status)
  }
}
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <form @submit.prevent="confirmPayment(clientSecret)">
        <VueStripeIbanElement
          :options="{ placeholderCountry: 'DE' }"
          @change="handleChange"
        />
        <p v-if="bankName">Bank: {{ bankName }}</p>
        <button :disabled="!ibanComplete || processing">
          Pay with SEPA
        </button>
      </form>
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

## TypeScript

```ts
import { ref } from 'vue'
import { VueStripeIbanElement } from '@vue-stripe/vue-stripe'
import type {
  StripeIbanElement,
  StripeIbanElementChangeEvent,
  StripeIbanElementOptions
} from '@stripe/stripe-js'

// Options
const options: StripeIbanElementOptions = {
  supportedCountries: ['SEPA'],
  placeholderCountry: 'DE',
  style: {
    base: {
      fontSize: '16px'
    }
  }
}

// Event handlers
const handleReady = (element: StripeIbanElement) => {
  console.log('Ready:', element)
}

const handleChange = (event: StripeIbanElementChangeEvent) => {
  console.log('Complete:', event.complete)
  console.log('Country:', event.country)
  console.log('Bank:', event.bankName)
}

// Template ref
const ibanRef = ref<InstanceType<typeof VueStripeIbanElement> | null>(null)
```

## Test IBAN Numbers

Use these test IBANs in test mode:

| Country | IBAN | Description |
|---------|------|-------------|
| Germany | `DE89 3704 0044 0532 0130 00` | Standard test |
| France | `FR76 3000 6000 0112 3456 7890 189` | Standard test |
| Netherlands | `NL91 ABNA 0417 1643 00` | Standard test |
| Austria | `AT61 1904 3002 3457 3201` | Standard test |
| Belgium | `BE62 5100 0754 7061` | Standard test |
| Spain | `ES91 2100 0418 4502 0005 1332` | Standard test |
| Italy | `IT60 X054 2811 1010 0000 0123 456` | Standard test |

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid IBAN checksum | IBAN fails checksum validation | Verify IBAN is entered correctly |
| Unsupported country | Country not in SEPA | Check supportedCountries option |
| Invalid format | IBAN doesn't match expected format | Use correct country format |

## See Also

- [VueStripeElements](/api/components/stripe-elements) - Parent container component
- [useStripeElements](/api/composables/use-stripe-elements) - Access elements in child components
- [IBAN Element Guide](/guide/iban-element) - Step-by-step implementation guide
- [VueStripePaymentElement](/api/components/stripe-payment-element) - iDEAL, P24, EPS and other bank payments (the standalone bank elements were removed by Stripe in Clover)
