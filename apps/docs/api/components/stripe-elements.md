# VueStripeElements

Creates a Stripe Elements instance and provides it to child element components.

## What is StripeElements?

StripeElements is the bridge between StripeProvider and individual Stripe element components. It:

| Capability | Description |
|------------|-------------|
| **Elements Instance** | Creates the Stripe Elements instance required by all element components |
| **Payment Intent Binding** | Binds Elements to a specific PaymentIntent or SetupIntent via clientSecret |
| **Appearance Control** | Configures theme, colors, fonts, and styling for all child elements |
| **Context Provision** | Makes Elements available to child components via Vue's provide/inject |

## How It Works

```mermaid
flowchart TD
    A["StripeElements mounts inside StripeProvider<br/>(Receives Stripe instance from parent context)"] --> B["Waits for Stripe instance to be available<br/>(Shows #loading slot while waiting)"]
    B --> C["Calls stripe.elements({ clientSecret, appearance, ... })<br/>Creates Elements instance with configuration"]
    C --> D{Result?}
    D -->|Success| E["<b>SUCCESS</b><br/>1. Store Elements ref<br/>2. provide() to tree<br/>3. Render #default"]
    D -->|Failure| F["<b>FAILURE</b><br/>1. Store error message<br/>2. Show #error slot"]
    E --> G["Child element components (PaymentElement,<br/>CardElement, etc.) inject Elements and<br/>mount their specific elements"]
    F --> G
```

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripePaymentElement />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clientSecret` | `string` | No* | Client secret from PaymentIntent or SetupIntent. When provided, Elements uses the intent-based flow |
| `mode` | `'payment' \| 'setup' \| 'subscription'` | No | Mode for deferred intent creation (without `clientSecret`). Required when `clientSecret` is not provided |
| `currency` | `string` | No | Currency code (e.g. `'usd'`, `'eur'`) for deferred intent creation. Required when using `mode` without `clientSecret` |
| `amount` | `number` | No | Amount in the smallest currency unit (e.g. cents for USD). Required for `'payment'` and `'subscription'` modes |
| `setupFutureUsage` | `'off_session' \| 'on_session'` | No | Indicates intent to save the payment method for future use |
| `captureMethod` | `'automatic' \| 'automatic_async' \| 'manual'` | No | Controls when to capture funds from the customer's account |
| `appearance` | `object` | No | [Appearance API](#appearance-api) options to theme all child elements (theme, variables, rules, labels). Convenience prop — equivalent to `options.appearance`. Changes are applied live with `elements.update()` |
| `fonts` | `object[]` | No | Custom fonts to load into the Elements iframe (`CssFontSource` / `CustomFontSource`). Convenience prop — equivalent to `options.fonts` |
| `locale` | `string` | No | Locale to display Elements in (e.g. `'en'`, `'fr'`, `'auto'`). Convenience prop — equivalent to `options.locale`. Changes are applied live with `elements.update()` |
| `options` | `object` | No | Any other option passed to `stripe.elements()` (e.g. `allowedPaymentMethodTypes` in the mode-based flow, `loader`) |

\* Required for Payment Element and some other elements. Optional for Card Element. When `clientSecret` is omitted, use `mode`/`currency`/`amount` for deferred intent creation.

A new `clientSecret`, `mode`, `currency`, `amount` or `setupFutureUsage` calls `stripe.elements()` again to create a new Elements group. Changes to the `appearance` and `locale` props are applied to the existing group with `elements.update()`, so mounted elements keep what the customer typed (keys inside `options` are read when the group is created).

::: warning `paymentMethodTypes` was removed in v6
Stripe.js Endive rejects `paymentMethodTypes` on `stripe.elements()` as an integration error, so `VueStripeElements` no longer has this prop (and drops the key if it appears in `options`). Choose the payment methods instead with:

- **Mode-based flow** (deferred Intent: `mode` / `currency` / `amount`): pass `allowedPaymentMethodTypes` through `options`:

  ```vue
  <VueStripeElements
    mode="payment"
    currency="usd"
    :amount="1099"
    :options="{ allowedPaymentMethodTypes: ['card', 'klarna'] }"
  >
    <VueStripePaymentElement />
  </VueStripeElements>
  ```

- **`clientSecret` flow**: set `payment_method_types` on the PaymentIntent / SetupIntent on your server, or manage payment methods in the Stripe Dashboard. `allowedPaymentMethodTypes` is **not** valid together with `clientSecret`.
:::

::: tip No Intent yet? Pass `mode`
With neither `clientSecret` nor `mode`, Stripe.js Endive logs "Unable to select session" inside its iframe for some elements (verified with the Address Element). When you do not have an Intent yet, pass `mode` / `currency` / `amount` so Elements has a session to work with.
:::

::: tip Convenience props vs. `options`
`appearance`, `fonts`, and `locale` are first-class convenience props so you can bind them directly without nesting them inside `options`. If you set the same key in both `options` and a dedicated prop, the dedicated prop wins.

```vue
<!-- These two are equivalent -->
<VueStripeElements :appearance="{ theme: 'night' }" />
<VueStripeElements :options="{ appearance: { theme: 'night' } }" />
```
:::

### Options Object

The `options` prop accepts the full `StripeElementsOptions` type from `@stripe/stripe-js`. The interface below is an illustrative subset of that upstream type, showing the most commonly used fields:

```ts
// Illustrative subset of @stripe/stripe-js StripeElementsOptions
interface StripeElementsOptions {
  appearance?: {
    theme?: 'stripe' | 'night' | 'flat' | 'none'
    variables?: Record<string, string>
    rules?: Record<string, Record<string, string>>
    labels?: 'above' | 'floating'
  }
  fonts?: Array<{
    cssSrc?: string
    family?: string
    src?: string
    weight?: string
    style?: string
  }>
  locale?: string
  loader?: 'auto' | 'always' | 'never'
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeElements` | Emitted after the Elements instance is created. The payload is the `StripeElements` instance |
| `@error` | `string` | Emitted when Elements creation fails, or when an `appearance` / `locale` update is rejected. The payload is the error message |

::: info `elements.update()` is asynchronous
Since Stripe.js Dahlia, `elements.update()` returns a Promise. `VueStripeElements` waits for it when it applies `appearance` / `locale` changes; a rejected update sets the component's error state and surfaces as `@error`.
:::

```vue
<template>
  <VueStripeElements
    :client-secret="clientSecret"
    @ready="onReady"
    @error="onError"
  >
    <VueStripePaymentElement />
  </VueStripeElements>
</template>

<script setup lang="ts">
import type { StripeElements } from '@stripe/stripe-js'
import { VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'

const clientSecret = 'pi_xxx_secret_xxx'

function onReady(elements: StripeElements) {
  console.log('Elements ready', elements)
}

function onError(error: string) {
  console.error('Elements failed to initialize:', error)
}
</script>
```

## Slots

### Default Slot

Rendered when Elements is ready:

```vue
<VueStripeElements :client-secret="secret">
  <VueStripePaymentElement />
</VueStripeElements>
```

### Loading Slot

Rendered while Elements is initializing:

```vue
<VueStripeElements :client-secret="secret">
  <template #loading>
    <div>Initializing payment form...</div>
  </template>

  <VueStripePaymentElement />
</VueStripeElements>
```

### Error Slot

Rendered if Elements fails to initialize:

```vue
<VueStripeElements :client-secret="secret">
  <template #error="{ error }">
    <div class="error">{{ error }}</div>
  </template>

  <VueStripePaymentElement />
</VueStripeElements>
```

## Provides

StripeElements uses Vue's `provide` to make these values available to descendants:

| Key | Type | Description |
|-----|------|-------------|
| `elements` | `Ref<StripeElements \| null>` | The Elements instance |
| `loading` | `Ref<boolean>` | Whether Elements is loading |
| `error` | `Ref<string \| null>` | Error message if initialization failed |

Access these values using the [useStripeElements](/api/composables/use-stripe-elements) composable.

## Appearance API

Customize the look of all Stripe Elements using the Appearance API:

### Themes

```vue
<VueStripeElements
  :client-secret="secret"
  :options="{
    appearance: {
      theme: 'stripe' // or 'night', 'flat', 'none'
    }
  }"
>
```

### Variables

```vue
<VueStripeElements
  :client-secret="secret"
  :options="{
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
        fontSizeBase: '16px'
      }
    }
  }"
