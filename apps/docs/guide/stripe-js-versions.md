---
description: "How Stripe versions Stripe.js (Basil, Clover, Dahlia, Endive), what each release changed for Vue apps, and why some Vue Stripe 5 components are gone."
---

# Stripe.js versions and what v6 changed

Vue Stripe 6 runs on Stripe.js 10, the Endive release. Vue Stripe 5 ran on Basil and Clover. Stripe has shipped two more trains since Clover, Dahlia and Endive, and Clover itself removed several things v5 still offered on Basil. This page explains how Stripe versions Stripe.js, what each recent train changed that matters to a Vue Stripe app, and why some v5 components and props are gone.

For the upgrade steps, see [Upgrade from v5 to v6](/guide/migration-v6).

## How Stripe versions Stripe.js

For years Stripe.js was a single evergreen script, `js.stripe.com/v3`. Stripe now also ships it in named **release trains**, two a year, alongside its API releases. Within a train, Stripe only makes changes that don't break integrations, and those reach every page automatically. Breaking changes, such as a removed element, a removed method or a changed default, wait for the next train. Each train also has its own server API versions, and Stripe recommends keeping your server on the same train as Stripe.js.

Each major version of the `@stripe/stripe-js` npm package loads exactly one train. Its types describe that train and no other:

| Train | `@stripe/stripe-js` | First API version | Vue Stripe |
|-------|---------------------|-------------------|------------|
| Acacia | 6 | `2024-12-18.acacia` | |
| Basil | 7 | `2025-03-31.basil` | 5 (`^7.5`) |
| Clover | 8 | `2025-09-30.clover` | 5 (`^8.5`) |
| Dahlia | 9 | `2026-03-25.dahlia` | |
| Endive | 10 | `2026-09-30.endive` | 6 (`^10.0.0`) |

