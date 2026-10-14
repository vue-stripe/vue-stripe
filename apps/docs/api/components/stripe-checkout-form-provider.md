---
description: "VueStripeCheckoutFormProvider reference: initialize Stripe's Checkout Form SDK (beta) for a Checkout Session and provide it to Vue components."
---

# VueStripeCheckoutFormProvider

Initializes the **Checkout Form** via `stripe.initCheckoutFormSdk()` and provides the Checkout Form SDK to descendants. Place [`VueStripeCheckoutForm`](/api/components/stripe-checkout-form) inside it to render Stripe's complete checkout form on your page, and confirm with the [`useCheckoutForm`](/api/composables/use-checkout-form) composable. [Choosing an integration](/guide/approaches#choosing-among-the-checkout-options) compares it with the other Checkout options.

- Use it inside [`VueStripeProvider`](/api/components/stripe-provider), or in an app that installs the [`createVueStripe()`](/api/plugin) plugin.
- Pass the `client_secret` of a Checkout Session created on your server with `ui_mode: 'form'` (Stripe API version `2026-03-25.dahlia` or later). [Add the Checkout Form](/guide/checkout-form) shows the server code.
- The provider shows its `#loading` slot until the Stripe instance exists, then calls `stripe.initCheckoutFormSdk()`, which returns the SDK synchronously, and renders its children at once. `@ready` fires when the session actions have loaded (`loadActions()`), and `@change` on every session change.

::: warning Beta: requires Stripe access
The Checkout Form SDK is a Stripe beta (`ui_mode: 'form'`). Your Stripe account needs access; contact [Stripe support](https://support.stripe.com/) to join. Some form options have their own gate: the `compact` layout is a separate private preview, and without it the form reports *"The `compact` layout is not available for your account"* through its `#error` slot and `@loaderror`.
:::

::: tip Live demo
The [Checkout Form demo](/live-demo/checkout-form) pays a Checkout Session with this provider, `VueStripeCheckoutForm` and `useCheckoutForm()`.
:::

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutFormProvider :fetch-client-secret="fetchClientSecret">
      <PayForm />
    </VueStripeCheckoutFormProvider>
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider, VueStripeCheckoutFormProvider } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts
import PayForm from './PayForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// From your backend: stripe.checkout.sessions.create({ ui_mode: 'form', ... })
// Called by the provider in the browser only, once Stripe.js has loaded
const fetchClientSecret = () =>
  fetch('/api/checkout-form-session', { method: 'POST' })
    .then((res) => res.json())
    .then((data) => data.clientSecret)
</script>
```

A Promise in `client-secret` works too, but not one created at the top of `<script setup>` in a server-rendered page: see [Fetch client secrets in the browser](/guide/ssr#fetch-client-secrets-in-the-browser).

```vue
<!-- PayForm.vue -->
<template>
  <VueStripeCheckoutForm @confirm="onConfirm" />
  <p v-if="message">{{ message }}</p>
</template>

<script setup>
import { ref } from 'vue'
import { VueStripeCheckoutForm, useCheckoutForm } from '@vue-stripe/vue-stripe'

const { confirm } = useCheckoutForm()
const message = ref('')

// The form's Pay button (or a wallet) fires @confirm; hand the event to Stripe.
const onConfirm = async (event) => {
  const result = await confirm({ formConfirmEvent: event })
  if (result.type === 'error') message.value = result.error.message
}
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clientSecret` | `string \| Promise<string>` | No\* | Client secret of a `ui_mode: 'form'` Checkout Session, or a Promise resolving to it (passed to Stripe as is) |
| `fetchClientSecret` | `() => Promise<string>` | No\* | Function returning the client secret. **Takes precedence** over `clientSecret` |
| `appearance` | `Omit<Appearance, 'rules'>` | No | [Appearance](https://docs.stripe.com/elements/appearance-api) of the form; the Form SDK does not accept `rules` |
| `loader` | `'auto' \| 'always' \| 'never'` | No | Whether Stripe shows a loader while the form loads |
| `fonts` | `Array<CssFontSource \| CustomFontSource>` | No | Custom fonts for the form |
| `savedPaymentMethod` | `SavedPaymentMethodOption` | No | Saved payment methods: `enableSave`, `enableRedisplay` (`'auto'` or `'never'`) |
| `defaultValues` | `object` | No | Prefill `email`, `phoneNumber`, `billingAddress`, `shippingAddress` |

\* Provide **either** `clientSecret` **or** `fetchClientSecret`. If neither is set, the error slot renders and `@error` fires.

The props are read once, when the SDK is initialized. To use another session, re-mount the provider (for example with a `:key`). To restyle the form later, call `useCheckoutForm().changeAppearance()`.

### defaultValues

```ts
interface DefaultValues {
  email?: string
  phoneNumber?: string
  billingAddress?: StripeCheckoutContact
  shippingAddress?: StripeCheckoutContact
}
```

The defaults go to the session as on [`VueStripeCheckoutElementsProvider`](/api/components/stripe-checkout-provider#defaultvalues), so Stripe refuses the same ones: `email` on a session that already has the customer's email, and `phoneNumber` unless the session was created with `phone_number_collection: { enabled: true }`.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeCheckoutFormLoadActionsSuccess` | Emitted once `loadActions()` resolves. Payload is the Form SDK actions object |
| `@change` | `StripeCheckoutSession` | Emitted on every Stripe `change` event with the new session snapshot |
| `@error` | `string` | Emitted if `initCheckoutFormSdk()` throws, `loadActions()` returns an error, or no client secret is given |

