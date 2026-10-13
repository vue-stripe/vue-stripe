---
description: "VueStripeElements reference: create a Stripe Elements group in Vue from a client secret or a deferred Intent, with Appearance API options, fonts and slots."
---

# VueStripeElements

Creates a Stripe Elements group (`stripe.elements()`) and provides it to the element components and composables inside it. Use it inside a [VueStripeProvider](/api/components/stripe-provider), or in an app that installs the [`createVueStripe()`](/api/plugin) plugin; without a provider, a Stripe.js load failure renders in this component's `#error` slot. [How Vue Stripe works](/guide/architecture#the-provider-chain) explains the provider chain.

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret" :appearance="{ theme: 'stripe' }">
      <VueStripePaymentElement />
    </VueStripeElements>
  </VueStripeProvider>
</template>

<script setup>
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend
</script>
```

Without an Intent, pass `mode` / `currency` / `amount` instead of `clientSecret` ([Collect payment details before creating an Intent](/guide/deferred-intent) walks through this flow):

```vue
<VueStripeElements mode="payment" currency="usd" :amount="1099">
  <VueStripePaymentElement />
</VueStripeElements>
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
| `appearance` | `Appearance` | No | [Appearance API](#appearance-api) options to theme all child elements (theme, variables, rules, labels). Convenience prop — equivalent to `options.appearance`. Changes are applied live with `elements.update()` |
| `fonts` | `(CssFontSource \| CustomFontSource)[]` | No | Custom fonts to load into the Elements iframe. Convenience prop — equivalent to `options.fonts` |
| `locale` | `string` | No | Locale to display Elements in (e.g. `'en'`, `'fr'`, `'auto'`). Convenience prop — equivalent to `options.locale`. Changes are applied live with `elements.update()` |
| `options` | `StripeElementsOptions` | No | Any other option passed to `stripe.elements()` (e.g. `allowedPaymentMethodTypes` in the mode-based flow, `loader`) |

\* Required for Payment Element and some other elements. Optional for Card Element. When `clientSecret` is omitted, use `mode`/`currency`/`amount` for deferred intent creation; see [Collect payment details before creating an Intent](/guide/deferred-intent).

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

- **`clientSecret` flow**: set `allowed_payment_method_types` on the PaymentIntent / SetupIntent on your server, or manage payment methods in the Stripe Dashboard. `allowedPaymentMethodTypes` is **not** valid together with `clientSecret`.
:::

::: tip No Intent yet? Pass `mode`
With neither `clientSecret` nor `mode`, Stripe.js Endive throws "Unable to select session" from its iframe for some elements (verified with the Address Element); error monitoring reports it as an uncaught error. When you do not have an Intent yet, pass `mode` / `currency` / `amount` so Elements has a session to work with.
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

The `options` prop takes Stripe's `StripeElementsOptions` (also accepted: a plain object of `stripe.elements()` options). `appearance` is typed as Stripe's `Appearance`, and `fonts` as an array of `CssFontSource | CustomFontSource`. All of these are re-exported from the package:

```ts
import type {
  Appearance,
  CssFontSource,
  CustomFontSource,
  StripeElementsOptions
} from '@vue-stripe/vue-stripe'
```

See [`stripe.elements()` options](https://docs.stripe.com/js/elements_object/create#stripe_elements-options) for every key.

### Appearance API

The `appearance` prop (or `options.appearance`) themes every element in the group. It takes Stripe's [`Appearance`](https://docs.stripe.com/elements/appearance-api) object:

| Key | Type | Description |
|-----|------|-------------|
| `theme` | `'stripe' \| 'night' \| 'flat'` | Base theme |
| `variables` | `Record<string, string>` | Design tokens such as `colorPrimary`, `colorBackground`, `colorText`, `colorDanger`, `fontFamily`, `fontSizeBase`, `spacingUnit`, `borderRadius` |
| `rules` | `Record<string, Record<string, string>>` | CSS-like rules per selector, e.g. `.Input`, `.Input:focus`, `.Input--invalid`, `.Label`, `.Error` |
| `labels` | `'auto' \| 'above' \| 'floating'` | Label position |

```vue
<VueStripeElements
  :client-secret="secret"
  :appearance="{
    theme: 'stripe',
    variables: { colorPrimary: '#0570de', borderRadius: '4px' },
    rules: { '.Input:focus': { border: '1px solid #0570de' } }
  }"
>
```

Custom fonts load through `fonts` (or `options.fonts`): pass `{ cssSrc }` for a stylesheet or `{ family, src, weight, style }` for a font file, then name the family in `variables.fontFamily`:

```vue
<VueStripeElements
  :client-secret="secret"
  :fonts="[{ cssSrc: 'https://fonts.googleapis.com/css?family=Roboto' }]"
  :appearance="{ variables: { fontFamily: 'Roboto, sans-serif' } }"
>
```

Changes to `appearance` are applied to the mounted elements with `elements.update()`. Pass a stable object (a `ref` or `computed`), not a new inline object on every render, if the parent re-renders often. [Style elements](/guide/styling#_2-theme-the-fields-with-the-appearance-api) has full theme examples, including [switching themes at runtime](/guide/styling#switch-themes-at-runtime).

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeElements` | Emitted after the Elements instance is created. The payload is the `StripeElements` instance |
| `@error` | `string` | Emitted when Elements creation fails, or when an `appearance` / `locale` update is rejected. The payload is the error message |
| `@update-end` | - | Emitted when an `elements.update()` call has been applied to the mounted elements (Stripe's `update-end` event), e.g. after an `appearance` or `locale` change |

::: info `elements.update()` is asynchronous
Since Stripe.js Dahlia, `elements.update()` returns a Promise. `VueStripeElements` waits for it when it applies `appearance` / `locale` changes; a rejected update sets the component's error state and surfaces as `@error`.
:::

```vue
<VueStripeElements :client-secret="clientSecret" @ready="onReady" @error="onError">
  <VueStripePaymentElement />
</VueStripeElements>
```

### `@update-end`

`VueStripeElements` listens to the group's `update-end` event (`elements.on('update-end', handler)`) and re-emits it, so you can react once Stripe has finished applying an update, for example to hide a spinner after switching themes:

```vue
<template>
  <VueStripeElements
    mode="payment"
    currency="usd"
    :amount="1099"
    :appearance="appearance"
    @update-end="applying = false"
  >
    <VueStripePaymentElement />
  </VueStripeElements>
  <button @click="switchTheme">Switch theme</button>
  <span v-if="applying">Applying...</span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'

const theme = ref<'stripe' | 'night'>('stripe')
// A computed keeps the object stable across re-renders, so only a theme change updates Elements.
const appearance = computed(() => ({ theme: theme.value }))
const applying = ref(false)

function switchTheme() {
  applying.value = true
  theme.value = theme.value === 'stripe' ? 'night' : 'stripe'
}
</script>
```

The event fires for every `elements.update()` call on the group, including calls you make yourself through [`useStripeElements().elements`](/api/composables/use-stripe-elements). A new `clientSecret`, `mode`, `currency`, `amount` or `setupFutureUsage` creates a new group instead of updating it: that emits `@ready`, not `@update-end`. The listener moves to the new group, and an event from the replaced group is never re-emitted. Stripe.js 10.0.0 types the group with `on('update-end')` only; `VueStripeElements` calls `off()` on unmount and on re-creation when the runtime provides it.

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| default | - | Rendered once the Elements group is created |
| `#loading` | - | Rendered while the group is created (default: "Initializing Elements...") |
| `#error` | `{ error: string }` | Rendered when creating the group fails, or, without a `VueStripeProvider`, when Stripe.js fails to load |

```vue
<VueStripeElements :client-secret="secret">
  <template #loading>
    <div>Initializing payment form...</div>
  </template>

  <template #error="{ error }">
    <div class="error">{{ error }}</div>
  </template>

  <VueStripePaymentElement />
</VueStripeElements>
```

## Provides

The component exposes nothing on a template ref. It provides these values to descendants:

| Key | Type | Description |
|-----|------|-------------|
| `elements` | `Ref<StripeElements \| null>` | The Elements instance |
| `loading` | `Ref<boolean>` | Whether Elements is loading |
| `error` | `Ref<string \| null>` | Error message if initialization failed |

Read them with the [useStripeElements](/api/composables/use-stripe-elements) composable.

## Styling

The component renders a plain wrapper `div` around the default slot once the group exists. While loading and on failure it renders:

```html
<!-- while loading (#loading slot replaces the message) -->
<div class="vue-stripe-elements-loading">
  <div class="vue-stripe-loading-message">Initializing Elements...</div>
</div>

<!-- on failure (#error slot replaces the message) -->
<div class="vue-stripe-elements-error">
  <div class="vue-stripe-error-message">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

The fields inside Stripe's iframes are styled with the [Appearance API](#appearance-api), not with CSS.

## TypeScript

The component's props and event payloads are typed on Vue 2.7 and Vue 3: `vue-tsc` checks a handler's parameter against the payload in [Events](#events).

```ts
import type {
  VueStripeElementsProps,
  Appearance,
  StripeElements
} from '@vue-stripe/vue-stripe'

const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0570de'
  }
}

function onReady(elements: StripeElements) {
  // elements is fully typed
}
```

## See Also

- [Style elements](/guide/styling) - Appearance API examples, the stylesheet and the wrapper markup
- [useStripeElements](/api/composables/use-stripe-elements) - Access Elements in child components
- [VueStripeProvider](/api/components/stripe-provider) - Parent provider component
- [createVueStripe](/api/plugin) - App-wide alternative to the provider
- [How Vue Stripe works](/guide/architecture) - The provider chain and when each layer renders
- [Accept a payment](/guide/payment-element) - The Payment Element with `VueStripeElements`
- [Stripe Appearance API](https://docs.stripe.com/elements/appearance-api) - Every variable and rule selector
