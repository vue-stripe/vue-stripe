---
description: "Set up Vue Stripe with Laravel and Inertia: keys in .env, the plugin, stripe-php routes without CSRF errors, webhooks and Back."
---

# Use Vue Stripe with Laravel and Inertia

Set up Vue Stripe in a Laravel app that renders Vue pages with Inertia, and create the PaymentIntents, Checkout Sessions and webhooks on the Laravel side with [stripe-php](https://github.com/stripe/stripe-php). The Vue pages from the how-to guides then work unchanged.

These steps were tested with Laravel 12 from the Vue starter kit (Inertia 2, Vite 6, `laravel-vite-plugin`) and stripe-php 22 on PHP 8.4, served by `php artisan serve`. The files and commands used below (`bootstrap/app.php`, `php artisan install:api`) exist from Laravel 11 on.

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

Inertia creates the Vue app in `resources/js/app.ts`. Import the stylesheet there and install the [plugin](/guide/plugin) next to Inertia's own:

```ts
// resources/js/app.ts
import '../css/app.css'
import '@vue-stripe/vue-stripe/style.css'
import { createVueStripe } from '@vue-stripe/vue-stripe'
// ...the starter kit's other imports

createInertiaApp({
  // ...
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(ZiggyVue)
      .use(createVueStripe({ publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY }))
      .mount(el)
  }
})
```

The starter kit declares `ImportMetaEnv` in the same file with an index signature, which types every variable as `string | boolean | undefined`. Add the key to that declaration, or TypeScript rejects it as `publishableKey`:

```ts
interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  // ...
}
```

The plugin loads Stripe.js once, on the first page that needs it, and keeps it across Inertia visits.

## 4. Create the API routes

The guides call `/api/...` with `fetch` POST requests and no CSRF token. A route in `routes/web.php` checks the CSRF token, so those requests fail with **419 Page Expired**. Put the routes in `routes/api.php` instead: Laravel serves them under the `/api` prefix, without the CSRF check. A new Laravel 11 or 12 app has no `routes/api.php`; create it with:

```bash
php artisan install:api
```

The command also installs Laravel Sanctum. Then add a controller with the two endpoints most guides use:

```php
<?php
// app/Http/Controllers/StripeController.php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
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
            'cancel_url' => url('/checkout'),
        ]);

        return response()->json(['url' => $session->url]);
    }
}
```

```php
// routes/api.php
use App\Http\Controllers\StripeController;

Route::post('/create-payment-intent', [StripeController::class, 'createPaymentIntent']);
Route::post('/create-checkout-session', [StripeController::class, 'createCheckoutSession']);
```

The two endpoints return what [Accept a payment with the Payment Element](/guide/payment-element) and [Redirect to Stripe Checkout](/guide/checkout) expect. The other guides' endpoints translate the same way: stripe-php takes the same parameters as stripe-node, written as PHP arrays.

### Keep a route in `routes/web.php`

Routes in `routes/api.php` have no session, so `$request->user()` is `null` there. When an endpoint needs the signed-in user, for example to attach a SetupIntent to the user's Customer, keep it in `routes/web.php` and send Laravel's CSRF token. Laravel puts it in the `XSRF-TOKEN` cookie; axios sends it back as a header by itself, `fetch` does not:

```ts
const xsrfToken = decodeURIComponent(document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)?.[1] ?? '')

const response = await fetch('/stripe/setup-intent', {
  method: 'POST',
  headers: { 'X-XSRF-TOKEN': xsrfToken }
})
```

## 5. Render the payment page

Add an Inertia route for the page and one for the return page:

```php
// routes/web.php
Route::inertia('/checkout', 'Checkout');
Route::inertia('/payment-complete', 'PaymentComplete');
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
    const data = await response.json()
    clientSecret.value = data.clientSecret
  } catch {
    errorMessage.value = 'Failed to initialize payment'
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

`PaymentForm.vue` is the form from [Accept a payment with the Payment Element](/guide/payment-element#_3-render-the-payment-element-and-confirm); save it in `resources/js/components/`. Build `PaymentComplete.vue` with `retrievePaymentIntent()`, as in [Check the result on the return page](/guide/error-handling#_4-check-the-result-on-the-return-page). Run `npm run dev` next to `php artisan serve`, open `/checkout` and pay with a [test card](/guide/testing#cards).

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
stripe listen --forward-to localhost:8000/stripe/webhook
```

Pay on `/checkout` again: `stripe listen` shows `payment_intent.succeeded` answered with `[200]`. A request with a wrong signature gets 400.

## Result

The Vue pages from the guides run inside Inertia with the plugin's Stripe instance, their `fetch` calls reach Laravel routes without a CSRF error, every visit to the checkout page gets a fresh PaymentIntent, and signed webhook events reach your controller.

## See also

- [Install and set up](/guide/installation): the setup for other build tools
- [Fulfil orders with webhooks](/guide/webhooks): which events to handle, and making fulfilment safe to repeat
- [Provide Stripe app-wide](/guide/plugin): plugin options, and combining it with providers
- [stripe-php](https://github.com/stripe/stripe-php) and [Stripe's API reference](https://docs.stripe.com/api?lang=php)