## Slots

| Slot | Props | Rendered when |
|------|-------|---------------|
| `default` | `{ checkout, actions, session, loading }` | As soon as the Checkout Form SDK exists (before the actions load) |
| `loading` | - | Until the Checkout Form SDK exists (Stripe.js still loading) |
| `error` | `{ error }` | Initialization failed |

The default slot renders early so `VueStripeCheckoutForm` can mount while the actions are still loading. Its `loading` prop (and `useCheckoutForm().loading`) stays `true` until `loadActions()` resolves; `actions` and `session` are `null` until then.

| Slot Prop | Type | Description |
|-----------|------|-------------|
| `checkout` | `StripeCheckoutFormSdk` | The Checkout Form SDK instance |
| `actions` | `StripeCheckoutFormLoadActionsSuccess \| null` | Form SDK actions (`null` until loaded) |
| `session` | `StripeCheckoutSession \| null` | Current session snapshot (`null` until loaded) |
| `loading` | `boolean` | `true` until the actions have loaded |

## Components inside the provider

| Component | Created with | Accepted `options` |
|-----------|--------------|--------------------|
| [VueStripeCheckoutForm](/api/components/stripe-checkout-form) | `createForm()` | `layout`, `contacts`, `expressCheckout`, `features` |
| [VueStripeCurrencySelectorElement](/api/components/stripe-currency-selector-element) | `createCurrencySelectorElement()` | None |

The Form SDK creates nothing else: any other element component placed inside this provider sets its error state (*"... is not available inside VueStripeCheckoutFormProvider"*) and logs an error. When you render a `VueStripeCurrencySelectorElement` yourself, the form leaves out its built-in currency picker.

## Provides

| Key | Type | Description |
|-----|------|-------------|
| `checkout` | `Ref<StripeCheckoutFormSdk \| null>` | The Checkout Form SDK instance |
| `actions` | `Ref<StripeCheckoutFormLoadActionsSuccess \| null>` | Form SDK actions, once `loadActions()` resolves |
| `session` | `Ref<StripeCheckoutSession \| null>` | Reactive session snapshot (updates on every Stripe `change`) |
| `loading` | `Ref<boolean>` | `true` until the actions have loaded |
| `error` | `Ref<string \| null>` | Initialization error, if any |

The provider uses its own injection key, so `useCheckoutSession()` does not work inside it. Access these via [`useCheckoutForm()`](/api/composables/use-checkout-form).

## TypeScript

The component's props, event payloads and slot props are typed on Vue 2.7 and Vue 3: `vue-tsc` checks a handler's parameter against the payload in [Events](#events), and a slot prop against [Slots](#slots).

```vue
<script setup lang="ts">
import { VueStripeCheckoutFormProvider, VueStripeCheckoutForm } from '@vue-stripe/vue-stripe'
import type {
  StripeCheckoutFormLoadActionsSuccess,
  StripeCheckoutSession,
  VueStripeCheckoutFormProviderProps
} from '@vue-stripe/vue-stripe'

const config: VueStripeCheckoutFormProviderProps = {
  clientSecret: 'cs_test_..._secret_...',
  appearance: { theme: 'stripe' },
  savedPaymentMethod: { enableSave: 'never' }
}

const onReady = (actions: StripeCheckoutFormLoadActionsSuccess) => {
  console.log(actions.getSession().total.total.amount)
}

const onChange = (session: StripeCheckoutSession) => {
  console.log('Status:', session.status.type)
}
</script>

<template>
  <VueStripeCheckoutFormProvider v-bind="config" @ready="onReady" @change="onChange">
    <VueStripeCheckoutForm />
  </VueStripeCheckoutFormProvider>
</template>
```

## See Also

- [VueStripeCheckoutForm](/api/components/stripe-checkout-form) - the form itself
- [useCheckoutForm](/api/composables/use-checkout-form) - confirm and drive the session from descendants
- [Checkout Form guide](/guide/checkout-form) - end-to-end walkthrough
- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) - compose your own form from elements instead
