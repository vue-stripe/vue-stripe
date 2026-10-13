# Guide

Welcome to the Vue Stripe guide. This documentation will help you integrate Stripe payments into your Vue.js application.

## Learning Path

We recommend following these pages in order:

### Getting Started

1. [Introduction](/guide/introduction) - What Vue Stripe is and why you'd use it
2. [Installation](/guide/installation) - Set up the library in your project
3. [Your First Payment](/guide/first-payment) - Build a working payment form

### Core Concepts

4. [Understanding the Architecture](/guide/architecture) - Learn how components work together
5. [Choosing Your Approach](/guide/approaches) - Pick the right solution for your use case

### Building Payment Forms

6. [Payment Element](/guide/payment-element) - The recommended all-in-one solution
7. [Card Element](/guide/card-element) - For card-only payments
8. [Express Checkout](/guide/express-checkout) - Apple Pay, Google Pay, and Link

### Checkout Sessions

9. [Checkout](/guide/checkout) - Redirect to Stripe's hosted page
10. [Embedded Checkout](/guide/embedded-checkout) - Stripe's Checkout page inside yours
11. [Custom Checkout](/guide/custom-checkout) - Your own page on a Checkout Session, with Elements
12. [Checkout Form (beta)](/guide/checkout-form) - Stripe's complete checkout form as one element

### Payment Flows

13. [Confirming Payments](/guide/confirming-payments) - Which composable confirms what
14. [Tokens and Payment Methods](/guide/tokens) - Collect now, confirm on your server or later

### Reference

Each component and composable has detailed API documentation:

- [Components](/api/#components) - StripeProvider, VueStripeElements, element components
- [Composables](/api/#composables) - useStripe, useStripeElements, usePaymentIntent, the method confirmers, and more
- [Plugin](/api/plugin) - `createVueStripe()`, Stripe for the whole app without a provider component

## Quick Links

| I want to... | Go to... |
|--------------|----------|
| Accept any payment method | [Payment Element](/guide/payment-element) |
| Accept only cards | [Card Element](/guide/card-element) |
| Add Apple Pay / Google Pay | [Express Checkout](/guide/express-checkout) |
| Redirect to Stripe's page | [Checkout](/guide/checkout) |
| Keep Stripe's checkout on my page | [Embedded Checkout](/guide/embedded-checkout) or [Checkout Form](/guide/checkout-form) |
| Build my own page on a Checkout Session | [Custom Checkout](/guide/custom-checkout) |
| Confirm a Card, IBAN or bank payment | [Confirming Payments](/guide/confirming-payments) |
| Confirm the payment on my server | [Tokens and Payment Methods](/guide/tokens) |
| Save a card for later | [Saving Payment Methods](/guide/setup-intent) |
| Show issued card details | [Issuing Elements](/guide/issuing) |
| Understand the component tree | [Architecture](/guide/architecture) |

## Prerequisites

Before using Vue Stripe, you should:

- Have a [Stripe account](https://dashboard.stripe.com/register)
- Know basic Vue.js (components, props, events)
- Understand async/await and Promises

## Getting Help

- Check the [API Reference](/api/) for detailed documentation
- Look at the [Live Demos](/live-demo/) for complete code samples
- Report issues on [GitHub](https://github.com/vue-stripe/vue-stripe/issues)
