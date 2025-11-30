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

### Reference

Each component and composable has detailed API documentation:

- [Components](/api/components) - StripeProvider, VueStripeElements, element components
- [Composables](/api/composables) - useStripe, useStripeElements, usePaymentIntent

## Quick Links

| I want to... | Go to... |
|--------------|----------|
| Accept any payment method | [Payment Element](/guide/payment-element) |
| Accept only cards | [Card Element](/guide/card-element) |
| Add Apple Pay / Google Pay | [Express Checkout](/guide/express-checkout) |
| Redirect to Stripe's page | [Checkout](/guide/checkout) |
| Understand the component tree | [Architecture](/guide/architecture) |

## Prerequisites

Before using Vue Stripe, you should:

- Have a [Stripe account](https://dashboard.stripe.com/register)
- Know basic Vue.js (components, props, events)
- Understand async/await and Promises

## Getting Help

- Check the [API Reference](/api) for detailed documentation
- Look at the [Examples](/examples) for complete code samples
- Report issues on [GitHub](https://github.com/vue-stripe/vue-stripe/issues)
