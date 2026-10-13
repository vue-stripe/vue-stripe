# Accept ACH Direct Debit

Take a payment from a US bank account. The customer links the account in Stripe's Financial Connections modal, accepts a mandate, and the payment settles in a few business days. No Elements group is needed: Stripe's modal collects the account.

Vue Stripe covers the browser side with two composables: `collectBankAccountForPayment()` from [`useFinancialConnections`](/api/composables/use-financial-connections) and [`useConfirmUsBankAccountPayment`](/api/composables/confirm/bank-debits#useconfirmusbankaccountpayment). Try the flow in the [ACH Direct Debit demo](/live-demo/ach-debit).

Before you start, enable ACH Direct Debit under **Settings > Payment methods** in the Stripe Dashboard. ACH charges are in USD only.

::: tip Using the Payment Element?
The Payment Element offers US bank accounts among its methods, and `usePaymentIntent` confirms them like any other method. Follow this guide when you want a bank-only flow without Elements.
:::

## 1. Create a PaymentIntent on the server

```js
// POST /api/ach-payment-intent (Node, stripe-node)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post('/api/ach-payment-intent', async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1000, // decide the amount on the server
    currency: 'usd',
    payment_method_types: ['us_bank_account'],
    payment_method_options: {
      us_bank_account: {
        financial_connections: { permissions: ['payment_method'] }
      }
    }
  })
  res.json({ clientSecret: paymentIntent.client_secret })
})
```

By default Stripe verifies the account instantly through Financial Connections and falls back to micro-deposits when the customer enters the account number by hand (step 4). Set `verification_method: 'instant'` in `payment_method_options.us_bank_account` to allow instant verification only.

## 2. Link the bank account

Call `collectBankAccountForPayment()` from a component inside `VueStripeProvider`. It opens Stripe's modal and resolves when the customer finishes or closes it. Stripe requires the account holder's name; the email is recommended.

```vue
<!-- AchPayment.vue: rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { ref } from 'vue'
import { useFinancialConnections, useConfirmUsBankAccountPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const { collectBankAccountForPayment, loading: linking, error: linkError } =
  useFinancialConnections()
const { confirmUsBankAccountPayment, loading: confirming, error: confirmError } =
  useConfirmUsBankAccountPayment()

const name = ref('')
const email = ref('')
const linked = ref(false)
const status = ref('')

async function linkAccount() {
  const { paymentIntent, error } = await collectBankAccountForPayment({
    clientSecret: props.clientSecret,
    params: {
      payment_method_type: 'us_bank_account',
      payment_method_data: { billing_details: { name: name.value, email: email.value } }
    }
  })
  if (error) return
  // Closing the modal without linking leaves the PaymentIntent in requires_payment_method
  linked.value = paymentIntent?.status === 'requires_confirmation'
}

async function pay() {
  const { paymentIntent } = await confirmUsBankAccountPayment(props.clientSecret)
  if (paymentIntent) status.value = paymentIntent.status
}
</script>

<template>
  <form v-if="!linked" @submit.prevent="linkAccount">
    <input v-model="name" placeholder="Account holder name" required />
    <input v-model="email" type="email" placeholder="Email" required />
    <button :disabled="linking">Link bank account</button>
  </form>

  <div v-else-if="!status">
    <p>
      By clicking Pay, you authorize Example Inc. to debit the bank account above for $10.00
      through ACH Direct Debit, in accordance with these terms. You can revoke this
      authorization by contacting us.
    </p>
    <button :disabled="confirming" @click="pay">Pay $10.00</button>
  </div>

  <p v-else-if="status === 'processing'">Payment submitted. It settles in a few business days.</p>
  <p v-else-if="status === 'requires_action'">Check your email to verify the account.</p>
  <p v-if="linkError || confirmError">{{ linkError || confirmError }}</p>
</template>
```

## 3. Show the mandate and confirm

Before you confirm, show the customer the mandate text and get their agreement; the Pay button above does both. Replace the example wording with your own: Stripe's [ACH mandate guidance](https://docs.stripe.com/payments/ach-direct-debit/accept-a-payment) lists what it must contain.

`confirmUsBankAccountPayment(clientSecret)` records the mandate and starts the debit. The PaymentIntent moves to `processing` and becomes `succeeded` or `requires_payment_method` (failed) later, usually within four business days ([Payments that settle later](/guide/payment-objects#payments-that-settle-later)). Fulfil the order from the `payment_intent.succeeded` [webhook](/guide/webhooks), and handle `payment_intent.payment_failed`.

`useConfirmUsBankAccountPayment` rejects when Stripe.js throws, like the Stripe.js method it wraps; wrap the call in `try` / `catch` if you need to handle that. See [Handle errors and declines](/guide/error-handling).

## 4. Verify with micro-deposits

When the customer enters the routing and account number by hand instead of logging in to the bank, Stripe verifies the account with micro-deposits. After confirming, the PaymentIntent is in `requires_action` with `next_action.type === 'verify_with_microdeposits'`, and Stripe sends two small deposits (or one with a code) that arrive in one to two business days.

Stripe emails the customer a link to its hosted verification page by default (`next_action.verify_with_microdeposits.hosted_verification_url`). To verify on your own page instead, collect the amounts or the code and pass them to [`useVerifyMicrodepositsForPayment`](/api/composables/use-verify-microdeposits-for-payment):

```vue
<!-- VerifyAccount.vue: rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { ref } from 'vue'
import { useVerifyMicrodepositsForPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()
const { verifyMicrodepositsForPayment, loading, error } = useVerifyMicrodepositsForPayment()
const descriptorCode = ref('')
const verified = ref(false)

async function verify() {
  const { paymentIntent } = await verifyMicrodepositsForPayment(props.clientSecret, {
    descriptor_code: descriptorCode.value // or: amounts: [32, 45]
  })
  verified.value = paymentIntent?.status === 'processing'
}
</script>

<template>
  <p v-if="verified">Account verified. Your payment is processing.</p>
  <form v-else @submit.prevent="verify">
    <input v-model="descriptorCode" placeholder="SMxxxx code from your bank statement" required />
    <button :disabled="loading">Verify</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
```

## 5. Save the account for later payments

To save the bank account without charging it, create a SetupIntent with `payment_method_types: ['us_bank_account']`, link the account with `collectBankAccountForSetup()` from the same composable, and confirm with `useConfirmUsBankAccountSetup`. Micro-deposits for a SetupIntent are verified with [`useVerifyMicrodepositsForSetup`](/api/composables/use-verify-microdeposits-for-setup).

## Test it

In the test-mode modal, pick **Test (Non-OAuth)**, accept the terms and choose the **Success** account. To test micro-deposits, enter the details by hand with routing number `110000000` and account number `000123456789`, then verify with the amounts `32` and `45` or the code `SM11AA`. More test accounts are in [Test your integration](/guide/testing#ach-direct-debit-us).

## Result

The customer links a US bank account, accepts the mandate, and the payment moves to `processing`. Your webhook handler fulfils the order once it succeeds.
