<script setup lang="ts">
import { inject } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Label
} from '@/components/ui'
import CreatePaymentMethodDemo from '@/components/convenience/CreatePaymentMethodDemo.vue'
import CreatePaymentMethodElementDemo from '@/components/convenience/CreatePaymentMethodElementDemo.vue'
import RetrievePaymentIntentDemo from '@/components/convenience/RetrievePaymentIntentDemo.vue'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Convenience Composables</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground">
          <code>useCreatePaymentMethod()</code>, <code>useHandleNextAction()</code>, and the
          <code>retrievePaymentIntent()</code> / <code>retrieveSetupIntent()</code> helpers wrap the
          raw Stripe instance for common one-off operations. The interactive demos below cover
          <code>createPaymentMethod()</code> and <code>retrievePaymentIntent()</code>;
          <code>useHandleNextAction()</code> requires a PaymentIntent in
          <code>requires_action</code>
          (e.g. 3D&nbsp;Secure) and is documented in the API reference.
        </p>
      </CardContent>
    </Card>

    <Alert v-if="!stripeConfig?.publishableKey" variant="warning">
      <AlertDescription>
        No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
      </AlertDescription>
    </Alert>

    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">useCreatePaymentMethod()</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground mb-4 text-sm">
            Enter a test card (e.g. <code>4242 4242 4242 4242</code>) and create a PaymentMethod.
          </p>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements>
              <CreatePaymentMethodDemo />
            </VueStripeElements>
          </VueStripeProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">useCreatePaymentMethod() — Payment Element</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground mb-4 text-sm">
            Deferred Payment Element flow. <code>createPaymentMethod()</code> is called with no
            arguments, so it auto-injects the Elements instance and runs
            <code>elements.submit()</code> first.
          </p>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements mode="payment" currency="usd" :amount="1099">
              <CreatePaymentMethodElementDemo />
            </VueStripeElements>
          </VueStripeProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">retrievePaymentIntent()</CardTitle>
        </CardHeader>
        <CardContent>
          <Label class="mb-2 block text-sm">PaymentIntent client secret</Label>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <RetrievePaymentIntentDemo />
          </VueStripeProvider>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
