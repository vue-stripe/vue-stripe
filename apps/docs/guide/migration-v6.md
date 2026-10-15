---
description: "Upgrade a Vue Stripe 5 app to Vue Stripe 6 and Stripe.js 10 (Endive): removed elements and props, the Checkout Elements SDK and new requirements."
---

# Upgrade from v5 to v6

Move a working Vue Stripe 5 app to Vue Stripe 6, which runs on Stripe.js 10 (API version Endive). Most breaking changes follow Stripe: elements and methods that Stripe removed are gone here too, and Checkout Sessions with Elements use the new Checkout Elements SDK.

## Before you begin

- Your app runs on Vue 2.7 or Vue 3. Vue 2.6 is no longer supported; upgrade to 2.7 first (see [Use Vue Stripe on Vue 2.7](/guide/vue-2)).
- Note which Vue Stripe components, props and composables your app uses, so you can match them against the table in step 3.
- Find the server routes that create PaymentIntents, SetupIntents or Checkout Sessions, and the version of your server's Stripe library. Step 4 updates them.

## 1. Update the packages

```bash
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10
```

::: tip v6 is in beta
The range `^6.0.0-beta.2` installs the latest beta until 6.0.0 is released, then the latest 6.x. A plain `@^6` matches no version during the beta.
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
| Server: `payment_method_types` when creating PaymentIntents, SetupIntents and Checkout Sessions | `allowed_payment_method_types`, or no parameter so your Dashboard settings decide (step 4) | Stripe removed the parameter (Endive) |
| `@loaderstop` on `VueStripePaymentElement` | Removed | Stripe never emitted this event |
| `@loadError` on `VueStripeAddressElement` | `@loaderror` | Same casing as Stripe and the other elements |
| `<VueStripeCheckout :session-id>` / `:price-id` (with `mode`, `success-url`, `cancel-url`, `customer-email`, ...) | `<VueStripeCheckout :session-url>` | Stripe removed `redirectToCheckout({ sessionId })` (Clover) |
| `useStripeCheckout().redirectToCheckout({ sessionId })` / `({ lineItems, ... })`, `LegacyCheckoutOptions` | `redirectToCheckout({ url })` (typed `CheckoutRedirectOptions`) or `redirectToUrl(url)` | Same |
| `<VueStripeCheckoutProvider :client-secret="string">` | `<VueStripeCheckoutElementsProvider :client-secret="stringOrPromise">`. The old name is a deprecated alias, and `fetchClientSecret` is still accepted | `initCheckout` became `initCheckoutElementsSdk` |
| `VueStripeCheckoutProvider` `@ready(checkout)` | `@ready(actions)`, plus a new `@change(session)` | Session methods moved to `loadActions()` |
| `useCheckoutSession().checkout` is a `StripeCheckout` with the session methods | `checkout` is a `StripeCheckoutElementsSdk`; session methods are on `actions` (and still forwarded by `useCheckoutSession()`) | Same |
| Checkout Session `ui_mode: 'custom'` | `ui_mode: 'elements'`, which needs API version `2026-03-25.dahlia` or later on your server (step 4) | Stripe renamed the value (Dahlia) |
| `StripeCheckout` type | `StripeCheckoutElementsSdk` / `StripeCheckoutLoadActionsSuccess` from `@stripe/stripe-js` | Same |
| `VueStripeLoadError`, `createVueStripeError` | Removed; catch the typed error classes (`VueStripeProviderError`, `VueStripeElementsError`, `VueStripeCheckoutError`) | Never thrown by the library |
| Address `state` formatted for the locale | Latin characters by default; `getValue({ format: 'localized' })` for the old behaviour | Stripe changed the default (Dahlia) |
| Link Authentication markup: `vue-stripe-link-auth-element`, `vue-stripe-link-auth-loading` | `vue-stripe-link-auth-mount`, `vue-stripe-link-auth-loader` | All elements now share one markup (step 5) |

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

