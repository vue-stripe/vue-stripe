---
title: Payment Request Example
description: "Live demo of usePaymentRequest: pay through the browser's payment sheet behind your own Vue button and confirm with useConfirmCardPayment."
---

# Payment Request Example

Your own button opens the browser's payment sheet (Apple Pay, Google Pay, Link or a saved card). `usePaymentRequest()` creates the `PaymentRequest` and checks `canMakePayment()`; when the customer authorizes, the `paymentmethod` handler creates a PaymentIntent on the server and confirms it with `useConfirmCardPayment()`.

::: warning Prefer the Express Checkout Element
For new integrations Stripe recommends the [Express Checkout Element](/live-demo/express-checkout), which renders the wallet buttons for you. Use `usePaymentRequest` to keep an existing custom-button integration working.
:::

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. The demo takes a $10.99 test payment. The button only appears when this browser has a wallet or a saved card and the page is served over HTTPS. Otherwise the demo shows the `canMakePayment` result, `No wallet in this browser`.

<PaymentRequestExample />

## How the demo works

1. `usePaymentRequest()` creates a `PaymentRequest` for $10.99 (country `US`, currency `usd`) that asks for the payer's name and email, and runs `canMakePayment()`. The demo prints the result: the wallets this browser offers, or `No wallet in this browser`.
2. The Pay $10.99 button calls `show()`, which opens the browser's payment sheet.
3. When the customer authorizes the payment, the request emits `paymentmethod`. The handler, registered with `on('paymentmethod', ...)`, asks the backend to create a PaymentIntent for $10.99.
4. It then calls `confirmCardPayment()` from `useConfirmCardPayment()` with the new PaymentMethod ID and `handleActions: false`, so the sheet can close before any 3D Secure step.
5. The handler closes the sheet with `event.complete('success')` or `event.complete('fail')`. If the PaymentIntent needs an action such as 3D Secure, it calls `confirmCardPayment()` again to run it.
6. When the PaymentIntent status is `succeeded`, the demo shows the PaymentIntent ID.

::: tip See also
How-to guide: [Add Apple Pay, Google Pay and Link buttons](/guide/express-checkout), with the Express Checkout Element that replaces this API. Reference: [usePaymentRequest](/api/composables/use-payment-request) and [useConfirmCardPayment](/api/composables/confirm/cards).
:::
