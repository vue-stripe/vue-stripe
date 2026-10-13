---
description: "Tutorial: build a small Vue app and Node server that takes a Stripe test payment with the Payment Element, including 3D Secure and a declined card."
---

# Take your first test payment

In this tutorial you build a small Vue app that charges €10 to a Stripe test card. You write a Node server of about 20 lines that creates the payment, add Stripe's payment form to a Vite app, and then pay three times: once with a card that succeeds, once with a card that asks for 3D Secure authentication, and once with a card that is declined.

It takes about 30 minutes. No real money moves: everything runs in Stripe's test mode.

This is what your app looks like at the end:

<img src="/tutorial/payment-succeeded.webp" width="460" style="border: 1px solid var(--vp-c-divider); border-radius: 8px" alt="The finished app: a Pay €10 heading, a card form filled with 4242 4242 4242 4242, a Pay €10 button and the text Payment succeeded">

## Before you start

You need:

- Node.js 20.19 or later. Check with `node --version`.
- A Stripe account. Sign up at [dashboard.stripe.com/register](https://dashboard.stripe.com/register); you can use test mode right away.
- Your two test API keys from [API keys](https://dashboard.stripe.com/test/apikeys) in the Stripe Dashboard: the **publishable key** (`pk_test_...`) and the **secret key** (`sk_test_...`).

## Step 1: Create the app

Open a terminal and create a Vue app with Vite:

```bash
npm create vite@latest first-payment -- --template vue --no-immediate
```

If npm asks `Ok to proceed? (y)` before it installs `create-vite`, type <kbd>y</kbd> and press <kbd>Enter</kbd>. Vite creates the project and tells you what to run next:

```text
◇  Scaffolding project in /home/you/first-payment...
│
└  Done. Now run:

  cd first-payment
  npm install
  npm run dev
```

Go into the folder and install the app's packages, then Vue Stripe, Stripe.js and Stripe's Node library:

```bash
cd first-payment
npm install
npm install @vue-stripe/vue-stripe@^6.0.0-beta.2 @stripe/stripe-js@^10 stripe
```

The version ranges pick Vue Stripe 6 and Stripe.js 10. Without them, npm installs Vue Stripe 5 while 6.0.0 is still a beta.

Check that all three are installed:

```bash
npm ls --depth=0
```

Your version numbers can be higher; `@vue-stripe/vue-stripe` must be 6 and `@stripe/stripe-js` must be 10:

```text
first-payment@0.0.0 /home/you/first-payment
├── @stripe/stripe-js@10.x.x
├── @vitejs/plugin-vue@6.x.x
├── @vue-stripe/vue-stripe@6.x.x
├── stripe@23.x.x
├── vite@8.x.x
└── vue@3.x.x
```

## Step 2: Add your test keys

In the `first-payment` folder, create a file named `.env.local` and paste your two keys into it:

```ini
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

Vite gives the browser only the variables that start with `VITE_`, so your secret key stays on the server. The `.gitignore` file that Vite created already ignores `*.local` files, so the keys stay out of git.

## Step 3: Write the server

Your app needs a server that creates a PaymentIntent, Stripe's record of one payment, for each visit. Create `server.mjs` in the `first-payment` folder, next to `package.json`:

```js
import { createServer } from 'node:http'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/payment-intent') {
    const paymentIntent = await stripe.paymentIntents.create({ amount: 1000, currency: 'eur' })
    console.log('Created', paymentIntent.id)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ clientSecret: paymentIntent.client_secret }))
    return
  }

  res.statusCode = 404
  res.end()
})

server.listen(3000, () => console.log('Server ready on http://localhost:3000'))
```

Start it, passing your keys file:

```bash
node --env-file=.env.local server.mjs
```

The terminal shows:

```text
Server ready on http://localhost:3000
```

Leave this terminal open. Open a second terminal in the `first-payment` folder and ask the server for a PaymentIntent:

```bash
curl -X POST http://localhost:3000/api/payment-intent
```

You get back the PaymentIntent's client secret:

```text
{"clientSecret":"pi_3UQ03bEfCmJMLhhr1clJ9TXY_secret_..."}
```

The first terminal prints the ID of the PaymentIntent it created:

```text
Created pi_3UQ03bEfCmJMLhhr1clJ9TXY
```

Now let the app reach the server. Replace the contents of `vite.config.js`, so that Vite's dev server sends every request for `/api/...` on to port 3000:

```js{6-9}
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Send the app's /api requests to the server from step 3.
    proxy: { '/api': 'http://localhost:3000' }
  }
})
```

The app can now call `/api/payment-intent` on its own address, the way the how-to guides call their server.

## Step 4: Load Stripe

Replace the contents of `src/main.js` with this. It loads Vue Stripe's stylesheet in place of the welcome page's styles:

```js
import { createApp } from 'vue'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