Vue Stripe's components and composables are typed against `@stripe/stripe-js`, and its tests check every element's events against the installed type declarations. So a Vue Stripe major release supports one `@stripe/stripe-js` major, and a new train means a new Vue Stripe major. [How Stripe.js is loaded](/guide/stripe-js-loading#release-trains) explains the loading side of this.

## Why removed features leave Vue Stripe too

When a train removes an element or a method, the Stripe.js script on that train no longer has it. A Vue component wrapping it would compile, then fail at runtime with an error from inside Stripe.js. Vue Stripe removes the wrapper instead, in the same major release that moves to the train. The import then fails at build time, and the migration guide names the replacement. The [Stripe.js coverage page](/coverage) lists each removed API as deprecated, next to what replaces it.

## Clover

Clover is the train with the most visible effect on v5 apps, because v5 kept components that worked only on Basil.

**The standalone iDEAL, P24, EPS and FPX bank elements are gone.** Stripe removed the `idealBank`, `p24Bank`, `epsBank` and `fpxBank` elements, and v6 removes `VueStripeIdealBankElement` and its three siblings. The Payment Element collects these payment methods now. It shows them when the Intent's currency and the customer's location fit, and it handles the redirect to the bank. The method confirmers remain (`useConfirmIdealPayment`, `useConfirmP24Payment` and so on), because Stripe kept `confirmIdealPayment()` and the others. Use them for a button that starts one bank redirect without collecting a bank in a form.

**The Affirm and Afterpay message elements are gone.** The Payment Method Messaging Element replaces both, with one element for every buy-now-pay-later provider.

**`stripe.redirectToCheckout()` is gone.** The browser could once start hosted Checkout from a session ID, or create the session itself from price IDs and line items. With the method removed, the server always creates the session and returns its `url`, and the browser follows that URL. One consequence is that prices and line items always come from your server. `VueStripeCheckout` therefore takes a `session-url` instead of `session-id` or `price-id`, and `useStripeCheckout().redirectToCheckout()` takes `{ url }`. The redirect is now a plain navigation, so hosted Checkout needs no `VueStripeProvider` at all.

**Elements with Checkout Sessions starts synchronously.** Stripe.js now creates the Checkout SDK synchronously, and the session's actions (`confirm`, `applyPromotionCode` and the rest) arrive later from a separate `loadActions()` call. The client secret can be a string or a Promise. This lets elements mount and show Stripe's skeleton loaders while the session loads. `VueStripeCheckoutElementsProvider` follows that design: it renders its children immediately, and its `@ready` event passes the actions. Saved payment methods also appear in the Payment Element automatically when the session is configured for them. By Stripe.js 10 the method is named `initCheckoutElementsSdk()`, which is why v6 renames `VueStripeCheckoutProvider` to `VueStripeCheckoutElementsProvider` and keeps the old name as an alias.

## Dahlia

Dahlia changed details rather than removing components:

- **`elements.update()` returns a Promise.** `VueStripeElements` waits for it when `appearance` or `locale` changes, and a rejected update now shows up in the component's error state.
- **The Address Element returns the state in Latin characters by default.** A Japanese prefecture, for example, comes back romanized. `getValue({ format: 'localized' })` restores the old behaviour.
- **Embedded Checkout has a new method name.** `initEmbeddedCheckout()` became `createEmbeddedCheckoutPage()`. `VueStripeEmbeddedCheckout` calls the new method for sessions created with `ui_mode: 'embedded_page'`.
- **The Sources API methods are gone** (`createSource`, `retrieveSource`). Vue Stripe never wrapped them, and PaymentMethods replace them.

The Checkout Form (`ui_mode: 'form'`, a Stripe beta) needs API version `2026-03-25.dahlia` or later on the server.

## Endive

Endive removed two more things:

- **The Payment Request Button element is gone.** The Express Checkout Element replaces it. It shows Apple Pay, Google Pay, Link and other wallets as separate buttons. The `stripe.paymentRequest()` object survives, for a wallet sheet behind your own button, and [`usePaymentRequest`](/api/composables/use-payment-request) wraps it.
- **`paymentMethodTypes` on `stripe.elements()` is gone.** Stripe now rejects it as an integration error, so `VueStripeElements` dropped its `payment-method-types` prop. The payment methods come from the Intent's `payment_method_types` or your Dashboard settings in the client-secret flow. In the deferred-Intent flow, the `allowedPaymentMethodTypes` option replaces it.

Endive is also stricter about Elements groups with no Intent. A group created with neither a client secret nor `mode` makes some elements, such as the Address Element, log "Unable to select session" inside their iframe. A `mode`, `currency` and `amount` on `VueStripeElements` avoid it even when no payment follows.

## What v6 changed that Stripe didn't

Not every v6 change comes from Stripe. The rest come from rebuilding the library so one build runs on Vue 2.7 and Vue 3:

- Every component is now a render function, so the styles moved out of the components into one stylesheet, `@vue-stripe/vue-stripe/style.css`, which apps import once.
- Vue 2.6 support ended. The components rely on APIs that arrived in Vue 2.7, and Vue 2.6 is end-of-life.
- Every element renders the same markup and exposes the same members (`element`, `loading`, `error`, `focus()`, `blur()`, `clear()`). The Link Authentication Element's classes changed to match.
- Event names now match what Stripe emits. `@loadError` became `@loaderror`, and `@loaderstop`, which Stripe never emitted, was removed.
- Error classes the library never threw (`VueStripeLoadError`, `createVueStripeError`) were removed.

[How Vue Stripe works](/guide/architecture) explains the design behind these changes.

## Related pages

- [Upgrade from v5 to v6](/guide/migration-v6): the steps and the full table of breaking changes.
- [Stripe.js coverage](/coverage): every Stripe.js 10 API, including the removed ones.
- Stripe's [changelog](https://docs.stripe.com/changelog) and [Stripe.js versioning policy](https://docs.stripe.com/sdks/stripejs-versioning).
