# How Stripe.js is loaded

Before any element can appear, the browser has to download Stripe.js from Stripe and create a `Stripe` instance with your publishable key. Vue Stripe makes a few deliberate choices about when that happens and how often. They affect page weight, Stripe's fraud signals and server-side rendering. This page explains them.

## Two things called Stripe.js

The npm package `@stripe/stripe-js` doesn't contain Stripe.js. It's a small loader with TypeScript types. The library itself is a script that Stripe serves from `js.stripe.com`, and the loader adds it to the page as a `<script>` tag. Stripe requires this. Stripe.js must be loaded from Stripe's servers, not bundled or self-hosted, so that Stripe can update it and so that the fields it renders stay in Stripe's PCI scope rather than yours.

So "loading Stripe.js" means a network request to Stripe, made at a moment the loader chooses. Vue Stripe's choices are about that moment.

## Nothing loads on import

`@stripe/stripe-js` has two entry points. The default entry adds the script tag as soon as a module imports it, as a side effect, whether or not the page shows any payment UI. The `pure` entry adds the tag only when `loadStripe()` is first called.

Vue Stripe imports only the `pure` entry. As a result:

- Importing `@vue-stripe/vue-stripe`, or registering its components, makes no request to Stripe. A large app can import the library everywhere and still load Stripe.js only on pages that render a provider.
- Load parameters can be set before the script is requested. The script URL carries one parameter, `advancedFraudSignals`, and it can only be set before the tag is added. With the default entry, the tag would already exist by the time any Vue code ran.

`VueStripeProvider` calls `loadStripe()` in `onMounted`. The `createVueStripe()` plugin calls it the first time a component or composable reads the Stripe context, so an app that installs the plugin but renders no Stripe UI loads nothing.

## One script, many instances

A page can have several providers: one for the platform account and one for a connected account, or one per payment widget. They share one script but each gets its own `Stripe` instance:

- **The script loads once.** Every `loadStripe()` call after the first reuses the script already on the page.
- **Each call creates its own instance**, with its own publishable key, connected account, locale and betas. Providers stay independent even though they share the script.

Version 10.0.0 of the pure loader has a gap here. A second `loadStripe()` call made while the first one is still loading re-adds the script and drops the first call's listeners, so the first call never settles. Two providers that mount in the same tick would hit this. Vue Stripe's own `loadStripe` (exported from the package, with the same signature) waits for a load in progress, then creates its instance from the loaded script. That's why the guides recommend importing `loadStripe` from `@vue-stripe/vue-stripe` if your code needs it directly.

If the script fails to load, for example on a network error, the loader retries once, then reports the failure. The provider shows its `#error` slot and emits `error`. The failure isn't cached, so remounting the provider tries again.

## Advanced fraud signals

By default, Stripe.js collects [advanced fraud detection signals](https://docs.stripe.com/disputes/prevention/advanced-fraud-detection): information about the device and how the customer moves through the page. Radar uses them to tell fraudulent payments from real ones. Stripe recommends loading Stripe.js on every page of the site, not only checkout, so the signals cover the whole visit.

Turning the signals off (`:advanced-fraud-signals="false"` on the provider, or `advancedFraudSignals: false` on the plugin) is a trade-off. It reduces what Stripe.js collects, which can matter for a privacy policy or a consent requirement. In return, Radar has less information about each payment and may block more good payments or let through more bad ones. Stripe documents what is collected and why, and it is worth reading before deciding.

The setting is part of the script URL (`?advancedFraudSignals=false`), so whoever loads the script first decides it for the whole page. That has two consequences:

- Every loader on the page has to agree. If one provider loads the script with the signals on, a later provider asking for them off can't change it. Vue Stripe logs a `[Vue Stripe]` warning and uses the script that is already there.
- Anything else that loads Stripe.js wins over your setting: a runtime import of the default `@stripe/stripe-js` entry, or a `<script>` tag in `index.html`. Type-only imports from `@stripe/stripe-js` are fine, because they produce no code.

The [`VueStripeProvider` reference](/api/components/stripe-provider#advanced-fraud-signals) lists the exact behaviour.

## Where to mount the provider

Where you mount the provider (or how you install the plugin) decides when Stripe.js loads. The options trade page weight against fraud coverage:

- **Only on payment pages.** The provider sits in the checkout page or component. Pages without payments never load Stripe.js. That's the lightest option, but the fraud signals start only when the customer reaches checkout.
- **High in the app.** A provider around the app's root, or a component that calls `useStripe()` on every page under the plugin, loads Stripe.js on the first page the customer opens. That's what Stripe recommends for fraud signals, and later checkout pages find the script already loaded. The cost is a script download on every visit.
- **Plugin plus local providers.** The plugin covers the common key and loads on first use. Local providers add other keys, connected accounts or `betas` where a subtree needs them. They all share the one script.

Remounting a provider is cheap after the first load: the script is reused, and only a new instance is created. That's why the documented way to switch keys or accounts is to remount the provider with a `:key`. The provider reads its props once, when it loads.

Some components load more than Stripe.js. `VueStripePricingTable` adds Stripe's separate pricing-table script the first time it mounts, and Embedded Checkout loads Stripe's page inside its iframe.

## Server-side rendering

Stripe.js needs a browser: it adds a script to `document` and draws its fields in iframes. Vue Stripe therefore never loads it during server rendering. The provider loads in `onMounted`, which doesn't run on the server, and the plugin returns before loading when there is no `window`. The server renders each provider in its loading state. The browser hydrates that same loading state, then loads Stripe.js and renders the real content.

So the library is safe to import and render in an SSR app. What you still choose is how much of the payment UI the server should render at all. Framework-specific advice, such as client-only wrappers for Nuxt, is in [Use Vue Stripe with Nuxt and SSR](/guide/ssr).

## Release trains

Stripe ships Stripe.js in named release trains: Acacia, Basil, Clover, Dahlia and Endive so far, two a year, alongside its API releases. Breaking changes happen only between trains. Within a train, Stripe keeps updating the script with fixes and features that don't break integrations, and every page gets those updates without a deploy, because the script comes from Stripe.

Each major version of `@stripe/stripe-js` loads exactly one train. Version 10, which Vue Stripe 6 requires, requests `https://js.stripe.com/endive/stripe.js`. In test mode, the loader warns if a different train is already on the page. Vue Stripe follows the same rule. A Vue Stripe major release supports one `@stripe/stripe-js` major, so moving to the next train is a Vue Stripe major upgrade, and the library's types and components match what that train offers. The `ReleaseTrain` type, re-exported from `@stripe/stripe-js`, names the current train in code.

Stripe also ties its server API versions to the trains (`2026-09-30.endive`, for example) and recommends keeping your server's API version on the same train as Stripe.js. [Stripe.js versions](/guide/stripe-js-versions) explains what each recent train changed. Stripe's [versioning policy](https://docs.stripe.com/sdks/stripejs-versioning) has the details.

## Related pages

- [VueStripeProvider](/api/components/stripe-provider) and [createVueStripe()](/api/plugin): the loading options as props and plugin options.
- [How Vue Stripe works](/guide/architecture#when-each-layer-renders-its-children): what renders while Stripe.js loads.
- [Choosing an integration](/guide/approaches#plugin-or-provider): the plugin and the provider compared.
