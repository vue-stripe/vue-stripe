---
description: "Upgrade a Vue Stripe 5 app to Vue Stripe 6 and Stripe.js 10 (Endive): removed elements and props, the Checkout Elements SDK and new requirements."
---

# Upgrade from v5 to v6

Move a working Vue Stripe 5 app to Vue Stripe 6, which runs on Stripe.js 10 (API version Endive). Most breaking changes follow Stripe: elements and methods that Stripe removed are gone here too, and Checkout Sessions with Elements use the new Checkout Elements SDK.

## Before you begin

- Your app runs on Vue 2.7 or Vue 3. Vue 2.6 is no longer supported; upgrade to 2.7 first (see [Use Vue Stripe on Vue 2.7](/guide/vue-2)).
- Note which Vue Stripe components, props and composables your app uses, so you can match them against the table in step 3.

## 1. Update the packages

```bash
npm install @vue-stripe/vue-stripe@^6 @stripe/stripe-js@^10
```

::: tip v6 is in beta
Until 6.0.0 is released, v6 is published under the `beta` tag: `npm install @vue-stripe/vue-stripe@beta @stripe/stripe-js@^10`.
:::

## 2. Import the stylesheet

v5 had no stylesheet export. v6 ships the component styles as `style.css`; without it, the loading and error states and the element wrappers are unstyled.

```ts
// main.ts: once, anywhere before the components render
import '@vue-stripe/vue-stripe/style.css'
```

## 3. Replace what changed

Work through the table row by row. The last column gives the reason in short; [Stripe.js versions](/guide/stripe-js-versions) has the background for each Stripe-driven change.

| v5.x | v6.0 | Reason |
|------|------|--------|
| `@stripe/stripe-js` `^7.5 \|\| ^8.5` | `^10.0.0` | Stripe.js Endive |
| `vue` `^2.6 \|\| ^3` | `^2.7 \|\| ^3` | v6 relies on `expose` and `useSlots`; Vue 2.6 is end-of-life |
| No stylesheet export | `import '@vue-stripe/vue-stripe/style.css'` | Render-function components carry no styles of their own |
| `VueStripeIdealBankElement`, `VueStripeP24BankElement`, `VueStripeEpsBankElement`, `VueStripeFpxBankElement` | `VueStripePaymentElement` | Stripe removed these elements (Clover) |
| `<VueStripeElements :payment-method-types>` | Mode-based flow: `:options="{ allowedPaymentMethodTypes }"`. `clientSecret` flow: `allowed_payment_method_types` on the Intent, or Dashboard settings | Stripe removed the option (Endive) |
| `@loaderstop` on `VueStripePaymentElement` | Removed | Stripe never emitted this event |
| `@loadError` on `VueStripeAddressElement` | `@loaderror` | Same casing as Stripe and the other elements |
| `<VueStripeCheckout :session-id>` / `:price-id` (with `mode`, `success-url`, `cancel-url`, `customer-email`, ...) | `<VueStripeCheckout :session-url>` | Stripe removed `redirectToCheckout({ sessionId })` (Clover) |
| `useStripeCheckout().redirectToCheckout({ sessionId })` / `({ lineItems, ... })`, `LegacyCheckoutOptions` | `redirectToCheckout({ url })` (typed `CheckoutRedirectOptions`) or `redirectToUrl(url)` | Same |
| `<VueStripeCheckoutProvider :client-secret="string">` | `<VueStripeCheckoutElementsProvider :client-secret="stringOrPromise">`. The old name is a deprecated alias, and `fetchClientSecret` is still accepted | `initCheckout` became `initCheckoutElementsSdk` |
| `VueStripeCheckoutProvider` `@ready(checkout)` | `@ready(actions)`, plus a new `@change(session)` | Session methods moved to `loadActions()` |
| `useCheckoutSession().checkout` is a `StripeCheckout` with the session methods | `checkout` is a `StripeCheckoutElementsSdk`; session methods are on `actions` (and still forwarded by `useCheckoutSession()`) | Same |
| Checkout Session `ui_mode: 'custom'` | `ui_mode: 'elements'` | Stripe's name in current API versions |
| `StripeCheckout` type | `StripeCheckoutElementsSdk` / `StripeCheckoutLoadActionsSuccess` from `@stripe/stripe-js` | Same |
| `VueStripeLoadError`, `createVueStripeError` | Removed; catch the typed error classes (`VueStripeProviderError`, `VueStripeElementsError`, `VueStripeCheckoutError`) | Never thrown by the library |
| Address `state` formatted for the locale | Latin characters by default; `getValue({ format: 'localized' })` for the old behaviour | Stripe changed the default (Dahlia) |
| Link Authentication markup: `vue-stripe-link-auth-element`, `vue-stripe-link-auth-loading` | `vue-stripe-link-auth-mount`, `vue-stripe-link-auth-loader` | All elements now share one markup (step 4) |

