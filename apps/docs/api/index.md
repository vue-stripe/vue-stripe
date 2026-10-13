---
description: "API reference for @vue-stripe/vue-stripe: every component, composable, plugin option and type, with compatibility for Vue 3, Vue 2.7 and Stripe.js 10."
---

# API reference

Every export of `@vue-stripe/vue-stripe`: components, composables, the plugin and types. To find the export that wraps a Stripe.js method or element, use [Stripe.js coverage](/coverage). Exported TypeScript types and the error classes are listed in [Types and errors](/api/types).

## Compatibility

| Requirement | Supported |
|-------------|-----------|
| Vue | `^2.7.0 \|\| ^3.0.0` (peer dependency). Vue 2.7 is tested in client-side apps; see [Use Vue Stripe on Vue 2.7](/guide/vue-2) |
| Stripe.js | `@stripe/stripe-js` `^10.0.0`, Stripe.js Endive (peer dependency) |
| Rendering | Client and server. Stripe.js loads only in the browser; during server rendering, components render their loading state and hydrate without mismatches. `<ClientOnly>` is optional. See [Use Vue Stripe with Nuxt and SSR](/guide/ssr) |
| Module formats | ES, CommonJS and UMD builds; TypeScript declarations included |
| Stylesheet | `@vue-stripe/vue-stripe/style.css`, imported once per app |

## Components

### Provider components

| Component | Description |
|-----------|-------------|
| [VueStripeProvider](/api/components/stripe-provider) | Loads Stripe.js and provides the `Stripe` instance |
| [VueStripeElements](/api/components/stripe-elements) | Creates a `StripeElements` instance and provides it to element components |

### Element components

| Component | Description |
|-----------|-------------|
| [VueStripePaymentElement](/api/components/stripe-payment-element) | Payment Element: cards, wallets, bank debits and local payment methods |
| [VueStripeExpressCheckoutElement](/api/components/stripe-express-checkout-element) | Express Checkout Element: Apple Pay, Google Pay, Link and other wallet buttons |
| [VueStripeCardElement](/api/components/stripe-card-element) | Card Element: number, expiry and CVC in one field |
| [Split Card Elements](/api/components/stripe-split-card-elements) | `VueStripeCardNumberElement`, `VueStripeCardExpiryElement`, `VueStripeCardCvcElement` |
| [VueStripeAddressElement](/api/components/stripe-address-element) | Address Element: shipping or billing address |
| [VueStripeLinkAuthenticationElement](/api/components/stripe-link-authentication-element) | Link Authentication Element: email and Link sign-in |
| [VueStripePaymentMethodMessagingElement](/api/components/stripe-payment-method-messaging-element) | Payment Method Messaging Element: buy-now-pay-later messaging |
| [VueStripeTaxIdElement](/api/components/stripe-tax-id-element) | Tax ID Element: business name and tax ID (Checkout Sessions) |
| [VueStripeCurrencySelectorElement](/api/components/stripe-currency-selector-element) | Currency Selector Element (Checkout Sessions, Adaptive Pricing) |
| [VueStripeContactDetailsElement](/api/components/stripe-contact-details-element) | Contact Details Element: customer email (Checkout Sessions or Elements) |
| [VueStripeTermsElement](/api/components/stripe-terms-element) | Terms Element: terms the customer accepts (Stripe beta) |
| [VueStripeLinkSignupElement](/api/components/stripe-link-signup-element) | Link Signup Element: save details to Link (Stripe beta) |

### Regional elements

| Component | Description |
|-----------|-------------|
| [VueStripeIbanElement](/api/components/stripe-iban-element) | IBAN Element: SEPA Direct Debit |
| [VueStripeAuBankAccountElement](/api/components/stripe-au-bank-account-element) | AU Bank Account Element: BECS Direct Debit (Australia) |

Stripe.js Clover (8.0) removed the standalone iDEAL, P24, EPS and FPX elements. The Payment Element collects these payment methods.

### Issuing elements

| Component | Description |
|-----------|-------------|
| [Issuing Elements](/api/components/stripe-issuing-elements) | `VueStripeIssuingCardNumberDisplayElement`, `...CvcDisplayElement`, `...ExpiryDisplayElement`, `...PinDisplayElement`, `...CopyButtonElement`, `...AddToWalletButtonElement`: issued card details in Stripe-hosted iframes |

### Checkout and subscriptions

| Component | Description |
|-----------|-------------|
| [VueStripeCheckout](/api/components/stripe-checkout) | Redirects to Stripe Checkout (Checkout Session URL) |
| [VueStripeEmbeddedCheckout](/api/components/stripe-embedded-checkout) | Embedded Checkout (`stripe.createEmbeddedCheckoutPage()`) |
| [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) | Checkout Elements SDK: Elements on a Checkout Session. `VueStripeCheckoutProvider` is a deprecated alias. |
| [VueStripeCheckoutFormProvider](/api/components/stripe-checkout-form-provider) | Checkout Form SDK, `ui_mode: 'form'` (beta, requires Stripe access) |
| [VueStripeCheckoutForm](/api/components/stripe-checkout-form) | Checkout Form: Stripe's complete checkout form in one element (beta, requires Stripe access) |
| [VueStripePricingTable](/api/components/stripe-pricing-table) | Embedded Stripe pricing table |

