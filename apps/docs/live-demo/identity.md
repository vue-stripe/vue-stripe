---
title: Identity Verification Example
description: "Live demo of Stripe Identity in Vue: open the verification modal with useIdentity and complete it with Stripe test data, with no real ID needed."
---

# Identity Verification Example

Verify who your customer is with [Stripe Identity](https://docs.stripe.com/identity). The server creates a VerificationSession; `verifyIdentity()` from `useIdentity()` opens Stripe's verification modal with its client secret and resolves when the customer submits or closes it.

This demo runs in test mode: under **Complete with test data**, pick an outcome (for example *Verification success*) and click **Submit**, so you do not need a real ID.

<IdentityExample />

::: tip See also
How-to guide: [Verify a customer's identity](/guide/identity). Reference: [useIdentity](/api/composables/use-identity).
:::