### Payment method types on `VueStripeElements`

`allowedPaymentMethodTypes` works when `VueStripeElements` gets `mode` / `currency` / `amount` instead of a client secret, and in `elements.update()`. With a `clientSecret`, Stripe reads the payment methods from the Intent, so set `allowed_payment_method_types` on the PaymentIntent or SetupIntent on your server, or manage them in the Dashboard.

```vue
<!-- v5 -->
<VueStripeElements :client-secret="clientSecret" :payment-method-types="['card', 'klarna']">

<!-- v6, mode-based -->
<VueStripeElements
  mode="payment"
  currency="usd"
  :amount="1099"
  :options="{ allowedPaymentMethodTypes: ['card', 'klarna'] }"
>
```

### Hosted Checkout

Create the session on your server and pass its `url`. Session settings that were props in v5 move to `stripe.checkout.sessions.create()` on your server: `line_items`, `mode`, `success_url`, `cancel_url`, `customer_email`, `client_reference_id` and `submit_type`. `VueStripeCheckout` no longer needs `VueStripeProvider` around it.

```vue
<!-- v5 -->
<VueStripeCheckout :session-id="sessionId" />

<!-- v6 -->
<VueStripeCheckout :session-url="session.url" />
```

See [Redirect to Stripe Checkout](/guide/checkout) for the server code.

### Checkout Sessions with Elements

```vue
<!-- v5 -->
<VueStripeCheckoutProvider :client-secret="clientSecret" @ready="(checkout) => ...">

<!-- v6 -->
<VueStripeCheckoutElementsProvider
  :client-secret="clientSecretPromise"
  @ready="(actions) => ..."
>
```

Inside the provider, `useCheckoutSession()` keeps the v5 method names (`confirm`, `applyPromotionCode`, `updateEmail`, ...), so most forms only need the rename. A session created with `return_url` must be confirmed without `returnUrl`; Stripe rejects a second one. See [Build your own checkout page on a Checkout Session](/guide/custom-checkout).

## 4. Check your CSS

Every element component now renders the same markup: a `vue-stripe-<name>-element` wrapper with `-error`, `-mount` and `-loader` children, plus shared `vue-stripe-element*` classes. The element-specific class names match v5 for every element except Link Authentication (see the last row of the table). If your CSS targets the old Link Authentication classes, rename them.

## Checklist

- [ ] `@stripe/stripe-js` is `^10`, `vue` is `^2.7` or `^3`
- [ ] `@vue-stripe/vue-stripe/style.css` is imported once
- [ ] No iDEAL / P24 / EPS / FPX element components remain; the Payment Element collects those methods
- [ ] No `payment-method-types` prop on `VueStripeElements`
- [ ] `VueStripeCheckout` gets `session-url`; the server creates the session
- [ ] `VueStripeCheckoutProvider` is renamed, and its `@ready` handler takes `actions`
- [ ] Checkout Sessions are created with `ui_mode: 'elements'`
- [ ] `@loadError` became `@loaderror`; `@loaderstop` is gone
- [ ] CSS that targets `vue-stripe-link-auth-element` / `-loading` uses `-mount` / `-loader`

v6 also adds events, elements and composable actions that need no changes; see the [release notes](https://github.com/vue-stripe/vue-stripe/releases).