>
```

### Rules

Target specific elements with CSS-like rules:

```vue
<VueStripeElements
  :client-secret="secret"
  :options="{
    appearance: {
      rules: {
        '.Input': {
          border: '1px solid #e6e6e6',
          boxShadow: 'none'
        },
        '.Input:focus': {
          border: '1px solid #0570de',
          boxShadow: '0 0 0 1px #0570de'
        },
        '.Input--invalid': {
          border: '1px solid #df1b41'
        },
        '.Label': {
          fontWeight: '500'
        },
        '.Error': {
          color: '#df1b41'
        }
      }
    }
  }"
>
```

### Custom Fonts

```vue
<VueStripeElements
  :client-secret="secret"
  :options="{
    fonts: [
      {
        cssSrc: 'https://fonts.googleapis.com/css?family=Roboto'
      }
    ],
    appearance: {
      variables: {
        fontFamily: 'Roboto, sans-serif'
      }
    }
  }"
>
```

## Examples

### Dark Theme

```vue
<VueStripeElements
  :client-secret="secret"
  :options="{
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#7c3aed'
      }
    }
  }"
>
  <VueStripePaymentElement />
</VueStripeElements>
```

### Custom Styled

```vue
<script setup>
const appearance = {
  theme: 'none',
  variables: {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSizeBase: '15px',
    colorPrimary: '#10b981',
    colorBackground: '#f9fafb',
    colorText: '#1f2937',
    colorDanger: '#ef4444',
    borderRadius: '8px',
    spacingUnit: '4px'
  },
  rules: {
    '.Input': {
      backgroundColor: '#ffffff',
      border: '1px solid #d1d5db',
      padding: '12px',
      transition: 'border-color 0.15s ease'
    },
    '.Input:hover': {
      borderColor: '#9ca3af'
    },
    '.Input:focus': {
      borderColor: '#10b981',
      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
    },
    '.Label': {
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '6px'
    }
  }
}
</script>

<template>
  <VueStripeElements
    :client-secret="secret"
    :options="{ appearance }"
  >
    <VueStripePaymentElement />
  </VueStripeElements>
</template>
```

### Without clientSecret (Card Element only)

```vue
<VueStripeProvider :publishable-key="key">
  <VueStripeElements>
    <!-- Card Element doesn't require clientSecret on Elements -->
    <VueStripeCardElement />
  </VueStripeElements>
</VueStripeProvider>
```

For other elements (Payment, Address, ...) without an Intent, use the deferred Intent flow instead:

```vue
<VueStripeElements mode="payment" currency="usd" :amount="1099">
  <VueStripeAddressElement :options="{ mode: 'shipping' }" />
</VueStripeElements>
```

## TypeScript

```ts
import type { Appearance } from '@stripe/stripe-js'

const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0570de'
  }
}
```

## See Also

- [useStripeElements](/api/composables/use-stripe-elements) - Access Elements in child components
- [StripeProvider](/api/components/stripe-provider) - Parent provider component
- [Appearance API](#appearance-api) - Themes, variables, rules and fonts
