<script setup lang="ts">
import { inject } from 'vue'
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import { Card, CardHeader, CardTitle, CardContent, Alert, AlertDescription } from '@/components/ui'
import PaymentRequestDemo from '@/components/wallet/PaymentRequestDemo.vue'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Payment Request API</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <p class="text-muted-foreground">
          <code>usePaymentRequest()</code> wraps <code>stripe.paymentRequest()</code>: it checks for
          Apple Pay, Google Pay, Link or a browser-saved card with <code>canMakePayment()</code>,
          opens the browser's payment interface with <code>show()</code> from your own button, and
          detaches its event handlers on unmount.
        </p>
        <Alert variant="info">
          <AlertDescription>
            Stripe recommends the Express Checkout Element for new integrations. Stripe.js 10
            removed the Payment Request Button element; this composable keeps custom-button
            integrations working.
          </AlertDescription>
        </Alert>
        <p class="text-sm text-muted-foreground">
          Wallets need HTTPS or localhost and a browser with a wallet or saved card. Headless and
          private windows report no wallet (<code>canMakePayment</code> is <code>null</code>).
        </p>
      </CardContent>
    </Card>

    <Alert v-if="!stripeConfig?.publishableKey" variant="warning">
      <AlertDescription>
        No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
      </AlertDescription>
    </Alert>

    <Card v-else>
      <CardHeader>
        <CardTitle class="text-lg">usePaymentRequest()</CardTitle>
      </CardHeader>
      <CardContent>
        <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
          <PaymentRequestDemo />
        </VueStripeProvider>
      </CardContent>
    </Card>
  </div>
</template>
