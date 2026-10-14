---
description: "Set up Vue Stripe with Laravel and Inertia: keys in .env, the plugin, stripe-php routes without CSRF errors, webhooks and Back."
---

# Use Vue Stripe with Laravel and Inertia

Set up Vue Stripe in a Laravel app that renders Vue pages with Inertia, and create the PaymentIntents, Checkout Sessions and webhooks on the Laravel side with [stripe-php](https://github.com/stripe/stripe-php). The Vue pages from the how-to guides then work as written, apart from requests that need the signed-in user (step 4).

The steps cover both Vue starter kits. Where they differ, in steps 3 and 5, the step shows both:

- **Laravel 13 kit**: the kit that `laravel new my-app --vue` installs today, with Inertia 3 and Vite 8. Tested with Laravel 13.36 and `@inertiajs/vue3` 3.9.
- **Laravel 12 kit**: `composer create-project laravel/vue-starter-kit:^1.0 my-app`, with Inertia 2, Vite 6 and Ziggy. Tested with kit v1.0.2 and Laravel 12.70.

Both were tested with stripe-php 22 on PHP 8.4, served by `php artisan serve`. The files and commands used below (`bootstrap/app.php`, `php artisan install:api`) exist from Laravel 11 on.

## 1. Install the packages

```bash
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10
composer require stripe/stripe-php
```

## 2. Add your keys to `.env`

Put all three values in Laravel's `.env`, the file that already holds `APP_KEY`:

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Vite reads the same file and passes only the `VITE_` variable to the browser. Don't create a `.env.local`: when `APP_ENV` is set in the environment, as `php artisan serve` does, Laravel loads `.env.{APP_ENV}` instead of `.env`. With `APP_ENV=local`, a `.env.local` holding only the Stripe key replaces your whole `.env`, and every request fails with a 500 error (`MissingAppKeyException`). Laravel's `.gitignore` already ignores `.env`.

Make the server keys available through `config()` in `config/services.php`:

```php
// config/services.php
'stripe' => [
    'secret' => env('STRIPE_SECRET_KEY'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
],
```

You get `STRIPE_WEBHOOK_SECRET` in step 6; leave it empty until then.

## 3. Install the plugin in `createInertiaApp`

Inertia creates the Vue app in `resources/js/app.ts`. Import the stylesheet there and install the [plugin](/guide/plugin) where the kit configures the app. Inertia 3 creates the app itself and passes it to `withApp`; with Inertia 2, your `setup()` creates it:

::: code-group

```ts [Laravel 13 kit]
// resources/js/app.ts
import '@vue-stripe/vue-stripe/style.css'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import { createInertiaApp } from '@inertiajs/vue3'
// ...the kit's other imports

void createInertiaApp({
  // ...title, layout
  withApp: (app) => {
    app.use(createVueStripe({ publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY }))
    // ...the kit's app.directive('focus', ...)
  },
  // ...progress
})
```

```ts [Laravel 12 kit]
// resources/js/app.ts
import '../css/app.css'
import '@vue-stripe/vue-stripe/style.css'
import { createVueStripe } from '@vue-stripe/vue-stripe'
// ...the kit's other imports

createInertiaApp({
  // ...title, resolve
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(ZiggyVue)
      .use(createVueStripe({ publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY }))
      .mount(el)
  }
})
```

:::

Don't add a `setup()` to the Laravel 13 kit: Inertia 3 accepts `setup` or `withApp`, not both, and the kit's `app.ts` imports neither `createApp` nor Ziggy.

`publishableKey` needs no type declaration. Vite types the variables in `import.meta.env` as `any`, and the `ImportMetaEnv` declaration that both kits put inside `declare module 'vite/client'` (in `app.ts` in the Laravel 12 kit, in `resources/js/types/global.d.ts` in the Laravel 13 kit) does not narrow them.

The plugin loads Stripe.js once, on the first page that needs it, and keeps it across Inertia visits.

## 4. Create the API routes

The guides call `/api/...` with `fetch` POST requests and no CSRF token. A route in `routes/web.php` checks the CSRF token, so those requests fail with **419 Page Expired**. Put the routes in `routes/api.php` instead: Laravel serves them under the `/api` prefix, without the CSRF check. A new Laravel app has no `routes/api.php`, in either kit; create it with:

```bash
php artisan install:api
```

The command also installs Laravel Sanctum. Then add a controller with the endpoints that [Accept a payment with the Payment Element](/guide/payment-element) and [Redirect to Stripe Checkout](/guide/checkout) call:

```php
<?php
// app/Http/Controllers/StripeController.php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\InvalidArgumentException;
use Stripe\StripeClient;

class StripeController extends Controller
{
    private function stripe(): StripeClient
    {
        return new StripeClient(config('services.stripe.secret'));
    }

    // Accept a payment with the Payment Element
    public function createPaymentIntent(): JsonResponse
    {
        $paymentIntent = $this->stripe()->paymentIntents->create([
            'amount' => 2000, // decide the amount on the server
            'currency' => 'usd',
            'automatic_payment_methods' => ['enabled' => true],
        ]);

        return response()->json(['clientSecret' => $paymentIntent->client_secret]);
    }

    // Redirect to Stripe Checkout
    public function createCheckoutSession(): JsonResponse
    {
        $session = $this->stripe()->checkout->sessions->create([
            'line_items' => [['price' => 'price_123', 'quantity' => 1]],
            'mode' => 'payment',
            'success_url' => url('/checkout/success').'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => url('/hosted-checkout'),
        ]);

        return response()->json(['url' => $session->url]);
    }

    // The page at success_url asks for the session's status: GET /api/checkout-status?session_id=cs_test_...
    public function checkoutStatus(Request $request): JsonResponse
    {
        try {
            $session = $this->stripe()->checkout->sessions->retrieve((string) $request->query('session_id'));
        } catch (ApiErrorException|InvalidArgumentException) {
            return response()->json(['error' => 'No such Checkout Session'], 404);
        }

        return response()->json(['status' => $session->status, 'paymentStatus' => $session->payment_status]);
    }
}
```

```php
// routes/api.php
use App\Http\Controllers\StripeController;

Route::post('/create-payment-intent', [StripeController::class, 'createPaymentIntent']);
Route::post('/create-checkout-session', [StripeController::class, 'createCheckoutSession']);
Route::get('/checkout-status', [StripeController::class, 'checkoutStatus']);
```

Replace `price_123` with a Price from your Stripe account. The endpoints return what the two guides expect. Other guides' endpoints translate the same way: stripe-php takes the same parameters as stripe-node, written as PHP arrays.

### Keep a route in `routes/web.php`

Routes in `routes/api.php` have no session, so `$request->user()` is `null` there. When an endpoint needs the signed-in user, keep it in `routes/web.php` behind the `auth` middleware, and send Laravel's CSRF token with the request.

For example, [Save a payment method for later](/guide/setup-intent) attaches the SetupIntent to the user's Stripe Customer. Store the Customer ID on the user:

```bash
php artisan make:migration add_stripe_customer_id_to_users_table --table=users
```

```php
// database/migrations/..._add_stripe_customer_id_to_users_table.php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('stripe_customer_id')->nullable();
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn('stripe_customer_id');
    });
}
```

Run `php artisan migrate`. Then add the endpoint to `StripeController`. It creates the Customer on the user's first visit:

```php
// app/Http/Controllers/StripeController.php

    // Save a payment method for later
    public function createSetupIntent(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->stripe_customer_id) {
            $customer = $this->stripe()->customers->create(['email' => $user->email, 'name' => $user->name]);
            $user->forceFill(['stripe_customer_id' => $customer->id])->save();
        }

        $setupIntent = $this->stripe()->setupIntents->create([
            'customer' => $user->stripe_customer_id, // the signed-in user's Customer, never an ID from the browser
            'automatic_payment_methods' => ['enabled' => true],
        ]);

        return response()->json(['clientSecret' => $setupIntent->client_secret]);
    }
```

```php
// routes/web.php
use App\Http\Controllers\StripeController;

Route::middleware('auth')->group(function () {
    Route::post('/stripe/setup-intent', [StripeController::class, 'createSetupIntent']);
    Route::inertia('/save-card', 'SaveCard');
    Route::inertia('/account/cards', 'AccountCards');
});
```

`resources/js/pages/SaveCard.vue` is `SaveCardPage.vue` from the guide, with `SaveCardButton.vue` saved next to it and the fetch changed to this route. Laravel puts the CSRF token in the `XSRF-TOKEN` cookie; axios sends it back as a header by itself, `fetch` does not:

```ts
const xsrfToken = decodeURIComponent(document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)?.[1] ?? '')

const response = await fetch('/stripe/setup-intent', {
  method: 'POST',
  headers: { 'X-XSRF-TOKEN': xsrfToken }
})
```

Without the header the request fails with 419. A guest who opens `/save-card` is sent to the login page.

`/account/cards` is the `return_url` of `SaveCardButton.vue`. Cards save on `/save-card`, but payment methods that redirect, such as Naver Pay or Kakao Pay, come back to `/account/cards` after the customer approves; without the route Laravel answers 404. `resources/js/pages/AccountCards.vue` is `SetupStatus.vue` from [Show the result on the return page](/guide/setup-intent#_4-show-the-result-on-the-return-page). The plugin from step 3 provides Stripe, so it needs no `VueStripeProvider`. Both pages are inside the `auth` group, so the Laravel 13 kit renders them in its dashboard layout.

## 5. Render the payment pages

Add Inertia routes for the Payment Element page and its return page, and for the hosted Checkout button and its success page:

```php
// routes/web.php
Route::inertia('/checkout', 'Checkout');
Route::inertia('/payment-complete', 'PaymentComplete');
Route::inertia('/hosted-checkout', 'HostedCheckout');
Route::inertia('/checkout/success', 'CheckoutSuccess');
```

Fetch the client secret when the page mounts, and render `VueStripeElements` once it has arrived:

```vue
<!-- resources/js/pages/Checkout.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueStripeElements } from '@vue-stripe/vue-stripe'
import PaymentForm from '@/components/PaymentForm.vue'

const clientSecret = ref('')
const errorMessage = ref('')

// Runs on every visit, including Back, so each visit gets its own PaymentIntent
onMounted(async () => {
  try {
    const response = await fetch('/api/create-payment-intent', { method: 'POST' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    clientSecret.value = (await response.json()).clientSecret
  } catch {
    errorMessage.value = 'Could not start the payment. Please reload the page.'
  }
})
</script>

<template>
  <p v-if="errorMessage">{{ errorMessage }}</p>
  <VueStripeElements v-else-if="clientSecret" :client-secret="clientSecret">
    <PaymentForm :client-secret="clientSecret" />
  </VueStripeElements>
</template>
```

The other three pages come from the guides; save them in `resources/js/pages/` and the form in `resources/js/components/`:

| File | Source |
|------|--------|
| `components/PaymentForm.vue` | The form from [Accept a payment with the Payment Element](/guide/payment-element#_3-render-the-payment-element-and-confirm) |
| `pages/PaymentComplete.vue` | `CompletePage.vue` from [Check the result on the return page](/guide/error-handling#_4-check-the-result-on-the-return-page) |
| `pages/HostedCheckout.vue` | The button from [Redirect to Stripe Checkout](/guide/checkout#_2-add-the-checkout-button) |
| `pages/CheckoutSuccess.vue` | `SuccessPage.vue` from [Show the outcome on the success page](/guide/checkout#_3-show-the-outcome-on-the-success-page) |

### Open the pages to guests (Laravel 13 kit)

The Laravel 13 kit wraps every page except `Welcome` and the `auth/` pages in `AppLayout`. `AppLayout` shows the signed-in user's menu, so for a guest the layout fails before the page renders, and `/checkout` stays blank. Return no layout for the Stripe pages in `createInertiaApp`:

```ts
// resources/js/app.ts
void createInertiaApp({
  layout: (name) => {
    switch (true) {
      case name === 'Welcome':
      case ['Checkout', 'PaymentComplete', 'HostedCheckout', 'CheckoutSuccess'].includes(name):
        return null
      // ...the kit's other cases
    }
  },
  // ...
})
```

To keep the pages inside the dashboard layout instead, put their routes in `Route::middleware('auth')->group(...)`, so only signed-in users reach them. The Laravel 12 kit applies no layout by itself, so its pages need neither change.

### Try it

Run `npm run dev` next to `php artisan serve`:

1. Open `/checkout` and pay with a [test card](/guide/testing#cards). Stripe returns to `/payment-complete`, which shows "Payment received."
2. Open `/hosted-checkout`, click the button and pay on Stripe's page. Stripe returns to `/checkout/success`, which shows "Thank you! Your payment was received."

### Why not pass the client secret as an Inertia prop

Creating the PaymentIntent in the controller and passing it with `Inertia::render('Checkout', ['clientSecret' => ...])` looks natural, but Inertia restores a page's props from the browser history when the customer presses Back, without asking your server. After a payment that stays on the page (`redirect: 'if_required'`), Back then mounts `VueStripeElements` with the PaymentIntent that is already paid, and every element shows Stripe's error "This PaymentIntent is in a terminal state and cannot be used to initialize Elements". The props are also written into the page's HTML and kept in the history state. Fetching on mount, as above, creates a new PaymentIntent on every visit.

If you pass the secret as a prop anyway, check the PaymentIntent's status with `retrievePaymentIntent()` before you render the elements, and offer a way to start a new payment when it has succeeded.

## 6. Receive webhooks

Fulfil orders from a webhook, as [Fulfil orders with webhooks](/guide/webhooks) explains. Stripe's POST to your endpoint carries a signature and no CSRF token, so exempt the route from the CSRF check in `bootstrap/app.php`. Without the exemption Laravel answers every event with 419, and Stripe keeps retrying:

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    // Stripe signs webhook requests instead of sending a CSRF token
    $middleware->validateCsrfTokens(except: ['stripe/webhook']);
    // ...the starter kit's middleware
})
```

Verify the signature against the raw body, which `$request->getContent()` returns. `$request->all()` returns the decoded fields, and JSON encoded again from them no longer matches the signature:

```php
<?php
// app/Http/Controllers/StripeWebhookController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request)
    {
        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature', ''),
                config('services.stripe.webhook_secret'),
            );
        } catch (SignatureVerificationException|\UnexpectedValueException $e) {
            return response()->json(['error' => 'Webhook signature check failed'], 400);
        }

        switch ($event->type) {
            case 'payment_intent.succeeded':
                // fulfil the order for $event->data->object
                break;
            case 'checkout.session.completed':
                // fulfil the order for $event->data->object
                break;
        }

        return response()->json(['received' => true]);
    }
}
```

```php
// routes/web.php
use App\Http\Controllers\StripeWebhookController;

Route::post('/stripe/webhook', StripeWebhookController::class);
```

A route in `routes/api.php` also skips the CSRF check and needs no exemption; its URL then starts with `/api/`.

Forward test-mode events to it with the Stripe CLI, and put the `whsec_...` secret that the command prints in `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --events payment_intent.succeeded,checkout.session.completed --forward-to localhost:8000/stripe/webhook
```

`--events` names the two events the controller handles; Stripe CLI 1.53 refuses to start `listen` without an event selection. Pay on `/checkout` again: `stripe listen` shows `payment_intent.succeeded` answered with `[200]`. A payment on `/hosted-checkout` also sends `checkout.session.completed`. A request with a wrong signature gets 400.

## Result

The Vue pages from the guides run inside Inertia with the plugin's Stripe instance, in either starter kit and for guests. Their `fetch` calls reach Laravel routes without a CSRF error, every visit to the checkout page gets a fresh PaymentIntent, hosted Checkout returns to a success page that checks the session, and signed webhook events reach your controller.

## See also

- [Install and set up](/guide/installation): the setup for other build tools
- [Fulfil orders with webhooks](/guide/webhooks): which events to handle, and making fulfilment safe to repeat
- [Provide Stripe app-wide](/guide/plugin): plugin options, and combining it with providers
- [stripe-php](https://github.com/stripe/stripe-php) and [Stripe's API reference](https://docs.stripe.com/api?lang=php)
