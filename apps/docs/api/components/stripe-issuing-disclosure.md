---
description: "VueStripeIssuingDisclosure reference: render the legal disclosure Stripe requires for an Issuing card program in a Vue app, via createIssuingDisclosure."
---

# VueStripeIssuingDisclosure

Shows cardholders the legal disclosure of a Stripe Issuing card program: the text Stripe generates for your program, its public card program name and an optional link of yours. The component calls `stripe.createIssuingDisclosure(options)` and mounts the HTML element Stripe.js returns, so the wording always comes from Stripe. It is the Vue port of React Stripe.js 7's `IssuingDisclosure`.

| | |
|---|---|
| Stripe product | Stripe Issuing (cards your platform issues) |
| Stripe.js method | `stripe.createIssuingDisclosure()`, not in the Stripe.js 10.0.0 type definitions |
| Account requirement | Onboarded to Issuing. Other accounts get `invalid_request_error` ("Unrecognized request URL (GET: /v1/disclosures/...)") through `@error` |
| Live demo | None: the demo account has not onboarded to Issuing |
| Related | [Issuing Elements](/api/components/stripe-issuing-elements) display the card itself; [Display issued card details](/guide/issuing) |

## Usage

Place the disclosure where a cardholder applies for or activates a card, next to the card program's terms:

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <h2>Apply for the Rocket Card</h2>
    <VueStripeIssuingDisclosure :options="disclosure" @error="onError" />
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider, VueStripeIssuingDisclosure } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css' // once, e.g. in main.ts

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const disclosure = {
  issuingProgramID: 'iprg_123',
  publicCardProgramName: 'Rocket Card',
  learnMoreLink: 'https://example.com/rocket-card'
}

const onError = (error) => console.error(error.message)
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stripe` | `Stripe \| PromiseLike<Stripe \| null> \| null` | No | Stripe instance, for use without `VueStripeProvider` (for example `loadStripe(key)`). Defaults to the provider's; with neither, the component throws `VueStripeProviderError`. Nothing is requested while it is `null` |
| `options` | `IssuingDisclosureOptions` | No | Which card program the disclosure is for (below) |

### Options

| Option | Type | Description |
|--------|------|-------------|
| `issuingProgramID` | `string` | ID of the Issuing program (`iprg_...`) whose disclosure Stripe returns |
| `publicCardProgramName` | `string` | The card program's public name, as cardholders know it |
| `learnMoreLink` | `string` | A link of yours where cardholders can read more about the card program |

A change to any option requests the disclosure again and replaces the text. An inline `:options="{ ... }"` with unchanged values does not.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@load` | - | The disclosure is mounted (React `onLoad`) |
| `@error` | `StripeError \| { message: string }` | Stripe refused the request, or the call failed (React `onError`) |

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | While the disclosure loads (default: "Loading disclosure...") |
| `#error` | `{ error: string }` | When no disclosure could be created |

## Exposed Properties

| Member | Type | Description |
|--------|------|-------------|
| `loading` | `Ref<boolean>` | `true` until the disclosure is mounted or fails |
| `error` | `Ref<string \| null>` | Current error message |

## CSS classes

The root is `vue-stripe-issuing-disclosure`; Stripe's element goes into `vue-stripe-issuing-disclosure-mount`, and the `-error` and `-loader` children hold the slots. Each also carries the shared `vue-stripe-element*` class, styled by `@vue-stripe/vue-stripe/style.css`.

## TypeScript

```ts
import type { IssuingDisclosureOptions, DisclosureError } from '@vue-stripe/vue-stripe'
```

If the loaded Stripe.js has no `createIssuingDisclosure`, `@error` receives `{ message: 'stripe.createIssuingDisclosure() is not available in this Stripe.js version' }`.

## See Also

- [VueStripeFinancialAccountDisclosure](/api/components/stripe-financial-account-disclosure): the disclosure for financial accounts
- [VueStripeProvider](/api/components/stripe-provider): loads Stripe.js
