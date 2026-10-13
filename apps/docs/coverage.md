---
title: Stripe.js Coverage
description: How much of Stripe.js Vue Stripe wraps — elements, checkout flows, and payment/setup methods.
aside: false
pageClass: coverage-page
---

# Stripe.js Coverage

How much of Stripe.js does Vue Stripe wrap? This page compares our components and composables against Stripe.js elements, checkout flows, and payment/setup methods, so you can see at a glance what ships today.

Every Stripe.js 10 element and method that Stripe still supports has a component or composable. Rows marked deprecated were removed or deprecated by Stripe and are intentionally not wrapped. When a new Stripe.js release adds something, it appears here as soon as it is classified; until a wrapper ships, the raw `stripe` / `elements` instances from `useStripe()` and `useStripeElements()` reach it.

<StripeCoverage />
