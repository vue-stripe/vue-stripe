# Checkout Form

The Checkout Form puts Stripe's **complete checkout form** on your page: contact details, addresses, shipping, tax ID, express checkout wallets, the payment method, the order total and the Pay button come as one element. A **Checkout Session** keeps the order, so Stripe calculates totals, tax, discounts and shipping. Stripe.js exposes it as the Checkout Form SDK (`stripe.initCheckoutFormSdk()`, `ui_mode: 'form'`).

::: warning Beta: requires Stripe access
The Checkout Form is a Stripe beta. Your Stripe account needs access to `ui_mode: 'form'`; contact [Stripe support](https://support.stripe.com/). Some options have their own gate: the `compact` layout is a separate private preview. Without access, Stripe's error appears in the component's `#error` slot instead of the form.
:::

## Which Checkout Should I Use?

| Approach | Where the customer pays | Who renders the form | Code you write |
|----------|------------------------|----------------------|----------------|
| [Stripe Checkout](/guide/checkout) | `checkout.stripe.com` | Stripe | A redirect |
| **Checkout Form** (beta) | Your page | Stripe, as one element | Provider, form, confirm handler |
| [Custom Checkout](/guide/custom-checkout) | Your page | You, with individual Elements | Every field and the Pay button |

Choose the Checkout Form when you want the customer to stay on your page but do not need to arrange the fields yourself.

## How It Works

```mermaid
sequenceDiagram
    participant Browser
    participant Server
    participant Stripe
    Browser->>Server: POST /checkout-session
    Server->>Stripe: checkout.sessions.create({ ui_mode: 'form' })
    Stripe-->>Server: session.client_secret
    Server-->>Browser: clientSecret
    Browser->>Stripe: initCheckoutFormSdk({ clientSecret }), createForm()
    Note over Browser: Customer fills the form and clicks Pay
    Browser->>Browser: VueStripeCheckoutForm @confirm(event)
    Browser->>Stripe: confirm({ formConfirmEvent: event })
    Stripe-->>Browser: success, or redirect to return_url
```

## Step 1: Create the Session (Server)

Create the session with `ui_mode: 'form'` and a `return_url`. `ui_mode: 'form'` needs Stripe API version `2026-03-25.dahlia` or later; older versions answer *"Invalid ui_mode: form"*.

```js
// Node.js (Express-style handler)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'form',
    mode: 'payment',
    line_items: [{ price: 'price_123', quantity: 1 }],
    return_url: 'https://example.com/checkout/complete?session_id={CHECKOUT_SESSION_ID}'
  })

  res.json({ clientSecret: session.client_secret })
})
```

## Step 2: Wrap the Page in the Provider

`VueStripeCheckoutFormProvider` calls `stripe.initCheckoutFormSdk()` and makes the session available to the components inside it. `client-secret` accepts a string or a **Promise**, so the form can mount while the session is being created.

```vue
<!-- CheckoutPage.vue -->
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutFormProvider
      :client-secret="clientSecret"
      :appearance="{ theme: 'stripe' }"
    >
      <template #error="{ error }">
        <p class="error">{{ error }}</p>
      </template>
      <PayForm />
    </VueStripeCheckoutFormProvider>
  </VueStripeProvider>
</template>

<script setup>
import { VueStripeProvider, VueStripeCheckoutFormProvider } from '@vue-stripe/vue-stripe'
import PayForm from './PayForm.vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const clientSecret = fetch('/api/checkout-session', { method: 'POST' })
  .then((res) => res.json())
  .then((data) => data.clientSecret)
</script>
```

## Step 3: Render the Form and Confirm

`VueStripeCheckoutForm` renders the whole form, including the Pay button. When the customer clicks Pay (or authorizes a wallet), the form emits `@confirm`. Pass that event to `confirm()` from `useCheckoutForm()`:

```vue
<!-- PayForm.vue -->
<template>
  <VueStripeCheckoutForm :options="{ layout: 'expanded' }" @confirm="onConfirm" />
  <p v-if="message">{{ message }}</p>
</template>

<script setup>
import { ref } from 'vue'
import { VueStripeCheckoutForm, useCheckoutForm } from '@vue-stripe/vue-stripe'

const { confirm } = useCheckoutForm()
const message = ref('')

const onConfirm = async (event) => {
  // The session has return_url, so no returnUrl here.
  // redirect: 'if_required' keeps card payments on this page.
  const result = await confirm({ formConfirmEvent: event, redirect: 'if_required' })
  message.value =
    result.type === 'error' ? result.error.message : `Payment ${result.session.status.type}`
}
</script>
```

Nothing is charged until you call `confirm`. Payment methods that need a redirect (bank authentication, some wallets) leave the page and come back to `return_url`.

## Reading the Form

`@change` reports whether the form is complete and its current values; `getValue()` on a template ref reads them on demand:

```vue
<script setup>
import { ref } from 'vue'

const formRef = ref(null)
const complete = ref(false)

const onChange = (event) => {
  complete.value = event.complete
}

const readEmail = async () => {
  const value = await formRef.value?.getValue()
  console.log(value?.value.customerDetails.email)
}
</script>

<template>
  <VueStripeCheckoutForm ref="formRef" @change="onChange" @confirm="onConfirm" />
</template>
```

In the `compact` layout (private preview), the change event also lists the form's `views`; call `formRef.value.setView(index)` to move between them.

## Currency Selector

With [Adaptive Pricing](https://docs.stripe.com/payments/checkout/adaptive-pricing), the form shows its own currency picker. To place it elsewhere on the page, render a `VueStripeCurrencySelectorElement` inside the provider; the form then leaves its built-in picker out:

```vue
<VueStripeCheckoutFormProvider :client-secret="clientSecret">
  <VueStripeCurrencySelectorElement />
  <VueStripeCheckoutForm @confirm="onConfirm" />
</VueStripeCheckoutFormProvider>
```

No other element component works inside `VueStripeCheckoutFormProvider`: the form already contains them.

## Session Actions

The form collects the email, phone number, addresses and tax ID itself, so `useCheckoutForm()` has no `updateEmail` or address updates. It keeps the actions that change the order: `applyPromotionCode`, `updateLineItemQuantity`, `updateShippingOption`, `addOptionalLineItem` / `removeOptionalLineItem` and `runServerUpdate`. The full list is in the [useCheckoutForm API](/api/composables/use-checkout-form).

## Next Steps

- [VueStripeCheckoutFormProvider API](/api/components/stripe-checkout-form-provider)
- [VueStripeCheckoutForm API](/api/components/stripe-checkout-form)
- [useCheckoutForm API](/api/composables/use-checkout-form)
- [Live demo](/live-demo/checkout-form): pay with the Checkout Form in this site's sandbox
- [Custom Checkout](/guide/custom-checkout): build the form from individual elements instead
