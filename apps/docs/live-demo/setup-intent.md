---
title: Save a Card Example
description: "Live demo of saving a card for future payments in Vue with a SetupIntent, the Payment Element and useSetupIntent, in Stripe test mode."
---

# Save a Card (SetupIntent)

Save a customer's card for future off-session charges without taking a payment now. The `useSetupIntent` composable validates the Payment Element and confirms the SetupIntent for you.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Click Start, enter the test card `4242 4242 4242 4242`, any future expiry date and any CVC in the Payment Element, then click Save card. No money moves; the demo ends with the SetupIntent ID.

<SetupIntentExample />

## How the demo works

1. Start asks the backend to create a SetupIntent and returns its client secret.
2. `VueStripeElements` gets the SetupIntent's client secret and renders `VueStripePaymentElement`, which shows the payment methods that can be saved with it.
3. Save card calls `confirmSetup()` from `useSetupIntent()` with `redirect: 'if_required'`. The composable runs `elements.submit()` to validate the form, then confirms the SetupIntent. Stripe runs 3D Secure when the card requires it.
4. When the SetupIntent status is `succeeded`, the card is saved as a PaymentMethod and the demo shows the SetupIntent ID. A Stripe error is shown instead when confirming fails.
5. Payment methods that need a redirect return to this page, where a banner reads the result from the URL.

Saving a card is the first half of charging it later: a server would use the saved PaymentMethod for off-session payments.

::: tip See also
How-to guide: [Save a payment method for later](/guide/setup-intent). Reference: [useSetupIntent](/api/composables/use-setup-intent).
:::
