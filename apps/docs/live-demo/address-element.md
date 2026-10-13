---
title: Address Element Example
description: "Live demo of VueStripeAddressElement: collect a validated shipping or billing address with autocomplete and read its change events in Vue."
---

# Address Element

Collect a complete, validated shipping or billing address with built-in autocomplete. The element emits structured `change` events you can read in real time.

## Try the demo

The demo uses the docs' Stripe test-mode key and takes no payment. Choose Shipping or Billing, then type an address. The captured value appears below the element as JSON, marked complete or incomplete.

<AddressElementExample />

## How the demo works

1. Nothing is sent to the demo backend. `VueStripeElements` gets `mode="payment"`, `currency="usd"` and `:amount="1000"` instead of an Intent's client secret, because Stripe.js 10 needs those values to create the Address Element.
2. `VueStripeAddressElement` renders with `:options="{ mode }"`, where `mode` is `shipping` or `billing` from the toggle. The component is keyed on the mode, so switching mounts a new element with the new options.
3. The element emits `ready` once it is mounted; the indicator above it turns green.
4. On every edit it emits `change`. The payload's `complete` flag says whether every required field is filled, and `value` holds the name and the structured address. The demo prints both.

In a checkout, the same Elements group would also hold the Payment Element, and Stripe would read the address when the payment is confirmed. This demo stops at reading the value.

::: tip See also
How-to guide: [Collect a shipping or billing address](/guide/address-element). Reference: [VueStripeAddressElement](/api/components/stripe-address-element).
:::
