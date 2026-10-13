---
title: Identity Verification Example
description: "Live demo of Stripe Identity in Vue: open the verification modal with useIdentity and complete it with Stripe test data, with no real ID needed."
---

# Identity Verification Example

Verify who your customer is with [Stripe Identity](https://docs.stripe.com/identity). The server creates a VerificationSession; `verifyIdentity()` from `useIdentity()` opens Stripe's verification modal with its client secret and resolves when the customer submits or closes it.

## Try the demo

This demo runs in test mode: under **Complete with test data**, pick an outcome (for example *Verification success*) and click **Submit**, so you do not need a real ID. The demo ends with the VerificationSession ID.

<IdentityExample />

## How the demo works

1. `VueStripeProvider` loads Stripe.js. The verify button is a child component, so it can call `useIdentity()`.
2. Each click asks the backend to create a new VerificationSession for a document check. The secret key stays on the server; the page receives the session's client secret and ID.
3. `verifyIdentity(clientSecret)` opens Stripe's verification modal, which asks for a photo ID and a selfie, or for test data in test mode. It resolves when the customer submits or closes the modal.
4. Without an error, the demo shows the VerificationSession ID. Closing the modal returns the error code `session_cancelled`, and the demo shows a hint instead of an error.
5. The browser never learns the outcome of the check. Stripe processes the verification and reports it to the server with the `identity.verification_session.*` webhooks.

::: tip See also
How-to guide: [Verify a customer's identity](/guide/identity). Reference: [useIdentity](/api/composables/use-identity).
:::