### Disclosures

| Component | Description |
|-----------|-------------|
| [VueStripeFinancialAccountDisclosure](/api/components/stripe-financial-account-disclosure) | Legal text for Financial Accounts for platforms |
| [VueStripeIssuingDisclosure](/api/components/stripe-issuing-disclosure) | Legal text for Issuing card programs |
| [VueStripeTreasuryDisclosure](/api/components/stripe-treasury-disclosure) | Legal text for Treasury financial accounts |

## Composables

| Composable | Description |
|------------|-------------|
| [useStripe](/api/composables/use-stripe) | The `Stripe` instance and its loading and error state |
| [useStripeElements](/api/composables/use-stripe-elements) | The `StripeElements` instance, `getElement`, `submit` and `fetchUpdates` |
| [usePaymentIntent](/api/composables/use-payment-intent) | `stripe.confirmPayment()` with the Elements group; runs `elements.submit()` first |
| [useSetupIntent](/api/composables/use-setup-intent) | `stripe.confirmSetup()` with the Elements group; runs `elements.submit()` first |
| [useStripeCheckout](/api/composables/use-stripe-checkout) | Redirects to Stripe Checkout (alias: `useCheckout`) |
| [useCheckoutSession](/api/composables/use-checkout-session) | Checkout Session state and actions inside `VueStripeCheckoutElementsProvider` |
| [useCheckoutForm](/api/composables/use-checkout-form) | Checkout Form state, session and confirm inside `VueStripeCheckoutFormProvider` (beta) |
| [useCreatePaymentMethod](/api/composables/use-create-payment-method) | `stripe.createPaymentMethod()` |
| [useHandleNextAction](/api/composables/use-handle-next-action) | `stripe.handleNextAction()`: 3D Secure and other next actions |
| [useCreateConfirmationToken](/api/composables/use-create-confirmation-token) | `stripe.createConfirmationToken()` from the Payment Element |
| [useCreateToken](/api/composables/use-create-token) | `stripe.createToken()`: card, bank account, PII, Connect account or person |
| [useHandleCardAction](/api/composables/use-handle-card-action) | `stripe.handleCardAction()` for manually confirmed PaymentIntents (legacy) |
| [useVerifyMicrodepositsForPayment](/api/composables/use-verify-microdeposits-for-payment) | `stripe.verifyMicrodepositsForPayment()` |
| [useVerifyMicrodepositsForSetup](/api/composables/use-verify-microdeposits-for-setup) | `stripe.verifyMicrodepositsForSetup()` |
| [useRadarSession](/api/composables/use-radar-session) | `stripe.createRadarSession()` |
| [useEphemeralKeyNonce](/api/composables/use-ephemeral-key-nonce) | `stripe.createEphemeralKeyNonce()` for Issuing elements |
| [useFinancialConnections](/api/composables/use-financial-connections) | Financial Connections and US bank account collection |
| [useIdentity](/api/composables/use-identity) | `stripe.verifyIdentity()`: the Stripe Identity modal |
| [usePaymentRequest](/api/composables/use-payment-request) | `stripe.paymentRequest()` behind your own button |

### Method confirmers

One composable per Stripe.js `confirm<Method>Payment` and `confirm<Method>Setup` method, such as `useConfirmCardPayment` and `useConfirmSepaDebitSetup`. The [method confirmers overview](/api/composables/confirm/) lists all of them and their shared return value.

| Page | Payment methods |
|------|-----------------|
| [Cards](/api/composables/confirm/cards) | Card |
| [Bank debits](/api/composables/confirm/bank-debits) | ACSS, AU BECS, Bacs, SEPA, US bank account |
| [Redirects and bank transfers](/api/composables/confirm/redirects) | Bancontact, EPS, FPX, giropay, iDEAL, Przelewy24, Sofort, Pay by Bank, Multibanco, customer balance |
| [Wallets](/api/composables/confirm/wallets) | Alipay, Amazon Pay, BLIK, Cash App Pay, GrabPay, MobilePay, PayNow, PayPal, Pix, PromptPay, TWINT, WeChat Pay |
| [Buy now, pay later](/api/composables/confirm/bnpl) | Affirm, Afterpay / Clearpay, Billie, Klarna |
| [Vouchers](/api/composables/confirm/vouchers) | Boleto, Konbini, OXXO |

## Plugin

| Export | Description |
|--------|-------------|
| [createVueStripe](/api/plugin) | Vue plugin that provides Stripe to the whole app, in place of `VueStripeProvider` |
| `loadStripe` | The `@stripe/stripe-js/pure` loader, with the same signature and `setLoadParameters`, sharing one Stripe.js load with every provider on the page. See [How Stripe.js is loaded](/guide/stripe-js-loading#one-script-many-instances) |
