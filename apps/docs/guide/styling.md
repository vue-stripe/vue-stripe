# Style elements

Make Stripe's payment fields match your design. Two layers are involved:

- **Inside the iframes** (inputs, labels, tabs): Stripe draws these. Style them with Stripe's [Appearance API](https://docs.stripe.com/elements/appearance-api), passed through Vue Stripe props.
- **Around the iframes** (the wrapper, loading text, error box): Vue Stripe renders these. Style them with CSS classes, or replace them with slots.

Your page CSS cannot reach inside Stripe's iframes, so use the Appearance API for everything there.

## 1. Import the stylesheet

The default styles for the wrapper markup ship in a separate file. Import it once in your app entry:

```ts
// main.ts
import '@vue-stripe/vue-stripe/style.css'
```

Leave it out only if you style every class listed in step 4 yourself.

## 2. Theme the fields with the Appearance API

Pass `appearance` to `VueStripeElements`. It applies to every element inside: Payment, Express Checkout, Address, Link Authentication and the other Payment Element family components.

```vue
<script setup lang="ts">
import { VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'
import type { Appearance } from '@vue-stripe/vue-stripe'

defineProps<{ clientSecret: string }>()

const appearance = {
  theme: 'stripe', // 'stripe', 'night' or 'flat'
  variables: {
    colorPrimary: '#635bff',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizeBase: '15px',
    spacingUnit: '4px',
    borderRadius: '8px'
  },
  rules: {
    '.Input': { border: '1px solid #d1d5db', boxShadow: 'none' },
    '.Input:focus': { borderColor: '#635bff', boxShadow: '0 0 0 3px rgba(99, 91, 255, 0.15)' },
    '.Input--invalid': { borderColor: '#df1b41' },
    '.Label': { fontWeight: '500' }
  }
} satisfies Appearance

const fonts = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500' }]
</script>

<template>
  <VueStripeElements :client-secret="clientSecret" :appearance="appearance" :fonts="fonts">
    <VueStripePaymentElement />
  </VueStripeElements>
</template>
```

- `theme` picks a base look; `variables` adjust colors, fonts, spacing and radius across all fields; `rules` target single parts (`.Input`, `.Label`, `.Tab`, `.Error`, ...) with CSS-like declarations. Stripe lists every [variable and rule selector](https://docs.stripe.com/elements/appearance-api).
- A font used in `fontFamily` must be loaded into the iframe with `fonts`; your page's fonts are not available there.
- In TypeScript, check the object with `satisfies Appearance` rather than annotating it as `Appearance`: the prop is typed as a plain object, which an `Appearance`-typed variable is not assignable to.

### Switch themes at runtime

Changes to `appearance` (and `locale`) are applied to the mounted elements in place, so what the customer typed stays. A dark mode toggle is a computed value:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'
import type { Appearance } from '@vue-stripe/vue-stripe'

defineProps<{ clientSecret: string }>()

const dark = ref(false)
const appearance = computed(
  () =>
    ({
      theme: dark.value ? 'night' : 'stripe',
      variables: { colorPrimary: '#7c3aed' }
    }) satisfies Appearance
)
</script>

<template>
  <label><input v-model="dark" type="checkbox" /> Dark mode</label>
  <VueStripeElements :client-secret="clientSecret" :appearance="appearance">
    <VueStripePaymentElement />
  </VueStripeElements>
</template>
```

`VueStripeElements` emits `@update-end` once Stripe has applied the change.

## 3. Style the Card, IBAN and BECS elements

The Card Element, the split card elements (`VueStripeCardNumberElement`, `VueStripeCardExpiryElement`, `VueStripeCardCvcElement`), `VueStripeIbanElement` and `VueStripeAuBankAccountElement` predate the Appearance API and ignore it. Style their text with the `style` option of each element:

```vue
<VueStripeCardElement
  :options="{
    style: {
      base: {
        color: '#30313d',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '16px',
        '::placeholder': { color: '#9ca3af' }
      },
      invalid: { color: '#df1b41', iconColor: '#df1b41' }
    }
  }"
