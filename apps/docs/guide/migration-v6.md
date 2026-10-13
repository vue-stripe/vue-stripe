# Migrating from v5 to v6

Vue Stripe 6 moves to Stripe.js 10 (API version Endive). Most changes follow Stripe: elements and methods that Stripe removed are gone here too, and Checkout Sessions with Elements use the new Checkout Elements SDK. Each component is now a render function, so the same build runs on Vue 2.7 and Vue 3.

For most apps, the upgrade takes three steps:

1. Update the packages and import the stylesheet.
2. Replace the components and props listed below that Stripe removed.
3. If you use `VueStripeCheckoutProvider`, move to `VueStripeCheckoutElementsProvider` and session `actions`.

## Install

```bash
npm install @vue-stripe/vue-stripe@^6 @stripe/stripe-js@^10
```

::: tip v6 is in beta
Until 6.0.0 is released, v6 is published under the `beta` tag: `npm install @vue-stripe/vue-stripe@beta @stripe/stripe-js@^10`.
:::

```ts
// main.ts: once, anywhere before the components render
import '@vue-stripe/vue-stripe/style.css'
```

v5 had no stylesheet export. v6 ships the component styles as `style.css`; without it, the loading and error states and the element wrappers are unstyled.

## Breaking Changes

| v5.x | v6.0 | Why |
|------|------|-----|
| `@stripe/stripe-js` `^7.5 \|\| ^8.5` | `^10.0.0` | Stripe.js Endive |
| `vue` `^2.6 \|\| ^3` | `^2.7 \|\| ^3` | v6 relies on `expose` and `useSlots`; Vue 2.6 is end-of-life |
| No stylesheet export | `import '@vue-stripe/vue-stripe/style.css'` | Render-function components carry no styles of their own |
| `VueStripeIdealBankElement`, `VueStripeP24BankElement`, `VueStripeEpsBankElement`, `VueStripeFpxBankElement` | `VueStripePaymentElement` | Stripe removed these elements (Clover) |
| `<VueStripeElements :payment-method-types>` | Mode-based flow: `:options="{ allowedPaymentMethodTypes }"`. `clientSecret` flow: `payment_method_types` on the Intent, or Dashboard settings | Stripe removed the option (Endive) |
| `@loaderstop` on `VueStripePaymentElement` | Removed | Stripe never emitted this event |
| `@loadError` on `VueStripeAddressElement` | `@loaderror` | Same casing as Stripe and the other elements |
| `<VueStripeCheckout :session-id>` / `:price-id` (with `mode`, `success-url`, `cancel-url`, `customer-email`, ...) | `<VueStripeCheckout :session-url>` | Stripe removed `redirectToCheckout({ sessionId })` (Clover) |
| `useStripeCheckout().redirectToCheckout({ sessionId })` / `({ lineItems, ... })`, `LegacyCheckoutOptions` | `redirectToCheckout({ url })` or `redirectToUrl(url)` | Same |
| `<VueStripeCheckoutProvider :client-secret="string">` | `<VueStripeCheckoutElementsProvider :client-secret="stringOrPromise">`. The old name is a deprecated alias, and `fetchClientSecret` is still accepted | `initCheckout` became `initCheckoutElementsSdk` |
| `VueStripeCheckoutProvider` `@ready(checkout)` | `@ready(actions)`, plus a new `@change(session)` | Session methods moved to `loadActions()` |
| `useCheckoutSession().checkout` is a `StripeCheckout` with the session methods | `checkout` is a `StripeCheckoutElementsSdk`; session methods are on `actions` (and still forwarded by `useCheckoutSession()`) | Same |
| Checkout Session `ui_mode: 'custom'` | `ui_mode: 'elements'` | Stripe's name in current API versions |
| `StripeCheckout` type | `StripeCheckoutElementsSdk` / `StripeCheckoutLoadActionsSuccess` from `@stripe/stripe-js` | Same |
| `VueStripeLoadError`, `createVueStripeError` | Removed | Never thrown by the library |
| Address `state` formatted for the locale | Latin characters by default; `getValue({ format: 'localized' })` for the old behaviour | Stripe changed the default (Dahlia) |
| Link Authentication markup: `vue-stripe-link-auth-element`, `vue-stripe-link-auth-loading` | `vue-stripe-link-auth-mount`, `vue-stripe-link-auth-loader` | All elements now share one markup (see below) |

### `allowedPaymentMethodTypes` is for mode-based Elements only

`allowedPaymentMethodTypes` works when `VueStripeElements` gets `mode` / `currency` / `amount` instead of a client secret, and in `elements.update()`. With a `clientSecret`, Stripe reads the payment methods from the Intent, so set `payment_method_types` on the PaymentIntent or SetupIntent on your server, or manage them in the Dashboard.

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

### Hosted Checkout takes a URL

Create the session on your server and pass its `url`:

```vue
<!-- v5 -->
<VueStripeCheckout :session-id="sessionId" />

<!-- v6 -->
<VueStripeCheckout :session-url="session.url" />
```

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

Inside the provider, `useCheckoutSession()` keeps the v5 method names (`confirm`, `applyPromotionCode`, `updateEmail`, ...), so most forms only need the rename. A session created with `return_url` must be confirmed **without** `returnUrl`; Stripe rejects a second one. See the [Custom Checkout guide](/guide/custom-checkout).

## New in v6

These are additive and need no changes.

- **Events**
  - Payment: `@availablepaymentmethodschange`, `@carddetailschange`, `@savedpaymentmethodupdate`, `@savedpaymentmethodremove`; `collapse()` on the template ref
  - Express Checkout: `@availablepaymentmethodschange`, `@focus`, `@blur`, `@escape`
  - Card: `@networkschange`, `@loaderror`
  - Address and Link Authentication: `@loaderstart`
- **Elements**: [`VueStripeTaxIdElement`](/api/components/stripe-tax-id-element) and [`VueStripeCurrencySelectorElement`](/api/components/stripe-currency-selector-element), for Checkout Sessions.
- **Checkout Sessions**
  - Provider props `adaptivePricing` and `defaultValues`
  - New `useCheckoutSession()` actions: `validateElements`, `addOptionalLineItem`, `removeOptionalLineItem`, `loadFonts`
- **Providers**: `betas` and any other `loadStripe` option on `VueStripeProvider`.
- **Elements group**: `fetchUpdates()` on `useStripeElements()`.
- **Next actions**: `useHandleNextAction()` accepts `{ hashedValue }` as well as `{ clientSecret }`.
- **Types**: results are typed (`ConfirmPaymentResult`, `ConfirmSetupResult`, `CreatePaymentMethodResult`, `HandleNextActionResult`) instead of `any`.

## One Markup for Every Element

Every element component now renders the same structure, so a single stylesheet covers all of them:

```html
<div class="vue-stripe-payment-element vue-stripe-element">
  <div class="vue-stripe-payment-element-error vue-stripe-element-error">...</div>
  <div class="vue-stripe-payment-element-mount vue-stripe-element-mount"></div>
  <div class="vue-stripe-payment-element-loader vue-stripe-element-loader">...</div>
</div>
```

The element-specific classes match v5 for every element except Link Authentication (see the table). The `vue-stripe-element*` classes are new and apply to all elements. Every element also has `#loading` and `#error` slots and exposes `element`, `loading`, `error`, `focus()`, `blur()` and `clear()` on its template ref.

## Vue 2.7

Vue 2.7 now runs the same build as Vue 3, and CI tests it. Vue 2.6 is no longer supported; upgrade to 2.7 first. See [Installation](/guide/installation#vue-2-7).

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
