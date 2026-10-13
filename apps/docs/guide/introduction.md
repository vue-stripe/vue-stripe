# Introduction

Vue Stripe is a Vue.js library that wraps [Stripe.js](https://stripe.com/docs/js) and [Stripe Elements](https://stripe.com/docs/payments/elements) into Vue components and composables.

## What is Stripe Elements?

Stripe Elements are pre-built UI components that help you collect payment information securely. Instead of building payment forms from scratch, you use Stripe's components that:

- **Handle sensitive data securely** - Card numbers never touch your servers
- **Support 100+ payment methods** - Cards, wallets, bank transfers, and more
- **Adapt to your customer's location** - Show relevant payment methods automatically
- **Look professional** - Pre-styled and customizable

## What does Vue Stripe provide?

Vue Stripe bridges the gap between Stripe.js and Vue.js by providing:

### 1. Vue Components
Instead of manually creating and mounting Stripe elements, you use Vue components:

```vue
<!-- Without Vue Stripe -->
<script>
const stripe = await loadStripe('pk_test_...')
const elements = stripe.elements()
const paymentElement = elements.create('payment')
paymentElement.mount('#payment-element')
</script>
<template>
  <div id="payment-element"></div>
</template>

<!-- With Vue Stripe -->
<template>
  <VueStripeProvider :publishable-key="pk">
    <VueStripeElements :client-secret="secret">
      <VueStripePaymentElement />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

### 2. Reactive Composables
Access Stripe instances with Vue's reactivity:

```js
import { watch } from 'vue'
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe, loading, error } = useStripe()

// stripe.value is reactive - use in templates or watchers
watch(stripe, (newStripe) => {
  if (newStripe) {
    console.log('Stripe ready!')
  }
})
```

### 3. Vue 3 and Vue 2.7
One build runs on Vue 3 and Vue 2.7 (through [vue-demi](https://github.com/vueuse/vue-demi)); CI mounts it on both. See [Installation](/guide/installation#vue-2-7) for the Vue 2.7 setup.

### 4. All of Stripe.js
Every Stripe.js 10 element and method has a component or composable (see the [coverage page](/coverage)), so your components never reach for the raw `stripe` object:

| Area | What Vue Stripe gives you |
|------|---------------------------|
| Elements | [Payment](/guide/payment-element), [Express Checkout](/guide/express-checkout), [Card](/guide/card-element) (single or split), [Address](/guide/address-element), [Link Authentication](/guide/link-authentication), [Payment Method Messaging](/guide/payment-method-messaging), [IBAN](/guide/iban-element), [AU BECS](/guide/au-bank-account-element), [Contact Details](/api/components/stripe-contact-details-element), [Tax ID](/api/components/stripe-tax-id-element), [Currency Selector](/api/components/stripe-currency-selector-element), [Terms](/api/components/stripe-terms-element) and [Link Signup](/api/components/stripe-link-signup-element) |
| Checkout | [Hosted Checkout](/guide/checkout) redirect, [Embedded Checkout](/guide/embedded-checkout), [Custom Checkout](/guide/custom-checkout) on a Checkout Session, the [Checkout Form](/guide/checkout-form) (beta) and the [Pricing Table](/guide/pricing-table) |
| Confirming | [`usePaymentIntent`](/api/composables/use-payment-intent), [`useSetupIntent`](/api/composables/use-setup-intent), one [`useConfirm<Method>`](/api/composables/confirm/) composable per payment method, [`useHandleNextAction`](/api/composables/use-handle-next-action): see [Confirming Payments](/guide/confirming-payments) |
| Tokens | [`useCreateConfirmationToken`](/api/composables/use-create-confirmation-token), [`useCreatePaymentMethod`](/api/composables/use-create-payment-method), [`useCreateToken`](/api/composables/use-create-token), [`useRadarSession`](/api/composables/use-radar-session): see [Tokens and Payment Methods](/guide/tokens) |
| Beyond payments | [Financial Connections](/api/composables/use-financial-connections), [Identity](/api/composables/use-identity), the [Payment Request API](/api/composables/use-payment-request), [Issuing Elements](/guide/issuing) and the Issuing, Treasury and Financial Account [disclosures](/api/components/stripe-issuing-disclosure) |
| App setup | [`VueStripeProvider`](/api/components/stripe-provider) per page, or the [`createVueStripe()`](/api/plugin) plugin for the whole app |

## How this guide is structured

This documentation is organized to build your knowledge progressively:

1. **Installation** - Set up the library in your project (Vue 3, Vue 2.7, Nuxt)
2. **Your First Payment** - Build a working payment form
3. **Understanding the Architecture** - Learn how components work together
4. **Choosing Your Approach** - Pick the right elements or Checkout flavor for your use case
5. **Building Payment Forms** - Deep dive into each element
6. **Payment Flows** - Confirming payments, tokens, and server-side confirmation
7. **Checkout and Advanced** - Saving payment methods, Checkout Sessions, Issuing

Every flow you can try in this site's sandbox is on the [Live Demo](/live-demo/) pages.

## Prerequisites

Before you begin, you should:

- Have a [Stripe account](https://dashboard.stripe.com/register) (test mode is fine)
- Know the basics of Vue.js (components, props, events)
- Have a Vue 3 or Vue 2.7 project set up

Ready? Let's [install the library](/guide/installation).