/>
```

The box around these fields (border, padding, focus ring) is Vue Stripe's wrapper; style it with the classes in step 4.

## 4. Style the wrapper markup

Every element component renders the same markup around Stripe's iframe:

```html
<div class="vue-stripe-payment-element vue-stripe-element">
  <!-- only when there is an error -->
  <div class="vue-stripe-payment-element-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; while loading it also has
       vue-stripe-payment-element-loading and vue-stripe-element-loading -->
  <div class="vue-stripe-payment-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading -->
  <div class="vue-stripe-payment-element-loader vue-stripe-element-loader">...</div>
</div>
```

Each part has a shared class (`vue-stripe-element`, `-mount`, `-error`, `-loader`, `-loading`) and an element-specific one built from the element type: `vue-stripe-payment-element`, `vue-stripe-card-element`, `vue-stripe-cardNumber-element`, `vue-stripe-iban-element`, `vue-stripe-au-bank-account-element`, `vue-stripe-express-checkout-element`, and so on (the Link Authentication Element uses `vue-stripe-link-auth`). Each component's API page shows its classes under "Styling".

Target the shared classes to restyle every element, or the specific ones for a single element:

```css
/* Every element: a quieter error message */
.vue-stripe-element-error {
  border: 0;
  background: none;
  padding: 0.25rem 0;
}

/* Card Element box, matching the inputs around it */
.vue-stripe-card-element-mount {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px 14px;
}
.vue-stripe-card-element-mount:focus-within {
  border-color: #635bff;
}

/* The Payment Element reserves 300px while loading; reserve less */
.vue-stripe-payment-element-mount {
  min-height: 200px;
}
```

The providers render `vue-stripe-loading` / `vue-stripe-error` (`VueStripeProvider`) and `vue-stripe-elements-loading` / `vue-stripe-elements-error` (`VueStripeElements`) while they load or fail.

## 5. Replace the loading and error UI with slots

Every element component and provider has `#loading` and `#error` slots. Use them to show your own spinner or message instead of the default text:

```vue
<VueStripeProvider :publishable-key="publishableKey">
  <template #loading>
    <AppSpinner label="Loading payment form" />
  </template>
  <template #error="{ error }">
    <AppAlert type="error">Payments are unavailable: {{ error }}</AppAlert>
  </template>

  <VueStripeElements :client-secret="clientSecret">
    <VueStripePaymentElement>
      <template #loading>
        <AppSkeleton :lines="4" />
      </template>
      <template #error="{ error }">
        <AppAlert type="error">{{ error }}</AppAlert>
      </template>
    </VueStripePaymentElement>
  </VueStripeElements>
</VueStripeProvider>
```

An element's `#error` slot shows Stripe's validation message while the customer types (an incomplete card number, say) and load errors. Errors from confirming a payment are not shown there; see [Handle errors and declines](/guide/error-handling).

## Checkout Sessions and Checkout pages

| Integration | Where the look is set |
|-------------|-----------------------|
| [`VueStripeCheckoutElementsProvider`](/guide/custom-checkout) | `:elements-options="{ appearance, fonts }"`, or `changeAppearance()` from `useCheckoutSession()` at runtime |
| [`VueStripeCheckoutFormProvider`](/guide/checkout-form) | The `appearance` and `fonts` props (`appearance` without `rules`) |
| [Embedded](/guide/embedded-checkout) and [hosted](/guide/checkout) Checkout | Your Stripe Dashboard's [branding settings](https://dashboard.stripe.com/settings/branding); the page cannot be styled from your code |

## Express Checkout buttons

Wallet buttons follow each wallet's brand rules, so only a few things can change: `borderRadius` from the Appearance API, and the `buttonHeight`, `buttonTheme` and `buttonType` options of `VueStripeExpressCheckoutElement`:

```vue
<VueStripeExpressCheckoutElement
  :options="{ buttonHeight: 48, buttonTheme: { applePay: 'white-outline' }, buttonType: { googlePay: 'buy' } }"
/>
```

## Result

Stripe's fields use your colors, fonts and spacing, the surrounding markup matches your form, and loading and error states use your own components.
