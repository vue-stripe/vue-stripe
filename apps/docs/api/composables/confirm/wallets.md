# Wallet confirmers

Confirm a PaymentIntent or SetupIntent with a wallet or app-based method: Alipay, Amazon Pay, BLIK, Cash App Pay, GrabPay, MobilePay, PayNow, PayPal, Pix, PromptPay, TWINT and WeChat Pay. Depending on the method, Stripe redirects to the wallet and back to your `return_url`, shows a QR code, or waits for the customer to approve in their banking app (BLIK).

Each composable returns the Stripe.js method under its own name plus `loading` and `error`; see [Method confirmers](/api/composables/confirm/) for the shared behavior. Call it in a component inside [`VueStripeProvider`](/api/components/stripe-provider).

## When to use

The [Express Checkout Element](/api/components/stripe-express-checkout-element) and the [Payment Element](/api/components/stripe-payment-element) offer the wallets enabled on your account in one integration; confirm the Payment Element with [`usePaymentIntent`](/api/composables/use-payment-intent) / [`useSetupIntent`](/api/composables/use-setup-intent). Use these confirmers for a dedicated button per wallet.

## Example

```vue
<!-- PayWithPayPal.vue: rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { useConfirmPayPalPayment } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret: string }>()

const { confirmPayPalPayment, loading, error } = useConfirmPayPalPayment()

const pay = () =>
  confirmPayPalPayment(props.clientSecret, {
    return_url: `${window.location.origin}/checkout/complete`
  })
</script>

<template>
  <button :disabled="loading" @click="pay">Pay with PayPal</button>
  <p v-if="error">{{ error }}</p>
</template>
```

BLIK takes the six-digit code from the customer's banking app and resolves once they approve the payment there:

```ts
const { confirmBlikPayment } = useConfirmBlikPayment()
const { paymentIntent } = await confirmBlikPayment(clientSecret, {
  payment_method: { blik: {}, billing_details: { email: 'jenny@example.com' } },
  payment_method_options: { blik: { code: '777123' } }
})
```

## Composables

### useConfirmAlipayPayment

