# EPS Bank Element

The EPS Bank Element displays a dropdown of Austrian banks for EPS payments. EPS (Electronic Payment Standard) is a popular payment method in Austria used for online bank transfers with over 80% market coverage.

::: tip Austria Only
EPS is exclusively for Austrian bank customers. For other European countries, see [iDEAL](/guide/ideal-bank-element) (Netherlands), [P24](/guide/p24-bank-element) (Poland), or [IBAN Element](/guide/iban-element) (SEPA).
:::

## Why Use EPS?

| Feature | Benefit |
|---------|---------|
| **Wide Coverage** | Supported by almost all Austrian banks (80%+) |
| **Trusted Method** | Established payment standard in Austria |
| **EUR Only** | Supports Euro currency |
| **Instant Confirmation** | Real-time payment notification |

## When to Use EPS Element

| Scenario | Description |
|----------|-------------|
| **Austrian customers** | Primary online payment method in Austria |
| **E-commerce** | Online purchases by Austrian shoppers |
| **EUR transactions** | EPS only supports Euro currency |

## How It Works

```mermaid
flowchart TD
    A["EpsBankElement mounts inside StripeElements"] --> B["Renders bank dropdown<br/>Emits @ready when mounted"]
    B --> C["Customer selects their bank<br/>• Bank Austria, Erste Bank, Raiffeisen, etc."]
    C --> D["Emits @change with selected bank code<br/>{ complete, value }"]
    D --> E["On submit: Create EPS PaymentIntent"]
    E --> F["stripe.confirmEpsPayment()"]
    F --> G["Customer redirected to bank<br/>to authorize payment"]
    G --> H["Return to your site with result"]
```

## Required Components

| Component | Role |
|-----------|------|
| `VueStripeProvider` | Loads Stripe.js and provides stripe instance |
| `VueStripeElements` | Creates Elements instance |
| `VueStripeEpsBankElement` | Renders the Austrian bank dropdown |

## Basic Implementation

### Step 1: Set Up the Component

```vue
<script setup>
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeEpsBankElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements>
      <VueStripeEpsBankElement
        @ready="onReady"
        @change="onChange"
      />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

### Step 2: Handle Bank Selection

```vue{7-12}
<script setup>
import { ref } from 'vue'

const selectedBank = ref('')
const isComplete = ref(false)

const onChange = (event) => {
  isComplete.value = event.complete
  selectedBank.value = event.value || ''
  console.log('Selected bank:', selectedBank.value)
}
</script>
```

## Supported Austrian Banks

| Bank Code | Bank Name | Description |
|-----------|-----------|-------------|
| `bank_austria` | Bank Austria | Major bank (UniCredit) |
| `erste_bank_und_sparkassen` | Erste Bank und Sparkassen | Major bank |
| `raiffeisen` | Raiffeisen Bankengruppe | Major cooperative bank |
| `bawag_psk` | BAWAG P.S.K. | Major bank |
| `oberbank` | Oberbank AG | Regional bank |
| `hypo_noe` | HYPO NOE | Regional bank |
| `hypo_tirol` | Hypo Tirol Bank | Regional bank |
| `hypo_vorarlberg` | Hypo Vorarlberg Bank | Regional bank |
| `bks_bank` | BKS Bank | Regional bank |
| `btv` | BTV | Regional bank |
| `schoellerbank` | Schoellerbank | Private bank |
| `sparda_bank_wien` | Sparda-Bank Wien | Cooperative bank |
| `volksbank` | Volksbank Gruppe | Cooperative bank |
| `easybank` | Easybank | Online bank |
| `dolomitenbank` | Dolomitenbank | Regional bank |

## Confirming EPS Payments

EPS uses a redirect flow - customers are sent to their bank to authorize the payment:

### Backend Endpoint

```typescript
// POST /api/eps-intent
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request: Request) {
  const { amount } = await request.json()

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur', // EPS only supports EUR
    payment_method_types: ['eps'],
  })

  return Response.json({
    clientSecret: paymentIntent.client_secret
  })
}
```

### Frontend Confirmation

```vue
<script setup>
import { useStripe, useStripeElements } from '@vue-stripe/vue-stripe'

const { stripe } = useStripe()
const { elements } = useStripeElements()

const handleSubmit = async (clientSecret: string) => {
  const epsElement = elements.value?.getElement('epsBank')

  const { error } = await stripe.value.confirmEpsPayment(
    clientSecret,
    {
      payment_method: {
        eps: epsElement,
        billing_details: {
          name: 'Customer Name'
        }
      },
      return_url: `${window.location.origin}/payment-complete`
    }
  )

  if (error) {
    console.error(error.message)
  }
  // Customer is redirected to their bank
}
</script>
```

::: warning Redirect Required
EPS payments require a `return_url`. After the customer authorizes at their bank, they're redirected back to your site with the payment result.
:::

## Customization

### Custom Styling

```vue
<script setup>
const epsOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: '10px 12px'
    }
  }
}
</script>

<template>
  <VueStripeEpsBankElement :options="epsOptions" />
</template>
```

## Complete Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeEpsBankElement,
  useStripe,
  useStripeElements
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const selectedBank = ref('')
const isComplete = ref(false)
const name = ref('')
const processing = ref(false)
const error = ref('')

const epsOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770'
    }
  }
}

const handleChange = (event: any) => {
  isComplete.value = event.complete
  selectedBank.value = event.value || ''
}

const handleSubmit = async () => {
  if (!name.value) {
    error.value = 'Name is required'
    return
  }

  processing.value = true
  error.value = ''

  try {
    // Fetch clientSecret from backend
    const response = await fetch('/api/eps-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 })
    })
    const { clientSecret } = await response.json()

    // Confirm payment (would be in child component)
    // const { stripe } = useStripe()
    // ... confirm EPS payment with redirect
  } catch (e) {
    error.value = 'Failed to process payment'
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="eps-form">
    <VueStripeProvider :publishable-key="publishableKey">
      <VueStripeElements>
        <form @submit.prevent="handleSubmit">
          <div class="field">
            <label>Name</label>
            <input
              v-model="name"
              type="text"
              placeholder="Full name"
            />
          </div>

          <div class="field">
            <label>Select your bank</label>
            <VueStripeEpsBankElement
              :options="epsOptions"
              @change="handleChange"
            />
          </div>

          <div v-if="selectedBank" class="selected-bank">
            Selected: {{ selectedBank }}
          </div>

          <div v-if="error" class="error">{{ error }}</div>

          <button
            type="submit"
            :disabled="!isComplete || !name || processing"
          >
            {{ processing ? 'Processing...' : 'Pay with EPS' }}
          </button>

          <p class="note">
            You will be redirected to your bank to authorize the payment.
          </p>
        </form>
      </VueStripeElements>
    </VueStripeProvider>
  </div>
</template>

<style scoped>
.eps-form {
  max-width: 400px;
  margin: 0 auto;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.field input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 16px;
}

.selected-bank {
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 4px;
  font-size: 14px;
}

button {
  width: 100%;
  padding: 12px;
  background: #ed1c24;
  color: white;
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
  margin-bottom: 16px;
}

.note {
  margin-top: 16px;
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>
```

## Next Steps

- [IBAN Element](/guide/iban-element) — SEPA Direct Debit for all EU
- [iDEAL Bank Element](/guide/ideal-bank-element) — Dutch bank payments
- [P24 Bank Element](/guide/p24-bank-element) — Polish bank payments
- [API Reference](/api/components/stripe-eps-bank-element) — Full props, events, and options
