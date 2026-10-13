---
description: "VueStripeCheckoutElementsProvider reference: run Stripe's Checkout Elements SDK on a Checkout Session and lay out your own checkout page in Vue."
---

# VueStripeCheckoutElementsProvider

Initializes **Elements with Checkout Sessions** via `stripe.initCheckoutElementsSdk()` and provides the Checkout SDK to descendants. Place element components inside it to build your own checkout page on top of a Checkout Session, and drive the session with the [`useCheckoutSession`](/api/composables/use-checkout-session) composable. [Choosing an integration](/guide/approaches#choosing-among-the-checkout-options) compares it with the other Checkout options, and [Build your own page on a Checkout Session](/guide/custom-checkout) shows the server and client code.

- Use it inside [`VueStripeProvider`](/api/components/stripe-provider).
- Pass the `client_secret` of a Checkout Session created on your server with `ui_mode: 'elements'`.
- The provider shows its `#loading` slot until the Stripe instance exists, then calls `stripe.initCheckoutElementsSdk()`, which returns the SDK synchronously, and renders its children at once. `@ready` fires when the session actions have loaded (`loadActions()`), and `@change` on every session change.

::: warning `VueStripeCheckoutProvider` is deprecated
`VueStripeCheckoutProvider` is a deprecated alias of this same component (it mirrored the old `stripe.initCheckout()` name). It keeps working in v6 but may be removed in a future major release, so import `VueStripeCheckoutElementsProvider` instead.
:::

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutElementsProvider :client-secret="clientSecret">
      <CheckoutForm />
    </VueStripeCheckoutElementsProvider>
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider, VueStripeCheckoutElementsProvider } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import CheckoutForm from './CheckoutForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// From your backend: stripe.checkout.sessions.create({ ui_mode: 'elements', ... })
const clientSecret = fetch('/api/checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ uiMode: 'elements' })
})
  .then((res) => res.json())
  .then((data) => data.clientSecret)
</script>
```

```vue
<!-- CheckoutForm.vue -->
<template>
  <VueStripePaymentElement :options="{ layout: 'accordion' }" />
  <p v-if="session">Total: {{ session.total.total.amount }}</p>
  <button :disabled="loading || !session?.canConfirm" @click="pay">Pay</button>
  <p v-if="message">{{ message }}</p>
</template>

<script setup>
import { ref } from 'vue'
import { VueStripePaymentElement, useCheckoutSession } from '@vue-stripe/vue-stripe'

const { session, confirm, loading } = useCheckoutSession()
const message = ref('')

const pay = async () => {
  // The session was created with return_url, so confirm() takes no returnUrl.
  const result = await confirm()
  if (result.type === 'error') message.value = result.error.message
}
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clientSecret` | `string \| Promise<string>` | No\* | Client secret of a `ui_mode: 'elements'` Checkout Session, or a Promise resolving to it (passed to Stripe as is) |
| `fetchClientSecret` | `() => Promise<string>` | No\* | Function returning the client secret (v5 compatible). **Takes precedence** over `clientSecret` |
| `elementsOptions` | `StripeCheckoutElementsOptions` | No | Options for every Checkout element: `appearance`, `fonts`, `loader`, `savedPaymentMethod`, `syncAddressCheckbox` |
| `adaptivePricing` | `{ allowed?: boolean }` | No | [Adaptive Pricing](https://docs.stripe.com/payments/checkout/adaptive-pricing): let customers pay in their local currency |
| `defaultValues` | `object` | No | Prefill `email`, `phoneNumber`, `billingAddress`, `shippingAddress` |

\* Provide **either** `clientSecret` **or** `fetchClientSecret`. If neither is set, the error slot renders and `@error` fires.

The props are read once, when the SDK is initialized. To use another session, re-mount the provider (for example with a `:key`).

### elementsOptions

```ts
interface StripeCheckoutElementsOptions {
  appearance?: Appearance
  loader?: 'auto' | 'always' | 'never'
  fonts?: Array<CssFontSource | CustomFontSource>
  savedPaymentMethod?: {
    enableSave?: 'auto' | 'never'
    enableRedisplay?: 'auto' | 'never'
  }
  syncAddressCheckbox?: 'billing' | 'shipping' | 'none'
}
```

::: info Saved payment methods
Since Stripe.js Clover, saved payment methods are on by default on the client. Use `elementsOptions.savedPaymentMethod` (`enableSave`, `enableRedisplay`: `'never'`) to turn the save checkbox or the redisplay of saved methods off.
:::

### defaultValues

```ts
interface DefaultValues {
  email?: string
  phoneNumber?: string
  billingAddress?: StripeCheckoutContact
  shippingAddress?: StripeCheckoutContact
}
```

Stripe refuses a default the session already sets: `email` on a session created with `customer_email` (or a `customer` with an email) makes `loadActions()` fail, and the provider reports it through `@error` and the `#error` slot.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeCheckoutLoadActionsSuccess` | Emitted once `loadActions()` resolves. Payload is the session actions object |
| `@change` | `StripeCheckoutSession` | Emitted on every Stripe `change` event with the new session snapshot |
| `@error` | `string` | Emitted if `initCheckoutElementsSdk()` throws, `loadActions()` returns an error or rejects, or no client secret is given. `loading` turns `false` |

## Slots

| Slot | Props | Rendered when |
|------|-------|---------------|
| `default` | `{ checkout, actions, session, loading }` | As soon as the Checkout SDK exists (before the actions load) |
| `loading` | — | Until the Checkout SDK exists (Stripe.js still loading) |
| `error` | `{ error }` | Initialization failed |

The default slot renders early so element components can mount while the session actions are still loading. Its `loading` prop (and `useCheckoutSession().loading`) stays `true` until `loadActions()` resolves; `actions` and `session` are `null` until then.

