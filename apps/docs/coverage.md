---
title: Stripe.js Coverage
description: How much of Stripe.js Vue Stripe wraps — elements, checkout flows, and payment/setup methods.
aside: false
pageClass: coverage-page
---

# Stripe.js Coverage

How much of Stripe.js does Vue Stripe wrap? This page compares our components and composables against Stripe.js elements, checkout flows, and payment/setup methods, so you can see at a glance what ships today.

Anything not yet wrapped is still reachable through the raw `stripe` / `elements` instance returned by `useStripe()` and `useStripeElements()` — and the list grows as new features land.

<StripeCoverage />