createApp(App).mount('#app')
```

Replace the contents of `src/App.vue`. `VueStripeProvider` loads Stripe.js with your publishable key:

```vue
<script setup>
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <main>
    <h1>Pay €10</h1>
    <VueStripeProvider :publishable-key="publishableKey">
      <p>Stripe is ready.</p>
    </VueStripeProvider>
  </main>
</template>

<style>
main {
  max-width: 420px;
  margin: 48px auto;
  font-family: system-ui, sans-serif;
}
</style>
```

In the second terminal, start the app:

```bash
npm run dev
```

```text
  VITE v8.3.1  ready in 928 ms

  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser. You see the heading **Pay €10** and, for a moment, **Loading Stripe...**, then:

```text
Stripe is ready.
```

The browser console shows the warning *"You may test your Stripe.js integration over HTTP. However, live Stripe.js integrations must use HTTPS."* That is expected on `localhost`.

## Step 5: Show the payment form

Replace `src/App.vue` again. The app now asks your server for a PaymentIntent, then shows the Payment Element inside `VueStripeElements`:

```vue{2-7,10-16,23-25}
<script setup>
import { ref, onMounted } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')

onMounted(async () => {
  const response = await fetch('/api/payment-intent', { method: 'POST' })
  const data = await response.json()
  clientSecret.value = data.clientSecret
})
</script>

<template>
  <main>
    <h1>Pay €10</h1>
    <VueStripeProvider :publishable-key="publishableKey">
      <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
        <VueStripePaymentElement />
      </VueStripeElements>
    </VueStripeProvider>
  </main>
</template>

<style>
main {
  max-width: 420px;
  margin: 48px auto;
  font-family: system-ui, sans-serif;
}
</style>
```

The page reloads and shows a card form:

<img src="/tutorial/card-form.webp" width="460" style="border: 1px solid var(--vp-c-divider); border-radius: 8px" alt="The app with an empty card form: card number, expiration date, security code and country fields, and a Save my information for faster checkout checkbox">

The **Country** field shows your own country. Depending on your country and your Stripe account, you can also see a postal code field or other payment methods next to **Card**.

Each time you load the page, your server creates a new PaymentIntent, and the first terminal prints another `Created pi_...` line. If the page shows only the heading, check that the server from step 3 is still running.

The browser console now shows a few more Stripe.js warnings, for example about Apple Pay domain registration. You can ignore them in this tutorial.

## Step 6: Take a payment

Create `src/PayButton.vue`. It confirms the payment with `usePaymentIntent()` and shows the result:

```vue
<script setup>
import { ref } from 'vue'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'

const props = defineProps({ clientSecret: String })

const { confirmPayment, loading, error } = usePaymentIntent()
const status = ref('')

async function pay() {
  const result = await confirmPayment({
    clientSecret: props.clientSecret,
    confirmParams: { return_url: window.location.href },
    redirect: 'if_required'
  })
  if (result.paymentIntent) {
    status.value = result.paymentIntent.status
  }
}
</script>

<template>
  <button :disabled="loading" @click="pay">Pay €10</button>
  <p v-if="status">Payment {{ status }}</p>
  <p v-if="error">{{ error }}</p>
</template>

<style scoped>
button {
  margin: 16px 0;
  padding: 8px 16px;
  font-size: 16px;
}
</style>
```

Add the button to `src/App.vue`, inside `VueStripeElements` under the Payment Element:

```vue{8,26}
<script setup>
import { ref, onMounted } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import PayButton from './PayButton.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')

onMounted(async () => {
  const response = await fetch('/api/payment-intent', { method: 'POST' })
  const data = await response.json()
  clientSecret.value = data.clientSecret
})
</script>

<template>
  <main>
    <h1>Pay €10</h1>
    <VueStripeProvider :publishable-key="publishableKey">
      <VueStripeElements v-if="clientSecret" :client-secret="clientSecret">
        <VueStripePaymentElement />
        <PayButton :client-secret="clientSecret" />
      </VueStripeElements>
    </VueStripeProvider>
  </main>
</template>

<style>
main {
  max-width: 420px;
  margin: 48px auto;
  font-family: system-ui, sans-serif;
}
</style>
```

Now pay. In the card form, enter:

- Card number: `4242 4242 4242 4242`
- Expiration date: `12 / 34`
- Security code: `123`
- Postal code, if the form asks for one: `10115`

Click **Pay €10**. After a second or two, the text under the button reads:

```text
Payment succeeded
```

<img src="/tutorial/payment-succeeded.webp" width="460" style="border: 1px solid var(--vp-c-divider); border-radius: 8px" alt="The card form filled with 4242 4242 4242 4242 and the text Payment succeeded under the Pay €10 button">

Open [Payments](https://dashboard.stripe.com/test/payments) in the Stripe Dashboard. The list starts with a €10.00 payment with the status **Succeeded**.

## Step 7: Pay with 3D Secure

Some banks ask the customer to confirm a payment, for example in their banking app. Stripe's test cards can play that part.

Reload the page, so your server creates a new PaymentIntent. The one you just paid is finished.

Enter the card number `4000 0025 0000 3155`, with the same expiration date, security code and postal code as before, and click **Pay €10**.

A window titled **3D Secure 2 Test Page** opens over your app, with the buttons **Fail** and **Complete**. Click **Complete**. The window closes and the text under the button reads:

```text
Payment succeeded
```

## Step 8: Pay with a declined card

Reload the page. Enter the card number `4000 0000 0000 0002`, with the same details as before, and click **Pay €10**.

This time the bank declines the card. The Payment Element marks the card number in red with **Your card was declined.**, and the text under your button reads:

```text
Your card has been declined.
```

<img src="/tutorial/card-declined.webp" width="460" style="border: 1px solid var(--vp-c-divider); border-radius: 8px" alt="The card form with 4000 0000 0000 0002 marked in red, the message Your card was declined, and Your card has been declined under the Pay €10 button">

The browser console shows a request that failed with status 402: that is Stripe's answer for a declined card.

More cards that decline in specific ways are in [Test your integration](/guide/testing#declines-and-errors).

The PaymentIntent stays open after a decline, so the customer can try another card. Replace the card number with `4242 4242 4242 4242` and click **Pay €10** again, without reloading. The text under the button reads:

```text
Payment succeeded
```

## What you built

You built a payment page in four parts:

- `server.mjs` creates a €10 PaymentIntent with your secret key each time the page loads. Vite's dev server forwards the app's `/api` requests to it.
- `VueStripeProvider` loads Stripe.js with your publishable key.
- `VueStripeElements` connects the Payment Element to the PaymentIntent's client secret, and `VueStripePaymentElement` shows the card form.
- `PayButton.vue` confirms the payment with `usePaymentIntent()`, which also handled the 3D Secure window and the decline message.

To learn why the components nest this way, read [How Vue Stripe works](/guide/architecture).

Stop both servers with <kbd>Ctrl</kbd>+<kbd>C</kbd> in each terminal.

## Next steps

- [Choosing an integration](/guide/approaches): the Payment Element compared with Stripe Checkout and the other options.
- [Accept a payment with the Payment Element](/guide/payment-element): the same flow for a production app, with a return page for payment methods that redirect.
- [Add Apple Pay, Google Pay and Link](/guide/express-checkout): wallet buttons next to the card form.
- [Save a payment method for later](/guide/setup-intent): collect a card now and charge it later.
- [Redirect to Stripe Checkout](/guide/checkout): let Stripe host the whole payment page.
- [Install and set up](/guide/installation): add Vue Stripe to an existing app.
- [Handle errors and declines](/guide/error-handling): show each kind of error the way your customers need it.
- [Fulfil orders with webhooks](/guide/webhooks): act on payments on your server, not in the browser.
- [Test your integration](/guide/testing): every test card, bank account and wallet setup.
