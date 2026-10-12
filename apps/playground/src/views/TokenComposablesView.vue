<script setup lang="ts">
import { inject } from 'vue'
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import { Card, CardHeader, CardTitle, CardContent, Alert, AlertDescription } from '@/components/ui'
import CreateTokenDemo from '@/components/tokens/CreateTokenDemo.vue'
import CreateConfirmationTokenDemo from '@/components/tokens/CreateConfirmationTokenDemo.vue'
import RadarSessionDemo from '@/components/tokens/RadarSessionDemo.vue'
import IntentActionsDemo from '@/components/tokens/IntentActionsDemo.vue'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Token Composables</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground">
          <code>useCreateToken()</code>, <code>useCreateConfirmationToken()</code>,
          <code>useRadarSession()</code>, <code>useHandleCardAction()</code>,
          <code>useVerifyMicrodepositsForPayment()</code> /
          <code>useVerifyMicrodepositsForSetup()</code> and <code>useEphemeralKeyNonce()</code> each
          wrap one Stripe.js method and return it with <code>loading</code> and <code>error</code>.
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
          <CardTitle class="text-lg">useCreateToken() with the Card Element</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground mb-4 text-sm">
            Enter a test card (e.g. <code>4242 4242 4242 4242</code>) and create a Token.
          </p>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements>
              <CreateTokenDemo />
            </VueStripeElements>
          </VueStripeProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg"
            >useCreateConfirmationToken() with the Payment Element</CardTitle
          >
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground mb-4 text-sm">
            Deferred Payment Element. <code>createConfirmationToken()</code> uses the injected
            Elements instance and runs <code>elements.submit()</code> first; send the token to your
            server to confirm there.
          </p>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements mode="payment" currency="usd" :amount="1099">
              <CreateConfirmationTokenDemo />
            </VueStripeElements>
          </VueStripeProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">useRadarSession()</CardTitle>
        </CardHeader>
        <CardContent>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <RadarSessionDemo />
          </VueStripeProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Client secret and Issuing methods</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground mb-4 text-sm">
            <code>handleCardAction</code> needs a manually confirmed PaymentIntent in
            <code>requires_action</code>; the micro-deposit methods need an ACH or ACSS intent
            waiting for micro-deposit verification; <code>createEphemeralKeyNonce</code> needs an
            Issuing card.
          </p>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <IntentActionsDemo />
          </VueStripeProvider>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
