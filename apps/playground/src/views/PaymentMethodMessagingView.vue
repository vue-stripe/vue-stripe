<script setup lang="ts">
import { inject, ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentMethodMessagingElement
} from '@vue-stripe/vue-stripe'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription
} from '@/components/ui'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')

const messagingReady = ref(false)
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Payment Method Messaging (v5.5)</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground">
          <code>VueStripePaymentMethodMessagingElement</code> displays promotional BNPL messaging
          (Affirm, Klarna, Afterpay/Clearpay) based on the order amount and currency.
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
        <CardTitle class="text-lg">Live demo</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="bg-card rounded-lg p-4 border" data-test="messaging">
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements>
              <VueStripePaymentMethodMessagingElement
                :options="{ amount: 9900, currency: 'USD', paymentMethodTypes: ['affirm'], countryCode: 'US' }"
                @ready="messagingReady = true"
              />
            </VueStripeElements>
          </VueStripeProvider>
        </div>
        <p class="text-xs text-muted-foreground mt-2" data-test="messaging-ready">ready: {{ messagingReady }}</p>
      </CardContent>
    </Card>
  </div>
</template>
