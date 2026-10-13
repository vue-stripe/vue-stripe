# How confirming works

Collecting payment details is half of a payment. The other half is **confirming**: telling Stripe to attach those details to a PaymentIntent or SetupIntent and try the payment. This page explains what happens during that step, why the Payment Element has to be submitted first, what redirects and next actions are, and why some payment methods are still undecided when confirmation returns.

## What confirming does

A PaymentIntent starts out without a payment method. Confirming gives it one (from an element, a saved PaymentMethod or a ConfirmationToken) and asks Stripe to collect the money. Stripe then moves the Intent to its next status:

- `succeeded`: the money is collected (or, for a SetupIntent, the payment method is ready for later use).
- `requires_action`: the customer has to do something first, such as 3D Secure or paying a voucher.
- `processing`: the payment method takes time to settle, as bank debits do.
- `requires_capture`: the payment is authorized and waits for your server to capture it.
- `requires_payment_method`: the attempt failed, and the customer can try again with other details.

[Payment objects](/guide/payment-objects#the-life-of-a-paymentintent) follows these statuses in detail. What matters here is that a confirm call can end in any of them. Only `succeeded` means the money is collected.

## Which composable confirms

What you collect with decides which composable confirms. Every one of them returns `loading` and `error` refs next to its method:

| You collect details with | Confirm with |
|--------------------------|--------------|
| The Payment Element in `VueStripeElements` | [`usePaymentIntent().confirmPayment`](/api/composables/use-payment-intent) or [`useSetupIntent().confirmSetup`](/api/composables/use-setup-intent) |
| Elements in a Checkout Session (`ui_mode: 'elements'`) | [`useCheckoutSession().confirm`](/api/composables/use-checkout-session) |
| The Checkout Form (`ui_mode: 'form'`) | [`useCheckoutForm().confirm`](/api/composables/use-checkout-form) |
| A single-purpose element (Card, IBAN, BECS), Stripe's bank modal, or a saved PaymentMethod | The [method confirmer](/api/composables/confirm/) for that payment method, such as `useConfirmCardPayment` or `useConfirmSepaDebitPayment` |
| Any of the above, with your **server** confirming | [`useCreateConfirmationToken`](/api/composables/use-create-confirmation-token), then [`useHandleNextAction`](/api/composables/use-handle-next-action) if Stripe asks for an action |

The Payment Element and the Checkout Sessions handle every payment method they show through one call. Stripe.js also has a separate confirm method for each payment method, such as `confirmCardPayment` or `confirmSepaDebitSetup`. Vue Stripe wraps all 46 of them as method confirmers. They exist for integrations that collect one payment method with its own element or form, or that charge a PaymentMethod saved earlier with no element at all. They take Stripe's arguments unchanged, so Stripe's documentation for each method applies as written.

## Why the Payment Element is submitted first

Stripe requires `elements.submit()` before it confirms details from the Payment Element (and before it creates a ConfirmationToken). Submitting validates every element in the group and shows field errors inline. It also collects what some payment methods need at the moment of the click, such as a wallet's payment sheet, which browsers allow only in direct response to a user gesture.

`usePaymentIntent()`, `useSetupIntent()` and `useCreateConfirmationToken()` call `submit()` for you, then confirm. If validation fails, they return the validation error as `{ error }` and don't confirm. You opt out with `skipSubmit: true` only when your own code already submitted. The usual reason is the deferred-Intent flow: submit the form, then ask your server to create the Intent, then confirm. Submitting first means the customer sees validation errors before your server does any work.

## Redirects

Some payment methods can't finish inside your page. Bank redirects such as iDEAL or Bancontact send the customer to their bank, and some wallets and buy-now-pay-later methods open the provider's own page. After the customer approves, Stripe sends the browser to the `return_url` you passed in `confirmParams`. It adds the Intent's ID, its client secret and a `redirect_status` to the URL.

Stripe.js's `redirect` option decides what happens for payment methods that don't need to leave:

- `'if_required'` (Vue Stripe's default) keeps the customer on your page when the payment method allows it. The promise resolves with the Intent, so your code shows the result.
- `'always'` sends every customer to `return_url`, even after a card payment. The page that `return_url` loads shows the result for every payment method.

With `'if_required'` you still need a `return_url` page, because some payment methods always redirect. That page reads the client secret from its URL and retrieves the Intent, for example with `usePaymentIntent().retrievePaymentIntent()`, before it shows a result. Checkout Sessions work the same way: `useCheckoutSession().confirm()` redirects to the session's return URL after success unless you pass `redirect: 'if_required'`.

A redirect means the confirming page is gone when the payment finishes, so code after the `await` may never run. Don't put order fulfilment there. Fulfil from a webhook, which arrives whether or not the customer comes back.

## Next actions

A bank can ask for more before it approves a payment. The most common case is 3D Secure authentication for a card. When confirmation runs in the browser, Stripe.js handles this inside the confirm call: it opens the bank's challenge in a modal, waits, and resolves with the final status. Your code sees one `await`.

When your server confirms, there is no browser call for Stripe to hold open. The Intent comes back to your server as `requires_action`. Your server sends its client secret to the browser, and [`useHandleNextAction`](/api/composables/use-handle-next-action) runs the same challenge there. [Confirm payments on your server](/guide/tokens#confirmationtoken-confirm-on-your-server) shows the whole round trip.

[`useHandleCardAction`](/api/composables/use-handle-card-action) belongs to Stripe's older manual-confirmation flow (`confirmation_method: 'manual'`), where the server confirms a second time after 3D Secure. It remains for existing integrations. New ones use `useHandleNextAction`.

## Payment methods that settle later

For a card, the bank answers within seconds, and confirmation returns `succeeded` or a decline. Other payment methods don't answer that quickly:

- **Bank debits** (SEPA Direct Debit, BECS Direct Debit, ACH Direct Debit) return `processing`. The debit is submitted to the banking network, and Stripe learns whether it succeeded only days later.
- **Vouchers** (OXXO, Boleto, Konbini) return `requires_action` with instructions for paying in cash or online. The Intent waits until the customer pays, or until the voucher expires.
- **ACH with micro-deposits**: when the customer types account details instead of logging in to their bank, Stripe sends two small deposits. The Intent waits until the customer enters the amounts through [`useVerifyMicrodepositsForPayment`](/api/composables/use-verify-microdeposits-for-payment).

For these methods, a successful confirm call means "accepted for processing", not "paid". Show the customer that the payment is on its way, and act on the `payment_intent.succeeded` or `payment_intent.payment_failed` webhook. [Payment objects](/guide/payment-objects#payments-that-settle-later) explains why settlement takes time and what mandates are for.

ACH Direct Debit and Canadian pre-authorized debits also differ in how the details are collected. The bank account is linked in Stripe's Financial Connections modal ([`useFinancialConnections`](/api/composables/use-financial-connections)) instead of an element. The customer then accepts a mandate, and only then is the Intent confirmed with `useConfirmUsBankAccountPayment`. The [ACH Direct Debit demo](/live-demo/ach-debit) runs the whole flow.

## Two error styles

The composables report failures in one of two ways, and the difference follows what each one wraps.

`usePaymentIntent`, `useSetupIntent`, `useCreatePaymentMethod`, `useHandleNextAction`, `useFinancialConnections` and `useIdentity` do more than pass a call through: they submit the form, choose an Elements group or check for the Stripe instance. They always **resolve**. A decline, a validation error, a missing Stripe instance and a thrown exception all come back as `{ error }`, so one `if (result.error)` check covers every failure.

The method confirmers and the other single-method composables (`useCreateToken`, `useCreateConfirmationToken`, `useHandleCardAction`, `useVerifyMicrodeposits*`, `useRadarSession`, `useEphemeralKeyNonce`) are thin wrappers that behave like the Stripe.js method they wrap. A decline resolves as `{ error }`, as it does in Stripe.js. Something Stripe.js throws, such as an invalid argument, **rejects**, and so does a call made before Stripe.js has loaded. Both cases also set the composable's `error` ref.

Either way, the `error` ref holds the latest message, so a template can show it without inspecting results. Inside `VueStripeProvider`, Stripe.js has always loaded by the time your component renders, so a "not loaded" error only happens in code outside it or with the plugin before the load finishes. The [method confirmer reference](/api/composables/confirm/#return-value) lists the exact contract.

## Related pages

- [Accept a payment with the Payment Element](/guide/payment-element): `usePaymentIntent` in a working form.
- [Confirm payments on your server](/guide/tokens): ConfirmationTokens and `useHandleNextAction`.
- [Save a payment method for later](/guide/setup-intent): `useSetupIntent`.
- [Method confirmers](/api/composables/confirm/): every `useConfirm<Method>` composable.
