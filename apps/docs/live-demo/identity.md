---
title: Identity Verification Example
description: Verify a customer's identity with Stripe Identity and useIdentity
---

# Identity Verification Example

Verify who your customer is with [Stripe Identity](https://docs.stripe.com/identity). The server creates a VerificationSession; `verifyIdentity()` from `useIdentity()` opens Stripe's verification modal with its client secret and resolves when the customer submits or closes it.

This demo runs in test mode: under **Complete with test data**, pick an outcome (for example *Verification success*) and click **Submit**, so you do not need a real ID.

<IdentityExample />

::: tip See Also
For implementation details, see [useIdentity](/api/composables/use-identity).
:::
