---
title: Express Checkout Example
description: "Live demo of VueStripeExpressCheckoutElement: Apple Pay, Google Pay, Link and PayPal buttons in Vue, shown according to the browser and device."
---

# Express Checkout

Offer one-click payment with the Express Checkout Element, which renders Apple Pay, Google Pay, Link and PayPal buttons based on what the customer's browser and your Dashboard support.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Pick a product; the element shows the wallet buttons that this browser and device support, such as Apple Pay in Safari or Google Pay in Chrome. In test mode, Stripe does not charge the card saved in your wallet. A headless or private window may show no buttons.

<ExpressCheckoutExample />

## How the demo works

1. The product step loads the demo account's one-time products from the backend.
2. Choosing a product asks the backend to create a PaymentIntent for that product's price and returns its client secret.
3. `VueStripeElements` gets the client secret and wraps `VueStripeExpressCheckoutElement`. The element renders a button only for each wallet it can offer here. Its `ready` event reports `availablePaymentMethods`; when there are none, the demo says that no wallet is available in this browser.
4. When the customer approves the payment in the wallet's sheet, the element emits `confirm`. The handler calls `confirmPayment()` from `usePaymentIntent()`, which runs `elements.submit()` and confirms the PaymentIntent with `redirect: 'if_required'`.
5. When the PaymentIntent status is `succeeded`, the demo shows a success message. A Stripe error appears under the element instead.

The buttons depend on the browser, the device, the wallets set up on it, and the payment methods enabled on the Stripe account.

::: tip See also
How-to guide: [Add Apple Pay, Google Pay and Link buttons](/guide/express-checkout). Reference: [VueStripeExpressCheckoutElement](/api/components/stripe-express-checkout-element).
:::