```vue
<VueStripeCheckoutElementsProvider :client-secret="clientSecret">
  <template #loading><div>Preparing checkout...</div></template>
  <template #error="{ error }"><div class="error">{{ error }}</div></template>

  <template #default="{ session, loading }">
    <VueStripePaymentElement />
    <p v-if="!loading">Total: {{ session.total.total.amount }}</p>
  </template>
</VueStripeCheckoutElementsProvider>
```

| Slot Prop | Type | Description |
|-----------|------|-------------|
| `checkout` | `StripeCheckoutElementsSdk` | The Checkout Elements SDK instance |
| `actions` | `StripeCheckoutLoadActionsSuccess \| null` | Session actions (`null` until loaded) |
| `session` | `StripeCheckoutSession \| null` | Current session snapshot (`null` until loaded) |
| `loading` | `boolean` | `true` until the actions have loaded |

## Elements inside the provider

Element components placed inside the provider are created with the Checkout SDK's creators instead of `elements.create()`:

| Component | Created with | Accepted `options` |
|-----------|--------------|--------------------|
| [VueStripePaymentElement](/api/components/stripe-payment-element) | `createPaymentElement()` | `layout`, `paymentMethodOrder`, `readOnly`, `terms`, `fields`, `wallets`, `walletOptions` |
| [VueStripeAddressElement](/api/components/stripe-address-element) | `createBillingAddressElement()` / `createShippingAddressElement()` (picked by `options.mode`: `'billing'` or `'shipping'`, default `'shipping'`) | `contacts`, `display`, `fields` |
| [VueStripeExpressCheckoutElement](/api/components/stripe-express-checkout-element) | `createExpressCheckoutElement()` | `buttonHeight`, `buttonTheme`, `buttonType`, `layout`, `paymentMethods`, `paymentMethodOrder` |
| [VueStripeTaxIdElement](/api/components/stripe-tax-id-element) | `createTaxIdElement()` | All Tax ID options |
| [VueStripeContactDetailsElement](/api/components/stripe-contact-details-element) | `createContactDetailsElement()` | None |
| [VueStripeCurrencySelectorElement](/api/components/stripe-currency-selector-element) | `createCurrencySelectorElement()` | None |
| [VueStripeTermsElement](/api/components/stripe-terms-element) | `createTermsElement()` (Stripe beta) | None |
| [VueStripeLinkSignupElement](/api/components/stripe-link-signup-element) | `createLinkSignupElement()` (Stripe beta) | `defaultValues` |

The Checkout SDK accepts only these option subsets; other keys you pass are dropped. Appearance and fonts are not element options here: set them with `elementsOptions`, or change them later with `useCheckoutSession().changeAppearance()` / `loadFonts()`.

The Card, split card (number / expiry / CVC), IBAN, AU bank account, Link Authentication, Payment Method Messaging and Issuing elements are **not** available with Checkout Sessions; rendering one inside this provider sets its error state and logs an error. A `VueStripeElements` nested inside the provider takes over for its own children.

::: warning Express Checkout events under Checkout Sessions
With Checkout Sessions, Express Checkout's `@click`, `@shippingaddresschange` and `@shippingratechange` never fire: Stripe handles them from the session. Confirm from `@confirm` with `useCheckoutSession().confirm({ expressCheckoutConfirmEvent: event })`.
:::

## Confirming the payment

Call `confirm()` from [`useCheckoutSession()`](/api/composables/use-checkout-session) (or the `actions` slot prop). When the session was created with `return_url`, call `confirm()` **without** `returnUrl`: Stripe rejects a confirm that sets both. Pass `returnUrl` only when the session has no `return_url`.

```ts
const { confirm } = useCheckoutSession()

// Session created with return_url
await confirm()

// Session created without return_url
await confirm({ returnUrl: `${window.location.origin}/complete` })
```

## Provides

| Key | Type | Description |
|-----|------|-------------|
| `checkout` | `Ref<StripeCheckoutElementsSdk \| null>` | The Checkout Elements SDK instance |
| `actions` | `Ref<StripeCheckoutLoadActionsSuccess \| null>` | Session actions, once `loadActions()` resolves |
| `session` | `Ref<StripeCheckoutSession \| null>` | Reactive session snapshot (updates on every Stripe `change`) |
| `loading` | `Ref<boolean>` | `true` until the session actions have loaded |
| `error` | `Ref<string \| null>` | Initialization error, if any |

Access these via [`useCheckoutSession()`](/api/composables/use-checkout-session).

## TypeScript

The component's props and event payloads are typed on Vue 2.7 and Vue 3: `vue-tsc` checks a handler's parameter against the payload in [Events](#events).

```ts
import type {
  StripeCheckoutElementsOptions,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutSession,
  VueStripeCheckoutElementsProviderProps
} from '@vue-stripe/vue-stripe'

const elementsOptions: StripeCheckoutElementsOptions = {
  appearance: { theme: 'stripe' },
  savedPaymentMethod: { enableSave: 'never' }
}

const onReady = (actions: StripeCheckoutLoadActionsSuccess) => {
  console.log(actions.getSession().total.total.amount)
}

const onChange = (session: StripeCheckoutSession) => {
  console.log('Can confirm:', session.canConfirm)
}
```

## See Also

- [useCheckoutSession](/api/composables/use-checkout-session) — drive the session from descendants
- [Build your own page on a Checkout Session](/guide/custom-checkout) — how-to guide
- [VueStripeProvider](/api/components/stripe-provider) — required parent
- [VueStripeCheckout](/api/components/stripe-checkout) — hosted Checkout redirect
- [Stripe: Elements with Checkout Sessions](https://docs.stripe.com/payments/quickstart-checkout-sessions) — official guide
