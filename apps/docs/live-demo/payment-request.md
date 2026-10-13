---
title: Payment Request Example
description: Pay through the browser's payment sheet with usePaymentRequest and useConfirmCardPayment
---

# Payment Request Example

Your own button opens the browser's payment sheet (Apple Pay, Google Pay, Link or a saved card). `usePaymentRequest()` creates the `PaymentRequest` and checks `canMakePayment()`; when the customer authorizes, the `paymentmethod` handler creates a PaymentIntent on the server and confirms it with `useConfirmCardPayment()`.

The button only appears when this browser has a wallet or a saved card and the page is served over HTTPS. Otherwise the demo shows the `canMakePayment` result, `No wallet in this browser`.

::: warning Prefer the Express Checkout Element
For new integrations Stripe recommends the [Express Checkout Element](/live-demo/express-checkout), which renders the wallet buttons for you. Use `usePaymentRequest` to keep an existing custom-button integration working.
:::

<PaymentRequestExample />

::: tip See also
How-to guide: [Add Apple Pay, Google Pay and Link buttons](/guide/express-checkout), with the Express Checkout Element that replaces this API. Reference: [usePaymentRequest](/api/composables/use-payment-request) and [useConfirmCardPayment](/api/composables/confirm/cards).
:::
