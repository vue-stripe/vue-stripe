---
description: "Verify a customer's identity in Vue with Stripe Identity: create a VerificationSession on your server and open the verification modal with useIdentity."
---

# Verify a customer's identity

Ask a customer to verify who they are with [Stripe Identity](https://docs.stripe.com/identity): Stripe's modal captures an ID document (and optionally a selfie), and your server receives the outcome. In the browser, [`useIdentity`](/api/composables/use-identity) opens the modal; no Elements group is needed.

Before you start, activate Identity in the Stripe Dashboard. Try the flow in the [Identity demo](/live-demo/identity).

## 1. Create a VerificationSession on the server

Create a new session for every attempt, linked to your user so you can match the outcome later:

```js
// POST /api/identity-session (Node, stripe-node)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/identity-session', async (req, res) => {
  const verificationSession = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { userId: req.user.id }
  })
  res.json({ clientSecret: verificationSession.client_secret })
})
```

`type: 'document'` checks an ID document. Add `options: { document: { require_matching_selfie: true } }` to also compare a selfie with the document photo.

## 2. Open the verification modal

Call `verifyIdentity()` with the session's client secret from a component inside `VueStripeProvider`:

```vue
<!-- VerifyButton.vue: rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { ref } from 'vue'
import { useIdentity } from '@vue-stripe/vue-stripe'

const { verifyIdentity, loading, error } = useIdentity()
const submitted = ref(false)
const cancelled = ref(false)

async function verify() {
  cancelled.value = false
  const response = await fetch('/api/identity-session', { method: 'POST' })
  const { clientSecret } = await response.json()

  const result = await verifyIdentity(clientSecret)
  if (!result.error) {
    submitted.value = true
    return
  }
  // The customer closed the modal: not an error worth showing
  if ('code' in result.error && result.error.code === 'session_cancelled') cancelled.value = true
}
</script>

<template>
  <p v-if="submitted">Thanks. We will let you know when your identity is verified.</p>
  <template v-else>
    <button :disabled="loading" @click="verify">Verify my identity</button>
    <p v-if="cancelled">You closed the verification. Start again when you are ready.</p>
    <p v-else-if="error">{{ error }}</p>
  </template>
</template>
```

`verifyIdentity()` resolves when the customer submits or closes the modal:

- **No `error`**: the customer submitted their details. This is not the outcome yet; Stripe checks them after submission.
- **`error.code === 'session_cancelled'`**: the customer closed the modal. Offer to start again with a new session.
- **Other codes** (`consent_declined`, `device_unsupported`, ...): the verification cannot go ahead; the [`useIdentity` reference](/api/composables/use-identity) lists them.

## 3. Get the outcome on the server

Listen for the VerificationSession events in your [webhook handler](/guide/webhooks):

| Event | Meaning |
|-------|---------|
| `identity.verification_session.verified` | All checks passed. Mark the user (from `metadata.userId`) as verified. |
| `identity.verification_session.requires_input` | A check failed or could not be completed; `last_error` says why. Ask the user to try again. |
| `identity.verification_session.processing` | Stripe is still checking the submitted details. |

You can also retrieve the session on your server (`stripe.identity.verificationSessions.retrieve(id)`) and read its `status`.

## Test it

With test-mode keys, the modal offers **Complete with test data**: pick an outcome, such as a successful verification, and submit. No real document or camera is needed, and the matching webhook event is sent.

## Result

The customer verifies their identity in Stripe's modal without leaving your page, and your server learns the outcome from a webhook.
