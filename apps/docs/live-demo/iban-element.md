---
title: SEPA Direct Debit Example
description: "Live demo of SEPA Direct Debit in Vue: collect an IBAN with VueStripeIbanElement and confirm a euro payment in Stripe test mode."
---

# SEPA Direct Debit (IBAN)

Collect a customer's IBAN with the IBAN Element and charge euro payments via SEPA Direct Debit. SEPA payments confirm asynchronously and settle to a `processing` status.

## Try the demo

The demo runs in Stripe test mode against the demo backend at `backend.vuestripe.com`, so nothing is charged. Click Start to create a €20.00 SEPA Direct Debit payment. Enter a name, an email address and the test IBAN shown in the demo, `AT61 1904 3002 3457 3201`, then pay. The payment ends in `processing`, as a real SEPA debit does.

<IbanElementExample />

## How the demo works

1. Start asks the backend to create a SEPA Direct Debit PaymentIntent for €20.00 and returns its client secret.
2. `VueStripeElements` gets the client secret and wraps `VueStripeIbanElement`, created with `supportedCountries: ['SEPA']` and `placeholderCountry: 'DE'`. Its `change` event reports when the IBAN is complete.
3. The Pay button is enabled once the IBAN is complete and the name and email are filled in. SEPA Direct Debit needs both as billing details for the mandate.
4. The button gets the mounted IBAN Element with `getElement('iban')` from `useStripeElements()` and calls `confirmSepaDebitPayment()` from `useConfirmSepaDebitPayment()` with `payment_method: { sepa_debit: ibanElement, billing_details: { name, email } }`.
5. Stripe returns the PaymentIntent in `processing`, and the demo shows its ID.

The debit settles days later. A server learns the final status from webhooks, not from the browser.

::: tip See also
How-to guide: [Accept SEPA Direct Debit](/guide/iban-element). Reference: [VueStripeIbanElement](/api/components/stripe-iban-element).
:::
