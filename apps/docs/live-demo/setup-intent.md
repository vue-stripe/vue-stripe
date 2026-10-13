---
title: Save a Card Example
description: "Live demo of saving a card for future payments in Vue with a SetupIntent, the Payment Element and useSetupIntent, in Stripe test mode."
---

# Save a Card (SetupIntent)

Save a customer's card for future off-session charges without taking a payment now. The `useSetupIntent` composable validates the Payment Element and confirms the SetupIntent for you.

<SetupIntentExample />

::: tip See also
How-to guide: [Save a payment method for later](/guide/setup-intent). Reference: [useSetupIntent](/api/composables/use-setup-intent).
:::