Create the session on your server and pass its `url`. Session settings that were props in v5 move to `stripe.checkout.sessions.create()` on your server: `line_items`, `mode`, `success_url`, `cancel_url`, `customer_email`, `client_reference_id` and `submit_type`. If your session code passes `payment_method_types`, step 4 replaces it. `VueStripeCheckout` no longer needs `VueStripeProvider` around it.

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

## 4. Update your server

The v6 guides write their server code for the Node.js `stripe` package 23, which uses API version `2026-09-30.endive`, the same release train as Stripe.js 10. A v5 server usually runs an older package on a Clover API version (`stripe` 19 uses `2025-10-29.clover`), and two of its calls break on the way to Endive. Make these changes in this order:

1. **Replace `payment_method_types`.** Endive rejects it when you create a PaymentIntent, SetupIntent or Checkout Session: "The `payment_method_types` parameter is no longer supported". Pass the same list as `allowed_payment_method_types`, or drop the parameter so your [Dashboard payment method settings](https://dashboard.stripe.com/settings/payment_methods) decide. Clover already accepts `allowed_payment_method_types`, so you can deploy this change before the others.

   ```js
   // v5
   const setupIntent = await stripe.setupIntents.create({ payment_method_types: ['card'] })

   // v6
   const setupIntent = await stripe.setupIntents.create({ allowed_payment_method_types: ['card'] })
   ```

2. **Upgrade the `stripe` package and rename `ui_mode` in the same change.** Run `npm install stripe@^23`. Clover rejects `ui_mode: 'elements'` ("you must upgrade to Stripe API version 2026-03-25.dahlia"), and Dahlia and later reject `ui_mode: 'custom'` ("Use `elements` instead"), so neither value works on both sides of the upgrade. The same goes for `ui_mode: 'embedded'`, which became `'embedded_page'`. If your code pins a version with `new Stripe(key, { apiVersion })`, set it to `'2026-09-30.endive'` or remove it. On another server language, upgrade its Stripe library to a release that uses `2026-09-30.endive`.

3. **Check the rest of your server code.** The move from Clover to Endive crosses the Dahlia and Endive API releases. Stripe's [API changelog](https://docs.stripe.com/changelog) lists their breaking changes, and the `stripe` package's [changelog](https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md) lists changes to its own methods and types.

The browser side accepts sessions from either server version: v5 confirms a `ui_mode: 'elements'` session, and v6 confirms a `ui_mode: 'custom'` session. You can deploy the browser and server changes in either order.

## 5. Check your CSS

Every element component now renders the same markup: a `vue-stripe-<name>-element` wrapper with `-error`, `-mount` and `-loader` children, plus shared `vue-stripe-element*` classes. The element-specific class names match v5 for every element except Link Authentication (see the last row of the table). If your CSS targets the old Link Authentication classes, rename them.

## Checklist

- [ ] `@stripe/stripe-js` is `^10`, `vue` is `^2.7` or `^3`
- [ ] `@vue-stripe/vue-stripe/style.css` is imported once
- [ ] No iDEAL / P24 / EPS / FPX element components remain; the Payment Element collects those methods
- [ ] No `payment-method-types` prop on `VueStripeElements`
- [ ] `VueStripeCheckout` gets `session-url`; the server creates the session
- [ ] `VueStripeCheckoutProvider` is renamed, and its `@ready` handler takes `actions`
- [ ] The server sends no `payment_method_types`
- [ ] The server runs `stripe` 23 (API version `2026-09-30.endive`) and creates Checkout Sessions with `ui_mode: 'elements'`
- [ ] `@loadError` became `@loaderror`; `@loaderstop` is gone
- [ ] CSS that targets `vue-stripe-link-auth-element` / `-loading` uses `-mount` / `-loader`

v6 also adds events, elements and composable actions that need no changes; see the [release notes](https://github.com/vue-stripe/vue-stripe/releases).
