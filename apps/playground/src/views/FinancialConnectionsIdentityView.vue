<script setup lang="ts">
import { inject } from 'vue'
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import { Card, CardHeader, CardTitle, CardContent, Alert, AlertDescription } from '@/components/ui'
import FinancialConnectionsDemo from '@/components/bank/FinancialConnectionsDemo.vue'
import IdentityDemo from '@/components/bank/IdentityDemo.vue'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Financial Connections and Identity</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground">
          <code>useFinancialConnections()</code> and <code>useIdentity()</code> open Stripe's
          modals. Each needs a client secret created on your server: a Financial Connections
          Session, an ACH Direct Debit (<code>us_bank_account</code>) PaymentIntent or SetupIntent,
          or an Identity VerificationSession. Create one with the Stripe CLI or Dashboard and paste
          its client secret below.
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
          <CardTitle class="text-lg">useFinancialConnections()</CardTitle>
        </CardHeader>
        <CardContent>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <FinancialConnectionsDemo />
          </VueStripeProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">useIdentity()</CardTitle>
        </CardHeader>
        <CardContent>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <IdentityDemo />
          </VueStripeProvider>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
