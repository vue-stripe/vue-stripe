# Test your integration

Run every payment flow end to end with Stripe's test data before you go live: test cards, bank accounts, wallets and webhooks. This page is the single list of test numbers used across these docs. The numbers come from Stripe's [testing documentation](https://docs.stripe.com/testing), which has the complete set.

Before you start, switch your app to test-mode keys: a `pk_test_...` publishable key in the browser and an `sk_test_...` secret key on your server (or the keys of a [sandbox](https://docs.stripe.com/sandboxes)). Test data only works with test keys, and real payment details never work with them.

## Cards

For every card below, use any future expiry date (for example `12/34`), any 3-digit CVC (4 digits for American Express) and any postal code.

### Successful payments

| Number | Brand |
|--------|-------|
| `4242 4242 4242 4242` | Visa |
| `5555 5555 5555 4444` | Mastercard |
| `3782 822463 10005` | American Express |

### Authentication (3D Secure)

| Number | Behavior |
|--------|----------|
| `4000 0025 0000 3155` | Requires authentication for on-session payments. Once saved with a SetupIntent, later off-session payments go through without authentication. |
| `4000 0027 6000 3184` | Requires authentication on every payment, saved or not. |
| `4000 0000 0000 3220` | 3D Secure 2: authentication must complete for the payment to succeed. |

Stripe.js shows a test authentication page in a modal over your page. Complete it to see the payment succeed, or fail it to see the `payment_intent_authentication_failure` error. With `redirect: 'if_required'`, `confirmPayment()` from `usePaymentIntent` resolves after the modal closes.

### Declines and errors

| Number | `error.code` | `error.decline_code` |
|--------|--------------|----------------------|
| `4000 0000 0000 0002` | `card_declined` | `generic_decline` |
| `4000 0000 0000 9995` | `card_declined` | `insufficient_funds` |
| `4000 0000 0000 9987` | `card_declined` | `lost_card` |
| `4000 0000 0000 9979` | `card_declined` | `stolen_card` |
| `4000 0000 0000 0069` | `expired_card` | |
| `4000 0000 0000 0127` | `incorrect_cvc` | |
| `4000 0000 0000 0119` | `processing_error` | |

`4000 0000 0000 0341` behaves differently: saving it to a customer succeeds, and every later charge on it fails with `card_declined`. Use it to test failed renewals and off-session charges.

How to show these errors to the customer is covered in [Handle errors and declines](/guide/error-handling).

## SEPA Direct Debit (IBAN)

Enter these in [`VueStripeIbanElement`](/guide/iban-element) or the Payment Element. A SEPA payment confirms to `processing` first; the final status arrives later, so watch it with [webhooks](/guide/webhooks).

| IBAN | Outcome |
|------|---------|
| `DE89 3704 0044 0532 0130 00` | `processing`, then `succeeded` |
| `DE08 3704 0044 0532 0130 03` | `processing`, then `succeeded` after at least 3 minutes |
| `DE62 3704 0044 0532 0130 01` | `processing`, then `requires_payment_method` (failed) |
| `DE35 3704 0044 0532 0130 02` | `succeeded`, then a dispute is opened |

Successful IBANs from other countries: `FR14 2004 1010 0505 0001 3M02 606` (France), `NL39 RABO 0300 0652 64` (Netherlands), `AT61 1904 3002 3457 3201` (Austria), `BE62 5100 0754 7061` (Belgium). Stripe lists failing and disputed IBANs for every SEPA country. Some IBANs that look like samples are failure cases there: `NL91 ABNA 0417 1643 00` and `ES91 2100 0418 4502 0005 1332` both end in `requires_payment_method`.

## BECS Direct Debit (Australia)

Enter these in [`VueStripeAuBankAccountElement`](/guide/au-bank-account-element). Use BSB `000-000` with:

| Account number | Outcome |
|----------------|---------|
| `000123456` | `processing`, then `succeeded` |
| `900123456` | `processing`, then `succeeded` after about 3 minutes |
| `111111113` | `processing`, then fails with `account_closed` |
| `222222227` | `processing`, then fails with `refer_to_customer` |
| `666666660` | `succeeded`, then a dispute is opened |

## ACH Direct Debit (US)

In Stripe's Financial Connections test modal (opened by [`useFinancialConnections`](/guide/ach-debit)), pick **Test (Non-OAuth)** as the bank, accept the terms and choose the **Success** account.

To test entering account details by hand, choose to enter them manually and use routing number `110000000` with:

| Account number | Outcome |
|----------------|---------|
| `000123456789` | Payment succeeds |
| `000222222227` | Fails with insufficient funds |
| `000111111113` | Fails, account closed |

Manually entered accounts are verified with micro-deposits. Verify them with the amounts `32` and `45`, or with the descriptor code `SM11AA`; see [Accept ACH Direct Debit](/guide/ach-debit#_4-verify-with-micro-deposits).

## Link

Sign up for Link with any email address. When Link asks for the one-time code, any six digits succeed except `000001` (invalid code), `000002` (expired code) and `000003` (too many attempts). Don't store real personal data in test-mode Link accounts.

## Identity

In test mode Stripe's Identity modal offers **Complete with test data**: pick an outcome, such as a successful verification, and submit. No real document is needed. See [Verify a customer's identity](/guide/identity).

## Wallets: Apple Pay and Google Pay

Wallet buttons in the [Express Checkout Element](/guide/express-checkout) and the Payment Element appear only when all of these hold:

- The page is served over HTTPS.
- The domain is registered in the Dashboard under **Settings > Payment method domains**, in test mode as well as in live mode.
- The browser supports the wallet (Safari or an iOS browser for Apple Pay; Chrome and most browsers for Google Pay) and has a card saved in it.

In test mode you can pay with a real card saved in the wallet: Stripe swaps it for a test card and nothing is charged.

To test from your development server, open it through an HTTPS tunnel such as [ngrok](https://ngrok.com) or [localhost.run](https://localhost.run), and register the tunnel's domain:

```bash
ngrok http 5173
```

Vite blocks requests for hostnames it doesn't know. Add the tunnel host to `server.allowedHosts` in `vite.config.ts`:

```ts
export default defineConfig({
  server: {
    allowedHosts: ['.ngrok-free.app']
  }
})
```

## Webhooks with the Stripe CLI

Forward test-mode events to your local server with the [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/webhook
```

`stripe listen` prints a signing secret (`whsec_...`); give it to your webhook handler while you test. Every test payment you make now reaches your server. To send one event without making a payment, trigger it:

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger checkout.session.completed
```

Writing the handler is covered in [Fulfil orders with webhooks](/guide/webhooks).

## Subscriptions and renewals

Use [test clocks](https://docs.stripe.com/billing/testing/test-clocks) to move a test customer forward in time and see renewals, trial ends and failed payments without waiting. To make a renewal fail, make `4000 0000 0000 0341` the customer's default payment method before you advance the clock: it saves without error but every charge on it is declined.

## Result

You have run each payment method you offer through success, authentication and failure, and seen the matching events reach your webhook handler. The [live demos](/live-demo/) on this site run in test mode with the same numbers, if you want to compare behavior.
