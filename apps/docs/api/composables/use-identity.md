---
description: "useIdentity reference: open Stripe Identity's verification modal for a VerificationSession from a Vue component and read the result."
---

# useIdentity

Verify a customer's identity with [Stripe Identity](https://docs.stripe.com/identity). Wraps [`stripe.verifyIdentity()`](https://docs.stripe.com/js/identity/modal), which opens Stripe's Identity modal for a VerificationSession and resolves when the customer submits or closes it. [Verify a customer's identity](/guide/identity) shows the server and client steps.

Must be called within a `<VueStripeProvider>` or an app using [`createVueStripe()`](/api/plugin). No `<VueStripeElements>` is needed. Create the [VerificationSession](https://docs.stripe.com/api/identity/verification_sessions) on your server and pass its client secret.

::: tip Live demo
The [Identity Verification demo](/live-demo/identity) opens the verification modal with a server-created VerificationSession.
:::

## Usage

```vue
<script setup>
import { useIdentity } from '@vue-stripe/vue-stripe'

const { verifyIdentity, loading, error } = useIdentity()

// clientSecret of a VerificationSession created on your server
const verify = async (clientSecret) => {
  const { error } = await verifyIdentity(clientSecret)
  if (error) return
  // The customer submitted their details. Listen for the identity.verification_session.*
  // webhooks on your server for the outcome.
}
</script>

<template>
  <button :disabled="loading" @click="verify(sessionClientSecret)">Verify my identity</button>
  <p v-if="error">{{ error }}</p>
</template>
```

A submitted verification resolves without an `error`. Check `result.error` rather than `result.verificationSession`: `@stripe/stripe-js` types the success result as `{ verificationSession }`, but Stripe.js 10 (sandbox, October 2026) resolves `{ error: null }` with no session object. Fetch the VerificationSession on your server for its status.

When the verification does not go ahead, Stripe resolves with an `error`, which also lands on the `error` ref. If the customer closes the modal, Stripe returns `{ error: { type: 'user_action', code: 'session_cancelled' } }` with no `message`, so the `error` ref falls back to `'Failed to verify identity'`; branch on `result.error.code` to tell a cancel apart. Stripe documents these other codes:

| `error.code` | Meaning |
|--------------|---------|
| `consent_declined` | The customer declined verification by Stripe. |
| `device_unsupported` | The verification needs a camera and the device has none. |
| `under_supported_age` | The customer is under the age of majority. |
| `phone_otp_declined` | The customer could not verify the provided phone number. |
| `email_verification_declined` | The customer could not verify the provided email address. |

## Return Value

```ts
interface UseIdentityReturn {
  verifyIdentity: (clientSecret: string) => Promise<VerifyIdentityResult>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
}

type VerifyIdentityResult = VerificationSessionResult | VueStripeErrorResult
```

| Property | Type | Description |
|----------|------|-------------|
| `verifyIdentity` | `(clientSecret: string) => Promise<VerifyIdentityResult>` | Opens the Identity modal; resolves to Stripe's result once the customer submits (no `error`) or stops (`{ error }`). |
| `loading` | `Readonly<Ref<boolean>>` | `true` while the modal is open. |
| `error` | `Readonly<Ref<string \| null>>` | The error message of the last call, or `null`. Cleared when a new call starts. |

When Stripe.js is not available (the plugin's load failed, for example; a call made while it loads waits for it), or the Stripe call throws, `verifyIdentity` does not reject: it resolves to a `VueStripeErrorResult`, `{ error: { message } }` (e.g. `{ error: { message: 'Stripe not initialized' } }`), so one `if (result.error)` check covers every failure.

## TypeScript

```ts
import { useIdentity } from '@vue-stripe/vue-stripe'
import type { VerifyIdentityResult } from '@vue-stripe/vue-stripe'

const { verifyIdentity } = useIdentity()

const run = async (clientSecret: string): Promise<VerifyIdentityResult> => {
  const result = await verifyIdentity(clientSecret)
  if (result.error) console.error(result.error.message)
  return result
}
```

## See Also

- [Verify a customer's identity](/guide/identity) - Server and client steps
- [Test your integration](/guide/testing#identity) - Test verification outcomes
- [Live demo](/live-demo/identity)
- [Stripe Identity docs](https://docs.stripe.com/identity)