Wraps [`stripe.confirmAlipayPayment()`](https://docs.stripe.com/js/payment_intents/confirm_alipay_payment). Use `stripe.confirmAlipayPayment` in the [Alipay Payments](https://docs.stripe.com/payments/alipay) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmAlipayPayment, loading, error } = useConfirmAlipayPayment()

// Stripe.js signature
confirmAlipayPayment(
  clientSecret: string,
  data?: ConfirmAlipayPaymentData,
  options?: ConfirmAlipayPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmAmazonPaySetup

Wraps [`stripe.confirmAmazonPaySetup()`](https://docs.stripe.com/js/setup_intents/confirm_amazon_pay_setup). Use `stripe.confirmAmazonPaySetup` in the [Set up future payments](https://docs.stripe.com/payments/amazon-pay/set-up-future-payments) flow when the customer submits your payment form. When called, it will confirm a `SetupIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmAmazonPaySetup, loading, error } = useConfirmAmazonPaySetup()

// Stripe.js signature
confirmAmazonPaySetup(
  clientSecret: string,
  data?: ConfirmAmazonPaySetupData
): Promise<SetupIntentResult>
```

### useConfirmBlikPayment

Wraps [`stripe.confirmBlikPayment()`](https://docs.stripe.com/js/payment_intents/confirm_blik_payment). Use `stripe.confirmBlikPayment` in the [BLIK Payments with Payment Methods](https://docs.stripe.com/payments/blik) flow when the customer submits your payment form. When called, it will confirm the PaymentIntent with data you provide, and it will automatically prompt the customer to authorize the transaction.

```ts
const { confirmBlikPayment, loading, error } = useConfirmBlikPayment()

// Stripe.js signature
confirmBlikPayment(
  clientSecret: string,
  data: ConfirmBlikPaymentData,
  options?: ConfirmBlikPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmBlikSetup

Wraps [`stripe.confirmBlikSetup()`](https://docs.stripe.com/js/setup_intents/confirm_blik_setup). Use `stripe.confirmBlikSetup` when the customer submits a custom BLIK setup form. When called, it confirms the [SetupIntent](https://docs.stripe.com/api/setup_intents) with the BLIK code and billing details in `data`, then waits for the customer to authorize the mandate in their banking app.

```ts
const { confirmBlikSetup, loading, error } = useConfirmBlikSetup()

// Stripe.js signature
confirmBlikSetup(
  clientSecret: string,
  data: ConfirmBlikSetupData,
  options?: ConfirmBlikSetupOptions
): Promise<SetupIntentResult>
```

### useConfirmCashappPayment

Wraps [`stripe.confirmCashappPayment()`](https://docs.stripe.com/js/payment_intents/confirm_cashapp_payment). Use `stripe.confirmCashappPayment` in the [Cash App Payments](https://docs.stripe.com/payments/cash-app-pay) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmCashappPayment, loading, error } = useConfirmCashappPayment()

// Stripe.js signature
confirmCashappPayment(
  clientSecret: string,
  data?: ConfirmCashappPaymentData,
  options?: ConfirmCashappPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmCashappSetup

Wraps [`stripe.confirmCashappSetup()`](https://docs.stripe.com/js/payment_intents/confirm_cashapp_setup). Use `stripe.confirmCashappSetup` in the [Setup Intents API flow](https://docs.stripe.com/payments/save-and-reuse) when the customer submits your payment form. When called, it will confirm the [SetupIntent](https://docs.stripe.com/api/setup_intents) with `data` you provide.

```ts
const { confirmCashappSetup, loading, error } = useConfirmCashappSetup()

// Stripe.js signature
confirmCashappSetup(
  clientSecret: string,
  data?: ConfirmCashappSetupData,
  options?: ConfirmCashappSetupOptions
): Promise<SetupIntentResult>
```

### useConfirmGrabPayPayment

Wraps [`stripe.confirmGrabPayPayment()`](https://docs.stripe.com/js/payment_intents/confirm_grabpay_payment). Use `stripe.confirmGrabPayPayment` in the [GrabPay payments](https://docs.stripe.com/payments/grabpay) flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents).

```ts
const { confirmGrabPayPayment, loading, error } = useConfirmGrabPayPayment()

// Stripe.js signature
confirmGrabPayPayment(
  clientSecret: string,
  data?: ConfirmGrabPayPaymentData,
  options?: ConfirmGrabPayPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmMobilepayPayment

Wraps [`stripe.confirmMobilepayPayment()`](https://docs.stripe.com/js/payment_intents/confirm_mobilepay_payment). Use `stripe.confirmMobilepayPayment` in the [Mobilepay Payments](https://docs.stripe.com/payments/mobilepay) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmMobilepayPayment, loading, error } = useConfirmMobilepayPayment()

// Stripe.js signature
confirmMobilepayPayment(
  clientSecret: string,
  data?: ConfirmMobilepayPaymentData,
  options?: ConfirmMobilepayPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmPayNowPayment

Wraps `stripe.confirmPayNowPayment()`. Use `stripe.confirmPayNowPayment` in the [PayNow Payments](https://docs.stripe.com/payments/paynow) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmPayNowPayment, loading, error } = useConfirmPayNowPayment()

// Stripe.js signature
confirmPayNowPayment(
  clientSecret: string,
  data?: ConfirmPayNowPaymentData,
  options?: ConfirmPayNowPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmPayPalPayment

Wraps [`stripe.confirmPayPalPayment()`](https://docs.stripe.com/js/payment_intents/confirm_paypal_payment). Use `stripe.confirmPayPalPayment` in the [PayPal Payments](https://docs.stripe.com/payments/paypal) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmPayPalPayment, loading, error } = useConfirmPayPalPayment()

// Stripe.js signature
confirmPayPalPayment(
  clientSecret: string,
  data?: ConfirmPayPalPaymentData
): Promise<PaymentIntentResult>
```

### useConfirmPayPalSetup

Wraps [`stripe.confirmPayPalSetup()`](https://docs.stripe.com/js/setup_intents/confirm_paypal_setup). Use `stripe.confirmPayPalSetup` in the [Set up future payments](https://docs.stripe.com/payments/paypal/set-up-future-payments) flow when the customer submits your payment form. When called, it will confirm a `SetupIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmPayPalSetup, loading, error } = useConfirmPayPalSetup()

// Stripe.js signature
confirmPayPalSetup(
  clientSecret: string,
  data?: ConfirmPayPalSetupData
): Promise<SetupIntentResult>
```

### useConfirmPixPayment

Wraps [`stripe.confirmPixPayment()`](https://docs.stripe.com/js/payment_intents/confirm_pix_payment). Use `stripe.confirmPixPayment` in the [Pix Payments](https://docs.stripe.com/payments/pix) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmPixPayment, loading, error } = useConfirmPixPayment()

// Stripe.js signature
confirmPixPayment(
  clientSecret: string,
  data?: ConfirmPixPaymentData,
  options?: ConfirmPixPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmPromptPayPayment

Wraps `stripe.confirmPromptPayPayment()`. Use `stripe.confirmPromptPayPayment` in the [PromptPay Payments](https://docs.stripe.com/payments/promptpay) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmPromptPayPayment, loading, error } = useConfirmPromptPayPayment()

// Stripe.js signature
confirmPromptPayPayment(
  clientSecret: string,
  data?: ConfirmPromptPayPaymentData,
  options?: ConfirmPromptPayPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmTwintPayment

Wraps [`stripe.confirmTwintPayment()`](https://docs.stripe.com/js/payment_intents/confirm_twint_payment). Use `stripe.confirmTwintPayment` in the [TWINT Payments with Payment Methods](https://docs.stripe.com/payments/twint) flow when the customer submits your payment form. When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.

```ts
const { confirmTwintPayment, loading, error } = useConfirmTwintPayment()

// Stripe.js signature
confirmTwintPayment(
  clientSecret: string,
  data?: ConfirmTwintPaymentData,
  options?: ConfirmTwintPaymentOptions
): Promise<PaymentIntentResult>
```

### useConfirmWechatPayPayment

Wraps [`stripe.confirmWechatPayPayment()`](https://docs.stripe.com/js/payment_intents/confirm_wechat_pay_payment). Use `stripe.confirmWechatPayPayment` in the [Wechat Pay Payments](https://docs.stripe.com/payments/wechat-pay) with Payment Methods flow when the customer submits your payment form. When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents) with `data` you provide.

```ts
const { confirmWechatPayPayment, loading, error } = useConfirmWechatPayPayment()

// Stripe.js signature
confirmWechatPayPayment(
  clientSecret: string,
  data?: ConfirmWechatPayPaymentData,
  options?: ConfirmWechatPayPaymentOptions
): Promise<PaymentIntentResult>
```
