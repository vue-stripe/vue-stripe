---
description: "Which Stripe keys and secrets belong in the browser and which on your server, how Stripe iframes keep card data off your page, and what PCI scope means."
---

# What runs where: keys, iframes and PCI scope

A Stripe integration splits its work between the customer's browser, your server and Stripe. Most of the warnings in these docs, such as keeping the secret key on the server or not trusting the return page, follow from that split. This page explains it once, so the warnings on other pages make sense.

## Two keys, two sides

Your Stripe account has two kinds of API keys, and they belong on different sides:

- The **publishable key** (`pk_test_...`, `pk_live_...`) identifies your account to Stripe.js. It can create PaymentMethods and tokens, and it can confirm or read an Intent only together with that Intent's client secret. It can't create charges, read your customers or issue refunds. It ships in your JavaScript bundle and is meant to be public. It's the key `VueStripeProvider` and `createVueStripe()` take.
- The **secret key** (`sk_test_...`, `sk_live_...`) can do anything in your account. It belongs on your server, in an environment variable, and never in browser code, a Vite `VITE_*` variable or a repository. Stripe also offers restricted keys, which limit a server key to the API resources it needs.

Every Vue Stripe component and composable works with the publishable key alone. When a flow needs the secret key, such as creating an Intent or a Checkout Session, confirming on the server or handling webhooks, the guides show that part as server code.

## Client secrets

Between the two keys sit **client secrets**. Your server creates a PaymentIntent, SetupIntent or Checkout Session, and Stripe returns a secret for that one object. Your server sends it to the browser of the customer who is paying. With it, Stripe.js can confirm that object and read its status, and nothing more.

A client secret is safe to give to its customer, but it isn't public. Don't log it, store it in analytics, or put it in a URL that other people see. Stripe adds it to the `return_url` after a redirect, which is fine: that URL goes back to the same customer.

## Card data stays in Stripe's frames

Each element renders its inputs inside an iframe served by Stripe. What the customer types into the card number or IBAN field goes from that iframe straight to Stripe. Your page's JavaScript, Vue Stripe included, can't read it. The element's events report only metadata, such as whether the field is complete, the card brand, or the validation error. Confirming sends a reference to the element, not its contents. Embedded Checkout and the Checkout Form are iframes too, and hosted Checkout is a different domain altogether.

This is what keeps a Stripe integration light on PCI DSS compliance work. Stripe's [integration security guide](https://docs.stripe.com/security/guide) explains which validation form applies to Checkout and Elements integrations. It also lists the conditions, including that Stripe.js is loaded from `js.stripe.com` and not bundled or self-hosted. Vue Stripe always loads it from there (see [How Stripe.js is loaded](/guide/stripe-js-loading)).

The frames protect the card data, not your page. A script injected into your page can't read the card number, but it can change what the page shows or where the Pay button sends the customer. Keeping your own page free of untrusted scripts still matters, and a Content Security Policy helps. Stripe documents the [CSP directives](https://docs.stripe.com/security/guide) Stripe.js needs.

## The browser can't be trusted with the outcome

Anything that runs in the browser can be changed by the person using it. Three consequences follow, and the guides apply all of them:

- **Your server sets the amount.** The `amount` on `VueStripeElements` in the deferred-Intent flow only drives what the Payment Element displays. The amount charged is what your server puts on the Intent or the Checkout Session, computed from your own prices.
- **Don't fulfil on the return page.** A customer can close the tab before the redirect, or open the success URL without paying. Fulfil orders from a [webhook](/guide/webhooks) (`payment_intent.succeeded`, `checkout.session.completed`), which Stripe sends to your server whatever the browser does. Or retrieve the Intent or session on your server and check its status before acting.
- **Check the signature on every webhook.** Your webhook endpoint is a public URL. Stripe signs each event with your endpoint's signing secret, and the server library's `constructEvent()` rejects events Stripe didn't send.

## Other secrets the browser sees

A few flows give the browser short-lived credentials for one purpose:

- **Issuing Elements** show a card's details to its cardholder using an ephemeral key. Your server creates the key for one card, after checking that the signed-in user may see it. The browser proves it asked for that key with a nonce from `useEphemeralKeyNonce()`. See [Display issued card details](/guide/issuing).
- **Identity and Financial Connections** open Stripe-hosted modals from a client secret your server created for that verification or that bank-linking session.

The pattern is the same as with Intents: the server decides what may happen, and the browser gets a secret scoped to exactly that.

## Fraud signals and privacy

Stripe.js collects device and behaviour signals for Radar unless you load it with `advancedFraudSignals` turned off. That's a decision for your privacy policy as much as for your fraud rate. [How Stripe.js is loaded](/guide/stripe-js-loading#advanced-fraud-signals) explains the trade-off and why the setting applies to the whole page.

## Related pages

- [Payment objects](/guide/payment-objects): what the server creates and what the browser receives.
- [How confirming works](/guide/confirming-payments#redirects): why the return page is only for showing a result.
- Stripe's [API keys](https://docs.stripe.com/keys) and [webhooks](https://docs.stripe.com/webhooks) documentation.
